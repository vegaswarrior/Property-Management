import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const session = await auth()
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-guard.ts:4',message:'requireAdmin called',data:{hasSession:!!session,userId:session?.user?.id,role:session?.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  const role = session?.user?.role

  const isAllowed =
    role === 'admin' ||
    role === 'superAdmin' ||
    role === 'landlord' ||
    role === 'property_manager'
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-guard.ts:13',message:'requireAdmin check result',data:{role,isAllowed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  if (!isAllowed) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-guard.ts:16',message:'requireAdmin redirecting to unauthorized',data:{role,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    redirect('/unauthorized')
  }

  return session
}

export async function requireUser() {
  const session = await auth()
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-guard.ts:22',message:'requireUser called',data:{hasSession:!!session,hasUser:!!session?.user,userId:session?.user?.id,role:session?.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  if (!session?.user) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth-guard.ts:25',message:'requireUser redirecting to sign-in',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    redirect('/sign-in')
  }

  return session
}
