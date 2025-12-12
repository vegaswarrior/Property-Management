import { prisma } from '@/db/prisma';
import SubdomainHeader from '@/components/subdomain/subdomain-header';
import { notFound } from 'next/navigation';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { auth } from '@/auth';

export default async function SubdomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/layout.tsx:12',message:'SubdomainLayout accessed',data:{subdomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // Get landlord for header
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
    include: {
      owner: true,
    },
  });

  if (!landlord) {
    notFound();
  }

  const session = await auth();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[subdomain]/layout.tsx:30',message:'Session check in subdomain layout',data:{subdomain,hasSession:!!session,userId:session?.user?.id,role:session?.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  return (
    <SessionProviderWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <SubdomainHeader landlord={landlord} />
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
