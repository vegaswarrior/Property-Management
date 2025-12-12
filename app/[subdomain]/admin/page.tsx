import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminDashboard from '../admin-dashboard';

export const metadata: Metadata = {
  title: 'Landlord Dashboard',
};

const SubdomainAdminPage = async ({ params }: { params: Promise<{ subdomain: string }> }) => {
  const { subdomain } = await params;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/admin/page.tsx:11',message:'SubdomainAdminPage accessed',data:{subdomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlord = landlordResult.landlord;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/admin/page.tsx:24',message:'Subdomain ownership check',data:{subdomain,landlordSubdomain:landlord.subdomain,matches:landlord.subdomain === subdomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // Verify this landlord owns the subdomain
  if (landlord.subdomain !== subdomain) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/admin/page.tsx:26',message:'Subdomain mismatch - redirecting to unauthorized',data:{subdomain,landlordSubdomain:landlord.subdomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    redirect('/unauthorized');
  }

  return <AdminDashboard landlord={landlord} />;
};

export default SubdomainAdminPage;
