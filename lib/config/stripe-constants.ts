/**
 * Stripe Integration Constants and Configuration
 * Complete reference for payment methods, fees, and limits
 */

// ============= PAYMENT METHOD TYPES =============
export const PAYMENT_METHOD_TYPES = {
  CARD: 'card',
  ACH: 'us_bank_account', // ACH bank transfer
  LINK: 'link', // Stripe Link
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
} as const;

// ============= TENANT PAYMENT (RENT COLLECTION) =============
/**
 * Tenant payment methods available at checkout
 * Supports multiple methods for flexibility
 */
export const TENANT_PAYMENT_METHODS = {
  CARD: {
    name: 'Debit or Credit Card',
    type: 'card',
    icon: 'credit-card',
    fee: 2.9, // percentage + $0.30 for cards
    feeFixed: 0.30,
    timeline: 'Instant',
    description: 'Visa, Mastercard, American Express, Discover',
    processingTime: '1-2 business days to landlord',
    supported: true,
  },
  ACH: {
    name: 'Bank Account (ACH)',
    type: 'us_bank_account',
    icon: 'bank',
    fee: 0, // FREE ACH transfers
    feeFixed: 0,
    timeline: '1-3 business days',
    description: 'Direct from your checking or savings account',
    processingTime: '1-3 business days',
    supported: true,
  },
  LINK: {
    name: 'Stripe Link',
    type: 'link',
    icon: 'link',
    fee: 2.9,
    feeFixed: 0.30,
    timeline: 'Instant',
    description: 'Save your payment details for faster checkout',
    processingTime: '1-2 business days',
    supported: true,
  },
  APPLE_PAY: {
    name: 'Apple Pay',
    type: 'apple_pay',
    icon: 'apple',
    fee: 2.9,
    feeFixed: 0.30,
    timeline: 'Instant',
    description: 'Quick checkout with Apple Pay',
    processingTime: '1-2 business days',
    supported: true,
  },
  GOOGLE_PAY: {
    name: 'Google Pay',
    type: 'google_pay',
    icon: 'google',
    fee: 2.9,
    feeFixed: 0.30,
    timeline: 'Instant',
    description: 'Quick checkout with Google Pay',
    processingTime: '1-2 business days',
    supported: true,
  },
} as const;

// ============= LANDLORD PAYOUT METHODS =============
/**
 * Payout methods for landlords receiving rent
 * Two-tier system: Fast (Instant Card) or Cheap (ACH Bank Transfer)
 * Both include a $2.00 platform processing fee
 */
export const LANDLORD_PAYOUT_METHODS = {
  INSTANT_CARD: {
    name: '🚀 GET YOUR MONEY in 30 min',
    subtitle: 'Instant to Debit Card',
    type: 'card',
    icon: 'lightning',
    stripeFee: 0.5, // Stripe charges $0.50
    platformFee: 2.0, // Your platform charges $2.00
    totalFee: 2.5, // $2.50 total
    timeline: '30 minutes to 2 hours',
    processingTime: 'Typically 30 minutes to 2 hours',
    description: 'Get your money fast to your debit card (Visa, Mastercard, etc)',
    minAmount: 1.0,
    maxPerTransaction: 2500, // $2,500 cap per transaction (user strategy)
    maxDaily: 10000, // $10,000 per day (Stripe limit)
    maxMonthly: 50000, // $50,000 per month (Stripe limit)
    supported: true,
    callToAction: 'Request Instant Cashout',
    emoji: '🚀',
  },
  STANDARD_ACH: {
    name: '💰 Bank Transfer (Standard)',
    subtitle: 'ACH to Your Bank Account',
    type: 'bank_account',
    icon: 'bank',
    stripeFee: null, // Calculated as 0.8% capped at $5.00
    platformFee: 2.0, // Your platform charges $2.00
    totalFee: null, // Varies: $2.00 + up to $5.00 Stripe fee
    timeline: '1-3 business days',
    processingTime: '1-3 business days to your bank',
    description: 'Withdraw your full balance to your bank account',
    minAmount: 0.01,
    maxPerTransaction: null, // No cap - can cashout any amount
    maxDaily: null, // No daily limit
    maxMonthly: null, // No monthly limit
    supported: true,
    callToAction: 'Request Bank Transfer',
    emoji: '💰',
  },
} as const;

