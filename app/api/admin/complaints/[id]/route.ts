import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { updateComplaintStatus } from "@/lib/services/admin/complaints";
import { fail, ok } from "@/lib/utils/http-response";

const UpdateComplaintStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "ADMIN");

    const { id } = await params;
    const complaintId = parseInt(id, 10);
    if (!Number.isFinite(complaintId) || complaintId <= 0) {
      return fail(new Error("Invalid complaint id"));
    }

    const body = UpdateComplaintStatusSchema.parse(await req.json().catch(() => ({})));
    const result = await updateComplaintStatus({
      id: complaintId,
      status: body.status,
      adminId: user.id,
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
