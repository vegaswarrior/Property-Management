import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order-actions';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  const event = await Stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;

    if (charge.metadata?.orderId) {
      await updateOrderToPaid({
        orderId: charge.metadata.orderId,
        paymentResult: {
          id: charge.id,
          status: 'COMPLETED',
          email_address: charge.billing_details.email!,
          pricePaid: (charge.amount / 100).toFixed(),
        },
      });
    }

    const paymentIntentIdRaw = charge.payment_intent;
    const paymentIntentId =
      typeof paymentIntentIdRaw === 'string'
        ? paymentIntentIdRaw
        : paymentIntentIdRaw?.id;

    if (paymentIntentId) {
      const now = new Date();

      await prisma.rentPayment.updateMany({
        where: {
          stripePaymentIntentId: paymentIntentId,
        },
        data: {
          status: 'paid',
          paidAt: now,
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed',
    });
  }

  return NextResponse.json({
    message: 'event is not charge.succeeded',
  });
}
