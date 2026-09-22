import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const FOCUS_ANGLES = [
  'how gentle and pain-free the treatment was',
  'the warm, polite staff and comfortable environment',
  'how spotless, modern and hygienic the clinic is',
  'how patiently and clearly the doctor explained everything',
  'the smooth, timely appointment and caring atmosphere',
  'feeling completely at ease and well looked after',
  'leaving with a confident, bright smile and great satisfaction',
  'the attentive care and high standards of cleanliness',
];

const STYLES = [
  'casual and friendly',
  'brief and warm',
  'enthusiastic and heartfelt',
  'direct and appreciative',
  'reassuring and authentic',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildPrompt(rating: number): string {
  const angle = pickRandom(FOCUS_ANGLES);
  const style = pickRandom(STYLES);

  return `Write a genuine, positive Google review for Radiaance Dentistry in Surat, Gujarat.
Style: ${style}. Focus: ${angle}. Rating: ${rating} out of 5 stars.

STRICT RULES:
- Length: EXACTLY 1 OR 2 SHORT SENTENCES (under 30 words total). Keep it punchy, simple, and real.
- DO NOT invent or mention ANY doctor's name (never use names like Dr. X). Just say "the doctor", "the team", or "Radiaance Dentistry".
- DO NOT invent specific surgeries or medical procedures (no "root canal", "implants", "tooth extraction", etc.). Focus on gentle care, clean clinic, and friendly service.
- Sound like a real person, not AI marketing copy.
- Output ONLY the review text, with no quotation marks or labels.`;
}

function sanitizeReview(text: string): string {
  let cleaned = text.replace(/^["'“”]+|["'“”]+$/g, '').trim();

  // Strip any hallucinated doctor names like Dr. Patil, Dr. Shah, Doctor Mehta -> The doctor
  cleaned = cleaned.replace(/\b(Dr\.?|Doctor)\s+[A-Z][a-zA-Z]+/g, 'The doctor');

  // Strip specific false surgery terms
  cleaned = cleaned.replace(/\b(root canal|implant|extraction|braces|surgery)\b/gi, 'treatment');

  // Capitalize first letter if needed
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rating = Math.max(1, Math.min(5, parseInt(body.rating) || 5));

    const prompt = buildPrompt(rating);

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1.0,         // High temp = variety
      max_tokens: 120,
      top_p: 0.95,
    });

    let rawReview = completion.choices[0]?.message?.content?.trim() || '';

    if (!rawReview) {
      return NextResponse.json({ error: 'No review generated' }, { status: 500 });
    }

    const reviewText = sanitizeReview(rawReview);

    return NextResponse.json({ review: reviewText, rating });
  } catch (error: unknown) {
    console.error('Groq generation error:', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

