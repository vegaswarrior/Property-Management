import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getOrderSummary } from '@/lib/actions/order-actions';
import { getAnalyticsOverview } from '@/lib/actions/analytics.actions';
import { convertToPlainObject } from '@/lib/utils';
import SuperAdminDashboard from './super-admin-dashboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Super Admin',
};

export default async function SuperAdminPage() {
  const session = await auth();

  if (!session) {
    return redirect('/sign-in');
  }

  const [summary, analytics] = await Promise.all([
    getOrderSummary(),
    getAnalyticsOverview(),
  ]);

  const serializedSummary = convertToPlainObject(summary);
  const serializedAnalytics = convertToPlainObject(analytics);

  return (
    <SuperAdminDashboard
      userEmail={session.user.email || ''}
      summary={serializedSummary}
      analytics={serializedAnalytics}
      currentUser={session.user}
    />
  );
}
