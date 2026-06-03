import { prisma } from '@/lib/prisma';

export async function listAdminTransactions(limit = 50, offset = 0, sinceDate?: Date) {
  return prisma.transaction.findMany({
    where: sinceDate ? { createdAt: { gte: sinceDate } } : undefined,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
      request: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    skip: offset,
  });
}

