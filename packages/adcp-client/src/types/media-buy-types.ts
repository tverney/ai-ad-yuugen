/**
 * Media Buy Protocol types
 */

import { TargetingConfig, Duration } from './signal-types';

export interface MediaBuyRequest {
  budget: number;
  duration: Duration;
  targeting: TargetingConfig;
  platforms: string[];
  baseBid: number;
  optimization?: OptimizationConfig;
}

export interface OptimizationConfig {
  goal: OptimizationGoal;
  constraints?: OptimizationConstraints;
  strategy?: OptimizationStrategy;
}

export enum OptimizationGoal {
  MAXIMIZE_REACH = 'maximize_reach',
  MAXIMIZE_CLICKS = 'maximize_clicks',
  MAXIMIZE_CONVERSIONS = 'maximize_conversions',
  MINIMIZE_CPA = 'minimize_cpa',
  MAXIMIZE_ROAS = 'maximize_roas'
}

export interface OptimizationConstraints {
  maxCPM?: number;
  maxCPC?: number;
  maxCPA?: number;
  minReach?: number;
}

export enum OptimizationStrategy {
  AGGRESSIVE = 'aggressive',
  BALANCED = 'balanced',
  CONSERVATIVE = 'conservative'
}

export interface MediaBuyResponse {
  buyId: string;
  status: BuyStatus;
  cost: number;
  impressions: number;
  deliveryTimeline: Date[];
  platforms: PlatformBuy[];
}

export interface PlatformBuy {
  platform: string;
  buyId: string;
  status: BuyStatus;
  cost: number;
  impressions: number;
}

export enum BuyStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface CampaignStatus {
  campaignId: string;
  status: BuyStatus;
  performance: PerformanceMetrics;
  budget: BudgetStatus;
  updatedAt: Date;
}

export interface BudgetStatus {
  total: number;
  spent: number;
  remaining: number;
  pacing: number;
}
