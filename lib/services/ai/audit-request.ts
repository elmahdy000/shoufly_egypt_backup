import { prisma } from '../../prisma';
import { logger } from '../../utils/logger';

export interface AuditResult {
  isSpam: boolean;
  score: number; // 0-100 (100 is definitely spam)
  suggestedCategory: string;
  isHarmful: boolean;
  reasoning: string;
  recommendedAction: 'APPROVE' | 'REJECT' | 'ADMIN_REVIEW';
}

/**
 * 🧠 The Watchtower: Intelligent AI Request Auditor
 * This service analyzes new requests using Gemini 1.5 Flash logic.
 */
import { callGemini } from './gemini';

export async function auditRequest(title: string, description: string): Promise<AuditResult> {
  logger.info('ai.audit.started', { title });

  const systemInstruction = `
    You are an expert content moderator for "شوفلي مصر" (Shoofly Egypt), a services marketplace.
    Your task is to analyze service requests and return a JSON response.
    
    Rules:
    1. isSpam: true if it contains promotional links, repetitive gibberish, or fake testing text.
    2. isHarmful: true if it requests illegal services (drugs, weapons), violence, or hate speech.
    3. recommendedAction: 
       - 'REJECT' if isHarmful is true.
       - 'ADMIN_REVIEW' if isSpam is true or content is very ambiguous.
       - 'APPROVE' if it is a legitimate service request (plumbing, car repair, electronics, etc.).
    4. suggestedCategory: Suggest the most relevant category in Arabic (e.g., 'سباكة', 'صيانة سيارات').
    5. reasoning: A brief explanation in Egyptian Arabic.

    Return only JSON in this format:
    {
      "isSpam": boolean,
      "score": number (0-100),
      "suggestedCategory": string,
      "isHarmful": boolean,
      "reasoning": string,
      "recommendedAction": "APPROVE" | "REJECT" | "ADMIN_REVIEW"
    }
  `;

  const prompt = `Request Title: ${title}\nDescription: ${description}`;

  try {
    const rawResponse = await callGemini(prompt, systemInstruction);
    const result: AuditResult = JSON.parse(rawResponse);

    logger.info('ai.audit.completed', { action: result.recommendedAction, score: result.score });
    return result;
  } catch (error: any) {
    logger.error('ai.audit.fallback', { error: error.message });
    
    // Fallback to basic logic if AI fails or key is missing
    const content = `${title} ${description}`.toLowerCase();
    return {
      isSpam: content.includes('ربح') || content.includes('كاش'),
      score: 50,
      suggestedCategory: 'Needs Analysis',
      isHarmful: false,
      reasoning: 'تم استخدام منطق المحاكاة (Fallback) لعدم توفر رد من الذكاء الاصطناعي.',
      recommendedAction: 'ADMIN_REVIEW'
    };
  }
}

/**
 * Integration helper: Automatically flags the request in DB based on AI audit.
 *
 * In the new flow the request is auto-dispatched to OPEN_FOR_BIDDING on
 * creation. The AI's job is *re-classification*:
 *   - REJECT        → flip to REJECTED, penalize trust, notify client.
 *   - ADMIN_REVIEW  → flip to PENDING_ADMIN_REVISION (vendors can no longer
 *                     see it because the vendor feed filters on
 *                     OPEN_FOR_BIDDING), notify client + admin queue.
 *   - APPROVE       → keep as-is (already broadcast). No-op for the status,
 *                     but the trust event + notification confirm to the
 *                     client that the system is paying attention.
 */
export async function processAiAudit(requestId: number) {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
        logger.info('ai.audit.skipped', { requestId, reason: 'not_found' });
        return;
    }

    // Only score requests that are still in the live state. If the client
    // already cancelled or admins already moved the request, do nothing.
    if (
        request.status === 'CLOSED_CANCELLED' ||
        request.status === 'CLOSED_SUCCESS' ||
        request.status === 'REJECTED' ||
        request.status === 'ORDER_PAID_PENDING_DELIVERY'
    ) {
        logger.info('ai.audit.skipped', { requestId, currentStatus: request.status });
        return;
    }

    const audit = await auditRequest(request.title, request.description);
    const { createNotification } = await import('../notifications/create-notification');
    const { awardTrustEvent } = await import('../users/trust-score');

    if (audit.recommendedAction === 'REJECT') {
        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'REJECTED', notes: `رفض آلي (AI): ${audit.reasoning}` },
        });

        await awardTrustEvent({
            userId: request.clientId,
            delta: -5,
            reason: 'ai_flagged_request',
            metadata: { requestId, aiAction: 'REJECT', score: audit.score },
        });

        await createNotification({
            userId: request.clientId,
            type: 'REQUEST_REJECTED' as any,
            title: 'تم رفض طلبك تلقائياً',
            message: `عذراً، تم رفض طلبك "${request.title}" بسبب: ${audit.reasoning}`,
            requestId: request.id,
        });
    } else if (audit.recommendedAction === 'ADMIN_REVIEW') {
        // Pull back from the live vendor feed. The vendors already received
        // a notification but the feed query (status = OPEN_FOR_BIDDING) will
        // exclude this from now on, so they can't act on it.
        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'PENDING_ADMIN_REVISION', notes: `مراجعة مطلوبة (AI): ${audit.reasoning}` },
        });

        await awardTrustEvent({
            userId: request.clientId,
            delta: -2,
            reason: 'ai_flagged_request',
            metadata: { requestId, aiAction: 'ADMIN_REVIEW', score: audit.score },
        });

        await createNotification({
            userId: request.clientId,
            type: 'REQUEST_NEEDS_REVISION' as any,
            title: 'طلبك قيد المراجعة',
            message: `طلبك "${request.title}" اتحول لمراجعة الإدارة للتأكد: ${audit.reasoning}`,
            requestId: request.id,
        });

        // Notify every active admin so the queue gets attention
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true },
            select: { id: true },
        });
        await Promise.all(
            admins.map((a) =>
                createNotification({
                    userId: a.id,
                    type: 'AI_FLAGGED_REQUEST' as any,
                    title: 'طلب يحتاج مراجعة 🤖⚠️',
                    message: `طلب #${requestId} (${request.title}) اتفلتر من الذكاء الاصطناعي. السبب: ${audit.reasoning}`,
                    requestId: request.id,
                }),
            ),
        );
    } else {
        // AI approves - already broadcast, no DB change needed.
        await createNotification({
            userId: request.clientId,
            type: 'OFFER_RECEIVED' as any,
            title: 'بدأ استقبال العروض',
            message: `طلبك "${request.title}" متاح الآن للموردين. هتبدأ تشوف عروض هنا.`,
            requestId: request.id,
        });
    }

    return audit;
}
