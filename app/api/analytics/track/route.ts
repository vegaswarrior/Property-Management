import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/lib/actions/analytics.actions';

export async function POST(request: NextRequest) {
  try {
    const { path, referrer } = await request.json();

    const sessionCartId = request.cookies.get('sessionCartId')?.value;
    const country = request.headers.get('x-vercel-ip-country');
    const userAgent = request.headers.get('user-agent');

    if (!sessionCartId || !path) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // User ID (if logged in) is already associated with the sessionCartId via auth
    await trackPageView({
      sessionCartId,
      userId: undefined,
      path,
      referrer: referrer || null,
      country: country || null,
      userAgent: userAgent || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in analytics track route', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
