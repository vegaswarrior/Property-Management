'use client';

import { useState } from 'react';
import RentStripePayment from './rent-stripe-payment';
import { Button } from '@/components/ui/button';

export default function RentPayClient({
  rentPaymentIds,
  totalInCents,
}: {
  rentPaymentIds: string[];
  totalInCents: number;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStartPayment = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await fetch('/api/rent/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rentPaymentIds }),
      });

      if (!res.ok) {
        setErrorMessage('Failed to start payment. Please try again.');
        return;
      }

      const data = (await res.json()) as { clientSecret?: string };

      if (!data.clientSecret) {
        setErrorMessage('Payment could not be initialized.');
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      setErrorMessage('Something went wrong starting the payment.');
    } finally {
      setIsLoading(false);
    }
  };

  if (clientSecret) {
    return (
      <div className='space-y-4'>
        <RentStripePayment totalInCents={totalInCents} clientSecret={clientSecret} />
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {errorMessage && <p className='text-xs text-destructive'>{errorMessage}</p>}
      <Button
        className='inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold text-white hover:bg-slate-800'
        size='lg'
        onClick={handleStartPayment}
        disabled={isLoading}
      >
        {isLoading ? 'Preparing payment...' : 'Pay rent'}
      </Button>
      <p className='mt-1 text-[11px] text-slate-400'>You will be redirected to secure Stripe payment fields.</p>
    </div>
  );
}
