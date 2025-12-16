import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import crypto from 'crypto';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';
import { sendBrandedEmail } from '@/lib/services/email-service';

const SESSION_EXPIRY_HOURS = 24;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: leaseId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const role = body.role as 'tenant' | 'landlord';

  if (role !== 'tenant' && role !== 'landlord') {
    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
  }

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      unit: {
        select: {
          name: true,
          type: true,
          property: {
            select: {
              name: true,
              landlordId: true,
              landlord: {
                select: { id: true, name: true, ownerUserId: true, owner: { select: { email: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!lease) {
    return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
  }

  // Authorization: tenant can create tenant session; landlord/admin can create landlord session.
  const isTenant = role === 'tenant' && lease.tenantId === session.user.id;
  const isLandlord =
    role === 'landlord' &&
    lease.unit.property?.landlord?.ownerUserId &&
    lease.unit.property.landlord.ownerUserId === session.user.id;
  if (!isTenant && !isLandlord) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const landlordName = lease.unit.property?.landlord?.name || lease.unit.property?.name || 'Landlord';
  const tenantName = lease.tenant?.name || 'Tenant';
  const propertyLabel = `${lease.unit.property?.name || 'Property'} - ${lease.unit.name} (${lease.unit.type})`;

  const landlordId = lease.unit.property?.landlordId;
  if (!landlordId) {
    return NextResponse.json({ message: 'Property landlord missing' }, { status: 400 });
  }

  // Ensure there is a LegalDocument record tied to this lease for FK safety
  await prisma.legalDocument.upsert({
    where: { id: lease.id },
    update: {},
    create: {
      id: lease.id,
      landlordId,
      name: `${lease.unit.property?.name || 'Property'} - ${lease.unit.name} Lease`,
      type: 'lease',
      description: 'Auto-generated lease document for signing',
    },
  });

  const leaseHtml = renderDocuSignReadyLeaseHtml({
    landlordName,
    tenantName,
    propertyLabel,
    leaseStartDate: new Date(lease.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    leaseEndDate: lease.endDate
      ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Month-to-Month',
    rentAmount: Number(lease.rentAmount).toLocaleString(),
    billingDayOfMonth: String(lease.billingDayOfMonth),
    todayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  });

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

  const recipientEmail =
    role === 'tenant' ? lease.tenant?.email || '' : lease.unit.property?.landlord?.owner?.email || session.user.email || '';
  const recipientName = role === 'tenant' ? tenantName : landlordName;

  const signatureRequest = await prisma.documentSignatureRequest.create({
    data: {
      documentId: lease.id, // using lease id as documentId reference context
      leaseId,
      recipientEmail,
      recipientName,
      status: 'sent',
      expiresAt,
      token,
      role,
      documentHash: null,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const actionUrl = `${baseUrl}/sign/${token}`;

  if (landlordId && recipientEmail) {
    try {
      await sendBrandedEmail({
        to: recipientEmail,
        subject: 'Lease ready to sign',
        template: 'notification',
        data: {
          landlord: lease.unit.property?.landlord,
          recipientName,
          notificationType: 'lease_signing',
          title: 'Lease ready to sign',
          message: `Click the link below to sign your lease.`,
          actionUrl,
          loginUrl: actionUrl,
        },
        landlordId,
      } as any);
    } catch (err) {
      console.error('Failed to send signing email', err);
    }
  }

  return NextResponse.json({
    token,
    url: `/sign/${token}`,
    expiresAt,
    leaseHtml,
    signatureRequestId: signatureRequest.id,
  });
}
