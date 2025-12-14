import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { exchangeDocuSignCode } from '@/lib/services/docusign-service';

export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:7',message:'DocuSign callback route called',data:{url:request.url,method:request.method,headers:Object.fromEntries(request.headers),searchParams:Object.fromEntries(request.nextUrl.searchParams)},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
  // #endregion

  try {
    const session = await auth();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:13',message:'Auth check result',data:{hasSession:!!session,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
    // #endregion

    if (!session?.user?.id) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:17',message:'Unauthorized - no valid session',data:{redirectingToLogin:true},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:23',message:'OAuth parameters extracted',data:{hasCode:!!code,hasState:!!state,hasError:!!error,error},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('DocuSign OAuth error:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:31',message:'OAuth error detected, redirecting with error',data:{error,redirectTo:'/admin?error=DocuSign authorization failed'},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      // #endregion
      const msg = errorDescription ? `${error}: ${errorDescription}` : error;
      const redirectTo = `/admin/analytics?error=${encodeURIComponent(msg)}`;
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    if (!code || !state) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:38',message:'Missing required OAuth parameters',data:{code:!!code,state:!!state},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ success: false, message: 'Missing authorization code or state' }, { status: 400 });
    }

    const expectedState = request.cookies.get('ds_oauth_state')?.value;
    const codeVerifier = request.cookies.get('ds_pkce_verifier')?.value;

    if (!expectedState || expectedState !== state) {
      return NextResponse.json({ success: false, message: 'Invalid OAuth state' }, { status: 400 });
    }

    if (!codeVerifier) {
      return NextResponse.json({ success: false, message: 'Missing PKCE verifier' }, { status: 400 });
    }

    const dsConn = (prisma as any).docuSignConnection;
    if (!dsConn?.findFirst) {
      throw new Error(
        'Prisma client is missing DocuSignConnection. Run `npx prisma generate` (and apply migrations if needed), then restart the dev server.'
      );
    }

    const conn = await dsConn.findFirst({
      where: { oauthState: state },
      include: { landlord: true },
    });

    if (!conn?.landlordId || !conn.landlord) {
      return NextResponse.json({ success: false, message: 'Invalid state' }, { status: 400 });
    }

    if (conn.landlord.ownerUserId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordId = conn.landlordId;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:48',message:'Extracted landlord ID from state',data:{landlordId},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
    // #endregion

    if (!landlordId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:53',message:'Invalid state - no landlord ID',data:{},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ success: false, message: 'Invalid state' }, { status: 400 });
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:59',message:'Starting token exchange',data:{landlordId},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
    // #endregion

    await exchangeDocuSignCode({ landlordId, code, codeVerifier });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:65',message:'Token exchange successful',data:{redirectingTo:'/admin?success=DocuSign connected successfully'},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
    // #endregion

    const redirectTo = `/admin/analytics?success=${encodeURIComponent('DocuSign connected successfully')}`;
    const res = NextResponse.redirect(new URL(redirectTo, request.url));
    res.cookies.set('ds_oauth_state', '', { path: '/', maxAge: 0 });
    res.cookies.set('ds_pkce_verifier', '', { path: '/', maxAge: 0 });
    return res;
  } catch (error) {
    console.error('DocuSign callback error:', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/docusign/callback/route.ts:73',message:'Callback error occurred',data:{error:String(error),redirectingTo:'/admin?error=Failed to connect DocuSign'},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
    // #endregion
    const rawMessage = error instanceof Error ? error.message : String(error);
    const redacted = rawMessage
      .replace(/(Basic\s+)[A-Za-z0-9+/=]+/g, '$1[redacted]')
      .replace(/(Bearer\s+)[A-Za-z0-9-_.]+/g, '$1[redacted]');
    const safeMessage = redacted.length > 300 ? `${redacted.slice(0, 300)}…` : redacted;
    const redirectTo = `/admin/analytics?error=${encodeURIComponent(safeMessage || 'Failed to connect DocuSign')}`;
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
}