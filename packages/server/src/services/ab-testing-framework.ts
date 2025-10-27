import { PerformanceMetrics } from '@ai-yuugen/types';

/**
 * A/B test variant
 */
export enum ABTestVariant {
  CONTROL = 'control', // Standard targeting
  TREATMENT = 'treatment', // ADCP-enhanced targeting
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  /** Test name/identifier */
  name: string;
  /** Description of the test */
  description?: string;
  /** Traffic split percentage for treatment group (0-100) */
  treatmentPercentage: number;
  /** Minimum sample size per variant */
  minSampleSize?: number;
  /** Statistical significance threshold (p-value) */
  significanceThreshold?: number;
  /** Test start date */
  startDate: Date;
  /** Test end date */
  endDate?: Date;
  /** Whether the test is active */
  active: boolean;
}

/**
 * A/B test assignment
 */
export interface ABTestAssignment {
  /** Session or user ID */
  id: string;
  /** Assigned variant */
  variant: ABTestVariant;
  /** Assignment timestamp */
  assignedAt: Date;
}

/**
 * A/B test metrics for a variant
 */
export interface ABTestVariantMetrics extends PerformanceMetrics {
  /** Number of requests */
  requests: number;
  /** Average response time in ms */
  avgResponseTime: number;
  /** Error rate (0-1) */
  errorRate: number;
}

/**
 * A/B test results
 */
export interface ABTestResults {
  /** Test configuration */
  config: ABTestConfig;
  /** Control group metrics */
  control: ABTestVariantMetrics;
  /** Treatment group metrics */
  treatment: ABTestVariantMetrics;
  /** Statistical analysis */
  analysis: {
    /** Sample size for control */
    controlSampleSize: number;
    /** Sample size for treatment */
    treatmentSampleSize: number;
    /** CTR lift (percentage) */
    ctrLift: number;
    /** CPA improvement (percentage) */
    cpaImprovement: number;
    /** Conversion lift (percentage) */
    conversionLift: number;
    /** Statistical significance (p-value) */
    pValue: number;
    /** Whether results are statistically significant */
    isSignificant: boolean;
    /** Confidence interval (95%) */
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  };
  /** Test status */
  status: 'running' | 'completed' | 'stopped';
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * A/B testing framework for comparing ADCP vs standard targeting
 */
export class ABTestingFramework {
  private config: ABTestConfig;
  private assignments: Map<string, ABTestAssignment> = new Map();
  private controlMetrics: Map<string, any> = new Map();
  private treatmentMetrics: Map<string, any> = new Map();

  constructor(config: ABTestConfig) {
    this.config = config;
  }

  /**
   * Assign a user/session to a test variant
   * Uses consistent hashing to ensure same ID always gets same variant
   */
  assignVariant(id: string): ABTestAssignment {
    // Check if already assigned
    const existing = this.assignments.get(id);
    if (existing) {
      return existing;
    }

    // Use hash-based assignment for consistency
    const hash = this.hashString(id);
    const percentage = (hash % 100) + 1;

    const variant =
      percentage <= this.config.treatmentPercentage
        ? ABTestVariant.TREATMENT
        : ABTestVariant.CONTROL;

    const assignment: ABTestAssignment = {
      id,
      variant,
      assignedAt: new Date(),
    };

    this.assignments.set(id, assignment);
    return assignment;
  }

  /**
   * Get variant for a user/session
   */
  getVariant(id: string): ABTestVariant {
    const assignment = this.assignVariant(id);
    return assignment.variant;
  }

  /**
   * Check if user/session is in treatment group
   */
  isInTreatment(id: string): boolean {
    return this.getVariant(id) === ABTestVariant.TREATMENT;
  }

  /**
   * Track performance metrics for a variant
   */
  trackMetrics(
    id: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      revenue?: number;
      responseTime?: number;
      error?: boolean;
    }
  ): void {
    const variant = this.getVariant(id);
    const metricsMap =
      variant === ABTestVariant.CONTROL ? this.controlMetrics : this.treatmentMetrics;

    const existing = metricsMap.get(id) || {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      responseTimes: [],
      errors: 0,
      requests: 0,
    };

    // Update metrics
    if (metrics.impressions) existing.impressions += metrics.impressions;
    if (metrics.clicks) existing.clicks += metrics.clicks;
    if (metrics.conversions) existing.conversions += metrics.conversions;
    if (metrics.revenue) existing.revenue += metrics.revenue;
    if (metrics.responseTime) existing.responseTimes.push(metrics.responseTime);
    if (metrics.error) existing.errors++;
    existing.requests++;

    metricsMap.set(id, existing);
  }

