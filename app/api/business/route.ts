import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BUSINESS_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || BUSINESS_CONFIG.slug;
    const business = db.getBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (err: any) {
    console.error('Error fetching business:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, adminPassword, ...updates } = body;

    if (!adminPassword || !db.verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const updated = db.updateBusiness(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, business: updated });
  } catch (err: any) {
    console.error('Error updating business:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
