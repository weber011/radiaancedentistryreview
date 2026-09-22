import { Metadata } from 'next';
import { db } from '@/lib/db';
import { BUSINESS_CONFIG } from '@/lib/config';
import QRClient from './QRClient';

export const metadata: Metadata = {
  title: 'Radiaance Dentistry | QR Code & Standee Manager',
  description: 'Manage, download, and print the official Radiaance Dentistry review QR codes.',
};

export default function AdminQRPage() {
  const business = db.getBusinessBySlug(BUSINESS_CONFIG.slug) || db.getAllBusinesses()[0];

  return <QRClient business={business} />;
}
