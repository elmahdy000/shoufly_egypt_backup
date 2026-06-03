import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import { withCache } from "@/lib/cache";

export async function getPlatformStats() {
  return withCache('admin:stats:global', async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalVendors,
      openRequests,
      pendingAiReview,
      activeDeliveries,
      totalGMVResult,
      totalRevenueResult,
      recentRequests,
      pendingWithdrawals,
      pendingComplaints,
      totalAdmins,
      onlineAdminKeys,
      dailyStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.request.count({ where: { status: 'OPEN_FOR_BIDDING' } }),
      prisma.request.count({ where: { status: 'PENDING_ADMIN_REVISION' } }),
      prisma.request.count({ where: { status: 'ORDER_PAID_PENDING_DELIVERY' } }),
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.transaction.aggregate({ 
        where: { type: 'ADMIN_COMMISSION' },
        _sum: { amount: true } 
      }),
      prisma.request.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { fullName: true } } }
      }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      redis.keys('presence:admin:*').catch(() => []),
      prisma.request.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
    ]);

    const todayRequests = await prisma.request.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
    });

    // Process daily stats into a simple array for charts
    const dailyTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = dailyStats.filter(s => 
        s.createdAt.toISOString().split('T')[0] === dateStr
      ).reduce((acc, s) => acc + s._count.id, 0);
      return { date: dateStr, count };
    }).reverse();

    return {
      totalUsers,
      totalVendors,
      openRequests,
      pendingAiReview,
      activeDeliveries,
      pendingWithdrawals,
      pendingComplaints,
      totalAdmins,
      onlineAdmins: onlineAdminKeys.length || 1,
      totalGMV: Number(totalGMVResult._sum.amount || 0),
      totalRevenue: Number(totalRevenueResult._sum.amount || 0),
      todayRequests,
      recentRequests,
      dailyTrends,
    };
  }, 300);
}
