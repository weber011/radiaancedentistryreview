'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Star,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { Business, ReviewPrompt, AnalyticsEventType } from '@/lib/types';

interface ReviewClientProps {
  business: Business;
  prompts: ReviewPrompt[];
}

export default function ReviewClient({ business, prompts }: ReviewClientProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [googleOpened, setGoogleOpened] = useState<boolean>(false);
  const [isDoneOnGoogle, setIsDoneOnGoogle] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number>(3);
  const [reviewKey, setReviewKey] = useState<number>(0); // Triggers re-animation on new review
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Session and log QR scan
  useEffect(() => {
    let sid = sessionStorage.getItem('radiaance_review_sid');
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('radiaance_review_sid', sid);
    }
    setSessionId(sid);
    logEvent('qr_scan', sid);
  }, []);

  const logEvent = useCallback(
    (eventType: AnalyticsEventType, sid = sessionId, starRating = rating) => {
      if (!sid) return;
      try {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            eventType,
            sessionId: sid,
            rating: starRating,
          }),
        }).catch(() => {});
      } catch {
        // Silent fail for analytics
      }
    },
    [business.id, rating, sessionId]
  );

  // Fetch concise, 1-2 sentence unique AI review from Groq
  const generateAIReview = useCallback(
    async (selectedRating: number) => {
      setIsGenerating(true);
      try {
        const res = await fetch('/api/generate-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: selectedRating }),
        });
        const data = await res.json();
        if (data.review) {
          setReviewText(data.review);
          setCharCount(data.review.length);
          setReviewKey((prev) => prev + 1);
        } else {
          throw new Error(data.error || 'Failed');
        }
      } catch {
        // Fallback concise, positive 1-2 sentence starter
        const fallbackOptions = [
          'The team made my visit so comfortable and stress-free. The clinic is spotless and the care is truly gentle!',
          'Very polite staff and completely painless dental care. Radiaance Dentistry is easily the best in Surat!',
          'Clean, modern clinic with genuinely caring doctors. I left feeling relaxed and very happy with my visit.',
          'Everything was explained so clearly and the gentle treatment put me right at ease. Highly recommend!',
        ];
        const chosen = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
        setReviewText(chosen);
        setCharCount(chosen.length);
        setReviewKey((prev) => prev + 1);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  // Initial generation on page load
  useEffect(() => {
    generateAIReview(5);
  }, [generateAIReview]);

  // Tab Return Detection: When user comes back from Google Review tab, show Instagram step!
  useEffect(() => {
    const handleReturn = () => {
      if (document.visibilityState === 'visible' && googleOpened && !isDoneOnGoogle) {
        setIsDoneOnGoogle(true);
        logEvent('flow_completed', sessionId, rating);
      }
    };

    document.addEventListener('visibilitychange', handleReturn);
    window.addEventListener('focus', handleReturn);

    return () => {
      document.removeEventListener('visibilitychange', handleReturn);
      window.removeEventListener('focus', handleReturn);
    };
  }, [googleOpened, isDoneOnGoogle, logEvent, sessionId, rating]);

  // Auto-redirect countdown once user returns from Google
  useEffect(() => {
    if (!isDoneOnGoogle) return;

    const interval = setInterval(() => {
      setAutoRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = business.instagramUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDoneOnGoogle, business.instagramUrl]);

  // Handle star selection
  const handleRatingChange = (stars: number) => {
    setRating(stars);
    setHoverRating(null);
    logEvent('rating_selected', sessionId, stars);
    generateAIReview(stars);
  };

  // Shared clipboard copy
  const copyTextToClipboard = async (textToCopy: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch {
        // Fallback below
      }
    }
    try {
      const tempArea = document.createElement('textarea');
      tempArea.value = textToCopy;
      tempArea.style.position = 'fixed';
      tempArea.style.opacity = '0';
      document.body.appendChild(tempArea);
      tempArea.focus();
      tempArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(tempArea);
      return success;
    } catch {
      return false;
    }
  };

  // One-click: Copy review + Launch Google Review
  const handlePostOnGoogle = async () => {
    const textToCopy = reviewText.trim();
    if (textToCopy) {
      await copyTextToClipboard(textToCopy);
      setCopiedSuccess(true);
      logEvent('review_copied', sessionId, rating);
    }
    logEvent('google_opened', sessionId, rating);
    setGoogleOpened(true);

    // Open Google Review modal URL
    window.open(business.googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #FFF1F2 0%, #FDF2F8 40%, #F0FDFA 100%)',
      }}
    >
      {/* ====================================================
          ANIMATED GLOWING BACKGROUND BLOBS (Pinkish & Dental Aqua)
         ==================================================== */}
      <div
        style={{
          position: 'absolute',
          top: '-8%',
          left: '-10%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251, 113, 133, 0.35) 0%, rgba(244, 63, 94, 0) 70%)',
          filter: 'blur(50px)',
          animation: 'floatSlow1 12s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-8%',
          width: '460px',
          height: '460px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(14, 116, 144, 0) 70%)',
          filter: 'blur(55px)',
          animation: 'floatSlow2 14s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '5%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244, 114, 182, 0.28) 0%, rgba(236, 72, 153, 0) 70%)',
          filter: 'blur(45px)',
          animation: 'floatSlow3 10s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Main Glassmorphic Container Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          position: 'relative',
          zIndex: 10,
          margin: '0 auto',
        }}
      >
        <div
          className="glass-panel-pink"
          style={{
            padding: '34px 24px',
            borderRadius: '28px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Decorative Gradient Rim */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #FB7185, #F43F5E, #14B8A6, #0E7490)',
            }}
          />

          {/* ====================================================
              VIEW A: INSTAGRAM FOLLOW (AFTER GOOGLE REVIEW)
             ==================================================== */}
          {isDoneOnGoogle ? (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '12px 6px' }}>
              {/* Animated Floating Instagram Badge */}
              <div
                className="animate-levitate"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '78px',
                  height: '78px',
                  borderRadius: '24px',
                  background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)',
                  marginBottom: '18px',
                  boxShadow: '0 12px 30px rgba(221, 42, 123, 0.4)',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                Thank You So Much! <span style={{ color: '#F43F5E' }}>❤️</span>
              </h2>
              <p style={{ fontSize: '0.96rem', color: '#475569', marginBottom: '20px', lineHeight: '1.55' }}>
                Your review helps others in Surat discover gentle dental care. Follow <strong style={{ color: '#0F172A' }}>Radiaance Dentistry</strong> on Instagram for smile care tips and transformations!
              </p>

              {/* Glass Tag */}
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(255, 241, 242, 0.85)',
                  border: '1px solid rgba(251, 113, 133, 0.4)',
                  padding: '8px 24px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  color: '#E11D48',
                  fontSize: '0.96rem',
                  letterSpacing: '0.4px',
                  marginBottom: '26px',
                  boxShadow: '0 4px 14px rgba(244, 63, 94, 0.12)',
                }}
              >
                @radiaance._.dentistry
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a
                  href={business.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn shimmer-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '16px',
                    fontSize: '1.05rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 45%, #9333EA 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 8px 25px rgba(244, 63, 94, 0.35)',
                    transition: 'transform 0.18s ease',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                  <span>Follow on Instagram Now →</span>
                </a>

                {/* Live Countdown Pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: '#64748B',
                    marginTop: '4px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#F43F5E',
                      animation: 'pulseGentle 1.2s infinite',
                    }}
                  />
                  <span>Opening Instagram automatically in {autoRedirectCountdown}s...</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDoneOnGoogle(false)}
                  className="btn btn-ghost"
                  style={{ color: '#64748B', fontSize: '0.86rem', marginTop: '6px' }}
                >
                  ← Edit or copy review again
                </button>
              </div>
            </div>
          ) : (
            /* ====================================================
                VIEW B: STREAMLINED AI REVIEW & GOOGLE FLOW
               ==================================================== */
            <div>
              {/* Clinic Branding with Levitating Tooth Badge */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  className="animate-levitate"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
                    border: '1.5px solid rgba(254, 205, 211, 0.9)',
                    marginBottom: '12px',
                    boxShadow: '0 8px 20px rgba(244, 63, 94, 0.2), inset 0 1px 2px #FFFFFF',
                  }}
                >
                  <img src="/tooth-icon.svg" alt="Radiaance Dentistry" width="38" height="38" />
                </div>
                <h1
                  style={{
                    fontSize: '1.55rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    marginBottom: '3px',
                  }}
                >
                  {business.name}
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#E11D48', fontWeight: 600, letterSpacing: '0.3px' }}>
                  Surat, Gujarat • Google Reviews
                </p>
              </div>

              {/* Star Rating Section with Animated Bouncy Buttons */}
              <div
                className="glass-box-pink"
                style={{
                  padding: 'clamp(14px, 3.5vw, 18px)',
                  borderRadius: '22px',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
                  Select your experience:
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'clamp(6px, 2.2vw, 12px)',
                    width: '100%',
                    maxWidth: '340px',
                    margin: '0 auto',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isHovered = hoverRating !== null && hoverRating >= starValue;
                    const isSelected = rating !== null && rating >= starValue;
                    const isFilled = isHovered || (!hoverRating && isSelected);

                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => handleRatingChange(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(null)}
                        aria-label={`${starValue} Stars`}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                            : 'rgba(255, 255, 255, 0.8)',
                          border: isSelected ? '1.5px solid #F59E0B' : '1px solid rgba(226, 232, 240, 0.85)',
                          borderRadius: 'clamp(12px, 3vw, 16px)',
                          flex: '1 1 0',
                          maxWidth: '54px',
                          minWidth: '42px',
                          height: 'clamp(46px, 12vw, 54px)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
                          transform: isHovered || rating === starValue ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: isSelected
                            ? '0 6px 16px rgba(245, 158, 11, 0.35)'
                            : '0 2px 6px rgba(0,0,0,0.03)',
                        }}
                      >
                        <Star
                          size={26}
                          color={isFilled ? '#F59E0B' : '#94A3B8'}
                          fill={isFilled ? '#F59E0B' : 'transparent'}
                          style={{
                            transition: 'transform 0.15s ease',
                            transform: isHovered ? 'rotate(10deg)' : 'rotate(0deg)',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#D97706', fontWeight: 600, marginTop: '10px' }}>
                  {rating} of 5 Stars Selected
                </div>
              </div>

              {/* AI-Generated 1-2 Line Review Box */}
              <div
                className="glass-box-pink"
                style={{
                  borderRadius: '22px',
                  padding: '16px 18px',
                  marginBottom: '18px',
                  position: 'relative',
                  border: '1.5px solid rgba(254, 205, 211, 0.85)',
                  background: 'rgba(255, 255, 255, 0.72)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#E11D48',
                    }}
                  >
                    <Sparkles size={16} color="#F43F5E" className="animate-pulse-gentle" />
                    <span>Suggested Review (1-2 Lines)</span>
                  </div>

                  {/* Regenerate Button with Smooth Spin */}
                  <button
                    type="button"
                    onClick={() => generateAIReview(rating)}
                    disabled={isGenerating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255, 241, 242, 0.9)',
                      border: '1px solid #FECDD3',
                      borderRadius: '10px',
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#E11D48',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: '0 2px 6px rgba(244, 63, 94, 0.12)',
                    }}
                    title="Generate another unique review"
                  >
                    <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
                    <span>{isGenerating ? 'Writing…' : 'New Review 🔄'}</span>
                  </button>
                </div>

                {/* Review Textarea with Keyed Re-animation */}
                {isGenerating ? (
                  <div
                    style={{
                      padding: '20px 10px',
                      textAlign: 'center',
                      color: '#E11D48',
                      fontSize: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <RefreshCw size={24} className="animate-spin" color="#F43F5E" />
                    <span style={{ fontWeight: 600 }}>Crafting a fresh unique review for you...</span>
                  </div>
                ) : (
                  <div key={reviewKey} className="animate-review-pop">
                    <textarea
                      ref={textareaRef}
                      value={reviewText}
                      onChange={(e) => {
                        setReviewText(e.target.value);
                        setCharCount(e.target.value.length);
                      }}
                      rows={3}
                      placeholder="Your review will appear here..."
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontSize: '1rem',
                        lineHeight: '1.55',
                        color: '#0F172A',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        background: 'transparent',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px dashed rgba(254, 205, 211, 0.8)',
                        paddingTop: '8px',
                        marginTop: '4px',
                        fontSize: '0.76rem',
                        color: '#94A3B8',
                      }}
                    >
                      <span style={{ color: '#64748B' }}>💡 Tap text to make any personal edits</span>
                      <span>{charCount} characters</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Alert if Google was opened */}
              {googleOpened && (
                <div
                  className="animate-fade-in"
                  style={{
                    backgroundColor: 'rgba(240, 253, 244, 0.9)',
                    border: '1px solid #BBF7D0',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)',
                  }}
                >
                  <Check size={18} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.84rem', color: '#15803D' }}>
                    <strong>Review copied to clipboard &amp; Google opened!</strong>
                    <div style={{ marginTop: '2px', color: '#166534' }}>
                      Paste into Google&apos;s review box and tap <strong>Post</strong>. When you return here, we&apos;ll take you straight to our Instagram!
                    </div>
                  </div>
                </div>
              )}

              {/* PRIMARY ACTION BUTTON WITH SHIMMER PASS */}
              <button
                type="button"
                onClick={handlePostOnGoogle}
                disabled={isGenerating || !reviewText.trim()}
                className="btn shimmer-btn"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 40%, #0E7490 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 28px rgba(244, 63, 94, 0.35)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  marginBottom: '12px',
                }}
              >
                {copiedSuccess ? <Check size={20} /> : <ExternalLink size={20} />}
                <span>
                  {copiedSuccess ? 'Copied! Opening Google Review →' : 'Copy Review & Post on Google →'}
                </span>
              </button>

              {/* Direct Follow on Instagram Secondary Action */}
              <button
                type="button"
                onClick={() => {
                  setIsDoneOnGoogle(true);
                  logEvent('flow_completed', sessionId, rating);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(254, 205, 211, 0.8)',
                  color: '#BE123C',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.15s ease',
                }}
              >
                <span>Already posted? Follow on Instagram</span>
                <ArrowRight size={15} />
              </button>

              {/* Trust Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '16px',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                }}
              >
                <ShieldCheck size={14} color="#E11D48" />
                <span>Genuine patient review • Powered by Groq AI</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
