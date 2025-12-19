'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PayoutsConnectEmbedded from '@/components/admin/payouts-connect-button';

type StripeStatusResponse =
  | {
      success: true;
      connected: boolean;
      payoutsEnabled: boolean;
      hasBankAccount: boolean;
      hasCard: boolean;
      requirements: any | null;
    }
  | {
      success: false;
      message: string;
    };

function getActionLabel(status: Extract<StripeStatusResponse, { success: true }>) {
  if (!status.connected) return 'Connect payout account';
  if (!status.payoutsEnabled) return 'Complete payout verification';
  if (!status.hasBankAccount && !status.hasCard) return 'Add a bank account or debit card';
  return 'Payouts are ready';
}

export default function PayoutsVerificationPanel() {
  const router = useRouter();

  const [status, setStatus] = useState<StripeStatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const isReady = useMemo(() => {
    if (!status || !status.success) return false;
    return status.payoutsEnabled && (status.hasBankAccount || status.hasCard);
  }, [status]);

  const connectComponent = useMemo(() => {
    if (!status || !status.success) return 'account_onboarding' as const;
    return status.payoutsEnabled ? ('payouts' as const) : ('account_onboarding' as const);
  }, [status]);

  useEffect(() => {
    let mounted = true;
    let interval: any;

    const fetchStatus = async () => {
      try {
        setChecking(true);
        setStatusError(null);
        const res = await fetch('/api/landlord/stripe/status', { cache: 'no-store' });
        const data = (await res.json()) as StripeStatusResponse;

        if (!mounted) return;

        if (!res.ok || !data || data.success === false) {
          setStatus(null);
          setStatusError(
            (data as any)?.message || 'Unable to check payout verification status. Please refresh and try again.'
          );
          return;
        }

        setStatus(data);

        // no-op
      } catch {
        if (!mounted) return;
        setStatusError('Unable to check payout verification status. Please refresh and try again.');
      } finally {
        if (mounted) setChecking(false);
      }
    };

    void fetchStatus();
    interval = setInterval(fetchStatus, 2500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='space-y-4'>
      <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs md:text-sm text-slate-700 space-y-2'>
        <div className='flex items-center justify-between gap-3'>
          <p className='font-semibold text-slate-900'>Payout verification status</p>
          <p className='text-[11px] text-slate-500'>
            {checking ? 'Checking…' : isReady ? 'Verified' : 'Not ready yet'}
          </p>
        </div>

        {statusError ? (
          <p className='text-red-700'>{statusError}</p>
        ) : status?.success ? (
          <div className='space-y-1'>
            <p className='text-[11px] text-slate-600'>
              {getActionLabel(status)}
            </p>
            {!status.payoutsEnabled && status.requirements?.currently_due?.length ? (
              <p className='text-[11px] text-slate-500'>
                Stripe still needs: {status.requirements.currently_due.slice(0, 3).join(', ')}
                {status.requirements.currently_due.length > 3 ? '…' : ''}
              </p>
            ) : null}
          </div>
        ) : (
          <p className='text-[11px] text-slate-600'>Starting verification…</p>
        )}

        {isReady && (
          <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900'>
            Verified. You can cash out now.
          </div>
        )}
      </div>

      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <Button variant='outline' onClick={() => router.push('/admin/payouts')}>
          Back to payouts
        </Button>
        <Button onClick={() => { router.refresh(); }}>
          Refresh status
        </Button>
      </div>

      <div className='rounded-3xl border border-slate-200 bg-white shadow-sm px-4 py-5 md:px-6 md:py-6 space-y-3'>
        <h3 className='text-sm md:text-base font-semibold text-slate-900'>Secure verification</h3>
        <p className='text-xs md:text-sm text-slate-600'>
          Complete the steps below to enable payouts and add your bank account/debit card.
        </p>
        <PayoutsConnectEmbedded component={connectComponent} />
      </div>
    </div>
  );
}
