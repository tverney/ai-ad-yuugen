/**
 * Signal-related types for ADCP Signals Activation Protocol
 */

export interface Signal {
  id: string;
  name: string;
  description: string;
  provider: SignalProvider;
  category: SignalCategory;
  cpm: number;
  reach: number;
  confidence: number;
  metadata: SignalMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignalMetadata {
  topics?: string[];
  intents?: string[];
  demographics?: Demographics;
  geography?: Geography;
  dataFreshness?: number;
  dataSource?: string;
}

export interface Demographics {
  ageRange?: { min: number; max: number };
  gender?: string[];
  income?: { min: number; max: number };
  education?: string[];
  interests?: string[];
}

export interface Geography {
  countries?: string[];
  regions?: string[];
  cities?: string[];
  postalCodes?: string[];
}

export interface SignalQuery {
  text?: string;
  categories?: SignalCategory[];
  providers?: SignalProvider[];
  priceRange?: PriceRange;
  minReach?: number;
  maxReach?: number;
  geography?: Geography;
  limit?: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ActivationConfig {
  budget: number;
  duration: Duration;
  targeting?: TargetingConfig;
}

export interface Duration {
  days?: number;
  hours?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface TargetingConfig {
  demographics?: Demographics;
  geography?: Geography;
  frequency?: FrequencyConfig;
}

export interface FrequencyConfig {
  maxImpressions?: number;
  maxImpressionsPerUser?: number;
  timePeriod?: string;
}

export interface Activation {
  id: string;
  signalId: string;
  status: ActivationStatus;
  cost: number;
  reach: number;
  performance?: ActivationPerformance;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface ActivationPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpa: number;
}

export enum ActivationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum SignalProvider {
  SCOPE3 = 'scope3',
  LIVERAMP = 'liveramp',
  NIELSEN = 'nielsen',
  COMSCORE = 'comscore'
}

export enum SignalCategory {
  DEMOGRAPHIC = 'demographic',
  BEHAVIORAL = 'behavioral',
  CONTEXTUAL = 'contextual',
  GEOGRAPHIC = 'geographic',
  TEMPORAL = 'temporal'
}

export interface ScoredSignal extends Signal {
  scores: {
    relevance: number;
    quality: number;
    costEfficiency: number;
    reach: number;
    total: number;
  };
  selected?: boolean;
  activationId?: string;
}
