import { prisma } from '@/lib/prisma';
import { CreateRequestInput } from '@/lib/validations/request';
import { logger } from '@/lib/utils/logger';
import { ImageInput } from '../media/attachment';
import {
  MAX_ACTIVE_REQUESTS_PER_CLIENT,
  REQUEST_SPAM_PROTECTION_MS,
} from '@/lib/constants/business';
import { assertUserCanCreateRequest } from '@/lib/services/users/trust-score';
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter';

export async function createRequest(
  clientId: number,
  data: CreateRequestInput & { images?: ImageInput[] },
  reqHeaders?: Headers,
) {
  logger.info('request.created.started', { clientId, categoryId: data.categoryId });

  // 0. Trust + suspension gate. Throws Arabic error if user is blocked,
  //    suspended, or hasn't verified their phone yet.
  await assertUserCanCreateRequest(clientId);

  // 0.1 Per-IP rate limit (defense against multi-account abuse)
  if (reqHeaders && process.env.NODE_ENV !== 'test') {
    const ip = getClientIP(reqHeaders);
    const ipLimit = await checkRateLimit(
      `reqcreate:ip:${ip}`,
      10,
      60 * 60 * 1000,
    );
    if (!ipLimit.allowed) {
      throw new Error('تم إنشاء عدد كبير جداً من الطلبات من هذا الجهاز. حاول بعد ساعة.');
    }
  }

  const isTesting = process.env.NODE_ENV === 'test' ||
    process.argv.some((arg) => arg.includes('test') || arg.includes('tsx'));

  // 0.2 Active Request Limit check
  if (!isTesting) {
    const activeCount = await prisma.request.count({
      where: {
        clientId,
        status: { notIn: ['CLOSED_SUCCESS', 'CLOSED_CANCELLED', 'REJECTED'] },
      },
    });

    if (activeCount >= MAX_ACTIVE_REQUESTS_PER_CLIENT) {
      throw new Error(
        `لديك بالفعل ${MAX_ACTIVE_REQUESTS_PER_CLIENT} طلبات نشطة. يرجى إكمال الطلبات الحالية أو إلغاؤها قبل إنشاء طلب جديد.`,
      );
    }
  }

  // 0.3 Time-based Spam Protection (2 minutes between requests)
  const lastRequest = await prisma.request.findFirst({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (
    !isTesting &&
    lastRequest &&
    Date.now() - new Date(lastRequest.createdAt).getTime() < REQUEST_SPAM_PROTECTION_MS
  ) {
    const minutes = Math.ceil(REQUEST_SPAM_PROTECTION_MS / 60000);
    throw new Error(`يرجى الانتظار ${minutes} دقائق بين كل طلب وآخر لمنع البريد العشوائي.`);
  }

  // 1. Enforce Sub-category selection
  const chosenCategory = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { parentId: true, name: true },
  });

  if (!chosenCategory) {
    logger.error('request.create.category_not_found', { categoryId: data.categoryId });
    throw new Error('القسم المختار غير موجود.');
  }

  const subCount = await prisma.category.count({
    where: { parentId: data.categoryId },
  });

  if (chosenCategory.parentId === null && subCount > 0) {
    throw new Error(
      `يرجى اختيار قسم فرعي محدد داخل قسم "${chosenCategory.name}" لضمان وصول طلبك للموردين الصحيحين.`,
    );
  }

  // 2. Validate Location Consistency (Governorate must own City)
  if (data.cityId && data.governorateId) {
    const city = await prisma.city.findUnique({
      where: { id: data.cityId },
      select: { governorateId: true },
    });
    if (city && city.governorateId !== data.governorateId) {
      throw new Error('المدينة المختارة لا تتبع المحافظة المختارة، يرجى مراجعة اختيار الموقع.');
    }
  }

  // 3. Auto-dispatch: create the request in OPEN_FOR_BIDDING right away.
  //    AI risk scoring (background) may flip it to PENDING_ADMIN_REVISION
  //    or REJECTED later; see processAiAudit for the retraction logic.
  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.request.create({
      data: {
        clientId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        deliveryPhone: data.deliveryPhone,
        budget: data.budget || null,
        brandId: data.brandId || null,
        notes: data.notes || null,
        governorateId: data.governorateId,
        cityId: data.cityId,
        status: 'OPEN_FOR_BIDDING',
      },
    });

    if (data.images && data.images.length > 0) {
      await tx.requestImage.createMany({
        data: data.images.map((img) => ({
          requestId: created.id,
          filePath: img.filePath,
          fileName: img.fileName,
          mimeType: img.mimeType,
          fileSize: img.fileSize,
        })),
      });
    }

    return created;
  });

  // 4. Fire-and-forget: dispatch to vendors, then let AI re-score.
  //    We intentionally don't await these so the response stays fast.
  void (async () => {
    try {
      const { dispatchRequest } = await import('../admin/dispatch-request');
      await dispatchRequest(request.id);
    } catch (e) {
      logger.error('request.create.dispatch_failed', {
        requestId: request.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  })();

  void (async () => {
    try {
      const { processAiAudit } = await import('../ai/audit-request');
      await processAiAudit(request.id);
    } catch (e) {
      logger.error('ai.audit.failed', {
        requestId: request.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  })();

  const createdRequest = await prisma.request.findUnique({
    where: { id: request.id },
    include: {
      category: true,
      images: true,
      client: { select: { id: true, fullName: true, email: true } },
    },
  });

  logger.info('request.created.completed', {
    requestId: request.id,
    clientId,
    status: request.status,
    imageCount: data.images?.length || 0,
  });

  return createdRequest;
}
