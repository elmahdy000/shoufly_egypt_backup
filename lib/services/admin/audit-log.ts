import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export type AuditAction =
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_CANCELLED'
  | 'REQUEST_DISPATCHED'
  | 'OFFER_FORWARDED'
  | 'USER_BLOCKED'
  | 'USER_UNBLOCKED'
  | 'USER_SUSPENDED'
  | 'USER_REINSTATED'
  | 'USER_VERIFIED'
  | 'USER_UNVERIFIED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'REFUND_ISSUED'
  | 'DISPUTE_RESOLVED'
  | 'SETTINGS_UPDATED';

interface AuditLogEntry {
  adminId: number;
  action: AuditAction;
  targetType: 'USER' | 'REQUEST' | 'BID' | 'WITHDRAWAL' | 'SETTINGS';
  targetId?: number;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(entry: AuditLogEntry) {
  try {
    // Create audit log in database
    await prisma.adminAuditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });

    // Also log to logger for real-time monitoring
    logger.info('admin.audit_log', {
      adminId: entry.adminId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
    });

    return true;
  } catch (error) {
    logger.error('admin.audit_log_failed', {
      error: error instanceof Error ? error.message : String(error),
      entry,
    });
    // Don't throw - audit logging should not break main functionality
    return false;
  }
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(
  adminId?: number,
  action?: AuditAction,
  limit = 50,
  offset = 0,
  search?: string,
) {
  const where: any = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { action: { contains: q } },
      { targetType: { contains: q } },
      { admin: { fullName: { contains: q } } },
      { admin: { email: { contains: q } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        admin: {
          select: { fullName: true, email: true },
        },
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log: typeof logs[0]) => ({
      ...log,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    })),
    total,
    limit,
    offset,
  };
}
