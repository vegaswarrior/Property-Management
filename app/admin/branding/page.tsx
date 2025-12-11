import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord, uploadLandlordLogo, updateCustomDomain } from '@/lib/actions/landlord.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getRootDomainFromHost, getProtocol } from '@/lib/utils/domain-utils';
import SubdomainForm from '@/components/admin/subdomain-form';
import DomainSearch from '@/components/admin/domain-search';
import { Image, Globe, Palette } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Branding & Domain',
};

const AdminBrandingPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlord = landlordResult.landlord;
  
  // Get root domain from request headers (works in production)
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const rootDomain = getRootDomainFromHost(host);
  const protocol = getProtocol(host);

  const handleLogoUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadLandlordLogo(formData);
    if (!result.success) {
      throw new Error(result.message || 'Failed to upload logo');
    }
    // Redirect to refresh the page with new logo
    redirect('/admin/branding');
  };

  const handleCustomDomainUpdate = async (formData: FormData) => {
    'use server';
    const result = await updateCustomDomain(formData);
    if (!result.success) {
      throw new Error(result.message || 'Failed to update custom domain');
    }
    // Redirect to refresh the page
    redirect('/admin/branding');
  };

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-2'>Branding & Domain</h1>
          <p className='text-sm text-slate-500'>
            Customize your public tenant portal with your logo, subdomain, and optional custom domain.
          </p>
        </div>

        {/* Logo Section */}
        <section className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow'>
          <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0'>
            <Image className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-900'>Logo</h2>
              <p className='text-xs text-slate-500'>
                Upload your company logo to display on your public tenant portal. Recommended size: 200x200px.
              </p>
            </div>

          {landlord.logoUrl && (
            <div className='flex items-center gap-4'>
              <div className='relative h-16 w-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50'>
                <img
                  src={landlord.logoUrl}
                  alt={`${landlord.name} logo`}
                  className='h-full w-full object-contain'
                />
              </div>
              <div className='text-sm text-slate-600'>
                <p className='font-medium text-slate-900'>Current logo</p>
                <p className='text-xs text-slate-500'>Displayed on your tenant portal</p>
              </div>
            </div>
          )}

          <form action={handleLogoUpload} className='space-y-3'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>Upload Logo</label>
              <input
                type='file'
                name='logo'
                accept='image/jpeg,image/png,image/svg+xml,image/webp'
                className='block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100'
                required
              />
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800'
              >
                Upload logo
              </button>
              <button
                type='button'
                className='inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100'
              >
                Request custom logo design ($99)
              </button>
            </div>
          </form>

            <p className='text-xs text-slate-500'>
              We'll design a professional logo for your brand (1 revision included). Delivered within 3 business days.
            </p>
          </div>
        </section>

        {/* Subdomain Section */}
        <section className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow'>
          <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0'>
            <Globe className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-900'>Subdomain</h2>
              <p className='text-xs text-slate-500'>
                Your free subdomain where tenants can view listings, apply, and pay rent online.
              </p>
            </div>

          <SubdomainForm currentSubdomain={landlord.subdomain} rootDomain={rootDomain} />

            {landlord.subdomain && (
              <p className='text-xs text-slate-600'>
                Current URL:{' '}
                <a
                  href={`${protocol}://${landlord.subdomain}.${rootDomain}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-mono text-emerald-700 hover:underline'
                >
                  {`${protocol}://${landlord.subdomain}.${rootDomain}`}
                </a>
              </p>
            )}
          </div>
        </section>

        {/* Custom Domain Section */}
        <section className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow'>
          <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0'>
            <Palette className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-900'>Custom Domain</h2>
              <p className='text-xs text-slate-500'>
                Use your own domain (e.g., www.yourcompany.com) for your tenant portal. We'll host it for 2 years free.
              </p>
            </div>

          {landlord.customDomain ? (
            <div className='space-y-3'>
              <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4'>
                <p className='text-sm font-medium text-emerald-900'>Active custom domain</p>
                <p className='text-lg font-semibold text-emerald-800 mt-1'>{landlord.customDomain}</p>
                <p className='text-xs text-emerald-700 mt-2'>Hosting included until Dec 2026</p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2'>
                <p className='text-sm font-semibold text-slate-900'>Premium feature</p>
                <p className='text-sm text-slate-600'>
                  Search and purchase your own domain. We handle DNS setup and provide 2 years of free hosting.
                </p>
                <ul className='text-xs text-slate-600 space-y-1 mt-2'>
                  <li>• Full DNS and SSL setup included</li>
                  <li>• 2 years of hosting completely free</li>
                  <li>• Professional email forwarding</li>
                  <li>• Priority support</li>
                </ul>
              </div>

              <DomainSearch />
            </div>
          )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminBrandingPage;
