'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PayoutsConnectButton = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/landlord/stripe/onboard');
      const data = await res.json();

      if (!res.ok || !data?.success) {
        toast({
          variant: 'destructive',
          description: data?.message || 'Unable to contact Stripe for payouts setup.',
        });
        return;
      }

      toast({
        description:
          'Your payout method is ready or in progress. You can securely add or update bank and debit details here.',
      });
    } catch (error) {
      console.error('Error calling payouts onboarding API', error);
      toast({
        variant: 'destructive',
        description: 'Something went wrong while preparing payouts.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type='button'
      onClick={handleClick}
      disabled={loading}
      className='rounded-full bg-emerald-600 text-white px-6 py-2.5 text-sm font-semibold shadow hover:bg-emerald-500 transition'
    >
      {loading ? 'Saving payout method…' : 'Add / update payout method'}
    </Button>
  );
};

export default PayoutsConnectButton;
