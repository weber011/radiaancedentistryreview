'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Download,
  Copy,
  Printer,
  Check,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Business } from '@/lib/types';

interface QRClientProps {
  business: Business;
}

export default function QRClient({ business }: QRClientProps) {
  const [origin, setOrigin] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const qrDestination = origin ? `${origin}/review/${business.slug}` : `/review/${business.slug}`;

  // Fetch SVG representation of the QR code
  useEffect(() => {
    async function fetchSvg() {
      try {
        setLoading(true);
        const res = await fetch(`/api/qr?slug=${business.slug}&format=svg`);
        if (res.ok) {
          const text = await res.text();
          setSvgContent(text);
        }
      } catch (err) {
        console.error('Failed to load QR SVG:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSvg();
  }, [business.slug]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrDestination);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', background: 'var(--bg-page)' }}>
      {/* Printable Counter Standee - Visible on Screen & Tailored for Print */}
      <div className="app-container" style={{ maxWidth: '980px' }}>
        {/* Navigation Bar */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/admin"
              className="btn btn-secondary"
              style={{ minHeight: '42px', padding: '8px 16px', fontSize: '0.88rem' }}
            >
              <ArrowLeft size={16} />
              <span>Admin Dashboard</span>
            </Link>
            <Link
              href={`/review/${business.slug}`}
              target="_blank"
              className="btn btn-ghost"
              style={{ minHeight: '42px', padding: '8px 16px', fontSize: '0.88rem' }}
            >
              <ExternalLink size={16} />
              <span>Preview Customer Flow</span>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ minHeight: '42px', padding: '8px 18px', fontSize: '0.9rem' }}
            >
              <Printer size={16} />
              <span>Print Standee / Display</span>
            </button>
          </div>
        </div>

        {/* Grid Layout: Standee Preview & Management Tools */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Printable Acrylic / Counter Display Card */}
          <div
            id="printable-standee"
            className="dental-card"
            style={{
              padding: '36px 28px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              border: '2px solid #E2E8F0',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Elegant Header Accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: 'linear-gradient(90deg, #0E7490, #0284C7, #14B8A6)',
              }}
            />

            {/* Brand Logo & Name */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: '#F0FDFA',
                  border: '1px solid #CCFBF1',
                  marginBottom: '12px',
                }}
              >
                <img src="/tooth-icon.svg" alt="Tooth Logo" width="38" height="38" />
              </div>
              <h1
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  color: '#0F172A',
                  textTransform: 'uppercase',
                }}
              >
                {business.name}
              </h1>
              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: '#0E7490',
                  marginTop: '2px',
                }}
              >
                {business.city.toUpperCase()} • REVIEW QR
              </p>
            </div>

            {/* Call to Action Phrase */}
            <div style={{ margin: '16px 0 20px 0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                How was your visit today?
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
                Scan to share your smile story in under 60 seconds
              </p>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                display: 'inline-block',
                padding: '16px',
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '2px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(14, 116, 144, 0.08)',
                margin: '0 auto 20px auto',
                maxWidth: '260px',
                maxHeight: '260px',
              }}
            >
              {loading ? (
                <div style={{ padding: '60px', color: '#94A3B8' }}>Generating QR...</div>
              ) : (
                <div
                  style={{ width: '220px', height: '220px' }}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              )}
            </div>

            {/* Stars decoration */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                marginBottom: '16px',
              }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: '#F59E0B', fontSize: '1.3rem' }}>
                  ★
                </span>
              ))}
            </div>

            {/* Footer Notice */}
            <div
              style={{
                paddingTop: '16px',
                borderTop: '1px dashed #CBD5E1',
                fontSize: '0.78rem',
                color: '#64748B',
              }}
            >
              <p style={{ fontWeight: 600, color: '#334155' }}>
                Your honest feedback helps us serve you better.
              </p>
              <p style={{ wordBreak: 'break-all', marginTop: '4px', color: '#0E7490' }}>
                {qrDestination}
              </p>
            </div>
          </div>

          {/* Management & Download Panel */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Actions Card */}
            <div className="dental-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                QR Code Actions
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '20px' }}>
                This QR code directly and permanently encodes your review route. It will never expire or require reconfiguration.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Copy URL */}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  {copied ? <Check size={18} color="#16A34A" /> : <Copy size={18} />}
                  <span>{copied ? 'URL Copied to Clipboard!' : 'Copy QR Destination URL'}</span>
                </button>

                {/* Download High Res PNG */}
                <a
                  href={`/api/qr?slug=${business.slug}&format=png`}
                  download={`${business.slug}-review-qr.png`}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  <Download size={18} />
                  <span>Download High-Res PNG (1200x1200px)</span>
                </a>

                {/* Download Vector SVG */}
                <a
                  href={`/api/qr?slug=${business.slug}&format=svg&download=true`}
                  download={`${business.slug}-review-qr.svg`}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  <Download size={18} />
                  <span>Download Vector SVG (Print Ready)</span>
                </a>

                {/* Print Counter Standee */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-primary"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  <Printer size={18} />
                  <span>Print Counter Standee</span>
                </button>
              </div>
            </div>

            {/* Target Architecture Information */}
            <div className="dental-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldCheck size={20} color="#0E7490" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  Policy &amp; Security Architecture
                </h4>
              </div>

              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
                <li>Encodes strictly <code>/review/{business.slug}</code> (never external URLs directly).</li>
                <li>Allows updating clinic Google links without re-printing standees.</li>
                <li>Zero review gating compliant with Google Business Profile terms.</li>
                <li>Works with any standard smartphone camera.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-standee {
            border: 1px solid #94a3b8 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 480px !important;
            margin: 40px auto !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
