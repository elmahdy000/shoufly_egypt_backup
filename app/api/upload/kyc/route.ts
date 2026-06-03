import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const formData = await req.formData();
    const frontFile = formData.get('front') as File;
    const backFile = formData.get('back') as File;

    if (!frontFile || !backFile) {
      return NextResponse.json({ error: 'يجب رفع صورة وجه وظهر البطاقة' }, { status: 400 });
    }

    const frontBuffer = Buffer.from(await frontFile.arrayBuffer());
    const backBuffer = Buffer.from(await backFile.arrayBuffer());

    let frontUrl = '';
    let backUrl = '';

    // Check Cloudflare R2 credentials
    if (
      process.env.R2_ACCOUNT_ID && 
      process.env.R2_ACCESS_KEY_ID && 
      process.env.R2_SECRET_ACCESS_KEY && 
      process.env.R2_BUCKET_NAME
    ) {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const frontFilename = `kyc-${user.id}-front-${uniqueSuffix}.jpg`;
      const backFilename = `kyc-${user.id}-back-${uniqueSuffix}.jpg`;

      // Upload Front
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: frontFilename,
          Body: frontBuffer,
          ContentType: frontFile.type || 'image/jpeg',
        })
      );

      // Upload Back
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: backFilename,
          Body: backBuffer,
          ContentType: backFile.type || 'image/jpeg',
        })
      );

      const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL 
        || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
      
      frontUrl = `${baseUrl.replace(/\/$/, '')}/${frontFilename}`;
      backUrl = `${baseUrl.replace(/\/$/, '')}/${backFilename}`;

    } else {
      // Local fallback
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'kyc');
      await mkdir(uploadDir, { recursive: true });

      const frontPath = join(uploadDir, `${user.id}-front-${Date.now()}.jpg`);
      const backPath = join(uploadDir, `${user.id}-back-${Date.now()}.jpg`);

      await writeFile(frontPath, frontBuffer);
      await writeFile(backPath, backBuffer);

      frontUrl = `/uploads/kyc/${frontPath.split(/[\\/]/).pop()}`;
      backUrl = `/uploads/kyc/${backPath.split(/[\\/]/).pop()}`;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        idCardFrontUrl: frontUrl,
        idCardBackUrl: backUrl,
        verificationStatus: 'PENDING',
        kycSubmissionDate: new Date(),
      }
    });

    return NextResponse.json({ success: true, frontUrl, backUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
