import { prisma } from "@/lib/prisma";

export interface ListAdminRequestsParams {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}

export async function listAdminRequests(params: ListAdminRequestsParams = {}) {
  const { limit = 20, offset = 0, status, search } = params;
  const where: any = {};
  if (status) where.status = status;
  if (search && search.trim()) {
    const q = search.trim();
    const idNum = parseInt(q, 10);
    where.OR = [
      ...(Number.isFinite(idNum) ? [{ id: idNum }] : []),
      { title: { contains: q } },
      { address: { contains: q } },
      { client: { fullName: { contains: q } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.request.findMany({
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
    }),
    prisma.request.count({ where }),
  ]);

  return { data, total };
}
