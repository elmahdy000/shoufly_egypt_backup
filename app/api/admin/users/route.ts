import { NextRequest } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { listAdminUsers } from "@/lib/services/admin/list-users";
import { AdminUserRoleEnum } from "@/lib/validations/admin";
import { fail, ok } from "@/lib/utils/http-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "ADMIN");

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 0, 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const roleParam = searchParams.get("role");
    const role = roleParam ? AdminUserRoleEnum.parse(roleParam) : undefined;
    const search = searchParams.get("search") || undefined;

    const result = await listAdminUsers({ limit, offset, role, search });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
