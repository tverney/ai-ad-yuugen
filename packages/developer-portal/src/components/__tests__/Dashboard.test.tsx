import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, expect } from 'vitest';
import { Dashboard } from '../Dashboard';

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    getDashboardMetrics: vi.fn().mockResolvedValue({
      success: true,
      data: {
        totalRevenue: 12500.50,
        totalImpressions: 1250000,
        totalClicks: 25000,
        averageCTR: 0.02,
        averageCPM: 2.50,
        activeCampaigns: 5,
        recentActivity: [],
      },
    }),
    getAnalytics: vi.fn().mockResolvedValue({
      success: true,
      data: {
        timeRange: { start: new Date(), end: new Date() },
        metrics: {
          impressions: 1250000,
          clicks: 25000,
          conversions: 500,
          revenue: 12500.50,
          ctr: 0.02,
          cpm: 2.50,
          cpc: 0.50,
          conversionRate: 0.02,
        },
        breakdown: {
          byDate: [],
          byAdFormat: [],
          byPlatform: [],
        },
      },
    }),
    getRealtimeMetrics: vi.fn().mockResolvedValue({
      success: true,
      data: {
        activeUsers: 150,
        impressionsPerMinute: 1200,
        clicksPerMinute: 24,
        revenuePerMinute: 12.50,
      },
    }),
  },
}));

describe('Dashboard Component', () => {
  it('should render dashboard component', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render time range selector', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('90 Days')).toBeInTheDocument();
  });
});