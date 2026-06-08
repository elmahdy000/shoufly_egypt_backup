/**
 * Trust Score service.
 *
 * Score is an integer 0..100, default 100.
 * Events (with default deltas):
 *   - phone_verified            +10
 *   - profile_completed          +5
 *   - completed_request          +2
 *   - cancelled_soon_after_dispatch  -2
 *   - ai_flagged_request         -5
 *   - vendor_spam_report_confirmed -10 (per confirmed report)
 *   - admin_trust_adjust         ±N  (admin override)
 *
 * Auto-suspension: when score crosses a threshold AND user is not already
 * suspended, set `suspendedUntil = now + cooldown`. Thresholds:
 *   - score < 30: 7 days
 *   - score < 10: 30 days
 *
 * Every change writes a `TrustEvent` (append-only) so admins can audit.
 */
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/utils/logger";
import { Prisma } from "@/app/generated/prisma";

const MIN_SCORE = 0;
const MAX_SCORE = 100;
const SUSPEND_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SUSPEND_7_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface AwardParams {
  userId: number;
  delta: number;
  reason: string;
  actorId?: number;
  metadata?: Prisma.InputJsonValue;
}

export interface TrustAwardResult {
  newScore: number;
  suspendedUntil: Date | null;
  wasSuspended: boolean;
}

export async function awardTrustEvent(params: AwardParams): Promise<TrustAwardResult> {
  const { userId, delta, reason, actorId, metadata } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustScore: true, suspendedUntil: true, isActive: true, isBlocked: true },
  });
  if (!user) {
    logger.warn("trust.user_not_found", { userId, reason });
    return { newScore: 0, suspendedUntil: null, wasSuspended: false };
  }

  if (user.isBlocked) {
    // Don't resurrect scores for blocked users
    return { newScore: 0, suspendedUntil: user.suspendedUntil, wasSuspended: true };
  }

  const wasSuspended =
    user.suspendedUntil != null && user.suspendedUntil.getTime() > Date.now();
  const raw = user.trustScore + delta;
  const newScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, raw));

  let suspendedUntil: Date | null = user.suspendedUntil;
  if (newScore < 10 && (!suspendedUntil || suspendedUntil < new Date())) {
    suspendedUntil = new Date(Date.now() + SUSPEND_30_DAYS_MS);
  } else if (newScore < 30 && (!suspendedUntil || suspendedUntil < new Date())) {
    suspendedUntil = new Date(Date.now() + SUSPEND_7_DAYS_MS);
  }

  await prisma.$transaction([
    prisma.trustEvent.create({
      data: {
        userId,
        delta,
        reason,
        actorId: actorId ?? null,
        metadata: metadata ?? undefined,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        trustScore: newScore,
        suspendedUntil,
        suspensionReason:
          suspendedUntil && suspendedUntil > new Date()
            ? `trust_score_below_threshold (${newScore})`
            : null,
        isActive:
          suspendedUntil && suspendedUntil > new Date() ? false : user.isActive,
      },
    }),
  ]);

  if (suspendedUntil && suspendedUntil > new Date() && !wasSuspended) {
    logger.info("trust.user_auto_suspended", { userId, newScore, suspendedUntil });
    await prisma.notification.create({
      data: {
        userId,
        type: "USER_SUSPENDED",
        title: "تم تعليق حسابك مؤقتاً",
        message: `تم تعليق حسابك حتى ${suspendedUntil.toLocaleDateString("ar-EG")} بسبب انخفاض درجة الثقة. للاستفسار، تواصل مع الدعم.`,
      },
    });
  }

  return { newScore, suspendedUntil, wasSuspended };
}

interface SuspendParams {
  userId: number;
  adminId: number;
  durationMs: number;
  reason: string;
}

export async function adminSuspendUser(params: SuspendParams) {
  const suspendedUntil = new Date(Date.now() + params.durationMs);
  await prisma.$transaction([
    prisma.trustEvent.create({
      data: {
        userId: params.userId,
        delta: 0,
        reason: `admin_suspend: ${params.reason}`,
        actorId: params.adminId,
        metadata: {
          durationMs: params.durationMs,
          suspendedUntil: suspendedUntil.toISOString(),
        },
      },
    }),
    prisma.user.update({
      where: { id: params.userId },
      data: {
        suspendedUntil,
        suspensionReason: params.reason,
        isActive: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: params.userId,
        type: "USER_SUSPENDED",
        title: "تم تعليق حسابك من الإدارة",
        message: `تم تعليق حسابك حتى ${suspendedUntil.toLocaleDateString("ar-EG")}. السبب: ${params.reason}`,
      },
    }),
  ]);
  return { suspendedUntil };
}

interface ReinstateParams {
  userId: number;
  adminId: number;
  restoreScore?: number;
}

export async function adminReinstateUser(params: ReinstateParams) {
  const restored = params.restoreScore ?? 70;
  await prisma.$transaction([
    prisma.trustEvent.create({
      data: {
        userId: params.userId,
        delta: restored - 0,
        reason: "admin_reinstate",
        actorId: params.adminId,
        metadata: { restoredTo: restored },
      },
    }),
    prisma.user.update({
      where: { id: params.userId },
      data: {
        suspendedUntil: null,
        suspensionReason: null,
        trustScore: restored,
        isActive: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: params.userId,
        type: "USER_REINSTATED",
        title: "تم رفع الإيقاف عن حسابك",
        message: "أصبح بإمكانك استخدام المنصة بشكل طبيعي. يرجى الالتزام بسياسة الاستخدام.",
      },
    }),
  ]);
}

/** Check if a user is currently blocked from creating new requests. */
export async function assertUserCanCreateRequest(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, isBlocked: true, suspendedUntil: true, phoneVerified: true, trustScore: true },
  });
  if (!user) throw new Error("حسابك غير موجود.");
  if (user.isBlocked) throw new Error("حسابك محظور. تواصل مع الدعم.");

  if (user.suspendedUntil && user.suspendedUntil.getTime() > Date.now()) {
    const until = user.suspendedUntil.toLocaleDateString("ar-EG");
    throw new Error(`حسابك موقوف مؤقتاً حتى ${until} بسبب نشاط غير معتاد.`);
  }

  if (!user.phoneVerified) {
    throw new Error("لازم تأكد رقم موبايلك الأول قبل ما تقدر تعمل طلب. روح على البروفايل.");
  }

  return user;
}
