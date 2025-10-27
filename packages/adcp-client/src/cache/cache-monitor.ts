/**
 * Cache monitoring and metrics collection
 */

import { CacheStats } from '../types/adcp-types';
import { Logger } from '../utils/logger';

export interface CacheMetrics {
	hits: number;
	misses: number;
	hitRatio: number;
	size: number;
	evictions: number;
	avgLatency: number;
	p95Latency: number;
	p99Latency: number;
	errorCount: number;
	lastError?: string;
	timestamp: Date;
}

export interface CacheMonitorConfig {
	reportInterval?: number; // Interval for logging stats (ms)
	alertThresholds?: {
		hitRatio?: number; // Alert if hit ratio falls below this
		errorRate?: number; // Alert if error rate exceeds this
		latency?: number; // Alert if p95 latency exceeds this (ms)
	};
}

/**
 * Cache monitor for tracking performance and health
 */
export class CacheMonitor {
	private latencies: number[] = [];
	private errorCount = 0;
	private lastError?: string;
	private reportTimer?: NodeJS.Timeout;
	private readonly maxLatencySamples = 1000;

	constructor(private logger: Logger, private config: CacheMonitorConfig = {}) {
		if (config.reportInterval) {
			this.startPeriodicReporting(config.reportInterval);
		}
	}

	/**
	 * Record cache operation latency
	 */
	recordLatency(latencyMs: number): void {
		this.latencies.push(latencyMs);

		// Keep only recent samples
		if (this.latencies.length > this.maxLatencySamples) {
			this.latencies.shift();
		}
	}

	/**
	 * Record cache error
	 */
	recordError(error: Error | string): void {
		this.errorCount++;
		this.lastError = error instanceof Error ? error.message : error;

		this.logger.error('Cache error recorded', {
			error: this.lastError,
			totalErrors: this.errorCount,
		});
	}

	/**
	 * Get current cache metrics
	 */
	getMetrics(baseStats: CacheStats): CacheMetrics {
		const avgLatency = this.calculateAvgLatency();
		const p95Latency = this.calculatePercentile(95);
		const p99Latency = this.calculatePercentile(99);

		return {
			...baseStats,
			avgLatency,
			p95Latency,
			p99Latency,
			errorCount: this.errorCount,
			lastError: this.lastError,
			timestamp: new Date(),
		};
	}

	/**
	 * Check if metrics exceed alert thresholds
	 */
	checkAlerts(metrics: CacheMetrics): string[] {
		const alerts: string[] = [];
		const thresholds = this.config.alertThresholds;

		if (!thresholds) {
			return alerts;
		}

		// Check hit ratio
		if (
			thresholds.hitRatio !== undefined &&
			metrics.hitRatio < thresholds.hitRatio
		) {
			alerts.push(
				`Cache hit ratio (${(metrics.hitRatio * 100).toFixed(
					1,
				)}%) below threshold (${(thresholds.hitRatio * 100).toFixed(1)}%)`,
			);
		}

		// Check error rate
		if (thresholds.errorRate !== undefined) {
			const total = metrics.hits + metrics.misses;
			const errorRate = total > 0 ? metrics.errorCount / total : 0;

			if (errorRate > thresholds.errorRate) {
				alerts.push(
					`Cache error rate (${(errorRate * 100).toFixed(
						1,
					)}%) exceeds threshold (${(thresholds.errorRate * 100).toFixed(1)}%)`,
				);
			}
		}

		// Check latency
		if (
			thresholds.latency !== undefined &&
			metrics.p95Latency > thresholds.latency
		) {
			alerts.push(
				`Cache p95 latency (${metrics.p95Latency.toFixed(
					1,
				)}ms) exceeds threshold (${thresholds.latency}ms)`,
			);
		}

		return alerts;
	}

	/**
	 * Reset monitoring metrics
	 */
	reset(): void {
		this.latencies = [];
		this.errorCount = 0;
		this.lastError = undefined;

		this.logger.info('Cache monitor metrics reset');
	}

	/**
	 * Start periodic reporting
	 */
	private startPeriodicReporting(intervalMs: number): void {
		this.reportTimer = setInterval(() => {
			this.logger.info('Cache monitor periodic report', {
				avgLatency: this.calculateAvgLatency(),
				p95Latency: this.calculatePercentile(95),
				p99Latency: this.calculatePercentile(99),
				errorCount: this.errorCount,
				sampleCount: this.latencies.length,
			});
		}, intervalMs);
	}

	/**
	 * Stop periodic reporting
	 */
	stopPeriodicReporting(): void {
		if (this.reportTimer) {
			clearInterval(this.reportTimer);
			this.reportTimer = undefined;
		}
	}

	/**
	 * Calculate average latency
	 */
	private calculateAvgLatency(): number {
		if (this.latencies.length === 0) {
			return 0;
		}

		const sum = this.latencies.reduce((acc, val) => acc + val, 0);
		return sum / this.latencies.length;
	}

	/**
	 * Calculate latency percentile
	 */
	private calculatePercentile(percentile: number): number {
		if (this.latencies.length === 0) {
			return 0;
		}

		const sorted = [...this.latencies].sort((a, b) => a - b);
		const index = Math.ceil((percentile / 100) * sorted.length) - 1;

		return sorted[Math.max(0, index)];
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.stopPeriodicReporting();
		this.reset();
	}
}

/**
 * Cache stats endpoint for exposing metrics
 */
export class CacheStatsEndpoint {
	constructor(
		private getBaseStats: () => Promise<CacheStats>,
		private monitor: CacheMonitor,
	) {}

	/**
	 * Get comprehensive cache statistics
	 */
	async getStats(): Promise<CacheMetrics> {
		const baseStats = await this.getBaseStats();
		return this.monitor.getMetrics(baseStats);
	}

	/**
	 * Get cache health status
	 */
	async getHealth(): Promise<{
		healthy: boolean;
		alerts: string[];
		metrics: CacheMetrics;
	}> {
		const metrics = await this.getStats();
		const alerts = this.monitor.checkAlerts(metrics);

		return {
			healthy: alerts.length === 0,
			alerts,
			metrics,
		};
	}

	/**
	 * Reset cache statistics
	 */
	reset(): void {
		this.monitor.reset();
	}
}
