import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import Link from 'next/link';
import { Building2, Users, Wrench, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Getting started',
};

const AdminOnboardingPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  const landlordName = landlordResult.success ? landlordResult.landlord.name : 'Your properties';

  return (
    <main className='min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12'>
      <div className='max-w-3xl w-full space-y-12'>
        {/* Welcome header */}
        <div className='text-center space-y-4'>
          <p className='text-sm uppercase tracking-[0.3em] text-emerald-600/80'>
            Welcome, {landlordName.split(' ')[0]}
          </p>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 leading-tight'>
            Let's get your dashboard set up
          </h1>
          <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
            Add your first property to start managing tenants and rent payments
          </p>
        </div>

        {/* Quick start steps */}
        <div className='grid gap-4 max-w-xl mx-auto'>
          <Link
            href='/admin/products/create'
            className='group relative rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200'
          >
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-200 transition-colors'>
                <Building2 className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-900 mb-1'>
                  Add your first property
                </h3>
                <p className='text-sm text-slate-600'>
                  Create a building with units and rent amounts
                </p>
              </div>
            </div>
          </Link>

          <div className='rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 opacity-60'>
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center'>
                <Users className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-700 mb-1'>
                  Invite tenants
                </h3>
                <p className='text-sm text-slate-500'>
                  Available after adding a property
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 opacity-60'>
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center'>
                <CreditCard className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-700 mb-1'>
                  Connect payouts
                </h3>
                <p className='text-sm text-slate-500'>
                  Link your bank to receive rent payments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Skip option */}
        <div className='text-center'>
          <Link
            href='/admin/overview'
            className='inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors'
          >
            Skip for now and explore the dashboard
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AdminOnboardingPage;
