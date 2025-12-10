import { APP_NAME } from '@/lib/constants';
import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';
import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

async function getLandlordForRequest() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const rawApex = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  console.log('[Subdomain Detection] Host:', host);
  console.log('[Subdomain Detection] NEXT_PUBLIC_ROOT_DOMAIN:', rawApex);

  const bareHost = host.split(':')[0].toLowerCase();
  let subdomain: string | null = null;

  if (rawApex) {
    let apex = rawApex.trim().toLowerCase();

    // Strip protocol if present
    if (apex.startsWith('http://')) apex = apex.slice(7);
    if (apex.startsWith('https://')) apex = apex.slice(8);

    // Remove any trailing slash
    if (apex.endsWith('/')) apex = apex.slice(0, -1);

    // Also strip port from apex for comparison
    const apexBase = apex.split(':')[0];

    console.log('[Subdomain Detection] bareHost:', bareHost);
    console.log('[Subdomain Detection] apexBase:', apexBase);

    if (bareHost !== apexBase && bareHost.endsWith(`.${apexBase}`)) {
      subdomain = bareHost.slice(0, bareHost.length - apexBase.length - 1);
      console.log('[Subdomain Detection] Extracted subdomain (from apex):', subdomain);
    }
  }

  // Localhost/dev fallback: treat *.localhost as subdomains
  if (!subdomain && bareHost.endsWith('.localhost')) {
    subdomain = bareHost.slice(0, bareHost.length - '.localhost'.length);
    console.log('[Subdomain Detection] Extracted subdomain (localhost fallback):', subdomain);
  }

  if (!subdomain) {
    console.log('[Subdomain Detection] No subdomain detected, showing main homepage');
    return null;
  }

  console.log('[Subdomain Detection] Looking up landlord with subdomain:', subdomain);
  const landlord = await prisma.landlord.findUnique({ where: { subdomain } });
  console.log('[Subdomain Detection] Landlord found:', landlord ? landlord.name : 'null');
  return landlord;
}

