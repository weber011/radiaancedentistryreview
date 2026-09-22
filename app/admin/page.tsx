import { Metadata } from 'next';
import { db } from '@/lib/db';
import { BUSINESS_CONFIG } from '@/lib/config';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Radiaance Dentistry | Admin Dashboard',
  description: 'Manage clinic review settings, writing prompts, and review funnel analytics.',
};

export default function AdminPage() {
  const business = db.getBusinessBySlug(BUSINESS_CONFIG.slug) || db.getAllBusinesses()[0];
  const prompts = db.getAllPrompts(business.id);
  const analytics = db.getAnalyticsSummary(business.id);

  return (
    <AdminClient
      initialBusiness={business}
      initialPrompts={prompts}
      initialAnalytics={analytics}
    />
  );
}
