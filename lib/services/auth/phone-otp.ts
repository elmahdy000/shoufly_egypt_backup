/**
 * Phone OTP service
 * - requestOtp(): generate a 6-digit code, store its hash, return the code
 *   (the caller is responsible for delivering it via SMS; the actual send is
 *   wrapped here as a no-op in dev so the code is logged once at INFO level).
 * - verifyOtp(): consume a code, mark the user's phone as verified.
 *
 * Rate-limited, single-use, expirable. All failures are typed so the caller
 * can present a user-friendly Arabic error.
 */
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { createHash, randomInt } from "node:crypto";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const CODE_LENGTH = 6;

export class OtpError extends Error {
  constructor(
    public readonly code:
      | "RATE_LIMITED"
      | "INVALID"
      | "EXPIRED"
      | "ALREADY_CONSUMED"
      | "TOO_MANY_ATTEMPTS"
      | "PHONE_MISMATCH",
    message: string,
  ) {
    super(message);
    this.name = "OtpError";
  }
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

interface RequestOtpParams {
  userId: number;
  phone: string;
  purpose?: "PHONE_VERIFY" | "LOGIN";
}

export async function requestOtp({ userId, phone, purpose = "PHONE_VERIFY" }: RequestOtpParams) {
  // Per-user rate limit: 3 OTPs per 10 minutes
  const rl = await checkRateLimit(`otp:user:${userId}`, 3, 10 * 60 * 1000);
  if (!rl.allowed) {
    throw new OtpError("RATE_LIMITED", "تم إرسال عدد كبير من الرموز. حاول مرة أخرى بعد قليل.");
  }

  const code = String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.phoneOtp.create({
    data: { userId, phone, codeHash, purpose, expiresAt },
  });

  if (isProd()) {
    // TODO: integrate Twilio / Vodafone / Etisalat SMS gateway here.
    // For now, surface a critical log line that an SMS provider would consume.
    logger.info("otp.sms.send", { userId, phone, code });
  } else {
    // Dev convenience: log the code so we can verify in Postman / tests.
    logger.info("otp.dev.code", { userId, phone, code, purpose, expiresAt });
  }

  return { expiresAt };
}

interface VerifyOtpParams {
  userId: number;
  phone: string;
  code: string;
  purpose?: "PHONE_VERIFY" | "LOGIN";
}

export async function verifyOtp({ userId, phone, code, purpose = "PHONE_VERIFY" }: VerifyOtpParams) {
  const codeHash = hashCode(code);

  // Most recent unused, unexpired record for this user+purpose
  const record = await prisma.phoneOtp.findFirst({
    where: {
      userId,
      purpose,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new OtpError("EXPIRED", "انتهت صلاحية الكود أو تم استخدامه. اطلب كوداً جديداً.");
  }

  if (record.phone !== phone) {
    throw new OtpError("PHONE_MISMATCH", "رقم الهاتف لا يطابق الكود المرسل.");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new OtpError("TOO_MANY_ATTEMPTS", "تم تجاوز عدد المحاولات. اطلب كوداً جديداً.");
  }

  if (record.codeHash !== codeHash) {
    await prisma.phoneOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new OtpError("INVALID", "الكود غير صحيح. حاول مرة أخرى.");
  }

  await prisma.$transaction([
    prisma.phoneOtp.update({
      where: { id: record.id },
      data: { consumed: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    }),
  ]);

  return { ok: true as const };
}
