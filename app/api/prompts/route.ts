import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BUSINESS_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || BUSINESS_CONFIG.id;
    const ratingParam = searchParams.get('rating');
    const all = searchParams.get('all') === 'true';

    if (all) {
      const prompts = db.getAllPrompts(businessId);
      return NextResponse.json({ prompts });
    }

    if (ratingParam) {
      const rating = parseInt(ratingParam, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Invalid rating (1-5)' }, { status: 400 });
      }
      const prompts = db.getPromptsForRating(businessId, rating);
      return NextResponse.json({ prompts });
    }

    const prompts = db.getAllPrompts(businessId);
    return NextResponse.json({ prompts });
  } catch (err: any) {
    console.error('Error fetching prompts:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, rating, promptText, starterText, adminPassword } = body;

    if (!adminPassword || !db.verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rating || rating < 1 || rating > 5 || !promptText) {
      return NextResponse.json(
        { error: 'Valid rating (1-5) and prompt text are required' },
        { status: 400 }
      );
    }

    const newPrompt = db.addPrompt(
      businessId || BUSINESS_CONFIG.id,
      rating,
      promptText.trim(),
      (starterText || '').trim()
    );

    return NextResponse.json({ success: true, prompt: newPrompt });
  } catch (err: any) {
    console.error('Error adding prompt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates, adminPassword } = body;

    if (!adminPassword || !db.verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || !updates) {
      return NextResponse.json({ error: 'ID and updates required' }, { status: 400 });
    }

    const updated = db.updatePrompt(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, prompt: updated });
  } catch (err: any) {
    console.error('Error updating prompt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminPassword = request.headers.get('x-admin-password');

    if (!adminPassword || !db.verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deleted = db.deletePrompt(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error('Error deleting prompt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
