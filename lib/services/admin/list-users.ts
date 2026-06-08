import { prisma } from "@/lib/prisma";

export interface ListAdminUsersParams {
  limit?: number;
  offset?: number;
  role?: string;
  search?: string;
}

export async function listAdminUsers(params: ListAdminUsersParams = {}) {
  const { limit = 20, offset = 0, role, search } = params;
  const where: any = {};
  if (role) where.role = role;
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { fullName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        phoneVerified: true,
        role: true,
        isActive: true,
        isVerified: true,
        isBlocked: true,
        trustScore: true,
        suspendedUntil: true,
        suspensionReason: true,
        walletBalance: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clientRequests: true,
            vendorBids: true,
            assignedDeliveries: true,
            transactions: true,
            complaints: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}
