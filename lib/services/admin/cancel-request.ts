import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/utils/logger";
import { logAdminAction } from "./audit-log";

const CANCELLABLE_STATUSES = new Set([
  "PENDING_ADMIN_REVISION",
  "OPEN_FOR_BIDDING",
  "OFFERS_FORWARDED",
]);

/**
 * Admin override: cancel a request that the client/vendor couldn't
 * cancel themselves (e.g. request stuck in OFFERS_FORWARDED after a
 * payment failure, or a request that the moderation team needs to
 * force-close). Writes an audit log.
 */
export async function cancelRequestAsAdmin(
  requestId: number,
  adminId: number,
  reason?: string,
) {
  logger.info("request.admin_cancel.started", { requestId, adminId });

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, clientId: true, title: true },
  });

  if (!request) throw new Error("Request not found");

  if (!CANCELLABLE_STATUSES.has(request.status)) {
    throw new Error(
      `Request in status ${request.status} can't be admin-cancelled (must be in PENDING_ADMIN_REVISION, OPEN_FOR_BIDDING, or OFFERS_FORWARDED).`,
    );
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: "CLOSED_CANCELLED" },
    select: { id: true, status: true },
  });

  try {
    await logAdminAction({
      adminId,
      action: "REQUEST_CANCELLED",
      targetType: "REQUEST",
      targetId: requestId,
      metadata: { reason: reason ?? "Admin override cancel" },
    });
  } catch (err) {
    logger.error("audit_log.write_failed", {
      event: "request.admin_cancel",
      requestId,
      adminId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await prisma.notification.create({
    data: {
      userId: request.clientId,
      type: "REQUEST_CANCELLED",
      title: "تم إلغاء طلبك من الإدارة",
      message: `طلب رقم #${request.id} (${request.title}) اتلغى بواسطة الإدارة. السبب: ${reason ?? "لم يُذكر"}.`,
    },
  });

  logger.info("request.admin_cancel.completed", { requestId, adminId });
  return updated;
}
