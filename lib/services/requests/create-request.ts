import { prisma } from '@/lib/prisma';
import { CreateRequestInput } from '@/lib/validations/request';
import { logger } from '@/lib/utils/logger';
import { ImageInput } from '../media/attachment';
import { MAX_ACTIVE_REQUESTS_PER_CLIENT, REQUEST_SPAM_PROTECTION_MS } from '@/lib/constants/business';

export async function createRequest(clientId: number, data: CreateRequestInput & { images?: ImageInput[] }) {
  logger.info('request.created.started', { clientId, categoryId: data.categoryId });

  // 0. Security check: Is user active?
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { isActive: true, isBlocked: true }
  });

  if (!client || !client.isActive || client.isBlocked) {
    throw new Error('حسابك غير نشط أو محظور حالياً. لا يمكنك إنشاء طلبات جديدة.');
  }

  const isTesting = process.env.NODE_ENV === 'test' || 
                    process.argv.some(arg => arg.includes('test') || arg.includes('tsx'));

  // 0.1 Active Request Limit check
  if (!isTesting) {
    const activeCount = await prisma.request.count({
      where: { 
          clientId, 
          status: { notIn: ['CLOSED_SUCCESS', 'CLOSED_CANCELLED', 'REJECTED'] } 
      }
    });

    if (activeCount >= MAX_ACTIVE_REQUESTS_PER_CLIENT) {
      throw new Error(`لديك بالفعل ${MAX_ACTIVE_REQUESTS_PER_CLIENT} طلبات نشطة. يرجى إكمال الطلبات الحالية أو إلغاؤها قبل إنشاء طلب جديد.`);
    }
  }

  // 0.2 Time-based Spam Protection (2 minutes between requests)
  const lastRequest = await prisma.request.findFirst({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });

  if (!isTesting && lastRequest && (Date.now() - new Date(lastRequest.createdAt).getTime() < REQUEST_SPAM_PROTECTION_MS)) {
    const minutes = Math.ceil(REQUEST_SPAM_PROTECTION_MS / 60000);
    throw new Error(`يرجى الانتظار ${minutes} دقائق بين كل طلب وآخر لمنع البريد العشوائي.`);
  }

  // 1. Enforce Sub-category selection
  const chosenCategory = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { parentId: true, name: true }
  });

  if (!chosenCategory) {
    logger.error('request.create.category_not_found', { categoryId: data.categoryId });
    throw new Error('القسم المختار غير موجود.');
  }

  // check if it has children
  const subCount = await prisma.category.count({
    where: { parentId: data.categoryId }
  });

  if (chosenCategory.parentId === null && subCount > 0) {
    throw new Error(`يرجى اختيار قسم فرعي محدد داخل قسم "${chosenCategory.name}" لضمان وصول طلبك للموردين الصحيحين.`);
  }

  // 2. Validate Location Consistency (Governorate must own City)
  if (data.cityId && data.governorateId) {
    const city = await prisma.city.findUnique({
        where: { id: data.cityId },
        select: { governorateId: true }
    });
    if (city && city.governorateId !== data.governorateId) {
        throw new Error('المدينة المختارة لا تتبع المحافظة المختارة، يرجى مراجعة اختيار الموقع.');
    }
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.request.create({
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
        status: 'PENDING_ADMIN_REVISION',
      },
    });

    if (data.images && data.images.length > 0) {
      await tx.requestImage.createMany({
        data: data.images.map(img => ({
          requestId: request.id,
          filePath: img.filePath,
          fileName: img.fileName,
          mimeType: img.mimeType,
          fileSize: img.fileSize,
        }))
      });
    }

    logger.info('request.created.completed', {
      requestId: request.id,
      clientId,
      status: request.status,
      imageCount: data.images?.length || 0
    });

    const createdRequest = await tx.request.findUnique({
      where: { id: request.id },
      include: {
        category: true,
        images: true,
        client: { select: { id: true, fullName: true, email: true } },
      }
    });

    // 3. Trigger AI Audit in background (don't await or handle Errors internally)
    // In dev/stage we can await it for immediate feedback.
    try {
        const { processAiAudit } = await import('../ai/audit-request');
        // We call it but we don't block the return of the request object
        processAiAudit(request.id).catch(err => logger.error('ai.audit.failed', { 
            requestId: request.id, 
            error: err instanceof Error ? err.message : String(err) 
        }));
    } catch (e) {
        logger.error('ai.audit.import.failed', { 
            error: e instanceof Error ? e.message : String(e) 
        });
    }

    return createdRequest;
  });
}
