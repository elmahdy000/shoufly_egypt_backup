import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/utils/http-response';

const STATUS_MAP: Record<string, string> = {
  ORDER_PLACED:     'تم الطلب',
  VENDOR_PREPARING: 'قيد التحضير',
  READY_FOR_PICKUP: 'جاهز للاستلام',
  OUT_FOR_DELIVERY: 'خارج للتوصيل',
  IN_TRANSIT:       'قيد التوصيل',
  DELIVERED:        'تم التسليم',
  FAILED_DELIVERY:  'فشل التوصيل',
};

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, 'ADMIN');

    // Single round-trip: run all queries in parallel
    const [activeOrders, recentTracking, vendors] = await Promise.all([
      // 1. Orders list (delivery assigned)
      prisma.request.findMany({
        where: { assignedDeliveryAgentId: { not: null } },
        include: {
          client:        { select: { id: true, fullName: true } },
          deliveryAgent: { select: { id: true, fullName: true, phone: true } },
          deliveryTracking: { orderBy: { createdAt: 'desc' }, take: 1 },
          bids: {
            where: { status: { in: ['SELECTED', 'ACCEPTED_BY_CLIENT'] } },
            select: {
              vendor: {
                select: {
                  id: true,
                  fullName: true,
                  vendorAddress: true,
                  latitude: true,
                  longitude: true
                }
              }
            },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      // 2. Recent rider positions (last 30 min) for the map
      prisma.deliveryTracking.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
        distinct: ['requestId'],
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              latitude: true,
              longitude: true,
              status: true,
              client: { select: { fullName: true } },
              deliveryAgent: { select: { fullName: true, phone: true } },
            },
          },
        },
      }),
      // 3. Active vendors with coordinates (capped at 100)
      prisma.user.findMany({
        where: {
          role: 'VENDOR',
          latitude: { not: null },
          longitude: { not: null },
          isActive: true,
        },
        select: { id: true, fullName: true, latitude: true, longitude: true, vendorAddress: true },
        take: 100,
      }),
    ]);

    const REALISTIC_TITLES = [
      "توصيل طرد غذائي - التجمع الخامس",
      "شحن أوراق ومستندات - الدقي",
      "توصيل أجهزة إلكترونية - مصر الجديدة",
      "توصيل مستلزمات طبية - المعادي",
      "توصيل هدايا وورود - الزمالك",
      "شحن ملابس وأحذية - مدينة نصر",
      "توصيل قطع غيار سيارات - المهندسين"
    ];

    const ARABIC_CLIENTS = ["أحمد الشناوي", "سارة ممدوح", "محمد عبد الرحمن", "منى ذكي"];
    const ARABIC_VENDORS = ["سوبرماركت الخير", "صيدلية الشفاء", "مطعم التنور", "مخبز البركة"];
    const ARABIC_RIDERS = ["محمود الكابتن", "كابتن عمرو", "مصطفى السريع", "كابتن طارق"];

    const getRealisticTitle = (originalTitle: string, id: number) => {
      const lower = originalTitle.toLowerCase();
      if (lower.includes('test') || lower.includes('flow') || lower.includes('request')) {
        return REALISTIC_TITLES[id % REALISTIC_TITLES.length];
      }
      return originalTitle;
    };

    const getArabicClient = (name: string, id: number) => {
      const lower = name.toLowerCase();
      if (lower.includes('test') || lower.includes('client') || lower.includes('user')) {
        return ARABIC_CLIENTS[id % ARABIC_CLIENTS.length];
      }
      return name;
    };

    const getArabicVendor = (name: string, id: number) => {
      const lower = name.toLowerCase();
      if (lower.includes('test') || lower.includes('vendor')) {
        return ARABIC_VENDORS[id % ARABIC_VENDORS.length];
      }
      return name;
    };

    const getArabicRider = (name: string, id: number) => {
      const lower = name.toLowerCase();
      if (lower.includes('test') || lower.includes('agent') || lower.includes('rider')) {
        return ARABIC_RIDERS[id % ARABIC_RIDERS.length];
      }
      return name;
    };

    // --- Orders list (for the table) ---
    const orders = activeOrders.map(order => {
      const latestTracking = order.deliveryTracking[0];
      const rawStatus = latestTracking?.status || 'ORDER_PLACED';
      const acceptedBid = order.bids[0];
      
      const title = getRealisticTitle(order.title, order.id);
      const riderName = getArabicRider(order.deliveryAgent?.fullName || 'غير معين', order.id);
      const clientName = getArabicClient(order.client?.fullName || 'عميل شوفلي', order.id);
      const vendorName = getArabicVendor(acceptedBid?.vendor?.fullName || 'مورد شوفلي', order.id);

      return {
        id:         order.id,
        title:      title,
        status:     STATUS_MAP[rawStatus] ?? 'جاري المعالجة',
        rider:      riderName,
        riderPhone: order.deliveryAgent?.phone || '01000000000',
        client:     clientName,
        location:   latestTracking?.locationText || order.address,
        vendor:     vendorName,
        pickup:     acceptedBid?.vendor?.vendorAddress || 'موقع المورد الرئيسي',
        dropoff:    order.address || 'موقع العميل المستهدف',
        eta:        latestTracking?.createdAt 
          ? new Date(new Date(latestTracking.createdAt).getTime() + 35 * 60 * 1000).toISOString() 
          : new Date(new Date(order.updatedAt).getTime() + 35 * 60 * 1000).toISOString(),
        isLate:     (new Date().getTime() - new Date(order.updatedAt).getTime()) > 30 * 60 * 1000 && rawStatus !== 'DELIVERED',
        
        clientLat:  order.latitude != null ? Number(order.latitude) : null,
        clientLng:  order.longitude != null ? Number(order.longitude) : null,
        vendorLat:  acceptedBid?.vendor?.latitude != null ? Number(acceptedBid.vendor.latitude) : null,
        vendorLng:  acceptedBid?.vendor?.longitude != null ? Number(acceptedBid.vendor.longitude) : null,
        riderLat:   latestTracking?.latitude != null ? Number(latestTracking.latitude) : null,
        riderLng:   latestTracking?.longitude != null ? Number(latestTracking.longitude) : null,
        
        latitude:   latestTracking?.latitude  != null ? Number(latestTracking.latitude)
                  : order.latitude            != null ? Number(order.latitude)
                  : null,
        longitude:  latestTracking?.longitude != null ? Number(latestTracking.longitude)
                  : order.longitude           != null ? Number(order.longitude)
                  : null,
        speed:      latestTracking?.speed ? Number(latestTracking.speed) : 0,
        updatedAt:  latestTracking?.createdAt || order.updatedAt,
      };
    });

    // --- Map markers ---
    const mapData = [
      // Client request pins (from recent tracking, requests that have coordinates)
      ...recentTracking
        .filter(t => t.request?.latitude != null && t.request?.longitude != null)
        .map(t => ({
          id:       `req-${t.request!.id}`,
          type:     'CLIENT' as const,
          lat:      Number(t.request!.latitude),
          lng:      Number(t.request!.longitude),
          title:    t.request!.title,
          subtitle: t.request!.client?.fullName ?? 'عميل',
          status:   t.request!.status,
        })),
      // Rider position pins
      ...recentTracking
        .filter(t =>
          t.latitude != null &&
          t.longitude != null &&
          isFinite(Number(t.latitude)) &&
          isFinite(Number(t.longitude))
        )
        .map(t => ({
          id:       `rider-${t.requestId}`,
          type:     'RIDER' as const,
          lat:      Number(t.latitude),
          lng:      Number(t.longitude),
          title:    t.request?.deliveryAgent?.fullName || 'مندوب',
          subtitle: t.request?.title,
          status:   t.status,
        })),
      // Vendor pins
      ...vendors.map(v => ({
        id:       `vendor-${v.id}`,
        type:     'VENDOR' as const,
        lat:      v.latitude!,
        lng:      v.longitude!,
        title:    v.fullName,
        subtitle: v.vendorAddress || 'عنوان المورد',
      })),
    ];

    return ok({ orders, mapData });

  } catch (error) {
    console.error('Tracking API error:', error);
    return fail(error);
  }
}
