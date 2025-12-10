import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

export default async function AdminLeasesPage() {
  await requireAdmin();
  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlordId = landlordResult.landlord.id;

  const leases = await prisma.lease.findMany({
    where: {
      unit: {
        property: {
          landlordId,
        },
      },
    },
    orderBy: { startDate: 'desc' },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
      },
      unit: {
        select: {
          name: true,
          type: true,
          property: { select: { name: true } },
        },
      },
    },
  });

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-1'>Leases</h1>
          <p className='text-sm text-slate-600'>View active and past leases and open a printable lease document.</p>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
          <table className='min-w-full text-sm'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Tenant</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Unit / property</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Start</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>End</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Status</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Lease doc</th>
              </tr>
            </thead>
            <tbody>
              {leases.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-6 text-center text-slate-500'>
                    No leases found.
                  </td>
                </tr>
              )}
              {leases.map((lease) => (
                <tr key={lease.id} className='border-t border-slate-100'>
                  <td className='px-4 py-2 text-xs text-slate-700'>
                    {lease.tenant?.name || 'Tenant'}
                    {lease.tenant?.email && (
                      <span className='block text-[11px] text-slate-400'>{lease.tenant.email}</span>
                    )}
                  </td>
                  <td className='px-4 py-2 text-xs text-slate-700'>
                    {lease.unit.property?.name || 'Property'} • {lease.unit.name}
                  </td>
                  <td className='px-4 py-2 text-xs text-slate-500'>
                    {new Date(lease.startDate).toLocaleDateString()}
                  </td>
                  <td className='px-4 py-2 text-xs text-slate-500'>
                    {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}
                  </td>
                  <td className='px-4 py-2 text-xs capitalize text-slate-700'>{lease.status}</td>
                  <td className='px-4 py-2 text-xs'>
                    <a
                      href={`/admin/leases/${lease.id}`}
                      className='inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800'
                    >
                      View lease PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
