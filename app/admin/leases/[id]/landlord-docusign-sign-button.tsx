'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import LeaseSigningModal from '@/components/lease-signing-modal';

interface LandlordDocusignSignButtonProps {
  leaseId: string;
}

export default function LandlordDocusignSignButton({ leaseId }: LandlordDocusignSignButtonProps) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [signingToken, setSigningToken] = useState('');

  const handleSign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}/sign-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'landlord' }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to initiate signing');
        return;
      }

      const data = await res.json();
      const token = data.token || '';
      if (!token) {
        alert('Signing link missing');
        return;
      }
      
      setSigningToken(token);
      setModalOpen(true);
    } catch (error) {
      console.error('Sign error:', error);
      alert('An error occurred while initiating signing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleSign}
        disabled={loading}
        className='bg-orange-600 hover:bg-orange-700 text-white'
      >
        {loading ? 'Loading...' : 'Sign Lease Electronically'}
      </Button>
      
      {signingToken && (
        <LeaseSigningModal 
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          token={signingToken}
        />
      )}
    </>
  );
}
