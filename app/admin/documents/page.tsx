import { requireAdmin } from '@/lib/auth-guard';
import { Metadata } from 'next';
import AdminDocumentsClient from './documents-client';

export const metadata: Metadata = {
    title: 'Documents',
};

const AdminDocumentsPage = async () => {
    await requireAdmin();

    return (
        <main className="w-full px-4 py-8 md:px-0">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Documents</h1>
                    <p className="text-sm text-gray-400">
                        Manage all your documents in one place.
                    </p>
                </div>
                <AdminDocumentsClient />
            </div>
        </main>
    );
};

export default AdminDocumentsPage;
