import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import EvictionFlow from '@/components/admin/eviction-flow';

export default async function PropertyDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await props.params;

  const landlordResult = await getOrCreateCurrentLandlord();
  if (!landlordResult.success) notFound();

  const property = await prisma.property.findFirst({
    where: { id, landlordId: landlordResult.landlord.id },
    include: {
      units: {
        include: {
          leases: {
            include: { tenant: { select: { id: true, name: true, email: true, phoneNumber: true } } },
          },
        },
      },
    },
  });

  if (!property) notFound();

  const imageSrc =
    property.units
      .map((u) => u.images?.[0])
      .filter(Boolean)[0] ?? '';

  const tenants = property.units.flatMap((unit) =>
    unit.leases.map((lease) => ({
      leaseId: lease.id,
      tenantId: lease.tenantId,
      name: lease.tenant?.name || 'Tenant',
      email: lease.tenant?.email || '',
      phone: lease.tenant?.phoneNumber || '',
      unitName: unit.name,
      status: lease.status,
    }))
  );

  return (
    <main className="w-full px-4 py-8 md:px-0">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-200/70">Property overview</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">{property.name}</h1>
            <p className="text-slate-300/80 text-sm">
              {property.type} • {property.address && typeof property.address === 'object'
                ? `${(property.address as any).street ?? ''} ${(property.address as any).unit ?? ''}`.trim()
                : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-white/10 text-black">
              <Link href={`/admin/products/${property.id}`}>Edit</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/maintenance">Start repair flow</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-white">Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Type" value={property.type} />
                <Stat label="Units" value={property.units.length} />
                <Stat
                  label="Lowest rent"
                  value={
                    property.units.length
                      ? formatCurrency(
                          Math.min(...property.units.map((u) => Number(u.rentAmount)))
                        )
                      : '—'
                  }
                />
              </div>
              <div className="h-px bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Units</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {property.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-xl border border-white/10 bg-slate-800/60 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white font-medium">{unit.name}</p>
                        <Badge variant="outline" className="border-emerald-400/40 text-emerald-200">
                          {unit.isAvailable ? 'Available' : 'Occupied'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300">
                        {unit.type} • {unit.bedrooms ?? '—'} bd •{' '}
                        {unit.bathrooms !== null && unit.bathrooms !== undefined
                          ? Number(unit.bathrooms)
                          : '—'}{' '}
                        ba • {unit.sizeSqFt ? `${unit.sizeSqFt} sqft` : '—'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Rent: {formatCurrency(Number(unit.rentAmount ?? 0))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-white">Blueprint</CardTitle>
            </CardHeader>
            <CardContent>
              {imageSrc ? (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <Image
                    src={imageSrc}
                    alt="Blueprint"
                    width={800}
                    height={600}
                    className="w-full h-64 object-cover"
                  />
                </div>
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-white/10 bg-slate-800/60 flex items-center justify-center text-slate-400 text-sm">
                  No blueprint uploaded
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-white">Tenants & actions</CardTitle>
          </CardHeader>
          <CardContent>
            <EvictionFlow tenants={tenants} propertyId={property.id} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800/50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white mt-1">{value}</p>
    </div>
  );
}
