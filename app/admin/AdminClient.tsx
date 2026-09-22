'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  QrCode,
  Settings,
  MessageSquare,
  Shield,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  TrendingUp,
  Eye,
  Copy,
  Star,
  Lock,
  Save,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Business, ReviewPrompt, AnalyticsSummary } from '@/lib/types';

interface AdminClientProps {
  initialBusiness: Business;
  initialPrompts: ReviewPrompt[];
  initialAnalytics: AnalyticsSummary;
}

type TabType = 'overview' | 'qr' | 'settings' | 'prompts';

export default function AdminClient({
  initialBusiness,
  initialPrompts,
  initialAnalytics,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [prompts, setPrompts] = useState<ReviewPrompt[]>(initialPrompts);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(initialAnalytics);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Business Form State
  const [name, setName] = useState(initialBusiness.name);
  const [city, setCity] = useState(initialBusiness.city);
  const [instagramUrl, setInstagramUrl] = useState(initialBusiness.instagramUrl);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialBusiness.googleReviewUrl);
  const [primaryColor, setPrimaryColor] = useState(initialBusiness.theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initialBusiness.theme.secondaryColor);
  const [expressMode, setExpressMode] = useState(initialBusiness.expressMode !== false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Prompts Form State
  const [selectedPromptRating, setSelectedPromptRating] = useState<number>(5);
  const [newPromptText, setNewPromptText] = useState('');
  const [newStarterText, setNewStarterText] = useState('');
  const [promptActionLoading, setPromptActionLoading] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editPromptText, setEditPromptText] = useState('');
  const [editStarterText, setEditStarterText] = useState('');

  // Password Change State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMessage, setPassMessage] = useState('');

  // Verify auth session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        // Not authenticated
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch updated analytics
  const refreshAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?businessId=${business.id}`, {
        headers: { 'x-admin-password': adminPassword },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.summary);
      }
    } catch {
      //
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        refreshAnalytics();
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch {
      setAuthError('Connection error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  // Save Business Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: business.id,
          adminPassword,
          name,
          city,
          instagramUrl,
          googleReviewUrl,
          expressMode,
          theme: {
            ...business.theme,
            primaryColor,
            secondaryColor,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBusiness(data.business);
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        const data = await res.json();
        setSettingsError(data.error || 'Failed to update settings');
      }
    } catch {
      setSettingsError('Connection error');
    }
  };

  // Add Prompt
  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

    setPromptActionLoading(true);
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          rating: selectedPromptRating,
          promptText: newPromptText.trim(),
          starterText: newStarterText.trim(),
          adminPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrompts((prev) => [...prev, data.prompt]);
        setNewPromptText('');
        setNewStarterText('');
      }
    } catch {
      //
    } finally {
      setPromptActionLoading(false);
    }
  };

  // Toggle Prompt Active
  const handleTogglePrompt = async (prompt: ReviewPrompt) => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prompt.id,
          updates: { active: !prompt.active },
          adminPassword,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? data.prompt : p)));
      }
    } catch {
      //
    }
  };

  // Delete Prompt
  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      const res = await fetch(`/api/prompts?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      });
      if (res.ok) {
        setPrompts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      //
    }
  };

  // Save Edited Prompt
  const handleSaveEditPrompt = async (id: string) => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: { promptText: editPromptText, starterText: editStarterText },
          adminPassword,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrompts((prev) => prev.map((p) => (p.id === id ? data.prompt : p)));
        setEditingPromptId(null);
      }
    } catch {
      //
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassMessage('Password changed successfully!');
        setCurrentPass('');
        setNewPass('');
      } else {
        setPassMessage(data.error || 'Password update failed');
      }
    } catch {
      setPassMessage('Connection error');
    }
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'var(--bg-page)',
        }}
      >
        <div
          className="dental-card dental-card-glow"
          style={{
            maxWidth: '420px',
            width: '100%',
            padding: '36px 28px',
            textAlign: 'center',
          }}
        >
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
              marginBottom: '16px',
            }}
          >
            <Lock size={26} color="#0E7490" />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '24px' }}>
            {business.name} • Review Management
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label
                htmlFor="admin-pass"
                style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}
              >
                Admin Password
              </label>
              <input
                id="admin-pass"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password (default: radiaance2026)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
                required
              />
            </div>

            {authError && (
              <p style={{ fontSize: '0.82rem', color: '#DC2626', marginBottom: '16px', textAlign: 'left' }}>
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '48px', fontSize: '0.95rem' }}
            >
              Access Dashboard
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <Link
              href={`/review/${business.slug}`}
              className="btn btn-ghost"
              style={{ fontSize: '0.85rem', padding: '6px 12px' }}
            >
              ← Back to Review Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '60px' }}>
      {/* Top Header */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          className="app-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/tooth-icon.svg" alt="" width="34" height="34" />
            <div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'block' }}>
                {business.name}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0E7490', letterSpacing: '1px' }}>
                ADMIN SUITE • {business.city.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href={`/review/${business.slug}`}
              target="_blank"
              className="btn btn-secondary"
              style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              <ExternalLink size={14} />
              <span>Live Patient Review</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.85rem', color: '#64748B' }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="app-container" style={{ padding: '0 20px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '6px', borderBottom: 'none' }}>
            {[
              { id: 'overview', label: 'Overview & Funnel', icon: BarChart3 },
              { id: 'qr', label: 'QR Code & Print', icon: QrCode },
              { id: 'settings', label: 'Business Settings', icon: Settings },
              { id: 'prompts', label: 'Review Prompts', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: isActive ? '3px solid #0E7490' : '3px solid transparent',
                    color: isActive ? '#0E7490' : '#64748B',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-container" style={{ paddingTop: '28px' }}>
        {/* ====================================================
            TAB 1: OVERVIEW & FUNNEL ANALYTICS
           ==================================================== */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header with Refresh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
                  Patient Review Funnel &amp; Analytics
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
                  Strictly anonymous, privacy-preserving performance telemetry
                </p>
              </div>
              <button
                type="button"
                onClick={refreshAnalytics}
                className="btn btn-secondary"
                style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Privacy Compliance Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                background: '#F0FDFA',
                border: '1px solid #CCFBF1',
                borderRadius: '16px',
              }}
            >
              <Shield size={22} color="#0E7490" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: '#134E4A' }}>
                <strong>Privacy &amp; Policy Guarantee:</strong> Zero patient PII, medical records, or review draft text are ever logged or stored. Only aggregated lifecycle funnel milestones are monitored.
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                { label: 'Total QR Scans', value: analytics.totalScans, color: '#0E7490', icon: QrCode },
                { label: 'Ratings Selected', value: analytics.ratingsSelected, color: '#0284C7', icon: Star },
                { label: 'Review Copies', value: analytics.reviewsCopied, color: '#14B8A6', icon: Copy },
                { label: 'Google Opened', value: analytics.googleOpened, color: '#16A34A', icon: ExternalLink },
                { label: 'Instagram Clicks', value: analytics.instagramOpened, color: '#DD2A7B', icon: Eye },
                {
                  label: 'Funnel Completion',
                  value: `${analytics.completionRate}%`,
                  color: '#B45309',
                  icon: TrendingUp,
                },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="dental-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
                        {card.label}
                      </span>
                      <Icon size={18} color={card.color} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>
                      {card.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Funnel Progress Flow */}
            <div className="dental-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                Conversion Funnel
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {analytics.funnel.map((step, idx) => (
                  <div key={step.eventType}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {idx + 1}. {step.label}
                      </span>
                      <span style={{ color: '#64748B' }}>
                        {step.count} sessions ({step.percentage}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        background: '#F1F5F9',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(step.percentage, 4)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #0E7490, #14B8A6)',
                          borderRadius: '999px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="dental-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                Patient Sentiment Distribution
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = analytics.ratingDistribution[s] || 0;
                  return (
                    <div
                      key={s}
                      style={{
                        textAlign: 'center',
                        padding: '14px 8px',
                        borderRadius: '14px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F59E0B' }}>
                        {s} ★
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        ratings
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB 2: QR CODE & PRINT
           ==================================================== */}
        {activeTab === 'qr' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="dental-card" style={{ padding: '28px', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: '#F0FDFA',
                  marginBottom: '16px',
                }}
              >
                <QrCode size={36} color="#0E7490" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                Clinic QR Code &amp; Reception Standee
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748B', maxWidth: '540px', margin: '0 auto 24px auto' }}>
                View and print the complete clinic counter standee, or download high-resolution vector and PNG formats for printing.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href="/admin/qr"
                  className="btn btn-primary"
                  style={{ minHeight: '44px', padding: '10px 20px', fontSize: '0.92rem' }}
                >
                  <ExternalLink size={16} />
                  <span>Open Full Screen QR &amp; Standee Studio →</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB 3: BUSINESS SETTINGS
           ==================================================== */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="dental-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                Business &amp; Destination Settings
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '24px' }}>
                Configure clinic details, Google Review URL, and Instagram social links.
              </p>

              {settingsSuccess && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#15803D',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Check size={18} />
                  <span>Settings updated successfully!</span>
                </div>
              )}

              {settingsError && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#B91C1C',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                  }}
                >
                  {settingsError}
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.92rem',
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.92rem',
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Google Review Destination URL (Configurable)
                  </label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.92rem',
                    }}
                    required
                  />
                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                    Admins can update this anytime to point directly to a new Google Place ID or shortlink.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Instagram Account URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.92rem',
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Primary Brand Color
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        style={{ width: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Secondary Accent Color
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        style={{ width: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Express Mode Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    background: expressMode ? '#F0FDFA' : '#F8FAFC',
                    border: `1px solid ${expressMode ? '#CCFBF1' : '#E2E8F0'}`,
                    borderRadius: '14px',
                    gap: '16px',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      ⚡ Express Mode
                    </p>
                    <p style={{ fontSize: '0.82rem', color: '#475569' }}>
                      <strong>ON</strong>: One tap copies review text and opens Google simultaneously. Automatically detects when patient returns.<br />
                      <strong>OFF</strong>: Full guided step-by-step flow with separate copy and open screens.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpressMode((v) => !v)}
                    style={{
                      flexShrink: 0,
                      width: '52px',
                      height: '28px',
                      borderRadius: '999px',
                      border: 'none',
                      background: expressMode ? '#0E7490' : '#CBD5E1',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.25s ease',
                    }}
                    aria-pressed={expressMode}
                    aria-label={expressMode ? 'Disable Express Mode' : 'Enable Express Mode'}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: expressMode ? '27px' : '3px',
                        transition: 'left 0.25s ease',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', minHeight: '44px', padding: '10px 24px', fontSize: '0.95rem' }}
                >
                  <Save size={16} />
                  <span>Save Business Configuration</span>
                </button>
              </form>
            </div>

            {/* Password Management */}
            <div className="dental-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                Change Admin Password
              </h3>
              <form onSubmit={handleChangePassword} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    required
                  />
                </div>
                {passMessage && (
                  <p style={{ fontSize: '0.82rem', color: '#0E7490', fontWeight: 600 }}>
                    {passMessage}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ minHeight: '40px', padding: '8px 16px', fontSize: '0.88rem', alignSelf: 'flex-start' }}
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB 4: REVIEW PROMPTS MANAGER
           ==================================================== */}
        {activeTab === 'prompts' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header & Policy Notice */}
            <div className="dental-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                Writing Prompts &amp; Starting Points Manager
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '16px' }}>
                Customize optional thought-starters organized by rating (1 to 5 stars). Patients remain in 100% control to edit or write in their own words.
              </p>

              <div
                style={{
                  padding: '12px 16px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: '#92400E',
                }}
              >
                ⚠️ <strong>Policy Notice:</strong> Negative ratings (1–3 stars) cannot be hidden or diverted. All patients have an honest, uninhibited path to Google Reviews.
              </div>
            </div>

            {/* Rating Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[5, 4, 3, 2, 1].map((r) => {
                const count = prompts.filter((p) => p.rating === r).length;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedPromptRating(r)}
                    className="btn"
                    style={{
                      minHeight: '42px',
                      padding: '8px 18px',
                      fontSize: '0.88rem',
                      background: selectedPromptRating === r ? '#0E7490' : '#FFFFFF',
                      color: selectedPromptRating === r ? '#FFFFFF' : '#334155',
                      borderColor: selectedPromptRating === r ? '#0E7490' : '#CBD5E1',
                    }}
                  >
                    <span>{r} Stars</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: selectedPromptRating === r ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                        color: selectedPromptRating === r ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add New Prompt Form */}
            <div className="dental-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                Add Prompt for {selectedPromptRating} Star Rating
              </h3>
              <form onSubmit={handleAddPrompt} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Prompt Question / Topic (Shown as chip)
                  </label>
                  <input
                    type="text"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="e.g. What made your visit comfortable?"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Suggested Starting Point (Optional editable draft)
                  </label>
                  <textarea
                    value={newStarterText}
                    onChange={(e) => setNewStarterText(e.target.value)}
                    placeholder="e.g. The clinic was immaculate and the dental procedure was gentle and painless..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={promptActionLoading}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', minHeight: '40px', padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  <Plus size={16} />
                  <span>Add Prompt</span>
                </button>
              </form>
            </div>

            {/* Existing Prompts for this rating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {prompts
                .filter((p) => p.rating === selectedPromptRating)
                .map((prompt) => (
                  <div
                    key={prompt.id}
                    className="dental-card"
                    style={{
                      padding: '20px',
                      opacity: prompt.active ? 1 : 0.6,
                      borderLeft: `4px solid ${prompt.active ? '#0E7490' : '#94A3B8'}`,
                    }}
                  >
                    {editingPromptId === prompt.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                          type="text"
                          value={editPromptText}
                          onChange={(e) => setEditPromptText(e.target.value)}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        />
                        <textarea
                          value={editStarterText}
                          onChange={(e) => setEditStarterText(e.target.value)}
                          rows={2}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleSaveEditPrompt(prompt.id)}
                            className="btn btn-primary"
                            style={{ minHeight: '34px', padding: '6px 14px', fontSize: '0.82rem' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPromptId(null)}
                            className="btn btn-ghost"
                            style={{ minHeight: '34px', padding: '6px 14px', fontSize: '0.82rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                              {prompt.promptText}
                            </h4>
                            {!prompt.active && (
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#F1F5F9', color: '#64748B', borderRadius: '4px' }}>
                                Inactive
                              </span>
                            )}
                          </div>
                          {prompt.starterText && (
                            <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                              &ldquo;{prompt.starterText}&rdquo;
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPromptId(prompt.id);
                              setEditPromptText(prompt.promptText);
                              setEditStarterText(prompt.starterText);
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '6px', minHeight: '32px' }}
                            title="Edit"
                          >
                            <Edit2 size={15} color="#475569" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePrompt(prompt)}
                            className="btn btn-ghost"
                            style={{ padding: '6px', minHeight: '32px' }}
                            title={prompt.active ? 'Disable' : 'Enable'}
                          >
                            <span style={{ fontSize: '0.78rem', color: prompt.active ? '#16A34A' : '#94A3B8' }}>
                              {prompt.active ? 'Active' : 'Disabled'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="btn btn-ghost"
                            style={{ padding: '6px', minHeight: '32px' }}
                            title="Delete"
                          >
                            <Trash2 size={15} color="#DC2626" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
