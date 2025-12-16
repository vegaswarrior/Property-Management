import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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
      signatureRequests: {
        select: { id: true, status: true, role: true },
      },
    },
  });

  const leasesAwaitingSignature = leases.filter((l) => {
    const landlordPending = l.signatureRequests?.some(
      (sr) => sr.role === 'landlord' && sr.status !== 'signed'
    );
    return landlordPending && l.tenantSignedAt && !l.landlordSignedAt;
  });

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-1'>Leases</h1>
          <p className='text-sm text-slate-600'>View active and past leases and sign pending lease documents.</p>
          {leasesAwaitingSignature.length > 0 && (
            <Badge className='mt-2 bg-orange-100 text-orange-700 border-orange-200'>
              {leasesAwaitingSignature.length} awaiting your signature
            </Badge>
          )}
        </div>

        {leasesAwaitingSignature.length > 0 && (
          <div className='rounded-xl border-2 border-orange-200 bg-orange-50 p-6 space-y-4'>
            <div className='flex items-start gap-3'>
              <div className='flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold'>
                {leasesAwaitingSignature.length}
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  Leases Awaiting Your Signature
                </h3>
                <p className='text-sm text-slate-600 mb-4'>
                  The following tenants have signed their leases. Please review and sign to complete the agreement.
                </p>
                <div className='space-y-2'>
                  {leasesAwaitingSignature.map((lease) => (
                    <div
                      key={lease.id}
                      className='flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200'
                    >
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-slate-900'>
                          {lease.tenant?.name || 'Tenant'} - {lease.unit.property?.name} • {lease.unit.name}
                        </p>
                        <p className='text-xs text-slate-500'>
                          Tenant signed: {lease.tenantSignedAt ? new Date(lease.tenantSignedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Link
                        href={`/admin/leases/${lease.id}`}
                        className='ml-4 inline-flex items-center rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700'
                      >
                        Sign Lease
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
          <table className='min-w-full text-sm'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Tenant</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Unit / property</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Start</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>End</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Status</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Signatures</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Lease doc</th>
              </tr>
            </thead>
            <tbody>
              {leases.length === 0 && (
                <tr>
                  <td colSpan={7} className='px-4 py-6 text-center text-slate-500'>
                    No leases found.
                  </td>
                </tr>
              )}
              {leases.map((lease) => {
                const tenantSigned = !!lease.tenantSignedAt;
                const landlordSigned = !!lease.landlordSignedAt;
                const bothSigned = tenantSigned && landlordSigned;
                const landlordPending = lease.signatureRequests?.some(
                  (sr) => sr.role === 'landlord' && sr.status !== 'signed'
                );

                return (
                  <tr
                    key={lease.id}
                    className={`border-t border-slate-100 ${landlordPending ? 'bg-orange-50' : ''}`}
                  >
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
                      <div className='flex flex-col gap-1'>
                        {bothSigned ? (
                          <Badge variant='default' className='w-fit bg-green-100 text-green-700 border-green-200'>
                            Fully Signed
                          </Badge>
                        ) : tenantSigned && !landlordSigned ? (
                          <>
                            <Badge variant='default' className='w-fit bg-green-100 text-green-700 border-green-200'>
                              Tenant Signed
                            </Badge>
                            <Badge variant='default' className='w-fit bg-orange-100 text-orange-700 border-orange-200'>
                              Awaiting Landlord
                            </Badge>
                          </>
                        ) : !tenantSigned && !landlordSigned ? (
                          <Badge variant='default' className='w-fit bg-gray-100 text-gray-700 border-gray-200'>
                            Unsigned
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className='px-4 py-2 text-xs'>
                      <a
                        href={`/admin/leases/${lease.id}`}
                        className='inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800'
                      >
                        {tenantSigned && !landlordSigned ? 'Sign Lease' : 'View Lease'}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
