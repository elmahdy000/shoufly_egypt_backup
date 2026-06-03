import { prisma } from '@/lib/prisma';

export async function getPlatformSettings() {
  let settings = await prisma.platformSetting.findFirst();

  if (!settings) {
    // Initialize defaults if missing
    settings = await prisma.platformSetting.create({
      data: {
        commissionPercent: 15,
        vatPercent: 14,
        minOrderAmount: 100,
        minVendorMatchCount: 3,
        initialRadiusKm: 5,
        maxRadiusKm: 50,
        radiusExpansionStepKm: 5,
        autoPayoutEnabled: true,
        verifyRequired: true,
        otpDeliveryEnabled: true,
      },
    });
  }

  return settings;
}

export async function updatePlatformSettings(data: {
  commissionPercent?: number;
  vatPercent?: number;
  minOrderAmount?: number;
  minVendorMatchCount?: number;
  initialRadiusKm?: number;
  maxRadiusKm?: number;
  radiusExpansionStepKm?: number;
  autoPayoutEnabled?: boolean;
  verifyRequired?: boolean;
  otpDeliveryEnabled?: boolean;
}) {
  const settings = await getPlatformSettings();

  return prisma.platformSetting.update({
    where: { id: settings.id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}