  /**
   * Calculate aggregate metrics for a variant
   */
  private calculateVariantMetrics(metricsMap: Map<string, any>): ABTestVariantMetrics {
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let totalRequests = 0;
    let totalErrors = 0;
    const allResponseTimes: number[] = [];

    for (const metrics of metricsMap.values()) {
      totalImpressions += metrics.impressions;
      totalClicks += metrics.clicks;
      totalConversions += metrics.conversions;
      totalRevenue += metrics.revenue;
      totalRequests += metrics.requests;
      totalErrors += metrics.errors;
      allResponseTimes.push(...metrics.responseTimes);
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpm = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0;
    const avgResponseTime =
      allResponseTimes.length > 0
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
        : 0;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr,
      cpm,
      revenue: totalRevenue,
      engagementScore: ctr / 100, // Simplified engagement score
      requests: totalRequests,
      avgResponseTime,
      errorRate,
    };
  }

  /**
   * Get current test results with statistical analysis
   */
  getResults(): ABTestResults {
    const control = this.calculateVariantMetrics(this.controlMetrics);
    const treatment = this.calculateVariantMetrics(this.treatmentMetrics);

    // Calculate lifts
    const ctrLift = control.ctr > 0 ? ((treatment.ctr - control.ctr) / control.ctr) * 100 : 0;
    const cpaControl = control.conversions > 0 ? control.revenue / control.conversions : 0;
    const cpaTreatment = treatment.conversions > 0 ? treatment.revenue / treatment.conversions : 0;
    const cpaImprovement =
      cpaControl > 0 ? ((cpaControl - cpaTreatment) / cpaControl) * 100 : 0;
    const conversionLift =
      control.conversions > 0
        ? ((treatment.conversions - control.conversions) / control.conversions) * 100
        : 0;

    // Calculate statistical significance using two-proportion z-test
    const { pValue, confidenceInterval } = this.calculateSignificance(control, treatment);
    const isSignificant = pValue < (this.config.significanceThreshold ?? 0.05);

    // Determine test status
    let status: 'running' | 'completed' | 'stopped' = 'running';
    if (!this.config.active) {
      status = 'stopped';
    } else if (this.config.endDate && new Date() > this.config.endDate) {
      status = 'completed';
    }

    return {
      config: this.config,
      control,
      treatment,
      analysis: {
        controlSampleSize: control.requests,
        treatmentSampleSize: treatment.requests,
        ctrLift,
        cpaImprovement,
        conversionLift,
        pValue,
        isSignificant,
        confidenceInterval,
      },
      status,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate statistical significance using two-proportion z-test
   */
  private calculateSignificance(
    control: ABTestVariantMetrics,
    treatment: ABTestVariantMetrics
  ): {
    pValue: number;
    confidenceInterval: { lower: number; upper: number };
  } {
    // Use CTR for significance testing
    const p1 = control.ctr / 100;
    const p2 = treatment.ctr / 100;
    const n1 = control.impressions;
    const n2 = treatment.impressions;

    if (n1 === 0 || n2 === 0) {
      return {
        pValue: 1,
        confidenceInterval: { lower: 0, upper: 0 },
      };
    }

    // Pooled proportion
    const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);

    // Standard error
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

    // Z-score
    const z = se > 0 ? (p2 - p1) / se : 0;

    // P-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    // 95% confidence interval for difference
    const seDiff = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
    const diff = p2 - p1;
    const margin = 1.96 * seDiff; // 1.96 for 95% CI

    return {
      pValue,
      confidenceInterval: {
        lower: (diff - margin) * 100,
        upper: (diff + margin) * 100,
      },
    };
  }

  /**
   * Cumulative distribution function for standard normal distribution
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Simple string hash function for consistent variant assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update test configuration
   */
  updateConfig(config: Partial<ABTestConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current test configuration
   */
  getConfig(): ABTestConfig {
    return { ...this.config };
  }

  /**
   * Reset test data
   */
  reset(): void {
    this.assignments.clear();
    this.controlMetrics.clear();
    this.treatmentMetrics.clear();
  }

  /**
   * Export test data for analysis
   */
  exportData(): {
    assignments: ABTestAssignment[];
    controlMetrics: any[];
    treatmentMetrics: any[];
  } {
    return {
      assignments: Array.from(this.assignments.values()),
      controlMetrics: Array.from(this.controlMetrics.entries()).map(([id, metrics]) => ({
        id,
        ...metrics,
      })),
      treatmentMetrics: Array.from(this.treatmentMetrics.entries()).map(([id, metrics]) => ({
        id,
        ...metrics,
      })),
    };
  }
}
