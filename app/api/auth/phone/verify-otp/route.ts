import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { OtpError, verifyOtp } from "@/lib/services/auth/phone-otp";
import { awardTrustEvent } from "@/lib/services/users/trust-score";
import { z } from "zod";

const VerifyOtpSchema = z.object({
  phone: z.string().trim().min(8).max(20),
  code: z.string().trim().regex(/^\d{6}$/, "الكود لازم يكون 6 أرقام"),
});

const ARABIC_PHONE_RE = /^\+?2?(01)[0-9]{9}$/;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const { phone, code } = VerifyOtpSchema.parse(await req.json());
    const normalized = phone.replace(/\s|-/g, "");
    if (!ARABIC_PHONE_RE.test(normalized)) {
      return NextResponse.json(
        { error: "رقم الهاتف غير صالح." },
        { status: 400 },
      );
    }

    await verifyOtp({ userId: user.id, phone: normalized, code });

    // +10 trust for verifying a phone number
    await awardTrustEvent({
      userId: user.id,
      delta: 10,
      reason: "phone_verified",
      metadata: { phone: normalized.replace(/(\d{4})\d{4}$/, "$1****") },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof OtpError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
