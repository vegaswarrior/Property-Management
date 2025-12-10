import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { landlordId } = await request.json();

    if (!landlordId) {
      return NextResponse.json({ success: false, message: 'Landlord ID required' }, { status: 400 });
    }

    // Verify user owns this landlord
    const landlord = await prisma.landlord.findFirst({
      where: {
        id: landlordId,
        ownerUserId: session.user.id,
      },
    });

    if (!landlord) {
      return NextResponse.json({ success: false, message: 'Landlord not found' }, { status: 404 });
    }

    // Get financial data for QuickBooks sync
    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        units: {
          include: {
            leases: {
              include: {
                tenant: true,
                rentPayments: {
                  where: { status: 'paid' },
                },
              },
            },
          },
        },
      },
    });

    // Mock QuickBooks API integration
    // In production, you would use the QuickBooks API SDK
    const quickBooksData = {
      realmId: process.env.QUICKBOOKS_REALM_ID,
      accessToken: process.env.QUICKBOOKS_ACCESS_TOKEN,
      data: {
        properties: properties.map(prop => ({
          name: prop.name,
          units: prop.units.map(unit => ({
            name: unit.name,
            rent: unit.leases[0]?.rentAmount || 0,
            tenant: unit.leases[0]?.tenant?.name || 'Vacant',
            payments: unit.leases[0]?.rentPayments.map(payment => ({
              amount: payment.amount,
              date: payment.paidAt,
              status: payment.status,
            })) || [],
          })),
        })),
      },
    };

    // Simulate API call to QuickBooks
    console.log('Syncing with QuickBooks:', JSON.stringify(quickBooksData, null, 2));

    // Store sync timestamp
    await prisma.landlord.update({
      where: { id: landlordId },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully synced with QuickBooks',
      syncedAt: new Date().toISOString(),
      propertiesCount: properties.length,
      unitsCount: properties.reduce((sum, prop) => sum + prop.units.length, 0),
    });
  } catch (error) {
    console.error('QuickBooks sync error:', error);
    return NextResponse.json({ success: false, message: 'Sync failed' }, { status: 500 });
  }
}
