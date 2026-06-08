import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { z } from "zod";
import { createErrorResponse, logError } from "@/lib/utils/error-handler";
import {
  fileReport,
  isValidReportReason,
  tallyReports,
} from "@/lib/services/requests/report-request";

const ReportSchema = z.object({
  reason: z.string().min(1).max(32),
  details: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "VENDOR");

    const { requestId } = await params;
    const id = Number(requestId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات البلاغ غير صحيحة" },
        { status: 400 },
      );
    }

    if (!isValidReportReason(parsed.data.reason)) {
      return NextResponse.json(
        { error: "سبب البلاغ غير معروف" },
        { status: 400 },
      );
    }

    const result = await fileReport({
      requestId: id,
      vendorId: user.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });

    // If we've just crossed the threshold, attempt to auto-close.
    const tally = await tallyReports(id);
    return NextResponse.json({
      ok: true,
      reportsCount: tally.total,
      autoClosed: tally.autoClosed,
    });
  } catch (error: unknown) {
    logError("REQUEST_REPORT_POST", error);
    const { response, status } = createErrorResponse(error, 400);
    return NextResponse.json(response, { status });
  }
}
