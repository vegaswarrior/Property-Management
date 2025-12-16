'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface SignSession {
  leaseId: string;
  role: 'tenant' | 'landlord';
  recipientName: string;
  recipientEmail: string;
  leaseHtml: string;
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SignSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/sign/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load signing session');
        }
        const data = (await res.json()) as SignSession;
        if (canceled) return;
        setSession(data);
        setSignerName(data.recipientName || '');
        setSignerEmail(data.recipientEmail || '');
      } catch (err: any) {
        setError(err.message || 'Unable to load signing session');
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * ratio;
      canvas.height = clientHeight * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false;
    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const start = (e: PointerEvent) => {
      drawing = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const end = () => {
      drawing = false;
      ctx.closePath();
    };

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointerleave', end);
    canvas.addEventListener('pointercancel', end);

    // Enable touch drawing without scrolling the page
    canvas.style.touchAction = 'none';
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointerleave', end);
      canvas.removeEventListener('pointercancel', end);
    };
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    if (!session) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!consent) {
      toast({ title: 'Consent required', description: 'Please agree to sign electronically.' });
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl: dataUrl,
          signerName,
          signerEmail,
          consent: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit signature');
      }
      toast({ title: 'Signed', description: 'Your signature was recorded.' });
      router.replace('/user/profile/lease?signed=1');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to sign' });
    } finally {
      setSubmitting(false);
    };
  };

  return (
    <div className='min-h-screen bg-background text-foreground px-4 py-8'>
      <div className='mx-auto w-full max-w-7xl space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-semibold'>Sign Lease</h1>
          <p className='text-sm text-muted-foreground flex flex-wrap gap-2'>
            {session ? `Role: ${session.role}` : ''}
            {session ? `• ${session.recipientEmail}` : ''}
          </p>
        </div>

        {loading && <p className='text-sm text-muted-foreground'>Loading signing session…</p>}
        {error && <p className='text-sm text-destructive'>{error}</p>}

        {session && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='rounded-2xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6 space-y-4 overflow-hidden'>
              <h2 className='text-lg font-semibold'>Lease Preview</h2>
              <div className='min-h-[75vh] max-h-[82vh] overflow-auto rounded-xl border bg-muted/20 p-5'>
                <div
                  className='prose max-w-none text-base leading-relaxed'
                  dangerouslySetInnerHTML={{ __html: session.leaseHtml }}
                />
              </div>
            </div>

            <div className='rounded-2xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6 space-y-4'>
              <h2 className='text-lg font-semibold'>Sign here</h2>
              <div className='space-y-4'>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-xs text-muted-foreground'>Full name</label>
                    <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs text-muted-foreground'>Email</label>
                    <Input value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} />
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-xs text-muted-foreground'>Signature (mouse, touch, or stylus)</label>
                  <div className='rounded-xl border bg-muted/30 p-3'>
                    <canvas ref={canvasRef} className='w-full h-48 bg-white rounded-lg shadow-inner' />
                    <div className='flex justify-end mt-3'>
                      <Button size='sm' variant='outline' onClick={clearSignature}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
                <div className='flex items-start gap-2 rounded-lg border bg-muted/20 p-3'>
                  <Checkbox id='consent' checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
                  <label htmlFor='consent' className='text-xs text-muted-foreground leading-relaxed'>
                    I agree to sign electronically and confirm that this signature is legally binding for this lease.
                  </label>
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className='w-full'>
                  {submitting ? 'Submitting…' : 'Submit Signature'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
