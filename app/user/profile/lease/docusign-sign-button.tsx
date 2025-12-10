'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DocusignSignButton({ leaseId }: { leaseId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError('');

      const res = await fetch(`/api/leases/${leaseId}/docusign`, {
        method: 'POST',
      });

      if (!res.ok) {
        setError('Failed to start DocuSign signing.');
        return;
      }

      const data = (await res.json()) as { url?: string };

      if (!data.url) {
        setError('DocuSign did not return a signing URL.');
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError('Something went wrong starting DocuSign.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-2'>
      {error && <p className='text-xs text-destructive'>{error}</p>}
      <Button
        type='button'
        onClick={handleClick}
        disabled={isLoading}
        className='rounded-full'
      >
        {isLoading ? 'Opening DocuSign…' : 'Sign lease electronically'}
      </Button>
    </div>
  );
}
