const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// Mock data
const mockDashboardMetrics = {
  success: true,
  data: {
    totalRevenue: 12500.50,
    totalImpressions: 1250000,
    totalClicks: 25000,
    averageCTR: 0.02,
    averageCPM: 2.50,
    activeCampaigns: 5,
    recentActivity: [
      {
        id: '1',
        type: 'campaign_created',
        message: 'New campaign "Summer AI Promotion" created',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
      {
        id: '2',
        type: 'ad_approved',
        message: 'Ad "ChatGPT Integration Banner" approved',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        id: '3',
        type: 'payment_received',
        message: 'Payment of $1,250.00 received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
    ],
  },
};

const mockAnalytics = {
  success: true,
  data: {
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
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
      byDate: [
        { date: '2024-01-15', impressions: 180000, clicks: 3600, revenue: 1800 },
        { date: '2024-01-16', impressions: 175000, clicks: 3500, revenue: 1750 },
        { date: '2024-01-17', impressions: 190000, clicks: 3800, revenue: 1900 },
        { date: '2024-01-18', impressions: 185000, clicks: 3700, revenue: 1850 },
        { date: '2024-01-19', impressions: 200000, clicks: 4000, revenue: 2000 },
        { date: '2024-01-20', impressions: 195000, clicks: 3900, revenue: 1950 },
        { date: '2024-01-21', impressions: 205000, clicks: 4100, revenue: 2050 },
      ],
      byAdFormat: [
        { format: 'banner', impressions: 500000, clicks: 10000, revenue: 5000 },
        { format: 'native', impressions: 400000, clicks: 8000, revenue: 4000 },
        { format: 'interstitial', impressions: 350000, clicks: 7000, revenue: 3500 },
      ],
      byPlatform: [
        { platform: 'web', impressions: 700000, clicks: 14000, revenue: 7000 },
        { platform: 'mobile', impressions: 550000, clicks: 11000, revenue: 5500 },
      ],
    },
  },
};

const mockRealtimeMetrics = {
  success: true,
  data: {
    activeUsers: Math.floor(Math.random() * 50) + 100, // 100-150
    impressionsPerMinute: Math.floor(Math.random() * 200) + 1000, // 1000-1200
    clicksPerMinute: Math.floor(Math.random() * 10) + 20, // 20-30
    revenuePerMinute: Math.floor(Math.random() * 5) + 10, // 10-15
  },
};

const mockSDKConfigurations = {
  success: true,
  data: [
    {
      id: '1',
      name: 'Production Config',
      apiKey: 'pk_live_1234567890abcdef',
      environment: 'production',
      settings: {
        enableAnalytics: true,
        enableTargeting: true,
        privacyCompliance: { gdpr: true, ccpa: true, coppa: false },
        adFormats: { banner: true, interstitial: true, native: true },
        targeting: { contextual: true, behavioral: true, demographic: true },
      },
      domains: ['example.com', 'app.example.com'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Development Config',
      apiKey: 'pk_test_abcdef1234567890',
      environment: 'development',
      settings: {
        enableAnalytics: true,
        enableTargeting: false,
        privacyCompliance: { gdpr: true, ccpa: false, coppa: false },
        adFormats: { banner: true, interstitial: false, native: true },
        targeting: { contextual: true, behavioral: false, demographic: false },
      },
      domains: ['localhost:3000', 'dev.example.com'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
    },
  ],
};

const mockCampaigns = {
  success: true,
  data: [
    {
      id: '1',
      name: 'AI Assistant Promotion',
      status: 'active',
      budget: { total: 5000, spent: 1250, dailyLimit: 200 },
      targeting: {
        demographics: { ageRange: [25, 45], gender: 'all' },
        interests: ['AI', 'Technology', 'Productivity'],
        keywords: ['chatgpt', 'ai assistant', 'automation'],
        aiContexts: ['coding assistance', 'writing help', 'data analysis'],
      },
      schedule: {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        timezone: 'UTC',
      },
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: '2',
      name: 'Developer Tools Campaign',
      status: 'paused',
      budget: { total: 3000, spent: 750, dailyLimit: 100 },
      targeting: {
        demographics: { ageRange: [22, 40], gender: 'all' },
        interests: ['Software Development', 'Programming', 'DevOps'],
        keywords: ['api', 'sdk', 'integration'],
        aiContexts: ['code generation', 'debugging', 'documentation'],
      },
      schedule: {
        startDate: new Date('2024-01-10'),
        timezone: 'America/New_York',
      },
      createdAt: new Date('2024-01-09'),
      updatedAt: new Date('2024-01-18'),
    },
  ],
};

const mockInventory = {
  success: true,
  data: [
    {
      id: '1',
      name: 'AI Assistant Banner',
      type: 'banner',
      status: 'active',
      content: {
        title: 'Boost Your Productivity with AI',
        description: 'Discover the power of AI assistants for your daily tasks',
        ctaText: 'Try Now',
        landingUrl: 'https://example.com/ai-assistant',
        imageUrl: 'https://example.com/banner.jpg',
      },
      targeting: {
        keywords: ['productivity', 'ai', 'assistant'],
        categories: ['Technology', 'Business'],
        aiContexts: ['task automation', 'scheduling', 'email writing'],
      },
      performance: {
        impressions: 50000,
        clicks: 1000,
        conversions: 50,
        ctr: 0.02,
        cpm: 2.50,
        revenue: 125.00,
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: '2',
      name: 'Code Assistant Native Ad',
      type: 'native',
      status: 'active',
      content: {
        title: 'AI-Powered Code Completion',
        description: 'Write code faster with intelligent suggestions and auto-completion',
        ctaText: 'Get Started',
        landingUrl: 'https://example.com/code-assistant',
      },
      targeting: {
        keywords: ['coding', 'programming', 'development'],
        categories: ['Software', 'Development Tools'],
        aiContexts: ['code completion', 'bug fixing', 'refactoring'],
      },
      performance: {
        impressions: 30000,
        clicks: 900,
        conversions: 45,
        ctr: 0.03,
        cpm: 3.00,
        revenue: 90.00,
      },
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-19'),
    },
  ],
};

// API Routes
app.get('/api/dashboard/metrics', (req, res) => {
  res.json(mockDashboardMetrics);
});

app.get('/api/analytics', (req, res) => {
  res.json(mockAnalytics);
});

app.get('/api/analytics/realtime', (req, res) => {
  // Generate slightly different values each time for real-time effect
  const realtimeData = {
    ...mockRealtimeMetrics,
    data: {
      activeUsers: Math.floor(Math.random() * 50) + 100,
      impressionsPerMinute: Math.floor(Math.random() * 200) + 1000,
      clicksPerMinute: Math.floor(Math.random() * 10) + 20,
      revenuePerMinute: (Math.random() * 5 + 10).toFixed(2),
    },
  };
  res.json(realtimeData);
});

app.get('/api/sdk/configurations', (req, res) => {
  res.json(mockSDKConfigurations);
});

app.get('/api/campaigns', (req, res) => {
  res.json(mockCampaigns);
});

app.get('/api/inventory', (req, res) => {
  res.json(mockInventory);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Mock API server running at http://localhost:${port}`);
  console.log(`📊 Dashboard metrics: http://localhost:${port}/api/dashboard/metrics`);
  console.log(`📈 Analytics: http://localhost:${port}/api/analytics`);
  console.log(`⚡ Real-time metrics: http://localhost:${port}/api/analytics/realtime`);
});