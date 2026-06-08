import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";

interface UpdateBody {
  status?: "RESOLVED" | "DISMISSED";
}

/**
 * Stub: acknowledges the action so the UI flow is wired. The real
 * FlaggedContent service will be added when the Prisma model lands.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "ADMIN");

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as UpdateBody;
    if (body.status !== "RESOLVED" && body.status !== "DISMISSED") {
      return NextResponse.json(
        { error: "status must be RESOLVED or DISMISSED" },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, id, status: body.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
