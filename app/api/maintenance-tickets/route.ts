import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
    }

    const { title, description, priority, unitId } = body as {
      title?: string;
      description?: string;
      priority?: string;
      unitId?: string;
    };

    if (!title || !description) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const finalPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // If unitId is provided, verify the tenant has access to that unit
    if (unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: unitId,
          leases: {
            some: {
              tenantId: userId,
              status: 'active',
            },
          },
        },
      });

      if (!unit) {
        return NextResponse.json(
          { success: false, message: 'Unit not found or you do not have access to it' },
          { status: 403 }
        );
      }
    }

    await prisma.maintenanceTicket.create({
      data: {
        tenantId: userId,
        unitId: unitId || null,
        title: title.trim(),
        description: description.trim(),
        priority: finalPriority,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Log error without exposing sensitive details
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error creating maintenance ticket:', error instanceof Error ? error.message : 'Unknown error');
    }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
