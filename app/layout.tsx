import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Radiaance Dentistry | Share Your Experience',
  description:
    'Share your genuine experience with Radiaance Dentistry in Surat, Gujarat. Your feedback matters to our dental care team.',
  manifest: '/manifest.json',
  icons: {
    icon: '/tooth-icon.svg',
    shortcut: '/tooth-icon.svg',
    apple: '/tooth-icon.svg',
  },
  openGraph: {
    title: 'Radiaance Dentistry | Share Your Experience',
    description: 'Share your genuine experience with Radiaance Dentistry, Surat.',
    images: [{ url: '/logo.svg', width: 360, height: 80, alt: 'Radiaance Dentistry Logo' }],
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0E7490',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
