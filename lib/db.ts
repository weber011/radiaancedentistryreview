import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BUSINESS_CONFIG } from './config';
import {
  Business,
  ReviewPrompt,
  QRCodeRecord,
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsSummary,
} from './types';

interface DatabaseSchema {
  businesses: Business[];
  reviewPrompts: ReviewPrompt[];
  qrCodes: QRCodeRecord[];
  analyticsEvents: AnalyticsEvent[];
  adminPasswordHash: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Default Admin Password (can be overridden via process.env.ADMIN_PASSWORD)
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'radiaance2026';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getDefaultDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  const radiaanceId = BUSINESS_CONFIG.id;

  const defaultPrompts: ReviewPrompt[] = BUSINESS_CONFIG.defaultPrompts.map((p, idx) => ({
    id: `prompt-${p.rating}-${idx + 1}`,
    businessId: radiaanceId,
    rating: p.rating,
    promptText: p.promptText,
    starterText: p.starterText,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));

  const initialBusiness: Business = {
    id: radiaanceId,
    name: BUSINESS_CONFIG.name,
    slug: BUSINESS_CONFIG.slug,
    city: BUSINESS_CONFIG.city,
    logo: BUSINESS_CONFIG.logo,
    instagramUrl: BUSINESS_CONFIG.instagramUrl,
    googleReviewUrl: BUSINESS_CONFIG.googleReviewUrl,
    expressMode: true,
    theme: {
      primaryColor: BUSINESS_CONFIG.theme.primaryColor,
      secondaryColor: BUSINESS_CONFIG.theme.secondaryColor,
      accentColor: BUSINESS_CONFIG.theme.accentColor,
    },
    welcomeHeading: "Your smile matters to us.",
    welcomeSubtext: BUSINESS_CONFIG.welcomeSubtext,
    createdAt: now,
    updatedAt: now,
  };

  const initialQr: QRCodeRecord = {
    id: `qr-${radiaanceId}`,
    businessId: radiaanceId,
    destinationPath: `/review/${BUSINESS_CONFIG.slug}`,
    createdAt: now,
    updatedAt: now,
  };

  return {
    businesses: [initialBusiness],
    reviewPrompts: defaultPrompts,
    qrCodes: [initialQr],
    analyticsEvents: [],
    adminPasswordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
  };
}

let dbMemoryCache: DatabaseSchema | null = null;

function ensureDataFile(): DatabaseSchema {
  if (dbMemoryCache) return dbMemoryCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const defaultData = getDefaultDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      dbMemoryCache = defaultData;
      return defaultData;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;

    // Check if radiaance business exists, if not seed it
    if (!parsed.businesses.some((b) => b.slug === BUSINESS_CONFIG.slug)) {
      const def = getDefaultDatabase();
      parsed.businesses.push(def.businesses[0]);
      parsed.reviewPrompts.push(...def.reviewPrompts);
      parsed.qrCodes.push(...def.qrCodes);
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }

    dbMemoryCache = parsed;
    return parsed;
  } catch (err) {
    console.error('Error loading database file, using fallback in-memory data:', err);
    const fallback = getDefaultDatabase();
    dbMemoryCache = fallback;
    return fallback;
  }
}

function persistDb(data: DatabaseSchema): void {
  dbMemoryCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error persisting database file:', err);
  }
}

