import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { htmlToPdfBuffer } from './pdf';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function generateLeasePdf(leaseHtml: string): Promise<Buffer> {
  return htmlToPdfBuffer(leaseHtml);
}

export async function stampSignatureOnPdf(opts: {
  basePdf: Buffer;
  signerName: string;
  signerEmail: string;
  role: 'tenant' | 'landlord';
  signatureDataUrl: string;
  signedAt: Date;
  audit: Record<string, any>;
  landlordId?: string;
  leaseId?: string;
}) {
  const pdfDoc = await PDFDocument.load(opts.basePdf);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  const sigPng = await pdfDoc.embedPng(opts.signatureDataUrl);
  const { width, height } = lastPage.getSize();
  const imgWidth = 200;
  const imgHeight = (sigPng.height / sigPng.width) * imgWidth;

  const textY = 120;
  const imgY = 60;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  lastPage.drawText('Signature', {
    x: 50,
    y: textY + 20,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  lastPage.drawImage(sigPng, {
    x: 50,
    y: imgY,
    width: imgWidth,
    height: imgHeight,
  });

  const signedAtStr = opts.signedAt.toISOString();
  const roleLabel = opts.role === 'tenant' ? 'Tenant' : 'Landlord';

  const textBlock = [
    `${roleLabel} Name: ${opts.signerName}`,
    `Email: ${opts.signerEmail}`,
    `Signed At: ${signedAtStr}`,
  ].join('\n');

  lastPage.drawText(textBlock, {
    x: 270,
    y: imgY + imgHeight - 10,
    size: 11,
    font,
    color: rgb(0.1, 0.1, 0.1),
    lineHeight: 14,
  });

  const auditPage = pdfDoc.addPage([width, height]);
  auditPage.drawText('Audit Log', {
    x: 50,
    y: height - 70,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });
  const auditFont = font;
  const auditText = JSON.stringify(opts.audit, null, 2);
  auditPage.drawText(auditText, {
    x: 50,
    y: height - 100,
    size: 10,
    font: auditFont,
    color: rgb(0.1, 0.1, 0.1),
    lineHeight: 12,
    maxWidth: width - 100,
  });

  const finalPdf = await pdfDoc.save();
  const hash = crypto.createHash('sha256').update(finalPdf).digest('hex');

  let signedPdfUrl = '';
  let auditLogUrl = '';

  try {
    const [signedUpload, auditUpload] = await Promise.all([
      uploadToCloudinary(Buffer.from(finalPdf), {
        folder: `signed-leases/${opts.landlordId || 'unknown'}`,
        resource_type: 'raw',
        public_id: `${opts.leaseId || 'lease'}-signed-${Date.now()}`,
        format: 'pdf',
      }),
      uploadToCloudinary(Buffer.from(JSON.stringify(opts.audit, null, 2)), {
        folder: `signed-leases/${opts.landlordId || 'unknown'}`,
        resource_type: 'raw',
        public_id: `${opts.leaseId || 'lease'}-audit-${Date.now()}`,
        format: 'txt',
      }),
    ]);
    signedPdfUrl = signedUpload.secure_url;
    auditLogUrl = auditUpload.secure_url;
  } catch (uploadError: any) {
    console.error('Cloudinary upload failed:', uploadError);
    if (uploadError?.http_code === 401) {
      throw new Error('Document storage authentication failed. Please check Cloudinary credentials (CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET).');
    }
    throw new Error(`Failed to upload signed document: ${uploadError?.message || 'Unknown error'}`);
  }

  return {
    signedPdfUrl,
    auditLogUrl,
    documentHash: hash,
  };
}
