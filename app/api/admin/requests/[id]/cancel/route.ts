import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { cancelRequestAsAdmin } from "@/lib/services/admin/cancel-request";
import { RequestRouteParamSchema } from "@/lib/validations/admin";

interface CancelBody {
  reason?: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "ADMIN");

    const { id } = RequestRouteParamSchema.parse(await params);
    const body = (await req.json().catch(() => ({}))) as CancelBody;

    const result = await cancelRequestAsAdmin(id, user.id, body.reason);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = /unauthorized/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
