export const renderDocuSignReadyLeaseHtml = (data: {
  landlordName: string;
  tenantName: string;
  propertyLabel: string;
  leaseStartDate: string;
  leaseEndDate: string;
  rentAmount: string;
  billingDayOfMonth: string;
  todayDate: string;
}) => {
  const {
    landlordName,
    tenantName,
    propertyLabel,
    leaseStartDate,
    leaseEndDate,
    rentAmount,
    billingDayOfMonth,
    todayDate,
  } = data;

  return `<!DOCTYPE html>
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
      .initials { font-size: 10px; color: #666; }
      .initials-box { display: inline-block; min-width: 90px; border-bottom: 1px solid #333; margin-left: 8px; }
    </style>
  </head>
  <body>
    <h1>Residential Lease Agreement</h1>

    <div class="section">
      <p>THIS LEASE AGREEMENT ("Agreement") is made on <span class="field">${todayDate}</span>, between:</p>
      <p><strong>Landlord:</strong> <span class="field">${landlordName}</span> ("Landlord")</p>
      <p><strong>Tenant(s):</strong> <span class="field">${tenantName}</span> ("Tenant")</p>
    </div>

    <h2>Property</h2>
    <div class="section">
      <p>The Landlord hereby leases to the Tenant the premises located at: <span class="field">${propertyLabel}</span> ("Premises").</p>
      <p class="initials"><strong>Tenant Initials:</strong> /init1/ <span class="initials-box"></span></p>
    </div>

    <h2>Lease Term</h2>
    <div class="section">
      <p>The term of this Lease shall begin on <span class="field">${leaseStartDate}</span> and end on <span class="field">${leaseEndDate}</span> unless renewed or terminated earlier.</p>
      <p class="initials"><strong>Tenant Initials:</strong> /init2/ <span class="initials-box"></span></p>
    </div>

    <h2>Rent</h2>
    <div class="section">
      <p>Tenant agrees to pay monthly rent of <span class="field">$${rentAmount}</span>, due on the <span class="field">${billingDayOfMonth}</span> day of each month.</p>
      <p>Payments shall be made to: <span class="field">${landlordName}</span>.</p>
      <p class="initials"><strong>Tenant Initials:</strong> /init3/ <span class="initials-box"></span></p>
    </div>

    <h2>Security Deposit</h2>
    <div class="section">
      <p>Tenant shall pay a security deposit as required by law and/or as provided in the addendum(s) to this Lease.</p>
      <p class="initials"><strong>Tenant Initials:</strong> /init4/ <span class="initials-box"></span></p>
    </div>

    <h2>Utilities</h2>
    <div class="section">
      <p>Tenant is responsible for the following utilities: <span class="field">Electric, Gas, Internet, Cable</span>.</p>
      <p>Landlord is responsible for: <span class="field">Water, Sewer, Trash</span>.</p>
      <p class="initials"><strong>Tenant Initials:</strong> /init5/ <span class="initials-box"></span></p>
    </div>

    <h2>Rules & Regulations</h2>
    <div class="section">
      <p>Tenant agrees to comply with all property rules.</p>
      <p class="initials"><strong>Tenant Initials:</strong> /init6/ <span class="initials-box"></span></p>
    </div>

    <div class="signature-section">
      <h2>Signatures</h2>
      <div class="sig-row">
        <p><strong>LANDLORD SIGNATURE:</strong> /sig_landlord/ <span class="signature-line"></span> &nbsp;&nbsp; <strong>DATE:</strong> <span class="date-line">${todayDate}</span></p>
      </div>
      <div class="sig-row">
        <p><strong>TENANT SIGNATURE:</strong> /sig_tenant/ <span class="signature-line"></span> &nbsp;&nbsp; <strong>DATE:</strong> <span class="date-line">${todayDate}</span></p>
      </div>
    </div>
  </body>
</html>`;
};
