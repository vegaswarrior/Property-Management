import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { testDocuSignConnection } from '@/lib/services/docusign-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get('landlordId');

    if (!landlordId) {
      return NextResponse.json({ success: false, message: 'Missing landlord ID' }, { status: 400 });
    }

    const isConnected = await testDocuSignConnection(landlordId);

    return NextResponse.json({
      success: true,
      data: {
        connected: isConnected,
      },
    });
  } catch (error) {
    console.error('DocuSign status error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check DocuSign connection',
      data: { connected: false },
    });
  }
}