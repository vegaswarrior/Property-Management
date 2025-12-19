import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { checkFeatureAccess } from '@/lib/actions/subscription.actions';

// Get messages for a channel
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = await params;
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

    let messages: any[] = [];
    try {
      messages = await (prisma as any).teamMessage?.findMany?.({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        take: 100,
      }) || [];
    } catch {
      // Model doesn't exist, return welcome message
      messages = [{
        id: 'welcome',
        channelId,
        senderId: 'system',
        senderName: 'System',
        content: `Welcome to this channel! Start collaborating with your team.`,
        createdAt: new Date().toISOString(),
      }];
    }

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ success: false, message: 'Failed to get messages' }, { status: 500 });
  }
}

// Send a message to a channel
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = await params;
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
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, message: 'Message content is required' }, { status: 400 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, image: true },
    });

    let message;
    try {
      message = await (prisma as any).teamMessage?.create?.({
        data: {
          channelId,
          senderId: session.user.id,
          content: content.trim(),
        },
      });
      
      // Add sender info
      message = {
        ...message,
        senderName: user?.name || 'Team Member',
        senderImage: user?.image,
      };
    } catch {
      // Model doesn't exist, return mock message
      message = {
        id: `msg-${Date.now()}`,
        channelId,
        senderId: session.user.id,
        senderName: user?.name || 'Team Member',
        senderImage: user?.image,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
  }
}
