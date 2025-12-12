import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';
import { getLandlordBySubdomain } from '@/lib/actions/landlord.actions';
import { getConvenienceFeeInCents } from '@/lib/config/platform-fees';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const host = req.headers.get('host') || '';
  const apex = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';

  const bareHost = host.split(':')[0].toLowerCase();
  const apexLower = apex.split(':')[0].toLowerCase(); // Strip port from apex too

  let landlordId: string | null = null;
  let subdomain: string | null = null;

  // Handle localhost subdomains (e.g., subdomain.localhost:3000)
  if (bareHost.endsWith('.localhost')) {
    subdomain = bareHost.slice(0, bareHost.length - '.localhost'.length);
  }
  // Handle production subdomains (e.g., subdomain.domain.com)
  else if (apexLower && bareHost.endsWith(`.${apexLower}`) && bareHost !== apexLower) {
    subdomain = bareHost.slice(0, bareHost.length - apexLower.length - 1);
  }

  console.log('[rent/checkout] host:', host, 'bareHost:', bareHost, 'subdomain:', subdomain);

  if (subdomain) {
    const landlordResult = await getLandlordBySubdomain(subdomain);
    console.log('[rent/checkout] landlordResult:', landlordResult);

    if (!landlordResult.success) {
      return NextResponse.json(
        { message: landlordResult.message || 'Landlord not found for this subdomain.' },
        { status: 404 }
      );
    }

    landlordId = landlordResult.landlord.id;
  }

  const body = await req.json().catch(() => null) as
    | { rentPaymentIds?: string[]; paymentMethodType?: 'ach' | 'card' }
    | null;

  if (!body?.rentPaymentIds || !Array.isArray(body.rentPaymentIds) || body.rentPaymentIds.length === 0) {
    return NextResponse.json({ message: 'No rent payments specified' }, { status: 400 });
  }

  // Build the query - if we have a landlordId from subdomain, filter by it
  // Otherwise, just verify the rent payments belong to the tenant
  const rentPaymentQuery: Parameters<typeof prisma.rentPayment.findMany>[0] = {
    where: {
      id: { in: body.rentPaymentIds },
      tenantId: session.user.id as string,
      status: 'pending',
    },
    include: {
      lease: {
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  };

  // If we have landlordId from subdomain, add that filter
  if (landlordId) {
    rentPaymentQuery.where = {
      ...rentPaymentQuery.where,
      lease: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    };
  }

  const rentPayments = await prisma.rentPayment.findMany(rentPaymentQuery);

  if (rentPayments.length === 0) {
    return NextResponse.json({ message: 'No pending rent payments found' }, { status: 400 });
  }

  // If we didn't have a landlordId from subdomain, get it from the first rent payment
  if (!landlordId) {
    const firstPayment = rentPayments[0] as typeof rentPayments[0] & {
      lease: { unit: { property: { landlordId: string } } };
    };
    landlordId = firstPayment.lease?.unit?.property?.landlordId || null;
  }

  if (!landlordId) {
    return NextResponse.json({ message: 'Could not determine landlord for payment' }, { status: 400 });
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

  // Get convenience fee based on payment method type
  // Default to 'card' to show the convenience fee, but ACH will be free
  const paymentMethodType = body.paymentMethodType || 'card';
  const convenienceFee = getConvenienceFeeInCents(paymentMethodType);
  const rentAmountInCents = Math.round(totalAmount * 100);
  const totalWithFee = rentAmountInCents + convenienceFee;

  // Create Payment Intent with dynamic payment method options
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: totalWithFee,
    currency: 'usd',
    metadata: {
      type: 'rent_payment',
      tenantId: session.user.id as string,
      rentPaymentIds: rentPayments.map((p) => p.id).join(','),
      landlordId,
      landlordStripeConnectAccountId: landlord?.stripeConnectAccountId ?? null,
      rentAmount: rentAmountInCents.toString(),
      convenienceFee: convenienceFee.toString(),
      maxConvenienceFee: getConvenienceFeeInCents('card').toString(), // Max possible fee
    },
    // Use automatic_payment_methods for card, ACH, Link, Apple Pay, Google Pay
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never', // Keep everything in-page
    },
    // ACH requires customer email for mandate
    receipt_email: session.user.email || undefined,
  };

  // If landlord has Stripe Connect account, charge them directly with application fee
  if (landlord?.stripeConnectAccountId) {
    // The convenience fee is the application fee that goes to platform
    paymentIntentParams.application_fee_amount = convenienceFee;
    paymentIntentParams.on_behalf_of = landlord.stripeConnectAccountId;
    // Transfer remaining funds (rent amount) to landlord's connected account
    paymentIntentParams.transfer_data = {
      destination: landlord.stripeConnectAccountId,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    await prisma.rentPayment.updateMany({
      where: { id: { in: rentPayments.map((p) => p.id) } },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      convenienceFee: convenienceFee / 100, // Return as dollars
      rentAmount: totalAmount,
      totalAmount: totalWithFee / 100,
    });
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    const message = error instanceof Error ? error.message : 'Payment initialization failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
