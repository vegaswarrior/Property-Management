'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loadConnect } from '@stripe/connect-js';

const PayoutsConnectEmbedded = ({
  component = 'account_onboarding',
}: {
  component?: 'account_onboarding' | 'payouts';
}) => {
  const { toast } = useToast();
  const [stripeError, setStripeError] = useState<string | null>(null);

  return (
    <div className='space-y-3'>
      {stripeError ? (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
          {stripeError}
        </div>
      ) : (
        <EmbeddedStripeOnboarding
          component={component}
          onError={(message) => setStripeError(message)}
          onExit={() => {
            toast({ description: 'Verification closed. You can reopen it any time.' });
          }}
        />
      )}
    </div>
  );
};

export default PayoutsConnectEmbedded;

function EmbeddedStripeOnboarding({
  component,
  onError,
  onExit,
}: {
  component: 'account_onboarding' | 'payouts';
  onError: (message: string) => void;
  onExit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(true);

  type AccountOnboardingElement = HTMLElement & {
    setOnExit?: (cb: () => void) => void;
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let canceled = false;

    void (async () => {
      try {
        setIsInitializing(true);
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
          onError('Payout setup is not configured yet. Please contact support.');
          return;
        }

        const fetchClientSecret = async () => {
          const res = await fetch(`/api/landlord/stripe/onboard?component=${component}`);
          const data = await res.json();

          if (!res.ok || !data?.success || !data?.clientSecret) {
            const message = data?.message || 'Unable to start secure payout verification.';
            throw new Error(message);
          }

          return data.clientSecret as string;
        };

        let clientSecret: string;
        try {
          clientSecret = await fetchClientSecret();
        } catch (e) {
          onError(e instanceof Error ? e.message : 'Unable to start secure payout verification.');
          return;
        }

        const stripeConnectWrapper = await loadConnect();
        const stripeConnectInstance = stripeConnectWrapper.initialize({
          publishableKey,
          clientSecret,
          refreshClientSecret: fetchClientSecret,
        });

        const elementName = component === 'payouts' ? 'payouts' : 'account-onboarding';

        const accountOnboarding = stripeConnectInstance.create(
          elementName
        ) as AccountOnboardingElement | null;

        if (!accountOnboarding) {
          onError('Unable to render payouts setup. Please refresh and try again.');
          return;
        }

        accountOnboarding.setOnExit?.(onExit);

        const container = containerRef.current;
        if (!container) {
          onError('Unable to render payouts setup. Please refresh and try again.');
          return;
        }

        container.innerHTML = '';
        container.appendChild(accountOnboarding);
      } catch (err) {
        console.error('Stripe embedded onboarding error', err);
        onError('Unable to load secure payout verification. Please try again.');
      } finally {
        if (!canceled) setIsInitializing(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [component, onError, onExit]);

  return (
    <div className='min-h-[520px] max-h-[70vh] overflow-y-auto'>
      {isInitializing && (
        <div className='py-10 text-sm text-slate-600'>
          Loading secure payout verification…
        </div>
      )}
      <div ref={containerRef} id='stripe-connect-onboarding-container' />
    </div>
  );
}
