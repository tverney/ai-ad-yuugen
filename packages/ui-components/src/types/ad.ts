// Comprehensive type definitions for AI Ad Yuugen components
import React from 'react';

export type AdType = 'banner' | 'native' | 'interstitial' | 'video';
export type AdFormat = 'display' | 'text' | 'rich-media' | 'video';
export type AdStatus = 'active' | 'paused' | 'expired' | 'pending' | 'rejected';

export enum AdPosition {
  INLINE = 'inline',
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  FLOATING = 'floating',
  OVERLAY = 'overlay',
}

export interface AdSize {
  width: number;
  height: number;
  responsive?: boolean;
}

export interface AdContent {
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaText: string;
  landingUrl: string;
  brandName?: string;
  logoUrl?: string;
}

export interface AdTargeting {
  keywords?: string[];
  categories?: string[];
  demographics?: {
    ageRange?: [number, number];
    gender?: 'male' | 'female' | 'all';
    location?: string[];
  };
  interests?: string[];
  aiContexts?: string[];
}

export interface AdPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpm: number;
  revenue: number;
}

export interface Ad {
  id: string;
  type: AdType;
  format: AdFormat;
  status?: AdStatus;
  content: AdContent;
  targeting?: AdTargeting;
  performance?: AdPerformance;
  createdAt: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}

export interface AdPlacement {
  id: string;
  name: string;
  size: AdSize;
  allowedFormats: AdFormat[];
  targeting?: AdTargeting;
}

export interface AdRequest {
  placementId: string;
  size?: AdSize;
  targeting?: AdTargeting;
  context?: {
    url?: string;
    referrer?: string;
    userAgent?: string;
    keywords?: string[];
    content?: string;
  };
}

export interface AdResponse {
  success: boolean;
  ad?: Ad;
  error?: {
    code: string;
    message: string;
  };
  requestId: string;
  timestamp: Date;
}

export interface AdEvent {
  type: 'impression' | 'click' | 'conversion' | 'error';
  adId: string;
  placementId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface AdTheme {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
}

export interface AdCallbacks {
  onAdLoad?: (ad: Ad) => void;
  onAdError?: (error: Error) => void;
  onAdClick?: (ad: Ad) => void;
  onAdImpression?: (ad: Ad) => void;
  onAdConversion?: (ad: Ad) => void;
}

export interface AdComponentProps extends AdCallbacks {
  placementId: string;
  size?: AdSize;
  className?: string;
  responsive?: boolean;
  theme?: AdTheme;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
  showFallback?: boolean;
  fallbackComponent?: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
}