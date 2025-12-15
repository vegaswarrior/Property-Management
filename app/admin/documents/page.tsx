import { requireAdmin } from '@/lib/auth-guard';
import { getDocuments } from '@/lib/actions/document.actions';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { prisma } from '@/db/prisma';
import { ScannedDocument } from '@/types/document-types';
import DocumentManagementClient from '@/components/admin/document-management-client';

export default async function AdminDocumentsPage() {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();
  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const documentsResult = await getDocuments();
  const documents: ScannedDocument[] = documentsResult.success ? documentsResult.documents ?? [] : [];

  const rawProperties = await prisma.property.findMany({
    where: { landlordId: landlordResult.landlord.id },
    include: {
      units: {
        select: {
          id: true,
          name: true,
          rentAmount: true,
        },
      },
    },
  });

  // Normalize Decimal fields for client components
  const properties = rawProperties.map((property) => ({
    ...property,
    units: property.units.map((unit) => ({
      ...unit,
      rentAmount: (unit as any)?.rentAmount?.toNumber?.() ?? unit.rentAmount ?? null,
    })),
  }));

  return (
    <div className="w-full px-4 py-8 md:px-0 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Document Management</h1>
          <p className="text-slate-300">
            Upload and digitize your paper leases, receipts, and tenant records. Our AI will automatically extract and classify information.
          </p>
        </div>

        <DocumentManagementClient documents={documents} properties={properties} />
      </div>
    </div>
  );
}
