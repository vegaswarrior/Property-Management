import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, message: 'Stripe configuration is missing on the server.' },
        { status: 500 }
      );
    }

    const landlordResult = await getOrCreateCurrentLandlord();

    if (!landlordResult.success) {
      return NextResponse.json(
        { success: false, message: landlordResult.message || 'Unable to determine landlord.' },
        { status: 400 }
      );
    }

    const landlord = landlordResult.landlord;

    if (!landlord.stripeConnectAccountId) {
      return NextResponse.json({
        success: true,
        connected: false,
        payoutsEnabled: false,
        hasBankAccount: false,
        hasCard: false,
        requirements: null,
      });
    }

    const stripe = new Stripe(stripeSecretKey);
    const accountId = landlord.stripeConnectAccountId;

    const account = await stripe.accounts.retrieve(accountId);

    const [bankAccounts, cards] = await Promise.all([
      stripe.accounts.listExternalAccounts(accountId, { object: 'bank_account', limit: 1 }),
      stripe.accounts.listExternalAccounts(accountId, { object: 'card', limit: 1 }),
    ]);

    return NextResponse.json({
      success: true,
      connected: true,
      payoutsEnabled: Boolean((account as any).payouts_enabled),
      hasBankAccount: bankAccounts.data.length > 0,
      hasCard: cards.data.length > 0,
      requirements: (account as any).requirements || null,
    });
  } catch (error) {
    console.error('Stripe status error:', error);
    return NextResponse.json({ success: false, message: 'Failed to check payout verification status.' }, { status: 500 });
  }
}
