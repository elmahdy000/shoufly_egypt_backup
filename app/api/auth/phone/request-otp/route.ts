import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { OtpError, requestOtp } from "@/lib/services/auth/phone-otp";
import { z } from "zod";

const RequestOtpSchema = z.object({
  phone: z.string().trim().min(8).max(20),
});

const ARABIC_PHONE_RE = /^\+?2?(01)[0-9]{9}$/;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const { phone } = RequestOtpSchema.parse(await req.json());

    // Normalize Egyptian numbers
    const normalized = phone.replace(/\s|-/g, "");
    if (!ARABIC_PHONE_RE.test(normalized)) {
      return NextResponse.json(
        { error: "رقم الهاتف غير صالح. استخدم رقم مصري (مثال: 01012345678)." },
        { status: 400 },
      );
    }

    const result = await requestOtp({ userId: user.id, phone: normalized });
    return NextResponse.json({
      ok: true,
      expiresAt: result.expiresAt,
    });
  } catch (error: unknown) {
    if (error instanceof OtpError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
