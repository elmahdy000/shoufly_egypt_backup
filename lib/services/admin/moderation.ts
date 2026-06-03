import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export async function verifyUser(userId: number, isVerified: boolean, adminId?: number) {
  logger.info('admin.moderation.verify', { userId, isVerified, adminId });
  
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, isVerified: true, verificationStatus: true }
  });
  
  if (!existingUser) {
    throw new Error(`المستخدم رقم ${userId} غير موجود.`);
  }
  
  const newStatus = isVerified ? 'APPROVED' : 'REJECTED';
  
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { 
      isVerified,
      verificationStatus: newStatus
    },
    select: { id: true, fullName: true, isVerified: true, verificationStatus: true }
  });

  // 📝 Log to Admin Audit Trail
  if (adminId) {
    import('./audit-log').then(({ logAdminAction }) => {
      logAdminAction({
        adminId,
        action: isVerified ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
        targetType: 'USER',
        targetId: userId,
        newValue: updated,
        metadata: { fullName: updated.fullName }
      });
    }).catch(() => {});
  }

  return updated;
}

export async function blockUser(userId: number, isBlocked: boolean, adminId?: number) {
  logger.info('admin.moderation.block', { userId, isBlocked, adminId });
  
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, isBlocked: true, isActive: true, role: true }
  });
  
  if (!existingUser) {
    throw new Error(`المستخدم رقم ${userId} غير موجود.`);
  }
  
  if (existingUser.role === 'ADMIN' && isBlocked) {
    throw new Error('لا يمكن حظر حسابات الإدارة. يرجى استخدام صلاحيات السوبر أدمن.');
  }
  
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { 
      isBlocked,
      isActive: !isBlocked
    },
    select: { id: true, fullName: true, isBlocked: true, isActive: true }
  });

  // 📝 Log to Admin Audit Trail
  if (adminId) {
    import('./audit-log').then(({ logAdminAction }) => {
      logAdminAction({
        adminId,
        action: isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
        targetType: 'USER',
        targetId: userId,
        newValue: updated,
        metadata: { fullName: updated.fullName }
      });
    }).catch(() => {});
  }

  return updated;
}