// ============= PLATFORM FEES =============
/**
 * How much the platform charges per transaction
 * TENANT PAYMENTS: charged when tenant pays rent
 * LANDLORD PAYOUTS: charged when landlord cashes out
 * This is distinct from Stripe's fees (2.9% + $0.30 cards, 0.8% ACH)
 */
export const PLATFORM_FEES = {
  // Tenant rent payment fees
  RENT_CARD: 2.0, // $2.00 flat fee per rent payment via card
  RENT_ACH: 0, // FREE ACH payments for tenants
  
  // Landlord cashout fees (both methods charge $2.00)
  CASHOUT_INSTANT: 2.0, // $2.00 platform fee for instant card cashout
  CASHOUT_ACH: 2.0, // $2.00 platform fee for ACH bank transfer cashout
  
  DEFAULT: 2.0,
} as const;

// ============= STRIPE CONNECT EXPRESS FEES =============
/**
 * Stripe's own processing fees
 * These are taken by Stripe, not by your platform
 */
export const STRIPE_PROCESSING_FEES = {
  CARD: 0.029, // 2.9%
  CARD_FIXED: 0.30, // $0.30 per transaction
  ACH: 0.008, // 0.8%
  ACH_MIN: 0.01,
  ACH_MAX: 5.0,
  INTERNATIONAL: 0.039, // 3.9%
} as const;

// ============= VERIFICATION & LIMITS =============
export const STRIPE_LIMITS = {
  // Instant payout limits (Debit Card)
  INSTANT_PAYOUT_MAX_PER_TRANSACTION: 2500, // $2,500 per request (platform strategy)
  INSTANT_PAYOUT_DAILY_LIMIT: 10000, // $10,000 per day (Stripe limit)
  INSTANT_PAYOUT_MONTHLY_LIMIT: 50000, // $50,000 per month (Stripe limit)
  INSTANT_PAYOUT_MIN: 1, // $1.00 minimum
  INSTANT_PAYOUT_FEE: 0.50, // $0.50 Stripe fee (doesn't include $2 platform fee)

  // ACH limits
  ACH_MAX_PER_TRANSFER: null, // No limit - can cashout full balance
  ACH_MIN: 0.01,

  // Verification
  MICRODEPOSIT_WAIT_HOURS: 24, // Wait before completing microdeposit verification
} as const;

// ============= PAYMENT INTENT CONFIGURATION =============
/**
 * Configuration for creating payment intents
 * Used in rent checkout flow
 */
export const PAYMENT_INTENT_CONFIG = {
  CURRENCY: 'usd',
  AUTOMATIC_PAYMENT_METHODS: true,
  ALLOW_REDIRECTS: 'never', // Keep everything in-page for better UX
} as const;

// ============= HELPER FUNCTIONS =============

/**
 * Calculate convenience fee based on payment method
 * Returns amount in CENTS for Stripe
 */
export function getConvenienceFeeInCents(paymentMethodType: string): number {
  const feeInDollars = PLATFORM_FEES[paymentMethodType as keyof typeof PLATFORM_FEES] || PLATFORM_FEES.DEFAULT;
  return Math.round(feeInDollars * 100);
}

/**
 * Calculate total amount with platform fee
 */
export function calculateTotalWithFee(rentAmountInCents: number, paymentMethodType: string): number {
  const convenienceFee = getConvenienceFeeInCents(paymentMethodType);
  return rentAmountInCents + convenienceFee;
}

/**
 * Get tenant-facing payment method info
 */
export function getTenantPaymentMethodInfo(methodType: string) {
  return TENANT_PAYMENT_METHODS[methodType as keyof typeof TENANT_PAYMENT_METHODS] || null;
}

