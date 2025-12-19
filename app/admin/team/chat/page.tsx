import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { auth } from '@/auth';
import { getCurrentLandlordSubscription } from '@/lib/actions/subscription.actions';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { TeamChat } from '@/components/team/team-chat';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Team Chat',
};

export default async function TeamChatPage() {
  await requireAdmin();
  
  const session = await auth();
  const subscriptionData = await getCurrentLandlordSubscription();
  const landlordResult = await getOrCreateCurrentLandlord();

  // Check if team communications feature is available
  const hasTeamChatAccess = subscriptionData.success && 
    subscriptionData.features?.teamCommunications === true;

  if (!hasTeamChatAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Team Chat</h1>
            <p className="text-slate-300 mb-6">
              Team chat is available on the Pro plan. Upgrade to communicate 
              with your team in real-time, create channels, and collaborate efficiently.
            </p>
            <Link
              href="/admin/settings/subscription"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <Zap className="h-5 w-5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentUser = {
    id: session?.user?.id || '',
    name: session?.user?.name || 'User',
    email: session?.user?.email || '',
    image: session?.user?.image || undefined,
  };

  const landlordId = landlordResult.success ? landlordResult.landlord.id : '';

  return (
    <main className="w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Team Chat</h1>
        <p className="text-sm text-slate-400">Communicate with your team in real-time</p>
      </div>
      
      <TeamChat 
        currentUser={currentUser}
        landlordId={landlordId}
        isFullPage={true}
      />
    </main>
  );
}
