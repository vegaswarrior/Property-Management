'use client';

import { auth } from '@/auth';
import { TeamChatWidget } from './team-chat-widget';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { getTeamMembers } from '@/lib/actions/team.actions';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function TeamChatWidgetWrapper() {
  const { data: session } = useSession();
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [landlordId, setLandlordId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTeamMembership = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const landlordResult = await getOrCreateCurrentLandlord();
        if (!landlordResult.success) {
          setLoading(false);
          return;
        }

        setLandlordId(landlordResult.landlord.id);

        const teamData = await getTeamMembers();
        if (!teamData.success || !teamData.members) {
          setLoading(false);
          return;
        }

        const isMember = teamData.members.some(
          m => m.userId === session.user.id && m.status === 'active'
        );

        setIsTeamMember(isMember);
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };

    checkTeamMembership();
  }, [session]);

  if (loading || !session?.user?.id || !isTeamMember) {
    return null;
  }

  return (
    <TeamChatWidget
      currentUser={{
        id: session.user.id,
        name: session.user.name || 'User',
        email: session.user.email || '',
        image: session.user.image || undefined,
      }}
      landlordId={landlordId}
      isTeamMember={isTeamMember}
    />
  );
}
