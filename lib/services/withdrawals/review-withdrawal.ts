import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { Notify } from '../notifications/hub';
import { d, toTwo } from '@/lib/utils/decimal';

export async function reviewWithdrawal(params: {
  withdrawalId: number;
  adminId: number;
  action: 'approve' | 'reject';
  reviewNote?: string;
}) {
  const { withdrawalId, adminId, action, reviewNote } = params;
  logger.info('withdrawal.review.started', { withdrawalId, adminId, action });

  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        vendor: {
          select: { id: true, walletBalance: true },
        },
      },
    });

    if (!withdrawal) {
      logger.warn('withdrawal.review.not_found', { withdrawalId, adminId });
      throw new Error('لم يتم العثور على طلب السحب.');
    }

    if (withdrawal.status !== 'PENDING') {
      logger.warn('withdrawal.review.already_reviewed', {
        withdrawalId,
        adminId,
        currentStatus: withdrawal.status,
      });
      throw new Error(`already reviewed: this withdrawal #${withdrawalId} has status '${withdrawal.status}'`);
    }

    if (action === 'approve') {
      // Logic for Approval:
      // Funds were ALREADY decremented (held) in requestWithdrawal.
      // We just need to record the final transaction ledger.
      
      await tx.transaction.create({
        data: {
          userId: withdrawal.vendorId,
          requestId: null,
          amount: withdrawal.amount,
          type: 'WITHDRAWAL',
          description: `تمت الموافقة على طلب سحب رقم #${withdrawal.id} | withdrawal #${withdrawal.id}`,
        },
      });
    } else if (action === 'reject') {
      // Logic for Rejection:
      // We MUST refund the held funds back to the vendor's wallet.
      await tx.user.update({
        where: { id: withdrawal.vendorId },
        data: {
          walletBalance: {
            increment: withdrawal.amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: withdrawal.vendorId,
          requestId: null,
          amount: withdrawal.amount,
          type: 'REFUND',
          description: `تم رفض طلب السحب رقم #${withdrawal.id} - إعادة المبلغ للمحفظة | withdrawal #${withdrawal.id}`,
        },
      });
    }

    const updated = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewNote: reviewNote || null,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    await Notify.withdrawalStatus(
        withdrawal.vendorId, 
        withdrawalId, 
        action === 'approve' ? 'APPROVED' : 'REJECTED',
        Number(withdrawal.amount)
    );

    logger.info('notification.created', {
      event: `withdrawal.${action === 'approve' ? 'approved' : 'rejected'}`,
      withdrawalId,
      userId: withdrawal.vendorId,
      role: 'VENDOR',
    });

    logger.info('withdrawal.review.completed', {
      withdrawalId,
      adminId,
      status: updated.status,
      vendorId: withdrawal.vendorId,
    });

    // 📝 Log to Admin Audit Trail (Non-blocking)
    import('@/lib/services/admin/audit-log').then(({ logAdminAction }) => {
      logAdminAction({
        adminId,
        action: action === 'approve' ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
        targetType: 'WITHDRAWAL',
        targetId: withdrawalId,
        newValue: updated,
        metadata: { vendorId: withdrawal.vendorId, amount: withdrawal.amount }
      });
    }).catch(() => {});

    return updated;
  });
}
