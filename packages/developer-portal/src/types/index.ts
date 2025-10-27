export interface DeveloperAccount {
  id: string;
  email: string;
  name: string;
  organization?: string;
  apiKey: string;
  createdAt: Date;
  lastLogin: Date;
  status: 'active' | 'suspended' | 'pending';
}

export interface SDKConfiguration {
  id: string;
  name: string;
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  settings: {
    enableAnalytics: boolean;
    enableTargeting: boolean;
    privacyCompliance: {
      gdpr: boolean;
      ccpa: boolean;
      coppa: boolean;
    };
    adFormats: {
      banner: boolean;
      interstitial: boolean;
      native: boolean;
    };
    targeting: {
      contextual: boolean;
      behavioral: boolean;
      demographic: boolean;
    };
  };
  domains: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: {
    total: number;
    spent: number;
    dailyLimit: number;
  };
  targeting: {
    demographics: {
      ageRange?: [number, number];
      gender?: 'male' | 'female' | 'all';
      location?: string[];
    };
    interests: string[];
    keywords: string[];
    aiContexts: string[];
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AdInventory {
  id: string;
  name: string;
  type: 'banner' | 'interstitial' | 'native';
  status: 'active' | 'inactive' | 'pending_review';
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText: string;
    landingUrl: string;
  };
  targeting: {
    keywords: string[];
    categories: string[];
    aiContexts: string[];
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpm: number;
    revenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpm: number;
    cpc: number;
    conversionRate: number;
  };
  breakdown: {
    byDate: Array<{
      date: string;
      impressions: number;
      clicks: number;
      revenue: number;
    }>;
    byAdFormat: Array<{
      format: string;
      impressions: number;
      clicks: number;
      revenue: number;
    }>;
    byPlatform: Array<{
      platform: string;
      impressions: number;
      clicks: number;
      revenue: number;
    }>;
  };
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averageCPM: number;
  activeCampaigns: number;
  recentActivity: Array<{
    id: string;
    type: 'campaign_created' | 'ad_approved' | 'payment_received';
    message: string;
    timestamp: Date;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}