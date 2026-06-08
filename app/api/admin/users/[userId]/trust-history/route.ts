import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Read-only trust history for a single user.
 * Returns the latest 100 TrustEvent rows.
 */
export async function GET(
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

    const [user, events] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          trustScore: true,
          suspendedUntil: true,
          suspensionReason: true,
          isActive: true,
        },
      }),
      prisma.trustEvent.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user, events });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
