import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import App from '../App';

// Mock the API client
vi.mock('../services/api', () => ({
  apiClient: {
    getDashboardMetrics: vi.fn().mockResolvedValue({ success: true, data: {} }),
    getAnalytics: vi.fn().mockResolvedValue({ success: true, data: {} }),
    getRealtimeMetrics: vi.fn().mockResolvedValue({ success: true, data: {} }),
    getSDKConfigurations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getCampaigns: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getAdInventory: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('Developer Portal Integration Tests', () => {
  it('should render the application', () => {
    renderApp();
    
    expect(screen.getByText('AI Ad Yuugen Portal')).toBeInTheDocument();
  });

  it('should have navigation menu', () => {
    renderApp();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('SDK Configuration')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Ad Inventory')).toBeInTheDocument();
  });
});