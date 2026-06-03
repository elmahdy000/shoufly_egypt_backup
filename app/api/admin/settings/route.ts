import { NextRequest } from 'next/server';
import { getCurrentUser, requireRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/utils/http-response';
import { getPlatformSettings } from '@/lib/services/admin/platform-settings';
import { logAdminAction } from '@/lib/services/admin/audit-log';

// GET - Fetch current settings
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, 'ADMIN');

    // Get settings from database or return defaults
    const settings = await prisma.platformSetting.findFirst();

    return ok({
      commission: settings ? Number(settings.commissionPercent) : 15,
      vat: settings ? Number(settings.vatPercent) : 14,
      radius: settings?.maxRadiusKm || 50,
      minOrder: settings ? Number(settings.minOrderAmount) : 100,
      minVendorMatch: settings?.minVendorMatchCount || 3,
      initialRadius: settings?.initialRadiusKm || 5,
      radiusStep: settings?.radiusExpansionStepKm || 5,
      autoPayout: settings?.autoPayoutEnabled ?? true,
      verifyRequired: settings?.verifyRequired ?? true,
      otpDelivery: settings?.otpDeliveryEnabled ?? true,
    });

  } catch (error) {
    console.error('Settings GET API error:', error);
    return fail(error);
  }
}

// POST - Update settings
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, 'ADMIN');

    const body = await req.json();
    const { 
      commission, 
      vat, 
      radius, 
      minOrder, 
      minVendorMatch, 
      initialRadius, 
      radiusStep,
      autoPayout,
      verifyRequired,
      otpDelivery 
    } = body;

    // 🛡️ VALIDATION: Ensure settings values are within acceptable ranges
    if (typeof commission === 'number' && (commission < 0 || commission > 50)) {
      return ok({ error: 'عمولة المنصة يجب أن تكون بين 0% و 50%' }, 400);
    }
    if (typeof vat === 'number' && (vat < 0 || vat > 30)) {
      return ok({ error: 'ضريبة القيمة المضافة يجب أن تكون بين 0% و 30%' }, 400);
    }
    if (typeof radius === 'number' && (radius < 1 || radius > 500)) {
      return ok({ error: 'نطاق البحث يجب أن يكون بين 1 و 500 كم' }, 400);
    }
    if (typeof minOrder === 'number' && (minOrder < 0 || minOrder > 10000)) {
      return ok({ error: 'الحد الأدنى للطلب يجب أن يكون بين 0 و 10,000 ج.م' }, 400);
    }
    // Additional validations — missing before
    if (typeof radiusStep === 'number' && radiusStep <= 0) {
      return ok({ error: 'خطوة توسع النطاق يجب أن تكون أكبر من صفر' }, 400);
    }
    if (typeof initialRadius === 'number' && initialRadius <= 0) {
      return ok({ error: 'النطاق الابتدائي يجب أن يكون أكبر من صفر' }, 400);
    }
    if (typeof initialRadius === 'number' && typeof radius === 'number' && initialRadius > radius) {
      return ok({ error: 'النطاق الابتدائي لا يمكن أن يتجاوز النطاق الأقصى' }, 400);
    }
    if (typeof minVendorMatch === 'number' && minVendorMatch < 1) {
      return ok({ error: 'الحد الأدنى لعدد الموردين يجب أن يكون 1 على الأقل' }, 400);
    }

    // Get the current settings first
    const currentSettings = await getPlatformSettings();

    // Update settings
    const settings = await prisma.platformSetting.update({
      where: { id: currentSettings.id },
      data: {
        commissionPercent: commission ?? undefined,
        vatPercent: vat ?? undefined,
        minOrderAmount: minOrder ?? undefined,
        maxRadiusKm: radius ?? undefined,
        minVendorMatchCount: minVendorMatch ?? undefined,
        initialRadiusKm: initialRadius ?? undefined,
        radiusExpansionStepKm: radiusStep ?? undefined,
        autoPayoutEnabled: autoPayout ?? undefined,
        verifyRequired: verifyRequired ?? undefined,
        otpDeliveryEnabled: otpDelivery ?? undefined,
      }
    });

    const result = {
      success: true,
      settings: {
        commission: Number(settings.commissionPercent),
        vat: Number(settings.vatPercent),
        minOrder: Number(settings.minOrderAmount),
        radius: settings.maxRadiusKm,
        minVendorMatch: settings.minVendorMatchCount,
        initialRadius: settings.initialRadiusKm,
        radiusStep: settings.radiusExpansionStepKm,
        autoPayout: settings.autoPayoutEnabled,
        verifyRequired: settings.verifyRequired,
        otpDelivery: settings.otpDeliveryEnabled,
      }
    };
    
    // 📝 Log settings change to audit trail (non-blocking)
    logAdminAction({
      adminId: user.id,
      action: 'SETTINGS_UPDATED',
      targetType: 'SETTINGS',
      oldValue: currentSettings,
      newValue: result.settings,
      metadata: { performedBy: user.fullName || user.email }
    }).catch(() => {
      // Audit logging failure should not break the main flow
    });
    
    return ok(result);

  } catch (error) {
    console.error('Settings POST API error:', error);
    return fail(error);
  }
}
