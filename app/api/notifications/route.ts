import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET /api/notifications - Get notifications for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeRead = searchParams.get('includeRead') === 'true';

    // Verify user can only access their own notifications
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const whereClause = {
      userId,
      ...(includeRead ? {} : { isRead: false }),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      includeRead 
        ? prisma.notification.count({
            where: { userId, isRead: false },
          })
        : Promise.resolve(0),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, actionUrl, metadata, landlordId } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user has permission to create notifications for this user/landlord
    // This is a simplified check - in production, you'd want more sophisticated authorization
    if (userId !== session.user.id && !landlordId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        metadata,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
