import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BUSINESS_CONFIG } from '@/lib/config';
import { AnalyticsEventType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS: AnalyticsEventType[] = [
  'qr_scan',
  'rating_selected',
  'review_editor_opened',
  'starter_selected',
  'review_copied',
  'google_opened',
  'instagram_opened',
  'flow_completed',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, eventType, sessionId, rating } = body;

    // Strict privacy guarantee: DO NOT accept any text content, PII, or review data
    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Valid anonymous session ID required' }, { status: 400 });
    }

    const cleanRating =
      rating !== undefined && typeof rating === 'number' && rating >= 1 && rating <= 5
        ? rating
        : undefined;

    const bId = businessId || BUSINESS_CONFIG.id;
    const event = db.recordAnalyticsEvent(bId, eventType, sessionId, cleanRating);

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (err: any) {
    console.error('Error logging analytics event:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || BUSINESS_CONFIG.id;
    const adminPassword = request.headers.get('x-admin-password');

    if (!adminPassword || !db.verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = db.getAnalyticsSummary(businessId);
    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error('Error retrieving analytics summary:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
