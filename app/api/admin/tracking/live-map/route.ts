import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentUser(req.headers);
    requireUser(admin);
    requireRole(admin, 'ADMIN');

    // Run all 3 queries in parallel instead of sequentially
    const [activeRequests, activeRiders, vendors] = await Promise.all([
      // 1. Active Requests (Clients)
      prisma.request.findMany({
        where: {
          status: {
            in: ['OPEN_FOR_BIDDING', 'OFFERS_FORWARDED', 'ORDER_PAID_PENDING_DELIVERY']
          }
        },
        select: {
          id: true,
          title: true,
          latitude: true,
          longitude: true,
          status: true,
          client: { select: { fullName: true } }
        }
      }),
      // 2. Active Riders (last 30 mins tracking)
      prisma.deliveryTracking.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        },
        distinct: ['requestId'],
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              deliveryAgent: { select: { fullName: true, phone: true } }
            }
          }
        }
      }),
      // 3. Verified Vendors (limit to 100 nearest active vendors)
      prisma.user.findMany({
        where: {
          role: 'VENDOR',
          latitude: { not: null },
          longitude: { not: null },
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          latitude: true,
          longitude: true,
          vendorAddress: true
        },
        take: 100,
      }),
    ]);

    const mapData = [
      // Filter out requests with null/invalid coordinates before mapping
      ...activeRequests
        .filter(r => r.latitude != null && r.longitude != null)
        .map(r => ({
          id: `req-${r.id}`,
          type: 'CLIENT',
          lat: Number(r.latitude),
          lng: Number(r.longitude),
          title: r.title,
          subtitle: r.client?.fullName ?? 'عميل',
          status: r.status
        })),
      ...activeRiders.filter(rid => rid.latitude && rid.longitude).map(rid => ({
        id: `rider-${rid.requestId}`,
        type: 'RIDER',
        lat: Number(rid.latitude),
        lng: Number(rid.longitude),
        title: rid.request?.deliveryAgent?.fullName || 'مندوب',
        subtitle: rid.request?.title,
        status: rid.status
      })),
      ...vendors.map(v => ({
        id: `vendor-${v.id}`,
        type: 'VENDOR',
        lat: v.latitude!,
        lng: v.longitude!,
        title: v.fullName,
        subtitle: v.vendorAddress || 'عنوان المورد'
      }))
    ];

    return NextResponse.json(mapData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
