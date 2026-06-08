import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/utils/http-response";

/**
 * Fetch a single delivery task. Available to the assigned agent,
 * or to any agent when the task is in the open pool (status:
 * ORDER_PAID_PENDING_DELIVERY with no assigned agent and the
 * vendor has marked it READY_FOR_PICKUP).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "DELIVERY");

    const { requestId } = await params;
    const id = Number(requestId);
    if (!Number.isFinite(id) || id <= 0) {
      return fail(new Error("Invalid request id"));
    }

    const task = await prisma.request.findFirst({
      where: {
        id,
        status: "ORDER_PAID_PENDING_DELIVERY",
        OR: [
          { assignedDeliveryAgentId: user.id },
          {
            assignedDeliveryAgentId: null,
            deliveryTracking: { some: { status: "READY_FOR_PICKUP" } },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        address: true,
        deliveryPhone: true,
        latitude: true,
        longitude: true,
        status: true,
        assignedDeliveryAgentId: true,
        category: { select: { name: true } },
        deliveryTracking: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, createdAt: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "الأوردر ده مش موجود أو مش معاك" },
        { status: 404 },
      );
    }
    return ok(task);
    return ok(task);
  } catch (error) {
    return fail(error);
  }
}
