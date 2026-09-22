import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const slug = searchParams.get('slug') || 'radiaance';
    const format = searchParams.get('format') || 'svg'; // svg or png

    // Target URL strictly encodes the review route, NEVER Google or Instagram
    const targetUrl = `${proto}://${host}/review/${slug}`;

    if (format === 'png') {
      const pngBuffer = await QRCode.toBuffer(targetUrl, {
        type: 'png',
        width: 1200,
        margin: 2,
        color: {
          dark: '#0E7490', // Dental Cyan
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${slug}-review-qr.png"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Default SVG
    const svgString = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#0E7490',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    if (searchParams.get('download') === 'true') {
      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="${slug}-review-qr.svg"`,
        },
      });
    }

    return new NextResponse(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Error generating QR:', err);
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
  }
}
