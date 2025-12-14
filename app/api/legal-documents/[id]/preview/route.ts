import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    const doc = await prisma.legalDocument.findFirst({
      where: {
        id,
        landlordId: landlord.id,
        isActive: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    if (doc.type !== 'lease') {
      return NextResponse.json({ message: 'Preview not available for this document type' }, { status: 400 });
    }

    const html = renderDocuSignReadyLeaseHtml({
      landlordName: landlord.name || 'Landlord',
      tenantName: 'Tenant',
      propertyLabel: 'Property / Unit',
      leaseStartDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      leaseEndDate: 'Month-to-Month',
      rentAmount: '0',
      billingDayOfMonth: String(new Date().getDate()),
      todayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to preview legal document:', error);
    return NextResponse.json({ message: 'Failed to preview document' }, { status: 500 });
  }
}
