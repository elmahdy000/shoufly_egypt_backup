import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { adminSuspendUser } from "@/lib/services/users/trust-score";
import { logAdminAction } from "@/lib/services/admin/audit-log";

const SuspendSchema = z.object({
  durationDays: z.number().int().min(1).max(365),
  reason: z.string().min(3).max(500),
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

    const body = await req.json();
    const parsed = SuspendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.role === "ADMIN") {
      return NextResponse.json(
        { error: "لا يمكن تعليق حساب أدمن من هذا المسار." },
        { status: 400 },
      );
    }

    const result = await adminSuspendUser({
      userId: id,
      adminId: admin.id,
      durationMs: parsed.data.durationDays * 24 * 60 * 60 * 1000,
      reason: parsed.data.reason,
    });

    await logAdminAction({
      adminId: admin.id,
      action: "USER_BLOCKED",
      targetType: "USER",
      targetId: id,
      metadata: {
        operation: "suspend",
        durationDays: parsed.data.durationDays,
        reason: parsed.data.reason,
      },
    });

    return NextResponse.json({ ok: true, suspendedUntil: result.suspendedUntil });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
