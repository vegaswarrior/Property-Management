import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import TenantComms from '@/components/admin/tenant-comms';
import { headers } from 'next/headers';

type ThreadWithMessages = {
  id: string;
  type: string;
  subject: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    content: string | null;
    senderName: string | null;
    senderEmail: string | null;
    createdAt: Date;
  }[];
};

export default async function AdminCommunicationsPage() {
  const session = await requireAdmin();

  const headersList = await headers();
  const landlordSlug = headersList.get('x-landlord-slug');

  const landlord = landlordSlug
    ? await prisma.landlord.findUnique({
        where: { subdomain: landlordSlug },
        select: { id: true },
      })
    : session?.user?.id
      ? await prisma.landlord.findFirst({
          where: { ownerUserId: session.user.id as string },
          select: { id: true },
        })
      : null;

  const landlordId = landlord?.id ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const threads = (await (prisma as any).thread.findMany({
    where: {
      type: { in: ['contact', 'support'] },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })) as ThreadWithMessages[];

  const tenantLeases = landlordId
    ? await prisma.lease.findMany({
        where: {
          status: 'active',
          unit: {
            property: {
              landlordId,
            },
          },
        },
        distinct: ['tenantId'],
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          unit: {
            select: {
              name: true,
              property: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })
    : [];

  const tenants = tenantLeases.map((lease) => ({
    id: lease.tenant.id,
    name: lease.tenant.name,
    email: lease.tenant.email,
    unitName: lease.unit.name,
    propertyName: lease.unit.property.name,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Communications
        </h1>
        <p className="text-sm text-slate-300/90">
          Contact inbox + tenant communications in one place.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_20px_70px_rgba(15,23,42,0.35)] overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                Contact Inbox
              </p>
              <h2 className="text-lg font-semibold text-slate-50">Threads</h2>
            </div>
          </div>

          <div className="max-h-[680px] overflow-y-auto p-4 space-y-2">
            {threads.length === 0 && (
              <p className="text-sm text-slate-400/80">No messages yet.</p>
            )}
            {threads.map((thread) => {
              const first = thread.messages[0];
              const preview = first?.content?.slice(0, 120) ?? '';
              const created = new Date(thread.createdAt).toLocaleString();

              return (
                <Link
                  key={thread.id}
                  href={`/admin/messages/${thread.id}`}
                  className="block rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-xs text-slate-200/90 flex flex-col gap-1 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/90">
                      {thread.type === 'contact' ? 'Contact' : 'Support'}
                    </span>
                    <span className="text-[10px] text-slate-400/90">
                      {created}
                    </span>
                  </div>
                  {first?.senderName && (
                    <p className="text-[11px] font-medium text-slate-100/90">
                      {first.senderName}{' '}
                      {first.senderEmail ? `• ${first.senderEmail}` : ''}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-300/90 line-clamp-2">
                    {preview || 'No message content'}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_20px_70px_rgba(15,23,42,0.35)] overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                Tenant Communications
              </p>
              <h2 className="text-lg font-semibold text-slate-50">Messages</h2>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <TenantComms tenants={tenants} landlordId={landlordId ?? undefined} hideHeader />
          </div>
        </section>
      </div>
    </div>
  );
}
