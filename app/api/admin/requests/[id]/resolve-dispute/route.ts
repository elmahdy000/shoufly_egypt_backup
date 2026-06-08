import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { resolveDispute } from "@/lib/services/admin/resolve-dispute";
import { RequestRouteParamSchema } from "@/lib/validations/admin";
import { z } from "zod";

const ResolveDisputeBodySchema = z.object({
  penaltyPercentage: z.coerce.number().min(0).max(100),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "ADMIN");

    const { id } = RequestRouteParamSchema.parse(await params);
    const body = ResolveDisputeBodySchema.parse(await req.json().catch(() => ({})));

    const result = await resolveDispute(user.id, id, body.penaltyPercentage);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = /unauthorized/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
