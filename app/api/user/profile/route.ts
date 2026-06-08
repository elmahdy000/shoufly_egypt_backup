import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        phoneVerified: true,
        role: true,
        isActive: true,
        walletBalance: true,
        createdAt: true,
      }
    });

    return NextResponse.json(userData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);

    const body = await req.json();
    const { fullName, phone } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      }
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
