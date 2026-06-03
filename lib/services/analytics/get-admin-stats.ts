import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import Decimal from 'decimal.js';

export async function getAdminStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const weekStart  = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  // Run ALL independent queries in parallel — was 13 sequential round-trips, now 1
  const [
    totalFinancials,
    totalRefunds,
    gmv,
    totalRequests,
    completedRequests,
    pendingRequests,
    totalUsers,
    vendorsCount,
    clientsCount,
    avgRating,
    openComplaints,
    todayRequests,
    todayRevenue,
    todayRefunds,
    topCategories,
    allWeekRequests,
    allWeekTransactions,
  ] = await Promise.all([
    // Financial aggregates
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'ADMIN_COMMISSION' } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'REFUND' } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'ESCROW_DEPOSIT' } }),

    // Request counts
    prisma.request.count(),
    prisma.request.count({ where: { status: 'CLOSED_SUCCESS' } }),
    prisma.request.count({ where: { status: 'PENDING_ADMIN_REVISION' } }),

    // User counts
    prisma.user.count(),
    prisma.user.count({ where: { role: 'VENDOR' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),

    // Quality metrics
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.complaint.count({ where: { status: 'OPEN' } }),

    // Today's activity
    prisma.request.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'ADMIN_COMMISSION', createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'REFUND', createdAt: { gte: todayStart, lte: todayEnd } },
    }),

    // Top categories
    prisma.category.findMany({
      include: { _count: { select: { requests: true } } },
      orderBy: { requests: { _count: 'desc' } },
      take: 5,
    }),

    // Week trend data (bulk fetch, aggregated in memory)
    prisma.request.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: weekStart }, type: { in: ['ADMIN_COMMISSION', 'REFUND'] } },
      select: { createdAt: true, type: true, amount: true },
    }),
  ]);

  // Derived financials
  const grossCommission = new Decimal(totalFinancials._sum.amount?.toString() || '0');
  const refundsAmount   = new Decimal(totalRefunds._sum.amount?.toString() || '0');
  const netCommission   = Decimal.max(0, grossCommission.minus(refundsAmount));
  const fulfillmentRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

  // 7-day trend (aggregated in memory — avoids 7 extra DB calls)
  const trends = Array.from({ length: 7 }, (_, i) => {
    const d      = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dStart = startOfDay(d);
    const dEnd   = endOfDay(d);
    const label  = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayRequests = allWeekRequests.filter(
      r => r.createdAt >= dStart && r.createdAt <= dEnd
    ).length;

    const dayCommissions = allWeekTransactions
      .filter(t => t.type === 'ADMIN_COMMISSION' && t.createdAt >= dStart && t.createdAt <= dEnd)
      .reduce((sum, t) => sum.plus(t.amount.toString()), new Decimal(0));

    const dayRefunds = allWeekTransactions
      .filter(t => t.type === 'REFUND' && t.createdAt >= dStart && t.createdAt <= dEnd)
      .reduce((sum, t) => sum.plus(t.amount.toString()), new Decimal(0));

    return {
      day:      label,
      requests: dayRequests,
      revenue:  Decimal.max(0, dayCommissions.minus(dayRefunds)).toNumber(),
    };
  });

  return {
    overview: {
      totalAdminCommission: netCommission.toNumber(),
      grossCommission:      grossCommission.toNumber(),
      totalRefunds:         refundsAmount.toNumber(),
      totalGMV:             Number(gmv._sum.amount || 0),
      fulfillmentRate:      Number(fulfillmentRate.toFixed(2)),
      avgPlatformRating:    Number(avgRating._avg.rating?.toFixed(1) || 0),
    },
    counters: {
      totalRequests,
      pendingRequests,
      openComplaints,
      totalUsers,
      vendorsCount,
      clientsCount,
    },
    today: {
      requests:   todayRequests,
      commission: Math.max(0, Number(todayRevenue._sum.amount || 0) - Number(todayRefunds._sum.amount || 0)),
      refunds:    Number(todayRefunds._sum.amount || 0),
    },
    topCategories: topCategories.map(c => ({
      name:         c.name,
      requestCount: c._count.requests,
    })),
    trends,
  };
}
