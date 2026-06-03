import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { Notify } from '../notifications/hub';

type ReviewAction = 'approve' | 'reject';

export async function reviewRequest(requestId: number, action: ReviewAction, adminId?: number) {
  logger.info('request.review.started', { requestId, action });
  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  // Idempotency check: If already approved/rejected, don't throw error for same action
  if (request.status === 'OPEN_FOR_BIDDING' && action === 'approve') {
    logger.info('request.review.idempotent_approve', { requestId });
    return request;
  }
  if (request.status === 'REJECTED' && action === 'reject') {
      logger.info('request.review.idempotent_reject', { requestId });
      return request;
  }

  if (request.status !== 'PENDING_ADMIN_REVISION') {
    throw new Error(`Request is in status ${request.status}, cannot review`);
  }

  const newStatus =
    action === 'approve' ? 'OPEN_FOR_BIDDING' : 'REJECTED';

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: newStatus },
    include: { category: true, client: true },
  });

  if (action === 'approve') {
    // Notify all vendors in this category
    // Notify vendors who are in the same category AND same governorate
    const vendors = await prisma.user.findMany({
      where: {
        role: 'VENDOR',
        isActive: true,
        governorateId: updated.governorateId, // Added location filter
        vendorCategories: {
          some: { categoryId: updated.categoryId },
        },
      },
      select: { id: true },
    });

    if (vendors.length > 0) {
      // ✅ Using Notify.bulkSend to ensure both DB persistence AND real-time Redis broadcast
      await Notify.bulkSend(vendors.map((v) => ({
        userId: v.id,
        type: 'NEW_REQUEST',
        requestId: requestId,
        title: 'فرصة عمل جديدة! 🛠️',
        message: `يوجد طلب جديد في قسم ${updated.category.name} بانتظار عروضك.`,
      })));

      logger.info('notification.bulk_dispatched', {
        event: 'request.opened',
        requestId,
        vendorCount: vendors.length,
      });
    }
  } else {
    // Notify client of rejection
    await Notify.requestRejected(updated.clientId, requestId, updated.title);
  }

  logger.info('request.review.completed', {

    requestId,
    action,
    newStatus: updated.status,
    adminId,
  });

  // 📝 Log to Admin Audit Trail (Non-blocking)
  if (adminId) {
    import('@/lib/services/admin/audit-log').then(({ logAdminAction }) => {
      logAdminAction({
        adminId,
        action: action === 'approve' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
        targetType: 'REQUEST',
        targetId: requestId,
        newValue: updated,
        metadata: { category: updated.category.name, title: updated.title }
      });
    }).catch(() => {});
  }

  return updated;
}
