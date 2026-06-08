import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { z } from "zod";
import { adminReinstateUser } from "@/lib/services/users/trust-score";
import { logAdminAction } from "@/lib/services/admin/audit-log";

const ReinstateSchema = z.object({
  restoreScore: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await getCurrentUser(req.headers);
    requireUser(admin);
    requireRole(admin, "ADMIN");

    const { userId } = await params;
    const id = Number(userId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = ReinstateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    await adminReinstateUser({
      userId: id,
      adminId: admin.id,
      restoreScore: parsed.data.restoreScore,
    });

    await logAdminAction({
      adminId: admin.id,
      action: "USER_UNBLOCKED",
      targetType: "USER",
      targetId: id,
      metadata: {
        operation: "reinstate",
        restoreScore: parsed.data.restoreScore ?? 70,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
