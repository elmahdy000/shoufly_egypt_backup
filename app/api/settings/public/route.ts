import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_COMMISSION_PERCENT = 15;

export async function GET() {
  const user = await getCurrentUserFromCookie().catch(() => null);

  let commission = DEFAULT_COMMISSION_PERCENT;
  let vat = 14;
  try {
    const settings = await prisma.platformSetting.findFirst();
    if (settings) {
      const parsedComm = Number(settings.commissionPercent);
      if (Number.isFinite(parsedComm) && parsedComm >= 0 && parsedComm <= 100) {
        commission = parsedComm;
      }
      const parsedVat = Number(settings.vatPercent);
      if (Number.isFinite(parsedVat) && parsedVat >= 0 && parsedVat <= 100) {
        vat = parsedVat;
      }
    }
  } catch {
    /* no settings table or row — fall back to defaults */
  }

  return NextResponse.json({
    commission,
    vat,
    siteName: "شوفلي",
    supportPhone: null,
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
    user: user
      ? {
          id: user.id,
          role: user.role,
          isActive: user.isActive,
        }
      : null,
  });
}
