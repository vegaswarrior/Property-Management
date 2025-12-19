import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { paymentIntentId?: string; email?: string; phone?: string }
    | null;

  const paymentIntentId = body?.paymentIntentId;

  if (!paymentIntentId) {
    return NextResponse.json({ success: false, message: 'Missing paymentIntentId' }, { status: 400 });
  }

  const now = new Date();

  const result = await prisma.rentPayment.updateMany({
    where: {
      stripePaymentIntentId: paymentIntentId,
      tenantId: session.user.id as string,
    },
    data: {
      status: 'paid',
      paidAt: now,
      paymentMethod: 'card', // Default to card for this endpoint
    },
  });

  if (!result.count) {
    return NextResponse.json({ success: false, message: 'No matching rent payments found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
