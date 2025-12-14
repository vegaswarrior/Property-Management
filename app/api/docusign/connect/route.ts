import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDocuSignAuthorizationUrl } from '@/lib/services/docusign-service';
import crypto from 'crypto';

const toBase64Url = (value: Buffer) =>
  value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const generatePkceVerifier = () => toBase64Url(crypto.randomBytes(32));

const generatePkceChallenge = (verifier: string) =>
  toBase64Url(crypto.createHash('sha256').update(verifier).digest());

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get('landlordId');

    if (!landlordId) {
      return NextResponse.json({ success: false, message: 'Missing landlord ID' }, { status: 400 });
    }

    const state = crypto.randomUUID();
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = generatePkceChallenge(codeVerifier);

    const authUrl = await getDocuSignAuthorizationUrl({
      landlordId,
      state,
      codeChallenge,
      codeChallengeMethod: 'S256',
    });

    const res = NextResponse.redirect(authUrl);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookies.set('ds_oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    });

    res.cookies.set('ds_pkce_verifier', codeVerifier, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    });

    return res;
  } catch (error) {
    console.error('DocuSign connect error:', error);
    return NextResponse.json({ success: false, message: 'Failed to initiate DocuSign connection' }, { status: 500 });
  }
}