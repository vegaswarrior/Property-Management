import { requireUser } from '@/lib/auth-guard';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import UserDashboard from '../user-dashboard';

export const metadata: Metadata = {
  title: 'Tenant Dashboard',
};

const SubdomainUserPage = async ({ params }: { params: Promise<{ subdomain: string }> }) => {
  const { subdomain } = await params;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/user/page.tsx:11',message:'SubdomainUserPage accessed',data:{subdomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  const session = await requireUser();

  // Verify this tenant belongs to this subdomain's landlord
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
  });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/user/page.tsx:18',message:'Landlord lookup for subdomain',data:{subdomain,landlordFound:!!landlord,landlordId:landlord?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (!landlord) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/user/page.tsx:21',message:'Landlord not found - redirecting to unauthorized',data:{subdomain,userId:session.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    redirect('/unauthorized');
  }

  const tenantLease = await prisma.lease.findFirst({
    where: {
      tenantId: session.user.id,
      status: 'active',
      unit: {
        property: {
          landlordId: landlord.id,
        },
      },
    },
    include: {
      unit: {
        include: {
          property: true,
        },
      },
    },
  });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/user/page.tsx:43',message:'Tenant lease check',data:{subdomain,userId:session.user.id,landlordId:landlord.id,hasLease:!!tenantLease},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (!tenantLease) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/user/page.tsx:44',message:'Tenant lease not found - redirecting to unauthorized',data:{subdomain,userId:session.user.id,landlordId:landlord.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    redirect('/unauthorized');
  }

  return <UserDashboard tenantLease={tenantLease} landlord={landlord} />;
};

export default SubdomainUserPage;
