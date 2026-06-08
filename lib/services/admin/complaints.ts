import { prisma } from "@/lib/prisma";
import type { ComplaintStatus } from "@/app/generated/prisma";

export interface AdminComplaintRow {
  id: number;
  requestId: number;
  requestTitle: string;
  requestStatus: string;
  hasEscrow: boolean;
  escrowAmount: number | null;
  netPrice: number | null;
  ticketNumber: string;
  reporterName: string;
  reporterRole: string;
  accusedName: string | null;
  accusedRole: string | null;
  type: string;
  status: ComplaintStatus;
  description: string;
  createdAt: Date;
}

export async function listComplaints(params: { limit: number; offset: number }) {
  const [data, total] = await Promise.all([
    prisma.complaint.findMany({
      skip: params.offset,
      take: params.limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, role: true } },
        reportedUser: { select: { id: true, fullName: true, role: true } },
        request: {
          select: {
            id: true,
            title: true,
            status: true,
            bids: {
              where: { status: "ACCEPTED_BY_CLIENT" },
              select: { netPrice: true, clientPrice: true, vendorId: true }
            },
            transactions: {
              where: { type: "ESCROW_DEPOSIT" },
              select: { amount: true }
            }
          }
        }
      },
    }),
    prisma.complaint.count(),
  ]);

  const rows: AdminComplaintRow[] = data.map((c) => {
    const acceptedBid = c.request?.bids?.[0];
    const escrowTx = c.request?.transactions?.[0];
    return {
      id: c.id,
      requestId: c.requestId,
      requestTitle: c.request?.title ?? "طلب غير معروف",
      requestStatus: c.request?.status ?? "UNKNOWN",
      hasEscrow: !!escrowTx,
      escrowAmount: escrowTx ? Number(escrowTx.amount) : null,
      netPrice: acceptedBid ? Number(acceptedBid.netPrice) : null,
      ticketNumber: `CMP-${String(c.id).padStart(4, "0")}`,
      reporterName: c.user?.fullName ?? "مستخدم",
      reporterRole: c.user?.role ?? "—",
      accusedName: c.reportedUser?.fullName ?? null,
      accusedRole: c.reportedUser?.role ?? null,
      type: c.subject,
      status: c.status,
      description: c.description,
      createdAt: c.createdAt,
    };
  });

  return { data: rows, total };
}

export async function updateComplaintStatus(params: {
  id: number;
  status: ComplaintStatus;
  adminId: number;
}) {
  const { id, status, adminId } = params;
  const isClosed = status === "RESOLVED" || status === "REJECTED";
  return prisma.complaint.update({
    where: { id },
    data: {
      status,
      resolvedById: isClosed ? adminId : null,
      resolvedAt: isClosed ? new Date() : null,
    },
  });
}

