import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const landlord = await prisma.landlord.findFirst({
        where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
        return NextResponse.json({ error: 'Landlord not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToCloudinary(buffer, {
            folder: 'documents',
        });

        const newFile = await prisma.scannedDocument.create({
            data: {
                originalFileName: file.name,
                fileUrl: result.secure_url,
                fileType: file.type,
                fileSize: file.size,
                landlordId: landlord.id,
                uploadedBy: session.user.id,
            },
        });

        uploadedFiles.push(newFile);
    }

    return NextResponse.json(uploadedFiles);
}
