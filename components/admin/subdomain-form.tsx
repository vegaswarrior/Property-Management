'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCurrentLandlordSubdomain } from '@/lib/actions/landlord.actions';

interface SubdomainFormProps {
  currentSubdomain: string;
  rootDomain: string;
}

export default function SubdomainForm({ currentSubdomain, rootDomain }: SubdomainFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      const result = await updateCurrentLandlordSubdomain(formData);
      
      if (!result.success) {
        setError(result.message || 'Failed to update subdomain');
      } else {
        setSuccess(true);
        // Refresh the page to show updated subdomain
        router.refresh();
      }
    });
  };

  return (
    <form action={handleSubmit} className='space-y-3'>
      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
          {error}
        </div>
      )}
      {success && (
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800'>
          Subdomain updated successfully!
        </div>
      )}
      <div>
        <label className='block text-sm font-medium text-slate-700 mb-2'>Subdomain</label>
        <div className='flex items-center gap-2'>
          <input
            type='text'
            name='subdomain'
            defaultValue={currentSubdomain}
            className='flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm'
            placeholder='your-company'
            required
            minLength={3}
            maxLength={50}
            pattern='[a-z0-9-]+'
          />
          <span className='text-sm text-slate-500'>.{rootDomain}</span>
        </div>
        <p className='text-xs text-slate-500 mt-1'>3-50 characters, letters, numbers, and hyphens only</p>
      </div>

      <button
        type='submit'
        disabled={isPending}
        className='inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isPending ? 'Saving...' : 'Save subdomain'}
      </button>
    </form>
  );
}

