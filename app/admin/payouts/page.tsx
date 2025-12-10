import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import PayoutsConnectButton from '@/components/admin/payouts-connect-button';
import { Button } from '@/components/ui/button';

const AdminPayoutsPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    return (
      <main className='px-4 py-10'>
        <div className='max-w-3xl mx-auto text-sm text-red-600'>
          {landlordResult.message || 'Unable to load landlord context for payouts.'}
        </div>
      </main>
    );
  }

  const landlord = landlordResult.landlord;

  const [unpaidRent, payouts] = await Promise.all([
    prisma.rentPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        payoutId: null,
        lease: {
          unit: {
            property: { landlordId: landlord.id },
          },
        },
      },
    }),
    prisma.payout.findMany({
      where: { landlordId: landlord.id },
      orderBy: { initiatedAt: 'desc' },
      take: 10,
    }),
  ]);

  const availableAmount = Number(unpaidRent._sum.amount || 0);

  return (
    <main className='px-4 py-8'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <section className='space-y-3'>
          <h1 className='text-2xl font-semibold text-slate-900'>Payouts</h1>
          <p className='text-sm text-slate-600'>
            Rent payments collected through the tenant portal appear here as available balance. When you
            cash out, we send funds to your saved payout details.
          </p>
        </section>

        <section className='grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start'>
          <div className='rounded-2xl border border-slate-200 bg-white p-5 space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-slate-500 uppercase tracking-[0.18em]'>
                  Available balance
                </p>
                <p className='mt-1 text-3xl font-semibold text-slate-900'>
                  ${availableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className='grid gap-3 md:grid-cols-2 text-xs md:text-sm'>
              <form action='/api/landlord/payouts/cash-out' method='POST' className='space-y-1'>
                <input type='hidden' name='type' value='standard' />
                <button
                  type='submit'
                  disabled={availableAmount <= 0}
                  className='inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  Free bank transfer
                </button>
                <p className='text-[11px] text-slate-500'>
                  Processed every Monday. No payout fee.
                </p>
              </form>

              <form action='/api/landlord/payouts/cash-out' method='POST' className='space-y-1'>
                <input type='hidden' name='type' value='instant' />
                <button
                  type='submit'
                  disabled={availableAmount <= 0}
                  className='inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  Instant cash out ($2 fee)
                </button>
                <p className='text-[11px] text-slate-500'>
                  Sent as soon as possible to your saved payout method.
                </p>
              </form>
            </div>

            <div className='mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs md:text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
              <div>
                <p className='font-medium text-slate-900'>Cash-paying tenants?</p>
                <p className='text-slate-600 text-[11px] md:text-xs'>
                  Generate barcodes for Walmart, 7‑Eleven and other locations so tenants can pay rent with cash.
                </p>
              </div>
              <Link href='/admin/cash-collection'>
                <Button variant='outline' size='sm' className='w-full md:w-auto'>
                  Manage Cash Payments
                </Button>
              </Link>
            </div>

            {!landlord.stripeConnectAccountId && (
              <p className='text-xs text-amber-600'>
                You have not added payout details yet. Go to Settings to securely add your bank or debit card
                information.
              </p>
            )}
          </div>

          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3'>
            <div className='space-y-2'>
              <p className='font-semibold text-slate-900'>Payout method</p>
              <p className='text-xs text-slate-500'>
                Add or update the bank account or debit card where you want to receive payouts. Details are
                stored securely and only the last 4 digits are shown.
              </p>
              <PayoutsConnectButton />
            </div>

            <div className='space-y-1 border-t border-slate-200 pt-3'>
              <p className='font-semibold text-slate-900'>How payouts work</p>
              <p>
                Free bank transfers are bundled and processed every Monday. Instant cash outs are processed
                immediately with a flat $2.00 fee.
              </p>
              <p className='text-xs text-slate-500'>
                Banking details are encrypted and processed by a PCI-compliant provider. We never store full
                card or account numbers on our servers.
              </p>
            </div>
          </div>
        </section>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-slate-900'>Recent payouts</h2>
          <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden text-sm'>
            <div className='grid grid-cols-4 gap-2 px-4 py-2 text-xs font-medium text-slate-500 border-b border-slate-100'>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Reference</span>
            </div>
            {payouts.length === 0 ? (
              <div className='px-4 py-4 text-xs text-slate-500'>No payouts yet.</div>
            ) : (
              <ul className='divide-y divide-slate-100'>
                {payouts.map((payout) => (
                  <li key={payout.id} className='grid grid-cols-4 gap-2 px-4 py-2 text-xs text-slate-700'>
                    <span>{new Date(payout.initiatedAt).toLocaleDateString()}</span>
                    <span>
                      ${Number(payout.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className='capitalize'>{payout.status}</span>
                    <span className='truncate'>{payout.stripeTransferId || '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminPayoutsPage;
