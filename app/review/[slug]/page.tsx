import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { BUSINESS_CONFIG } from '@/lib/config';
import ReviewClient from './ReviewClient';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const business = db.getBusinessBySlug(params.slug) || db.getBusinessBySlug(BUSINESS_CONFIG.slug);

  if (!business) {
    return {
      title: 'Review Experience',
    };
  }

  return {
    title: `${business.name} | Share Your Experience`,
    description: `Share your honest feedback and experience with ${business.name} in ${business.city}.`,
    openGraph: {
      title: `${business.name} | Share Your Experience`,
      description: `Share your honest feedback and experience with ${business.name} in ${business.city}.`,
      images: [{ url: business.logo || '/logo.svg' }],
    },
  };
}

export default function ReviewPage({ params }: PageProps) {
  const business = db.getBusinessBySlug(params.slug);

  // If business not found and slug isn't radiaance, try fallback or 404
  if (!business) {
    notFound();
  }

  const prompts = db.getAllPrompts(business.id);

  return <ReviewClient business={business} prompts={prompts} />;
}
