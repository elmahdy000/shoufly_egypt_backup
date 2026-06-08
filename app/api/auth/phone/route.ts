import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, phoneVerified: true, phoneVerifiedAt: true },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(dbUser);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 400 },
    );
  }
}
