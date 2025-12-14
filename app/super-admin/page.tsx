import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getOrderSummary } from '@/lib/actions/order-actions';
import { getAnalyticsOverview } from '@/lib/actions/analytics.actions';
import { getSuperAdminInsights, listUsersForSuperAdmin } from '@/lib/actions/super-admin.actions';
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

  const [summary, analytics, insights, users] = await Promise.all([
    getOrderSummary(),
    getAnalyticsOverview(),
    getSuperAdminInsights(),
    listUsersForSuperAdmin(),
  ]);

  const serializedSummary = convertToPlainObject(summary);
  const serializedAnalytics = convertToPlainObject(analytics);
  const serializedInsights = convertToPlainObject(insights);
  const serializedUsers = convertToPlainObject(users);

  return (
    <SuperAdminDashboard
      userEmail={session.user.email || ''}
      summary={serializedSummary}
      analytics={serializedAnalytics}
      insights={serializedInsights as any}
      users={serializedUsers as any}
      currentUser={session.user}
    />
  );
}
