import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { Building2, Users, FileText, Wrench } from 'lucide-react';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminNavLinks } from '@/lib/constants/admin-nav';

export const metadata: Metadata = {
  title: 'Property Dashboard',
};

const AdminOverviewPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlordId = landlordResult.landlord.id;

  const [
    propertiesCount,
    applicationsCount,
    tenantsCount,
    ticketsCount,
  ] = await Promise.all([
    prisma.property.count({ where: { landlordId } }),
    prisma.rentalApplication.count({
      where: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        role: 'tenant',
        leasesAsTenant: {
          some: {
            unit: {
              property: {
                landlordId,
              },
            },
          },
        },
      },
    }),
    prisma.maintenanceTicket.count({
      where: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    }),
  ]);

  if (propertiesCount === 0) {
    redirect('/admin/onboarding');
  }

  return (
    <div className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-2'>Property Dashboard</h1>
          <p className='text-sm text-slate-500'>High-level snapshot of properties, tenants, and operations.</p>
        </div>

        {/* Stats Cards - Clickable on mobile */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Link href='/admin/products' className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <Building2 className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Properties</span>
              <span className='text-2xl font-semibold text-slate-900'>{propertiesCount}</span>
              <span className='text-xs text-slate-500'>Active buildings and communities</span>
            </div>
          </Link>

          <Link href='/admin/applications' className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <FileText className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Applications</span>
              <span className='text-2xl font-semibold text-slate-900'>{applicationsCount}</span>
              <span className='text-xs text-slate-500'>Submitted rental applications</span>
            </div>
          </Link>

          <Link href='/admin/users' className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <Users className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Tenants</span>
              <span className='text-2xl font-semibold text-slate-900'>{tenantsCount}</span>
              <span className='text-xs text-slate-500'>Users with tenant access</span>
            </div>
          </Link>

          <Link href='/admin/maintenance' className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <Wrench className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Maintenance</span>
              <span className='text-2xl font-semibold text-slate-900'>{ticketsCount}</span>
              <span className='text-xs text-slate-500'>Total work tickets logged</span>
            </div>
          </Link>
        </div>

        {/* Mobile Navigation Cards - Show all sidebar links on mobile (excluding duplicates from stat cards) */}
        <div className='md:hidden space-y-4'>
          <div className='grid gap-3'>
            {adminNavLinks
              .filter((item) => {
                // Filter out links that are already shown in the stat cards above
                const statCardLinks = ['/admin/products', '/admin/applications', '/admin/maintenance'];
                return !statCardLinks.includes(item.href);
              })
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
                  >
                    <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0'>
                      <Icon className='h-4 w-4' />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-semibold text-slate-900'>{item.title}</span>
                      <span className='text-xs text-slate-500'>{item.description}</span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