const Homepage = async () => {
  const landlord = await getLandlordForRequest();

  if (landlord) {
    const properties = await prisma.property.findMany({
      where: {
        landlordId: landlord.id,
        units: {
          some: {
            isAvailable: true,
          },
        },
      },
      include: {
        units: {
          where: { isAvailable: true },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return (
      <main className='flex-1 w-full'>
        <section className='w-full pt-10 pb-14 px-4'>
          <div className='max-w-6xl mx-auto space-y-4 bg-translucent rounded-3xl p-6 md:p-8 text-slate-50'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-emerald-300 uppercase tracking-wide'>Listings</p>
              <h1 className='text-2xl md:text-3xl font-semibold tracking-tight text-white'>Homes and apartments by {landlord.name}</h1>
              <p className='text-sm text-slate-100/80 max-w-2xl'>
                Browse available units and start your application online. All rent payments and maintenance
                requests are handled securely through our resident portal.
              </p>
            </div>
          </div>
        </section>

        <section className='w-full py-10 px-4'>
          <div className='max-w-6xl mx-auto bg-translucent rounded-3xl p-6 md:p-8 text-slate-50'>
            {properties.length === 0 ? (
              <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600'>
                No properties are currently available for this landlord. Please check back soon.
              </div>
            ) : (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {properties.map((property) => {
                  const unitCount = property.units.length;
                  return (
                    <div
                      key={property.id}
                      className='rounded-2xl border border-white/10 bg-slate-950/40 shadow-sm overflow-hidden flex flex-col backdrop-blur-sm'
                    >
                      <div className='relative h-44 w-full bg-slate-900/60'>
                        <Image
                          src={property.units[0]?.images?.[0] || '/images/placeholder-property.jpg'}
                          alt={property.name}
                          fill
                          className='object-cover'
                        />
                      </div>
                      <div className='p-4 space-y-2 flex-1 flex flex-col'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='space-y-1'>
                            <h2 className='text-sm font-semibold text-white'>{property.name}</h2>
                            <p className='text-[11px] text-slate-200'>
                              {unitCount === 1
                                ? '1 available unit'
                                : `${unitCount} available units`}
                            </p>
                          </div>
                        </div>

                        {property.units[0] && (
                          <p className='text-sm font-medium text-emerald-300 mt-1'>
                            {formatCurrency(Number(property.units[0].rentAmount))} / month
                          </p>
                        )}

                        <div className='mt-3 flex items-center justify-between text-[11px] text-slate-200'>
                          <span>{property.type}</span>
                          <span>Professionally managed</span>
                        </div>

                        <div className='mt-4 flex gap-2'>
                          <Link
                            href={`/${property.slug}/apply`}
                            className='inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-medium text-slate-950 hover:bg-emerald-400 flex-1'
                          >
                            Start application
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className='flex-1 w-full'>
        {/* Hero: speak directly to landlords */}
        <section className='w-full pt-16 pb-20 px-4'>
          <div className='max-w-6xl mx-auto grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center bg-translucent rounded-3xl p-6 md:p-10 text-slate-50'>
            <div className='space-y-6'>
              <div className='inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-emerald-300 text-[11px] font-medium border border-emerald-300/60'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                <span>Built for independent landlords & small property managers</span>
              </div>
              <h1 className='text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-white'>
                Property management software that grows with your units.
              </h1>
              <p className='text-sm md:text-base text-slate-100/85 max-w-xl'>
                {APP_NAME} gives you everything in one place: properties, tenants, leases, online rent
                payments, and maintenance—designed for landlords with 1 to 200+ units.
              </p>
              <div className='flex flex-wrap items-center gap-3'>
                <a
                  href='/(auth)/sign-up'
                  className='inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-emerald-300 transition'
                >
                  Get started free
                </a>
                <a
                  href='#how-it-works'
                  className='inline-flex items-center justify-center rounded-full border border-white/30 text-slate-50 px-4 py-2 text-xs font-medium hover:bg-white/10 transition'
                >
                  See how it works
                </a>
              </div>
              <div className='flex flex-wrap items-center gap-4 text-[11px] text-slate-200/90'>
                <span>Stripe-powered rent payments directly to your account</span>
                <span className='hidden xs:inline text-slate-400'>•</span>
                <span className='hidden xs:inline'>Leases signed securely with e-signatures</span>
              </div>
            </div>
            <div className='relative h-64 md:h-80 rounded-2xl bg-slate-950/40 border border-white/15 shadow-lg overflow-hidden p-5 flex flex-col justify-between backdrop-blur-md'>
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-xs text-slate-200'>
                  <span className='font-semibold'>Portfolio snapshot</span>
                  <span className='text-[10px] text-emerald-300'>Live demo</span>
                </div>
                <div className='grid grid-cols-3 gap-3 text-[11px]'>
                  <div className='rounded-xl bg-slate-900/70 border border-white/10 p-3 space-y-1'>
                    <div className='text-slate-300'>Units</div>
                    <div className='text-lg font-semibold text-white'>18</div>
                    <div className='text-[10px] text-emerald-300'>3 vacant, 15 occupied</div>
                  </div>
                  <div className='rounded-xl bg-slate-900/70 border border-white/10 p-3 space-y-1'>
                    <div className='text-slate-300'>This month&apos;s rent</div>
                    <div className='text-lg font-semibold text-white'>$24,750</div>
                    <div className='text-[10px] text-emerald-300'>96% collected</div>
                  </div>
                  <div className='rounded-xl bg-slate-900/70 border border-white/10 p-3 space-y-1'>
                    <div className='text-slate-300'>Tickets</div>
                    <div className='text-lg font-semibold text-white'>4</div>
                    <div className='text-[10px] text-amber-300'>2 urgent, 2 scheduled</div>
                  </div>
                </div>
              </div>
              <div className='space-y-2 text-[11px]'>
                <div className='flex items-center justify-between text-slate-200'>
                  <span className='font-medium'>Onboarding checklist</span>
                  <span className='text-emerald-300'>3 of 4 complete</span>
                </div>
                <ol className='space-y-1'>
                  <li className='flex items-center gap-2'>
                    <span className='h-4 w-4 rounded-full bg-emerald-400 flex items-center justify-center text-[9px] font-bold text-slate-950'>✓</span>
                    <span>Add your first property</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <span className='h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-slate-950'>✓</span>
                    <span>Invite a tenant</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <span className='h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-slate-950'>✓</span>
                    <span>Send lease for e-signature</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <span className='h-4 w-4 rounded-full border border-emerald-300/80 text-[9px] font-bold text-emerald-200 flex items-center justify-center'>4</span>
                    <span>Connect payouts with Stripe</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* How it works: simple 4-step flow */}
        <section
          id='how-it-works'
          className='w-full py-14 md:py-16 px-4'
        >
          <div className='max-w-5xl mx-auto space-y-8 bg-translucent rounded-3xl p-6 md:p-10 text-slate-50'>
            <div className='space-y-2 text-center'>
              <h2 className='text-2xl md:text-3xl font-semibold tracking-tight text-white'>How {APP_NAME} fits your day-to-day</h2>
              <p className='text-sm md:text-base text-slate-100/80 max-w-2xl mx-auto'>
                Go from spreadsheets and text-message chaos to a single, organized system for
                properties, tenants, leases, rent, and maintenance.
              </p>
            </div>
            <div className='grid gap-4 md:grid-cols-4 text-[13px] md:text-sm'>
              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex flex-col gap-2'>
                <span className='text-[11px] font-semibold text-emerald-300'>Step 1</span>
                <h3 className='font-semibold'>Add your properties & units</h3>
                <p className='text-slate-100/85'>
                  Create buildings and units in minutes with beds, baths, rent amounts, and photos.
                </p>
              </div>
              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex flex-col gap-2'>
                <span className='text-[11px] font-semibold text-emerald-300'>Step 2</span>
                <h3 className='font-semibold'>Invite tenants & send leases</h3>
                <p className='text-slate-600'>
                  Send digital lease agreements for e-signature and keep all documents in one place.
                </p>
              </div>
              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex flex-col gap-2'>
                <span className='text-[11px] font-semibold text-emerald-300'>Step 3</span>
                <h3 className='font-semibold'>Collect rent online</h3>
                <p className='text-slate-600'>
                  Tenants pay through a secure portal. Funds route directly to your connected bank
                  account via Stripe.
                </p>
              </div>
              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex flex-col gap-2'>
                <span className='text-[11px] font-semibold text-emerald-300'>Step 4</span>
                <h3 className='font-semibold'>Stay on top of issues</h3>
                <p className='text-slate-600'>
                  Tenants submit maintenance tickets, you track status, and everyone stays updated
                  automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing tiers for different portfolio sizes */}
        <section className='w-full py-16 px-4'>
          <div className='max-w-5xl mx-auto space-y-8 bg-translucent rounded-3xl p-6 md:p-10 text-slate-50'>
            <div className='space-y-2 text-center'>
              <h2 className='text-2xl md:text-3xl font-semibold tracking-tight text-white'>Pricing that grows with your units</h2>
              <p className='text-sm md:text-base text-slate-100/80 max-w-2xl mx-auto'>
                Start free for your first properties. Upgrade only when you add more units or need
                advanced reporting and collaboration.
              </p>
            </div>
            <div className='grid gap-4 md:grid-cols-3 text-[13px] md:text-sm'>
              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-5 flex flex-col gap-4'>
                <div className='space-y-1'>
                  <h3 className='font-semibold text-lg text-white'>Starter</h3>
                  <p className='text-slate-100/80 text-xs md:text-sm'>For individual landlords and side hustlers.</p>
                </div>
                <div className='space-y-1'>
                  <div className='text-2xl font-semibold text-white'>Free</div>
                  <div className='text-slate-200 text-xs'>Up to 24 units</div>
                </div>
                <ul className='space-y-1 text-slate-100/85'>
                  <li>• Unlimited properties & tenants (within unit limit)</li>
                  <li>• Online rent payments</li>
                  <li>• Digital leases & document storage</li>
                  <li>• Maintenance requests & tracking</li>
                  <li>• Email reminders for rent and tickets</li>
                </ul>
                <a
                  href='/(auth)/sign-up'
                  className='mt-auto inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-semibold hover:bg-emerald-300 transition'
                >
                  Start free
                </a>
              </div>
              <div className='rounded-2xl border border-emerald-300/80 bg-emerald-500/20 p-5 flex flex-col gap-4 ring-2 ring-emerald-300/60'>
                <div className='space-y-1'>
                  <div className='inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] text-emerald-200 border border-emerald-300/80'>
                    <span>Most popular</span>
                  </div>
                  <h3 className='font-semibold text-lg text-white'>Pro</h3>
                  <p className='text-emerald-50 text-xs md:text-sm'>For growing portfolios and lean management teams.</p>
                </div>
                <div className='space-y-1'>
                  <div className='text-2xl font-semibold text-white'>$79</div>
                  <div className='text-emerald-50 text-xs'>per month · 25–199 units</div>
                </div>
                <ul className='space-y-1 text-emerald-50'>
                  <li>• Everything in Starter</li>
                  <li>• Advanced income & vacancy reports</li>
                  <li>• Automated late fees & extra reminders</li>
                  <li>• Team access for assistants & bookkeepers</li>
                  <li>• Priority support</li>
                </ul>
                <a
                  href='/(auth)/sign-up'
                  className='mt-auto inline-flex items-center justify-center rounded-full bg-emerald-300 text-slate-950 px-4 py-2 text-xs font-semibold hover:bg-emerald-200 transition'
                >
                  Try Pro
                </a>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col gap-4'>
                <div className='space-y-1'>
                  <h3 className='font-semibold text-lg text-white'>Large portfolio</h3>
                  <p className='text-slate-100/80 text-xs md:text-sm'>For property management companies and larger owners.</p>
                </div>
                <div className='space-y-1'>
                  <div className='text-2xl font-semibold text-white'>$250</div>
                  <div className='text-slate-200 text-xs'>per month · 200+ units</div>
                </div>
                <ul className='space-y-1 text-slate-700'>
                  <li>• Everything in Pro</li>
                  <li>• Custom branding & subdomain setup</li>
                  <li>• Higher automation & notification limits</li>
                  <li>• Dedicated onboarding help</li>
                  <li>• Priority roadmap feedback</li>
                </ul>
                <a
                  href='/contact'
                  className='mt-auto inline-flex items-center justify-center rounded-full border border-emerald-300/80 text-emerald-100 px-4 py-2 text-xs font-semibold hover:bg-emerald-500/10 transition'
                >
                  Talk to us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Who this is for / positioning */}
        <section className='w-full py-14 md:py-16 px-4'>
          <div className='max-w-5xl mx-auto space-y-8 bg-translucent rounded-3xl p-6 md:p-10 text-slate-50'>
            <div className='space-y-2 text-center'>
              <h2 className='text-2xl md:text-3xl font-semibold tracking-tight text-white'>Built for modern, lean landlords</h2>
              <p className='text-sm md:text-base text-slate-100/80 max-w-2xl mx-auto'>
                Skip the clunky legacy software. {APP_NAME} is fast, simple, and focused on what you
                actually do every month.
              </p>
            </div>
            <div className='grid gap-4 md:grid-cols-3 text-[13px] md:text-sm'>
              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-1'>
                <h3 className='font-semibold'>New landlords (1–5 units)</h3>
                <p className='text-slate-600'>
                  Get out of spreadsheets and text threads. Keep all leases, payments, and tenants in
                  one clean dashboard.
                </p>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-1'>
                <h3 className='font-semibold'>Growing portfolios (5–25 units)</h3>
                <p className='text-slate-600'>
                  Stay ahead of rent, renewals, and repairs as you scale without hiring a full office
                  team.
                </p>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-1'>
                <h3 className='font-semibold'>Lean management companies</h3>
                <p className='text-slate-600'>
                  Offer a modern experience to owners and residents with online payments, branded
                  portals, and clear reporting.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Property collections as entry points */}
      {/* Trust & contact */}
      {/* <DealCountdown /> */}
      <CustomerReviews />
      <HomeContactCard />
    </>
  );
};

export default Homepage;
