/**
 * Vendor report-on-request service.
 *
 * - fileReport: a vendor flags a request as fake/spam/duplicate.
 *   The filer is recorded (unique per (request, vendor)).
 * - tallyReports: counts unique open reports and, if >= AUTO_CLOSE_THRESHOLD,
 *   flips the request to REJECTED and notifies the client.
 *   The client also loses 10 trust per auto-close.
 */
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/utils/logger";
import { awardTrustEvent } from "@/lib/services/users/trust-score";
import { Notify } from "@/lib/services/notifications/hub";

const AUTO_CLOSE_THRESHOLD = 3;
const TRUST_PENALTY_PER_CONFIRMED_REPORT = -10;

export type ReportReason = "SPAM" | "FAKE" | "DUPLICATE" | "OUT_OF_SCOPE" | "OTHER";

const VALID_REASONS: ReadonlyArray<ReportReason> = [
  "SPAM",
  "FAKE",
  "DUPLICATE",
  "OUT_OF_SCOPE",
  "OTHER",
];

export function isValidReportReason(value: unknown): value is ReportReason {
  return typeof value === "string" && (VALID_REASONS as readonly string[]).includes(value);
}

interface FileReportParams {
  requestId: number;
  vendorId: number;
  reason: ReportReason;
  details?: string;
}

export async function fileReport({ requestId, vendorId, reason, details }: FileReportParams) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, clientId: true },
  });
  if (!request) throw new Error("الطلب غير موجود.");
  if (request.status === "CLOSED_CANCELLED" || request.status === "CLOSED_SUCCESS") {
    throw new Error("الطلب مغلق بالفعل، مش هتقدر تبلّغ عنه.");
  }

  try {
    await prisma.requestReport.create({
      data: { requestId, reportedById: vendorId, reason, details: details ?? null },
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      throw new Error("إنت بالفعل بلّغت على الطلب ده.");
    }
    throw err;
  }

  // Notify admins (and the client) of the first report only — we only want one
  // notification per request. Subsequent reports don't spam admins.
  const total = await prisma.requestReport.count({ where: { requestId, resolved: false } });
  if (total === 1) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    if (admins.length > 0) {
      await Notify.bulkSend(
        admins.map((a) => ({
          userId: a.id,
          requestId,
          type: "REQUEST_REPORTED",
          title: "بلاغ جديد على طلب ⚠️",
          message: `في بلاغ جديد على الطلب #${requestId} من مورد. السبب: ${reason}.`,
        })),
      );
    }
  }

  return { reportsCount: total, autoClosed: false };
}

export interface TallyResult {
  total: number;
  autoClosed: boolean;
  requestId: number;
}

export async function tallyReports(requestId: number): Promise<TallyResult> {
  const total = await prisma.requestReport.count({
    where: { requestId, resolved: false },
  });
  if (total < AUTO_CLOSE_THRESHOLD) {
    return { total, autoClosed: false, requestId };
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, clientId: true, title: true },
  });
  if (!request) return { total, autoClosed: false, requestId };

  // Idempotent: only act if not already closed
  if (request.status === "CLOSED_CANCELLED" || request.status === "CLOSED_SUCCESS" || request.status === "REJECTED") {
    return { total, autoClosed: false, requestId };
  }

  await prisma.$transaction([
    prisma.request.update({
      where: { id: requestId },
      data: { status: "REJECTED", notes: `إغلاق آلي بعد ${total} بلاغات من موردين مستقلين.` },
    }),
    prisma.requestReport.updateMany({
      where: { requestId, resolved: false },
      data: { resolved: true },
    }),
  ]);

  // Penalize the client
  await awardTrustEvent({
    userId: request.clientId,
    delta: TRUST_PENALTY_PER_CONFIRMED_REPORT,
    reason: "vendor_spam_report_confirmed",
    metadata: { requestId, totalReports: total },
  });

  // Notify the client
  await Notify.send({
    userId: request.clientId,
    requestId,
    type: "REQUEST_AUTO_CLOSED",
    title: "تم إغلاق طلبك تلقائياً",
    message: `طلبك "#${requestId}" (${request.title}) تم إغلاقه تلقائياً بعد عدة بلاغات من موردين. ده هيأثر على درجة الثقة بتاعتك.`,
  });

  logger.info("request.auto_closed", { requestId, totalReports: total });
  return { total, autoClosed: true, requestId };
}
