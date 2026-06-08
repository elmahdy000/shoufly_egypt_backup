import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getAuditLogs, AuditAction } from '@/lib/services/admin/audit-log';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await getCurrentUserFromCookie();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') as AuditAction | undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 0, 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
    const search = searchParams.get('search') || undefined;

    // Fetch audit logs
    const result = await getAuditLogs(undefined, action, limit, offset, search);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('admin.audit_logs_api_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
