import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { listAdminRequests } from "@/lib/services/admin/list-admin-requests";
import { AdminRequestStatusEnum } from "@/lib/validations/admin";
import { createErrorResponse, logError } from "@/lib/utils/error-handler";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "ADMIN");

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 0, 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const statusParam = searchParams.get("status");
    const status = statusParam ? AdminRequestStatusEnum.parse(statusParam) : undefined;
    const search = searchParams.get("search") || undefined;

    const result = await listAdminRequests({ limit, offset, status, search });
    return NextResponse.json(result);
  } catch (error: unknown) {
    logError("ADMIN_REQUESTS", error);
    const { response, status: errStatus } = createErrorResponse(error, 400);
    return NextResponse.json(response, { status: errStatus });
  }
}
