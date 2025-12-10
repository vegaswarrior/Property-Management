import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

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
          property: { select: { name: true } },
        },
      },
    },
  });

  if (!lease) {
    return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
  }

  const DOCUSIGN_BASE_URL = process.env.DOCUSIGN_BASE_URL || process.env.DOCUSIGN_URL;
  const DOCUSIGN_ACCESS_TOKEN = process.env.DOCUSIGN_ACCESS_TOKEN;
  const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;

  if (!DOCUSIGN_BASE_URL || !DOCUSIGN_ACCESS_TOKEN || !DOCUSIGN_ACCOUNT_ID) {
    return NextResponse.json(
      { message: 'DocuSign environment not fully configured' },
      { status: 500 }
    );
  }

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

  const documentHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Residential Lease Agreement</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; max-width: 750px; margin: 0 auto; padding: 30px; color: #333; }
      h1 { text-align: center; font-size: 16px; margin-bottom: 20px; text-transform: uppercase; }
      h2 { font-size: 12px; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; }
      .field { font-weight: bold; }
      .section { margin-bottom: 12px; }
      .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #333; margin-right: 5px; vertical-align: middle; }
      .checked { background-color: #333; }
      .signature-section { margin-top: 30px; page-break-inside: avoid; }
      .signature-line { border-bottom: 1px solid #333; width: 250px; display: inline-block; margin-bottom: 5px; }
      .date-line { border-bottom: 1px solid #333; width: 120px; display: inline-block; }
      .sig-row { margin-top: 25px; }
    </style>
  </head>
  <body>
    <h1>Residential Lease Agreement</h1>
    
    <div class="section">
      <p>THIS LEASE AGREEMENT ("Agreement") is made on <span class="field">${todayDate}</span>, between:</p>
      <p><strong>Landlord:</strong> <span class="field">${lease.unit.property?.name || 'Property Management'}</span> ("Landlord")</p>
      <p><strong>Tenant(s):</strong> <span class="field">${tenantName}</span> ("Tenant")</p>
    </div>

    <h2>Property</h2>
    <div class="section">
      <p>The Landlord hereby leases to the Tenant the premises located at: <span class="field">${propertyAddress}</span> ("Premises").</p>
    </div>

    <h2>Lease Term</h2>
    <div class="section">
      <p>The term of this Lease shall begin on <span class="field">${leaseStartDate}</span> and end on <span class="field">${leaseEndDate}</span> unless renewed or terminated earlier.</p>
    </div>

    <h2>Rent</h2>
    <div class="section">
      <p>Tenant agrees to pay monthly rent of <span class="field">$${rentAmount}</span>, due on the <span class="field">${lease.billingDayOfMonth}</span> day of each month.</p>
      <p>Payments shall be made to: <span class="field">${lease.unit.property?.name || 'Property Management'}</span>.</p>
    </div>

    <h2>Late Fees</h2>
    <div class="section">
      <p>A late fee of <span class="field">$${lateFee}</span> will be charged if rent is not paid within <span class="field">${lateDays}</span> days of the due date.</p>
    </div>

    <h2>Security Deposit</h2>
    <div class="section">
      <p>Tenant shall pay a security deposit of <span class="field">$${securityDeposit}</span>. This deposit may be used for unpaid rent, damages beyond normal wear and tear, or other charges as allowed by law.</p>
    </div>

    <h2>Utilities</h2>
    <div class="section">
      <p>Tenant is responsible for the following utilities: <span class="field">Electric, Gas, Internet, Cable</span>.</p>
      <p>Landlord is responsible for: <span class="field">Water, Sewer, Trash</span>.</p>
    </div>

    <h2>Occupancy</h2>
    <div class="section">
      <p>The Premises shall be occupied only by the Tenant(s) listed on this Agreement. No other individuals may reside at the property without written permission of the Landlord.</p>
    </div>

    <h2>Maintenance & Repairs</h2>
    <div class="section">
      <p>Tenant agrees to maintain the Premises in a clean and sanitary manner. Tenant shall promptly report damage or needed repairs. Landlord is responsible for major repairs unless damage is caused by Tenant misuse.</p>
    </div>

    <h2>Rules & Regulations</h2>
    <div class="section">
      <p>Tenant agrees to comply with all property rules, including but not limited to:</p>
      <ul>
        <li>No illegal activities.</li>
        <li>No excessive noise.</li>
        <li>No changes to property without written approval.</li>
      </ul>
    </div>

    <h2>Pets</h2>
    <div class="section">
      <p><span class="checkbox"></span> Pets allowed &nbsp;&nbsp; <span class="checkbox checked"></span> Pets NOT allowed</p>
      <p>If allowed, Tenant must comply with all pet policies and pay applicable pet fees or deposits.</p>
    </div>

    <h2>Smoking Policy</h2>
    <div class="section">
      <p><span class="checkbox"></span> Smoking allowed &nbsp;&nbsp; <span class="checkbox checked"></span> Smoking NOT allowed inside the Premises.</p>
    </div>

    <h2>Insurance</h2>
    <div class="section">
      <p>Tenant is encouraged to obtain renter's insurance. Landlord insurance does not cover Tenant's personal belongings.</p>
    </div>

    <h2>Right of Entry</h2>
    <div class="section">
      <p>Landlord may enter the Premises with reasonable notice for inspections, repairs, or emergencies as allowed by state law.</p>
    </div>

    <h2>Assignment & Subletting</h2>
    <div class="section">
      <p>Tenant may NOT sublease or assign the Premises without written consent.</p>
    </div>

    <h2>Move-In Inspection</h2>
    <div class="section">
      <p>A move-in inspection form shall be completed by both parties and attached.</p>
    </div>

    <h2>Termination</h2>
    <div class="section">
      <p>Tenant must provide <span class="field">${noticeDays}</span> days written notice prior to vacating. Property must be left clean and free of damage beyond normal wear and tear.</p>
    </div>

    <h2>Legal Compliance</h2>
    <div class="section">
      <p>This Agreement shall comply with all applicable federal, state, and local housing laws. In case of conflict, governing law supersedes this lease.</p>
    </div>

    <h2>Entire Agreement</h2>
    <div class="section">
      <p>This Lease contains the entire agreement between the parties.</p>
    </div>

    <div class="signature-section">
      <h2>Signatures</h2>
      <div class="sig-row">
        <p><strong>LANDLORD SIGNATURE:</strong> /s1/ <span class="signature-line"></span> &nbsp;&nbsp; <strong>DATE:</strong> <span class="date-line">${todayDate}</span></p>
      </div>
      <div class="sig-row">
        <p><strong>TENANT SIGNATURE:</strong> /s/ ${tenantName} <span class="signature-line"></span> &nbsp;&nbsp; <strong>DATE:</strong> <span class="date-line">${todayDate}</span></p>
      </div>
    </div>
  </body>
</html>`;

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
            signHereTabs: [
              {
                anchorString: '/s/',
                anchorYOffset: '10',
                anchorXOffset: '0',
              },
            ],
          },
        },
      ],
    },
  };

  const envelopesResponse = await fetch(
    `${DOCUSIGN_BASE_URL}/restapi/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DOCUSIGN_ACCESS_TOKEN}`,
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
    `${DOCUSIGN_BASE_URL}/restapi/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeJson.envelopeId}/views/recipient`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DOCUSIGN_ACCESS_TOKEN}`,
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
