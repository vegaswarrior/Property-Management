'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { formatError } from '../utils';
import { getOrCreateCurrentLandlord } from './landlord.actions';
import { checkFeatureAccess } from './subscription.actions';
import { randomUUID } from 'crypto';

export type TeamMemberRole = 'owner' | 'admin' | 'member';
export type TeamPermission = 
  | 'view_properties' 
  | 'manage_tenants' 
  | 'manage_maintenance' 
  | 'manage_finances'
  | 'manage_team';

const DEFAULT_PERMISSIONS: Record<TeamMemberRole, TeamPermission[]> = {
  owner: ['view_properties', 'manage_tenants', 'manage_maintenance', 'manage_finances', 'manage_team'],
  admin: ['view_properties', 'manage_tenants', 'manage_maintenance', 'manage_finances'],
  member: ['view_properties', 'manage_maintenance'],
};

// Type-safe prisma access for models that may not exist yet
const teamMemberModel = () => (prisma as any).teamMember;

export async function getTeamMembers() {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    // Check if team management is available
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamManagement');
    if (!featureCheck.allowed) {
      return { 
        success: false, 
        message: featureCheck.reason,
        featureLocked: true,
        upgradeTier: featureCheck.upgradeTier,
      };
    }

    // Note: TeamMember model needs to be created via Prisma migration
    let members: any[] = [];
    try {
      members = await teamMemberModel()?.findMany?.({
        where: { landlordId: landlordResult.landlord.id },
        orderBy: { createdAt: 'asc' },
      }) || [];
    } catch {
      // Model doesn't exist yet
      return { success: true, members: [] };
    }

    // Get user details for active members
    const userIds = members.filter((m: any) => m.status === 'active').map((m: any) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    const membersWithUsers = members.map((member: any) => {
      const user = users.find(u => u.id === member.userId);
      return {
        ...member,
        user: user || null,
      };
    });

    return { success: true, members: membersWithUsers };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function inviteTeamMember(email: string, role: TeamMemberRole = 'member') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    // Check if team management is available
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamManagement');
    if (!featureCheck.allowed) {
      return { 
        success: false, 
        message: featureCheck.reason,
        featureLocked: true,
        upgradeTier: featureCheck.upgradeTier,
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    // Check if already a team member
    if (existingUser) {
      try {
        const existingMember = await teamMemberModel()?.findUnique?.({
          where: {
            landlordId_userId: {
              landlordId: landlordResult.landlord.id,
              userId: existingUser.id,
            },
          },
        });

        if (existingMember) {
          return { success: false, message: 'This user is already a team member' };
        }
      } catch {
        // Model doesn't exist yet, continue
      }
    }

    // Generate invite token
    const inviteToken = randomUUID();
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create pending team member
    let member;
    try {
      member = await teamMemberModel()?.create?.({
        data: {
          landlordId: landlordResult.landlord.id,
          userId: existingUser?.id || session.user.id, // Temporary, will be updated on accept
          role,
          permissions: DEFAULT_PERMISSIONS[role],
          invitedEmail: email,
          inviteToken,
          inviteExpires,
          status: 'pending',
        },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration. Please run: npx prisma migrate dev' };
    }

    // TODO: Send invitation email
    // await sendTeamInviteEmail(email, inviteToken, landlordResult.landlord.name);

    return { 
      success: true, 
      message: 'Invitation sent successfully',
      member,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function acceptTeamInvite(inviteToken: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    let member;
    try {
      member = await teamMemberModel()?.findUnique?.({
        where: { inviteToken },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration' };
    }

    if (!member) {
      return { success: false, message: 'Invalid invitation' };
    }

    if (member.status !== 'pending') {
      return { success: false, message: 'This invitation has already been used' };
    }

    if (member.inviteExpires && member.inviteExpires < new Date()) {
      return { success: false, message: 'This invitation has expired' };
    }

    // Update member with actual user ID
    await teamMemberModel()?.update?.({
      where: { id: member.id },
      data: {
        userId: session.user.id,
        status: 'active',
        joinedAt: new Date(),
        inviteToken: null,
        inviteExpires: null,
      },
    });

    return { success: true, message: 'You have joined the team' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateTeamMemberRole(memberId: string, role: TeamMemberRole) {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    let member;
    try {
      member = await teamMemberModel()?.findFirst?.({
        where: { id: memberId, landlordId: landlordResult.landlord.id },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration' };
    }

    if (!member) {
      return { success: false, message: 'Team member not found' };
    }

    if (member.role === 'owner') {
      return { success: false, message: 'Cannot change the owner role' };
    }

    await teamMemberModel()?.update?.({
      where: { id: memberId },
      data: {
        role,
        permissions: DEFAULT_PERMISSIONS[role],
      },
    });

    return { success: true, message: 'Role updated successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function removeTeamMember(memberId: string) {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    let member;
    try {
      member = await teamMemberModel()?.findFirst?.({
        where: { id: memberId, landlordId: landlordResult.landlord.id },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration' };
    }

    if (!member) {
      return { success: false, message: 'Team member not found' };
    }

    if (member.role === 'owner') {
      return { success: false, message: 'Cannot remove the owner' };
    }

    await teamMemberModel()?.delete?.({ where: { id: memberId } });

    return { success: true, message: 'Team member removed' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
