import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireUser, requireRole } from '@/lib/auth';
import { reviewRequest } from '@/lib/services/admin';
import { RequestRouteParamSchema, ReviewRequestSchema } from '@/lib/validations/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, 'ADMIN');

    const { id } = RequestRouteParamSchema.parse(await params);
    const body = ReviewRequestSchema.parse(await req.json());
    const action = body.action;

    const request = await reviewRequest(id, action, user.id);
    return NextResponse.json(request);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : 400 }
    );
  }
}


