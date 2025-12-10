'use client';

import { FormEvent, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

export default function RentStripePayment({
  totalInCents,
  clientSecret,
}: {
  totalInCents: number;
  clientSecret: string;
}) {
  const { theme, systemTheme } = useTheme();

  const StripeForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements || !email) return;

      setIsLoading(true);
      setErrorMessage('');

      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {},
          redirect: 'if_required',
        });

        if (error) {
          if (error.type === 'card_error' || error.type === 'validation_error') {
            setErrorMessage(error.message ?? 'An unknown error occurred');
          } else {
            setErrorMessage('An unknown error occurred');
          }
          return;
        }

        const intentId = paymentIntent?.id;

        if (intentId) {
          await fetch('/api/rent/mark-paid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentIntentId: intentId }),
          });
        }

        window.location.href = '/user/profile/rent-receipts';
      } catch (err) {
        setErrorMessage('Something went wrong while processing your payment.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <form className='space-y-4' onSubmit={handleSubmit}>
        <div className='text-sm font-semibold'>Pay with card or wallet (via Stripe)</div>
        {errorMessage && <div className='text-xs text-destructive'>{errorMessage}</div>}
        <PaymentElement />
        <div>
          <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />
        </div>
        <Button
          className='w-full rounded-full'
          size='lg'
          disabled={stripe == null || elements == null || isLoading}
        >
          {isLoading
            ? 'Processing rent...'
            : `Pay ${formatCurrency(totalInCents / 100)}`}
        </Button>
      </form>
    );
  };

  return (
    <Elements
      options={{
        clientSecret,
        appearance: {
          theme:
            theme === 'dark'
              ? 'night'
              : theme === 'light'
              ? 'stripe'
              : systemTheme === 'light'
              ? 'stripe'
              : 'night',
        },
      }}
      stripe={stripePromise}
    >
      <StripeForm />
    </Elements>
  );
}
