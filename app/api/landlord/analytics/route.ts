import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get('landlordId');

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

    // Get all properties for this landlord
    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        units: {
          include: {
            leases: {
              where: { status: 'active' },
            },
          },
        },
      },
    });

    // Get rent payments for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const rentPayments = await prisma.rentPayment.findMany({
      where: {
        status: 'paid',
        paidAt: { gte: twelveMonthsAgo },
        lease: {
          unit: {
            property: { landlordId },
          },
        },
      },
    });

    // Get maintenance tickets (expenses)
    const maintenanceTickets = await prisma.maintenanceTicket.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
        unit: {
          property: { landlordId },
        },
      },
    });

    // Calculate analytics
    const totalUnits = properties.reduce((sum, prop) => sum + prop.units.length, 0);
    const occupiedUnits = properties.reduce((sum, prop) => 
      sum + prop.units.filter(unit => unit.leases.length > 0).length, 0);
    const vacancyRate = totalUnits > 0 ? ((totalUnits - occupiedUnits) / totalUnits) * 100 : 0;

    const totalRevenue = rentPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalExpenses = maintenanceTickets.length * 150; // Estimated average maintenance cost
    const netProfit = totalRevenue - totalExpenses;

    const totalTenants = occupiedUnits;
    const averageRent = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    // Monthly revenue data (last 6 months for simplicity)
    const monthlyRevenue = Array(6).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return Math.floor(Math.random() * 5000) + 10000; // Mock data
    });

    const monthlyExpenses = Array(6).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return Math.floor(Math.random() * 2000) + 3000; // Mock data
    });

    // Property performance data
    const propertyPerformance = properties.map(property => {
      const propertyUnits = property.units.length;
      const propertyOccupiedUnits = property.units.filter(unit => unit.leases.length > 0).length;
      const propertyOccupancyRate = propertyUnits > 0 ? (propertyOccupiedUnits / propertyUnits) * 100 : 0;
      
      const propertyRevenue = Math.floor(Math.random() * 10000) + 5000; // Mock data
      const propertyExpenses = Math.floor(Math.random() * 3000) + 1000; // Mock data

      return {
        id: property.id,
        name: property.name,
        revenue: propertyRevenue,
        expenses: propertyExpenses,
        occupancyRate: propertyOccupancyRate,
        units: propertyUnits,
      };
    });

    const analyticsData = {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalProperties: properties.length,
      totalUnits,
      occupiedUnits,
      vacancyRate,
      averageRent,
      totalTenants,
      monthlyRevenue,
      monthlyExpenses,
      propertyPerformance,
    };

    return NextResponse.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
