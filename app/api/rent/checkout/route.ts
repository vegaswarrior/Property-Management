import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';
import { getLandlordBySubdomain } from '@/lib/actions/landlord.actions';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const host = req.headers.get('host') || '';
  const apex = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';

  const bareHost = host.split(':')[0].toLowerCase();
  const apexLower = apex.toLowerCase();

  let landlordId: string | null = null;

  if (apexLower && bareHost.endsWith(`.${apexLower}`) && bareHost !== apexLower) {
    const subdomain = bareHost.slice(0, bareHost.length - apexLower.length - 1);

    if (subdomain) {
      const landlordResult = await getLandlordBySubdomain(subdomain);

      if (!landlordResult.success) {
        return NextResponse.json(
          { message: landlordResult.message || 'Landlord not found for this subdomain.' },
          { status: 404 }
        );
      }

      landlordId = landlordResult.landlord.id;
    }
  }

  if (!landlordId) {
    return NextResponse.json(
      { message: 'Missing or invalid landlord context for this request.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null) as
    | { rentPaymentIds?: string[] }
    | null;

  if (!body?.rentPaymentIds || !Array.isArray(body.rentPaymentIds) || body.rentPaymentIds.length === 0) {
    return NextResponse.json({ message: 'No rent payments specified' }, { status: 400 });
  }

  const rentPayments = await prisma.rentPayment.findMany({
    where: {
      id: { in: body.rentPaymentIds },
      tenantId: session.user.id as string,
      status: 'pending',
      lease: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    },
  });

  if (rentPayments.length === 0) {
    return NextResponse.json({ message: 'No pending rent payments found' }, { status: 400 });
  }

  const totalAmount = rentPayments.reduce((sum, p) => {
    const amt = Number(p.amount);
    return sum + (Number.isNaN(amt) ? 0 : amt);
  }, 0);

  if (!totalAmount || totalAmount <= 0) {
    return NextResponse.json({ message: 'Invalid total amount' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  const landlord = await prisma.landlord.findUnique({
    where: { id: landlordId },
    select: { stripeConnectAccountId: true },
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: 'USD',
    metadata: {
      type: 'rent_payment',
      tenantId: session.user.id as string,
      rentPaymentIds: rentPayments.map((p) => p.id).join(','),
      landlordId,
      landlordStripeConnectAccountId: landlord?.stripeConnectAccountId ?? null,
    },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.rentPayment.updateMany({
    where: { id: { in: rentPayments.map((p) => p.id) } },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
