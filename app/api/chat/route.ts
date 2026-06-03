import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { sendMessage } from '@/lib/services/chat/send-message';
import { listMessages } from '@/lib/services/chat/list-messages';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, logError } from '@/lib/utils/error-handler';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const { searchParams } = new URL(req.url);
    const otherId = parseInt(searchParams.get('otherId') || '0', 10);
    if (!otherId || isNaN(otherId)) throw new Error('Other user ID is required');

    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const requestIdParam = searchParams.get('requestId');
    const requestId = requestIdParam ? parseInt(requestIdParam, 10) : undefined;
    const validRequestId = requestId && !isNaN(requestId) ? requestId : undefined;

    const messages = await listMessages(user.id, otherId, limit, offset, validRequestId);
    return NextResponse.json(messages);
  } catch (error: unknown) {
    logError('CHAT_GET', error);
    const { response, status } = createErrorResponse(error, 400);
    return NextResponse.json(response, { status });
  }
}

const SendMessageSchema = z.object({
  receiverId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
  requestId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const body = await req.json();
    const validated = SendMessageSchema.parse(body);

    const msg = await sendMessage({
      senderId: user.id,
      receiverId: validated.receiverId,
      content: validated.content,
      requestId: validated.requestId,
    });

    return NextResponse.json(msg);
  } catch (error: unknown) {
    logError('CHAT_POST', error);
    const { response, status } = createErrorResponse(error, 400);
    return NextResponse.json(response, { status });
  }
}

const MarkReadSchema = z.object({
  senderId: z.number().int().positive(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const body = await req.json();
    const validated = MarkReadSchema.parse(body);

    // SECURITY: Validate senderId is a positive integer before using in query
    await prisma.chatMessage.updateMany({
      where: { 
        senderId: validated.senderId, 
        receiverId: user.id, 
        isRead: false 
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logError('CHAT_PATCH', error);
    const { response, status } = createErrorResponse(error, 400);
    return NextResponse.json(response, { status });
  }
}

