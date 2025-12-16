'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LeaseViewerProps {
  leaseHtml: string;
  triggerLabel?: string;
}

export default function LeaseViewer({ leaseHtml, triggerLabel = 'View lease' }: LeaseViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='rounded-full border-white/30 text-white hover:bg-white/10'>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-5xl max-h-[85vh] overflow-hidden bg-slate-950 text-slate-50 border border-white/10'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold'>Lease preview</DialogTitle>
        </DialogHeader>
        <div className='overflow-auto max-h-[70vh] rounded-lg border border-white/10 bg-slate-900/70 p-4'>
          {leaseHtml ? (
            <div
              className='prose prose-invert max-w-none text-sm'
              dangerouslySetInnerHTML={{ __html: leaseHtml }}
            />
          ) : (
            <p className='text-sm text-slate-300'>Lease content is unavailable.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
