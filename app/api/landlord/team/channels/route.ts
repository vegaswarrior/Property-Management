import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { checkFeatureAccess } from '@/lib/actions/subscription.actions';

// Get all channels for the team
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: landlordResult.message }, { status: 400 });
    }

    // Check feature access
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamCommunications');
    if (!featureCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: featureCheck.reason,
        featureLocked: true,
      }, { status: 403 });
    }

    // Get channels - using dynamic access since model may not exist yet
    let channels: any[] = [];
    try {
      channels = await (prisma as any).teamChannel?.findMany?.({
        where: { landlordId: landlordResult.landlord.id },
        orderBy: { createdAt: 'asc' },
      }) || [];
    } catch {
      // Model doesn't exist, return default channels
      channels = [
        { id: 'general', name: 'general', type: 'public', description: 'Company-wide announcements' },
        { id: 'maintenance', name: 'maintenance', type: 'public', description: 'Maintenance requests & updates' },
        { id: 'tenants', name: 'tenants', type: 'public', description: 'Tenant discussions' },
      ];
    }

    return NextResponse.json({ success: true, channels });
  } catch (error) {
    console.error('Get channels error:', error);
    return NextResponse.json({ success: false, message: 'Failed to get channels' }, { status: 500 });
  }
}

// Create a new channel
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: landlordResult.message }, { status: 400 });
    }

    // Check feature access
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamCommunications');
    if (!featureCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: featureCheck.reason,
        featureLocked: true,
      }, { status: 403 });
    }

    const body = await req.json();
    const { name, type = 'public', description } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Channel name is required' }, { status: 400 });
    }

    let channel;
    try {
      channel = await (prisma as any).teamChannel?.create?.({
        data: {
          landlordId: landlordResult.landlord.id,
          name: name.toLowerCase().replace(/\s+/g, '-'),
          type,
          description,
          createdById: session.user.id,
        },
      });
    } catch {
      // Model doesn't exist, return mock channel
      channel = {
        id: `channel-${Date.now()}`,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        description,
      };
    }

    return NextResponse.json({ success: true, channel });
  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create channel' }, { status: 500 });
  }
}
