/**
 * Stripe Payout Service
 * Handles instant payouts to debit cards and ACH transfers
 * For Stripe Connect Express accounts
 */

import Stripe from 'stripe';
import {
  STRIPE_LIMITS,
  LANDLORD_PAYOUT_METHODS,
  isWithinInstantPayoutDailyLimit,
  isWithinInstantPayoutMonthlyLimit,
} from '@/lib/config/stripe-constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// ============= PAYOUT CREATION =============

/**
 * Create an instant payout to debit card
 * Stripe fee: $0.50 flat
 * Platform fee: $2.00 (applied in actions layer, not here)
 * Total landlord pays: $2.50
 * Includes validation for limits and provides detailed response
 */
export async function createInstantPayoutToDebitCard(
  connectedAccountId: string,
  amountInCents: number,
  paymentMethodId: string,
  metadata?: Record<string, string>
): Promise<{
  success: boolean;
  payout?: Stripe.Payout;
  error?: string;
  details?: {
    amount: number;
    fee: number;
    net: number;
    timeline: string;
    dailyRemaining: number;
    monthlyRemaining: number;
  };
}> {
  try {
    // Validate amount is above minimum
    if (amountInCents < STRIPE_LIMITS.INSTANT_PAYOUT_MIN * 100) {
      return {
        success: false,
        error: `Minimum instant payout is $${STRIPE_LIMITS.INSTANT_PAYOUT_MIN}`,
      };
    }

    // Validate daily limit
    if (!isWithinInstantPayoutDailyLimit(amountInCents)) {
      return {
        success: false,
        error: `Daily limit of $${STRIPE_LIMITS.INSTANT_PAYOUT_DAILY_LIMIT} exceeded`,
        details: {
          amount: amountInCents / 100,
          fee: STRIPE_LIMITS.INSTANT_PAYOUT_FEE,
          net: amountInCents / 100 - STRIPE_LIMITS.INSTANT_PAYOUT_FEE,
          timeline: LANDLORD_PAYOUT_METHODS.INSTANT_CARD.timeline,
          dailyRemaining: 0,
          monthlyRemaining: 0,
        },
      };
    }

    const payout = await stripe.payouts.create(
      {
        amount: amountInCents,
        currency: 'usd',
        method: 'instant', // instant or standard
        destination: paymentMethodId,
        description: 'Instant payout to debit card',
        metadata: {
          ...metadata,
          type: 'instant_debit_payout',
          createdAt: new Date().toISOString(),
        },
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    const fee = STRIPE_LIMITS.INSTANT_PAYOUT_FEE * 100;
    const net = amountInCents - fee;

    return {
      success: true,
      payout,
      details: {
        amount: amountInCents / 100,
        fee: fee / 100,
        net: net / 100,
        timeline: LANDLORD_PAYOUT_METHODS.INSTANT_CARD.timeline,
        dailyRemaining: STRIPE_LIMITS.INSTANT_PAYOUT_DAILY_LIMIT - amountInCents / 100,
        monthlyRemaining: STRIPE_LIMITS.INSTANT_PAYOUT_MONTHLY_LIMIT - amountInCents / 100,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payout';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create a standard ACH payout (1-3 business days)
 * Stripe fee: 0.8% capped at $5.00
 * Platform fee: $2.00 (applied in actions layer, not here)
 * Total landlord pays: $2.00 + Stripe fee (varies)
 * No daily/monthly limits, free Stripe transfers for landlords
 */
export async function createAchPayout(
  connectedAccountId: string,
  amountInCents: number,
  bankAccountId: string,
  metadata?: Record<string, string>
): Promise<{
  success: boolean;
  payout?: Stripe.Payout;
  error?: string;
  details?: {
    amount: number;
    fee: number;
    net: number;
    timeline: string;
  };
}> {
  try {
    if (amountInCents < STRIPE_LIMITS.ACH_MIN * 100) {
      return {
        success: false,
        error: `Minimum ACH payout is $${STRIPE_LIMITS.ACH_MIN}`,
      };
    }

    const payout = await stripe.payouts.create(
      {
        amount: amountInCents,
        currency: 'usd',
        method: 'standard', // standard for ACH (1-3 days)
        destination: bankAccountId,
        description: 'Standard ACH payout',
        metadata: {
          ...metadata,
          type: 'ach_payout',
          createdAt: new Date().toISOString(),
        },
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    return {
      success: true,
      payout,
      details: {
        amount: amountInCents / 100,
        fee: 0,
        net: amountInCents / 100,
        timeline: LANDLORD_PAYOUT_METHODS.STANDARD_ACH.timeline,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payout';
    return {
      success: false,
      error: message,
    };
  }
}

// ============= PAYOUT RETRIEVAL & STATUS =============

/**
 * Get payout status and details
 */
export async function getPayoutStatus(
  connectedAccountId: string,
  payoutId: string
): Promise<{
  success: boolean;
  payout?: Stripe.Payout;
  error?: string;
  status?: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
}> {
  try {
    const payout = await stripe.payouts.retrieve(payoutId, {
      stripeAccount: connectedAccountId,
    });

    return {
      success: true,
      payout,
      status: payout.status as any,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve payout';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * List recent payouts for connected account
 */
export async function listRecentPayouts(
  connectedAccountId: string,
  limit: number = 10
): Promise<{
  success: boolean;
  payouts?: Stripe.Payout[];
  error?: string;
}> {
  try {
    const payouts = await stripe.payouts.list(
      {
        limit,
        expand: ['data.destination'],
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    return {
      success: true,
      payouts: payouts.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list payouts';
    return {
      success: false,
      error: message,
    };
  }
}

// ============= PAYMENT METHOD MANAGEMENT =============

/**
 * Create a debit card token for instant payouts
 * In production, this would come from Stripe Elements/TokenElement
 */
export async function createDebitCardToken(
  cardToken: string,
  connectedAccountId: string
): Promise<{
  success: boolean;
  paymentMethod?: Stripe.PaymentMethod;
  error?: string;
}> {
  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: cardToken,
      },
    });

    // Attach to account if needed
    if (connectedAccountId) {
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: connectedAccountId,
      });
    }

    return {
      success: true,
      paymentMethod,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment method';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create bank account token for ACH payouts
 */
export async function createBankAccountToken(
  bankAccountData: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    accountType: 'checking' | 'savings';
  },
  connectedAccountId: string
): Promise<{
  success: boolean;
  bankAccount?: Stripe.BankAccount;
  error?: string;
}> {
  try {
    // Create bank account token
    const bankAccount = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: bankAccountData.accountHolderName,
        account_holder_type: 'individual',
        account_number: bankAccountData.accountNumber,
        routing_number: bankAccountData.routingNumber,
        account_type: bankAccountData.accountType,
      },
    });

    return {
      success: true,
      bankAccount: bankAccount as unknown as Stripe.BankAccount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create bank account';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Verify bank account with microdeposits
 * Stripe sends two small deposits; user must confirm amounts
 */
export async function verifyBankAccountMicrodeposits(
  connectedAccountId: string,
  bankAccountId: string,
  amounts: [number, number]
): Promise<{
  success: boolean;
  bankAccount?: Stripe.BankAccount;
  error?: string;
}> {
  try {
    const bankAccount = await stripe.customers.updateSource(
      connectedAccountId,
      bankAccountId,
      {
        verify_with_microdeposits: amounts as unknown as Record<string, unknown>,
      } as unknown as Stripe.CustomerUpdateSourceParams
    );

    return {
      success: true,
      bankAccount: bankAccount as unknown as Stripe.BankAccount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify bank account';
    return {
      success: false,
      error: message,
    };
  }
}

// ============= PAYOUT LIMIT TRACKING =============

/**
 * Get payout usage for current day/month
 * Useful for UI to show remaining instant payout capacity
 */
export async function getPayoutLimitUsage(
  connectedAccountId: string
): Promise<{
  success: boolean;
  dailyUsed?: number;
  dailyRemaining?: number;
  monthlyUsed?: number;
  monthlyRemaining?: number;
  error?: string;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Get today's payouts
    const todayPayouts = await stripe.payouts.list(
      {
        created: {
          gte: Math.floor(today.getTime() / 1000),
        },
        limit: 100,
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    // Get this month's payouts
    const monthPayouts = await stripe.payouts.list(
      {
        created: {
          gte: Math.floor(monthStart.getTime() / 1000),
        },
        limit: 100,
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    // Calculate instant payouts only (method: 'instant')
    const dailyInstant = todayPayouts.data
      .filter((p) => p.method === 'instant')
      .reduce((sum, p) => sum + p.amount, 0) / 100;

    const monthlyInstant = monthPayouts.data
      .filter((p) => p.method === 'instant')
      .reduce((sum, p) => sum + p.amount, 0) / 100;

    return {
      success: true,
      dailyUsed: dailyInstant,
      dailyRemaining: Math.max(0, STRIPE_LIMITS.INSTANT_PAYOUT_DAILY_LIMIT - dailyInstant),
      monthlyUsed: monthlyInstant,
      monthlyRemaining: Math.max(0, STRIPE_LIMITS.INSTANT_PAYOUT_MONTHLY_LIMIT - monthlyInstant),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get payout limits';
    return {
      success: false,
      error: message,
    };
  }
}

// ============= CONNECT ACCOUNT VERIFICATION =============

/**
 * Check if account is eligible for instant payouts
 * May require additional verification
 */
export async function checkInstantPayoutEligibility(
  connectedAccountId: string
): Promise<{
  success: boolean;
  eligible?: boolean;
  requirements?: string[];
  error?: string;
}> {
  try {
    const account = await stripe.accounts.retrieve(connectedAccountId);

    const eligible =
      account.payouts_enabled &&
      account.charges_enabled &&
      (!account.requirements || !account.requirements.past_due || account.requirements.past_due.length === 0);

    return {
      success: true,
      eligible,
      requirements: account.requirements?.past_due || [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check eligibility';
    return {
      success: false,
      error: message,
    };
  }
}
