import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getDocuSignAccessToken } from '@/lib/services/docusign-service';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';

// Expects these env vars to be set:
// DOCUSIGN_BASE_URL (e.g. https://demo.docusign.net)
// DOCUSIGN_ACCESS_TOKEN (OAuth/Bearer token)
// DOCUSIGN_ACCOUNT_ID (DocuSign account ID)
// DOCUSIGN_INTEGRATION_KEY (optional, for metadata)

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: leaseId } = await context.params;

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: { select: { name: true, email: true } },
      unit: {
        select: {
          name: true,
          type: true,
          property: {
            select: {
              name: true,
              landlordId: true
            }
          },
        },
      },
    },
  });

  if (!lease) {
    return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
  }

  if (lease.tenantId !== session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!lease.unit?.property?.landlordId) {
    return NextResponse.json({ message: 'Lease property missing landlord' }, { status: 400 });
  }

  const landlordId = lease.unit.property.landlordId;

  // Get DocuSign access token for the landlord
  let accessToken: string;
  let accountId: string;

  try {
    const tokenData = await getDocuSignAccessToken(landlordId);
    accessToken = tokenData.accessToken;
    accountId = tokenData.accountId;
  } catch (error) {
    console.error('DocuSign token error:', error);
    return NextResponse.json(
      { message: 'DocuSign not connected for this landlord. Please connect DocuSign in admin settings.' },
      { status: 400 }
    );
  }

  // Get DocuSign base URL from service config
  const isProduction = process.env.NODE_ENV === 'production';
  const DOCUSIGN_BASE_URL = isProduction
    ? 'https://www.docusign.net'
    : 'https://demo.docusign.net';

  const tenantName = lease.tenant?.name || 'Tenant';
  const tenantEmail = lease.tenant?.email;

  if (!tenantEmail) {
    return NextResponse.json(
      { message: 'Lease tenant does not have an email address on file' },
      { status: 400 }
    );
  }

  const leaseStartDate = new Date(lease.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const leaseEndDate = lease.endDate 
    ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Month-to-Month';
  const rentAmount = Number(lease.rentAmount).toLocaleString();
  const propertyAddress = `${lease.unit.property?.name || 'Property'} - ${lease.unit.name} (${lease.unit.type})`;
  const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const securityDeposit = rentAmount;
  const lateFee = '50.00';
  const lateDays = '5';
  const noticeDays = '30';

  const landlord = await prisma.landlord.findUnique({
    where: { id: landlordId },
    select: { name: true },
  });

  const selectedLeaseTemplate = await prisma.legalDocument.findFirst({
    where: {
      landlordId,
      isActive: true,
      isTemplate: true,
      type: 'lease',
    },
    orderBy: { updatedAt: 'desc' },
  });

  const documentHtml = selectedLeaseTemplate
    ? renderDocuSignReadyLeaseHtml({
        landlordName: landlord?.name || lease.unit.property?.name || 'Landlord',
        tenantName,
        propertyLabel: propertyAddress,
        leaseStartDate,
        leaseEndDate,
        rentAmount,
        billingDayOfMonth: String(lease.billingDayOfMonth),
        todayDate,
      })
    : renderDocuSignReadyLeaseHtml({
        landlordName: landlord?.name || lease.unit.property?.name || 'Landlord',
        tenantName,
        propertyLabel: propertyAddress,
        leaseStartDate,
        leaseEndDate,
        rentAmount,
        billingDayOfMonth: String(lease.billingDayOfMonth),
        todayDate,
      });

  const envelopeBody = {
    emailSubject: 'Lease agreement for your rental',
    status: 'sent',
    documents: [
      {
        documentBase64: Buffer.from(documentHtml).toString('base64'),
        name: 'Lease Agreement',
        fileExtension: 'html',
        documentId: '1',
      },
    ],
    recipients: {
      signers: [
        {
          email: tenantEmail,
          name: tenantName,
          recipientId: '1',
          clientUserId: lease.tenantId, // for embedded signing
          tabs: {
            initialHereTabs: [
              {
                anchorString: '/init1/',
                anchorYOffset: '0',
                anchorXOffset: '10',
                anchorIgnoreIfNotPresent: 'true',
              },
              {
                anchorString: '/init2/',
                anchorYOffset: '0',
                anchorXOffset: '10',
                anchorIgnoreIfNotPresent: 'true',
              },
              {
                anchorString: '/init3/',
                anchorYOffset: '0',
                anchorXOffset: '10',
                anchorIgnoreIfNotPresent: 'true',
              },
              {
                anchorString: '/init4/',
                anchorYOffset: '0',
                anchorXOffset: '10',
                anchorIgnoreIfNotPresent: 'true',
              },
              {
                anchorString: '/init5/',
                anchorYOffset: '0',
                anchorXOffset: '10',
                anchorIgnoreIfNotPresent: 'true',
              },
              {
                anchorString: '/init6/',
                anchorYOffset: '0',
                anchorXOffset: '10',
                anchorIgnoreIfNotPresent: 'true',
              },
            ],
            signHereTabs: [
              {
                anchorString: '/sig_tenant/',
                anchorYOffset: '0',
                anchorXOffset: '10',
                anchorIgnoreIfNotPresent: 'true',
              },
            ],
          },
        },
      ],
    },
  };

  const envelopesResponse = await fetch(
    `${DOCUSIGN_BASE_URL}/restapi/v2.1/accounts/${accountId}/envelopes`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeBody),
    }
  );

  if (!envelopesResponse.ok) {
    const errText = await envelopesResponse.text();
    console.error('DocuSign envelope error:', errText);
    return NextResponse.json(
      { message: 'Failed to create DocuSign envelope' },
      { status: 500 }
    );
  }

  const envelopeJson = (await envelopesResponse.json()) as { envelopeId: string };

  const recipientViewBody = {
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/user/profile/lease`,
    authenticationMethod: 'none',
    email: tenantEmail,
    userName: tenantName,
    clientUserId: lease.tenantId,
  };

  const viewResponse = await fetch(
    `${DOCUSIGN_BASE_URL}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeJson.envelopeId}/views/recipient`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipientViewBody),
    }
  );

  if (!viewResponse.ok) {
    const errText = await viewResponse.text();
    console.error('DocuSign recipient view error:', errText);
    return NextResponse.json(
      { message: 'Failed to create DocuSign recipient view' },
      { status: 500 }
    );
  }

  const viewJson = (await viewResponse.json()) as { url: string };

  return NextResponse.json({
    url: viewJson.url,
  });
}