/**
 * Get landlord-facing payout method info
 */
export function getLandlordPayoutMethodInfo(methodType: string) {
  return LANDLORD_PAYOUT_METHODS[methodType as keyof typeof LANDLORD_PAYOUT_METHODS] || null;
}

/**
 * Check if instant payout is within daily limit
 */
export function isWithinInstantPayoutDailyLimit(amountInCents: number): boolean {
  const limitInCents = STRIPE_LIMITS.INSTANT_PAYOUT_DAILY_LIMIT * 100;
  return amountInCents <= limitInCents;
}

/**
 * Check if instant payout is within monthly limit
 */
export function isWithinInstantPayoutMonthlyLimit(amountInCents: number): boolean {
  const limitInCents = STRIPE_LIMITS.INSTANT_PAYOUT_MONTHLY_LIMIT * 100;
  return amountInCents <= limitInCents;
}

/**
 * Get human-readable fee breakdown
 */
export function getFeeBreakdown(rentAmountInCents: number, paymentMethodType: string) {
  const rentAmount = rentAmountInCents / 100;
  const platformFee = getConvenienceFeeInCents(paymentMethodType) / 100;
  
  // Stripe processing fees (vary by method)
  let stripeFee = 0;
  if (paymentMethodType === 'card') {
    stripeFee = (rentAmountInCents * STRIPE_PROCESSING_FEES.CARD) / 100 + STRIPE_PROCESSING_FEES.CARD_FIXED;
  } else if (paymentMethodType === 'us_bank_account') {
    stripeFee = Math.min(
      Math.max((rentAmountInCents * STRIPE_PROCESSING_FEES.ACH) / 100, STRIPE_PROCESSING_FEES.ACH_MIN * 100),
      STRIPE_PROCESSING_FEES.ACH_MAX * 100
    );
  }

  return {
    rentAmount: rentAmount.toFixed(2),
    platformFee: platformFee.toFixed(2),
    stripeFee: (stripeFee / 100).toFixed(2),
    totalFees: ((platformFee * 100 + stripeFee) / 100).toFixed(2),
    landlordReceives: (rentAmount - (stripeFee / 100)).toFixed(2),
  };
}

/**
 * Validate payout method eligibility
 */
export function validatePayoutMethodEligibility(
  payoutMethodType: string,
  amountInDollars: number,
  isInstant: boolean = false
): { valid: boolean; reason?: string } {
  if (isInstant && payoutMethodType === 'card') {
    if (amountInDollars < STRIPE_LIMITS.INSTANT_PAYOUT_MIN) {
      return {
        valid: false,
        reason: `Minimum instant payout amount is $${STRIPE_LIMITS.INSTANT_PAYOUT_MIN}`,
      };
    }
    if (amountInDollars > STRIPE_LIMITS.INSTANT_PAYOUT_DAILY_LIMIT) {
      return {
        valid: false,
        reason: `Instant payout daily limit is $${STRIPE_LIMITS.INSTANT_PAYOUT_DAILY_LIMIT}`,
      };
    }
  }

  if (payoutMethodType === 'bank_account') {
    if (amountInDollars < STRIPE_LIMITS.ACH_MIN) {
      return {
        valid: false,
        reason: `Minimum ACH payout amount is $${STRIPE_LIMITS.ACH_MIN}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get stripe payment method display name
 */
export function getPaymentMethodDisplayName(type: string): string {
  const method = TENANT_PAYMENT_METHODS[type as keyof typeof TENANT_PAYMENT_METHODS];
  return method?.name || type;
}

/**
 * Format payout method for display
 */
export function formatPayoutMethod(type: string, last4: string, bankName?: string): string {
  if (type === 'card') {
    return `Debit Card ending in ${last4}`;
  }
  if (type === 'bank_account') {
    return `${bankName || 'Bank Account'} ending in ${last4}`;
  }
  return `${type} ending in ${last4}`;
}
