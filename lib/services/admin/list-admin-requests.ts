import { prisma } from "@/lib/prisma";

export async function listAdminRequests(limit = 200, offset = 0, status?: string) {
  const where = status ? { status: status as any } : {};
  return prisma.request.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      budget: true,
      createdAt: true,
      category: { select: { id: true, name: true, nameAr: true } },
      client: { select: { id: true, fullName: true, email: true, phone: true } },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
