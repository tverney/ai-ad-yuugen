import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {  AreaChart, Area,  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

// Mock Dashboard Components
const MetricCard = ({ title, value, change, icon }: any) => (
  <div style={{ 
    background: 'white', 
    borderRadius: '0.5rem', 
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
          {value}
        </div>
        {change && (
          <div style={{ 
            fontSize: '0.875rem', 
            color: change > 0 ? '#10b981' : '#ef4444',
            fontWeight: '500'
          }}>
            {change > 0 ? '↗' : '↘'} {Math.abs(change)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '2rem', opacity: 0.6 }}>{icon}</div>
    </div>
  </div>
);

const RealtimeMetrics = ({ data }: any) => (
  <div style={{ 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    marginBottom: '2rem'
  }}>
    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
      Real-time Metrics
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.activeUsers}</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Active Users</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.impressionsPerMinute}</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Impressions/min</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.clicksPerMinute}</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Clicks/min</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>${data.revenuePerMinute}</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Revenue/min</div>
      </div>
    </div>
  </div>
);

const ChartContainer = ({ title, children }: any) => (
  <div style={{ 
    background: 'white', 
    borderRadius: '0.5rem', 
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  }}>
    <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.125rem', fontWeight: '600' }}>
      {title}
    </h3>
    {children}
  </div>
);

// Sample data
const revenueData = [
  { date: '2024-01-15', revenue: 1800, impressions: 180000, clicks: 3600 },
  { date: '2024-01-16', revenue: 1750, impressions: 175000, clicks: 3500 },
  { date: '2024-01-17', revenue: 1900, impressions: 190000, clicks: 3800 },
  { date: '2024-01-18', revenue: 1850, impressions: 185000, clicks: 3700 },
  { date: '2024-01-19', revenue: 2000, impressions: 200000, clicks: 4000 },
  { date: '2024-01-20', revenue: 1950, impressions: 195000, clicks: 3900 },
  { date: '2024-01-21', revenue: 2050, impressions: 205000, clicks: 4100 },
];

const adFormatData = [
  { format: 'Banner', revenue: 5000, fill: '#3b82f6' },
  { format: 'Native', revenue: 4000, fill: '#10b981' },
  { format: 'Interstitial', revenue: 3500, fill: '#f59e0b' },
];

const realtimeData = {
  activeUsers: 142,
  impressionsPerMinute: 1180,
  clicksPerMinute: 24,
  revenuePerMinute: '12.50'
};

const meta: Meta = {
  title: 'AI Ad Yuugen/Dashboard Components',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Dashboard components for the AI Ad Yuugen developer portal showing analytics and metrics.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const MetricCards: StoryObj = {
  render: () => (
    <div style={{ padding: '2rem', background: '#f9fafb' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <MetricCard
          title="Total Revenue"
          value="$12,500.50"
          change={12.5}
          icon="💰"
        />
        <MetricCard
          title="Total Impressions"
          value="1.25M"
          change={8.3}
          icon="👁️"
        />
        <MetricCard
          title="Total Clicks"
          value="25,000"
          change={-2.1}
          icon="👆"
        />
        <MetricCard
          title="Average CTR"
          value="2.00%"
          change={5.7}
          icon="📊"
        />
      </div>
    </div>
  ),
};

export const RealtimeDashboard: StoryObj = {
  render: () => (
    <div style={{ padding: '2rem', background: '#f9fafb' }}>
      <RealtimeMetrics data={realtimeData} />
    </div>
  ),
};

export const RevenueChart: StoryObj = {
  render: () => (
    <div style={{ padding: '2rem', background: '#f9fafb' }}>
      <ChartContainer title="Revenue Trend (Last 7 Days)">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
            />
            <YAxis tickFormatter={(value) => `$${value}`} />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
              formatter={(value: number) => [`$${value}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  ),
};

export const AdFormatBreakdown: StoryObj = {
  render: () => (
    <div style={{ padding: '2rem', background: '#f9fafb' }}>
      <ChartContainer title="Revenue by Ad Format">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={adFormatData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ format, revenue }) => `${format}: $${revenue}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="revenue"
            >
              {adFormatData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value}`} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  ),
};