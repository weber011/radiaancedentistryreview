export interface BusinessTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  city: string;
  logo?: string;
  instagramUrl: string;
  googleReviewUrl: string;
  theme: BusinessTheme;
  expressMode?: boolean;
  welcomeHeading?: string;
  welcomeSubtext?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPrompt {
  id: string;
  businessId: string;
  rating: number; // 1 to 5
  promptText: string;
  starterText: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeRecord {
  id: string;
  businessId: string;
  destinationPath: string;
  createdAt: string;
  updatedAt: string;
}

export type AnalyticsEventType =
  | 'qr_scan'
  | 'rating_selected'
  | 'review_editor_opened'
  | 'starter_selected'
  | 'review_copied'
  | 'google_opened'
  | 'instagram_opened'
  | 'flow_completed';

export interface AnalyticsEvent {
  id: string;
  businessId: string;
  eventType: AnalyticsEventType;
  rating?: number;
  sessionId: string;
  timestamp: string;
}

export interface FunnelMetric {
  eventType: AnalyticsEventType;
  label: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalScans: number;
  ratingsSelected: number;
  reviewsStarted: number;
  startersUsed: number;
  reviewsCopied: number;
  googleOpened: number;
  instagramOpened: number;
  flowCompleted: number;
  completionRate: number;
  ratingDistribution: Record<number, number>;
  funnel: FunnelMetric[];
}
