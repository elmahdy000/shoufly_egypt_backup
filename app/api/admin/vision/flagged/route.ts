import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";

/**
 * Stub: returns an empty list. Will be backed by a `FlaggedContent`
 * Prisma model when AI vision moderation is wired end-to-end.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "ADMIN");
    return NextResponse.json({ data: [], total: 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