export const db = {
  // Business
  getBusinessBySlug(slug: string): Business | null {
    const data = ensureDataFile();
    return data.businesses.find((b) => b.slug === slug) || null;
  },

  getAllBusinesses(): Business[] {
    const data = ensureDataFile();
    return data.businesses;
  },

  updateBusiness(id: string, updates: Partial<Business>): Business | null {
    const data = ensureDataFile();
    const index = data.businesses.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const existing = data.businesses[index];
    const updated: Business = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    data.businesses[index] = updated;
    persistDb(data);
    return updated;
  },

  // Review Prompts
  getPromptsForRating(businessId: string, rating: number): ReviewPrompt[] {
    const data = ensureDataFile();
    return data.reviewPrompts.filter(
      (p) => p.businessId === businessId && p.rating === rating && p.active
    );
  },

  getAllPrompts(businessId: string): ReviewPrompt[] {
    const data = ensureDataFile();
    return data.reviewPrompts.filter((p) => p.businessId === businessId);
  },

  addPrompt(
    businessId: string,
    rating: number,
    promptText: string,
    starterText: string
  ): ReviewPrompt {
    const data = ensureDataFile();
    const now = new Date().toISOString();
    const newPrompt: ReviewPrompt = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      rating,
      promptText,
      starterText,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    data.reviewPrompts.push(newPrompt);
    persistDb(data);
    return newPrompt;
  },

  updatePrompt(id: string, updates: Partial<ReviewPrompt>): ReviewPrompt | null {
    const data = ensureDataFile();
    const index = data.reviewPrompts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    data.reviewPrompts[index] = {
      ...data.reviewPrompts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistDb(data);
    return data.reviewPrompts[index];
  },

  deletePrompt(id: string): boolean {
    const data = ensureDataFile();
    const beforeCount = data.reviewPrompts.length;
    data.reviewPrompts = data.reviewPrompts.filter((p) => p.id !== id);
    if (data.reviewPrompts.length !== beforeCount) {
      persistDb(data);
      return true;
    }
    return false;
  },

  // QR Codes
  getQRCodeRecord(businessId: string): QRCodeRecord | null {
    const data = ensureDataFile();
    return data.qrCodes.find((q) => q.businessId === businessId) || null;
  },

  // Analytics - STRICTLY PRIVACY PRESERVING
  recordAnalyticsEvent(
    businessId: string,
    eventType: AnalyticsEventType,
    sessionId: string,
    rating?: number
  ): AnalyticsEvent {
    const data = ensureDataFile();
    const event: AnalyticsEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      eventType,
      rating,
      sessionId,
      timestamp: new Date().toISOString(),
    };
    data.analyticsEvents.push(event);

    // Keep events capped at last 50,000 for storage sanity
    if (data.analyticsEvents.length > 50000) {
      data.analyticsEvents = data.analyticsEvents.slice(-50000);
    }

    persistDb(data);
    return event;
  },

  getAnalyticsSummary(businessId: string): AnalyticsSummary {
    const data = ensureDataFile();
    const events = data.analyticsEvents.filter((e) => e.businessId === businessId);

    // Filter unique sessions per funnel stage
    const sessionMap = new Map<string, Set<AnalyticsEventType>>();
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const ev of events) {
      if (!sessionMap.has(ev.sessionId)) {
        sessionMap.set(ev.sessionId, new Set());
      }
      sessionMap.get(ev.sessionId)!.add(ev.eventType);

      if (ev.eventType === 'rating_selected' && ev.rating && ev.rating >= 1 && ev.rating <= 5) {
        ratingDistribution[ev.rating] = (ratingDistribution[ev.rating] || 0) + 1;
      }
    }

    const countForEvent = (type: AnalyticsEventType) => {
      let count = 0;
      for (const set of sessionMap.values()) {
        if (set.has(type)) count++;
      }
      return count;
    };

    const totalScans = Math.max(countForEvent('qr_scan'), sessionMap.size);
    const ratingsSelected = countForEvent('rating_selected');
    const reviewsStarted = countForEvent('review_editor_opened');
    const startersUsed = countForEvent('starter_selected');
    const reviewsCopied = countForEvent('review_copied');
    const googleOpened = countForEvent('google_opened');
    const instagramOpened = countForEvent('instagram_opened');
    const flowCompleted = countForEvent('flow_completed');

    const completionRate = totalScans > 0 ? Math.round((googleOpened / totalScans) * 100) : 0;

    const funnel = [
      {
        eventType: 'qr_scan' as AnalyticsEventType,
        label: 'QR Scan',
        count: totalScans,
        percentage: 100,
      },
      {
        eventType: 'rating_selected' as AnalyticsEventType,
        label: 'Rating Selected',
        count: ratingsSelected,
        percentage: totalScans > 0 ? Math.round((ratingsSelected / totalScans) * 100) : 0,
      },
      {
        eventType: 'review_editor_opened' as AnalyticsEventType,
        label: 'Review Started',
        count: reviewsStarted,
        percentage: totalScans > 0 ? Math.round((reviewsStarted / totalScans) * 100) : 0,
      },
      {
        eventType: 'review_copied' as AnalyticsEventType,
        label: 'Review Copied',
        count: reviewsCopied,
        percentage: totalScans > 0 ? Math.round((reviewsCopied / totalScans) * 100) : 0,
      },
      {
        eventType: 'google_opened' as AnalyticsEventType,
        label: 'Google Opened',
        count: googleOpened,
        percentage: totalScans > 0 ? Math.round((googleOpened / totalScans) * 100) : 0,
      },
      {
        eventType: 'instagram_opened' as AnalyticsEventType,
        label: 'Instagram Opened',
        count: instagramOpened,
        percentage: totalScans > 0 ? Math.round((instagramOpened / totalScans) * 100) : 0,
      },
    ];

    return {
      totalScans,
      ratingsSelected,
      reviewsStarted,
      startersUsed,
      reviewsCopied,
      googleOpened,
      instagramOpened,
      flowCompleted,
      completionRate,
      ratingDistribution,
      funnel,
    };
  },

  // Admin Auth
  verifyAdminPassword(password: string): boolean {
    const data = ensureDataFile();
    const hash = hashPassword(password);
    return (
      hash === data.adminPasswordHash ||
      hash === hashPassword(process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD)
    );
  },

  updateAdminPassword(newPassword: string): void {
    const data = ensureDataFile();
    data.adminPasswordHash = hashPassword(newPassword);
    persistDb(data);
  },
};
