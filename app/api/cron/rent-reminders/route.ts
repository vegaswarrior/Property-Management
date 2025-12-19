import { NextRequest, NextResponse } from 'next/server';
import { sendRentReminders } from '@/lib/actions/notification.actions';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await sendRentReminders();

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Rent reminders cron job error:', error);
    return NextResponse.json({ error: 'Failed to process rent reminders' }, { status: 500 });
  }
}