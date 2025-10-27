import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  DeveloperAccount,
  SDKConfiguration,
  Campaign,
  AdInventory,
  AnalyticsData,
  DashboardMetrics,
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: DeveloperAccount }>> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser(): Promise<ApiResponse<DeveloperAccount>> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Dashboard
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    const response = await this.client.get('/dashboard/metrics');
    return response.data;
  }

  // SDK Configuration
  async getSDKConfigurations(): Promise<ApiResponse<SDKConfiguration[]>> {
    const response = await this.client.get('/sdk/configurations');
    return response.data;
  }

  async getSDKConfiguration(id: string): Promise<ApiResponse<SDKConfiguration>> {
    const response = await this.client.get(`/sdk/configurations/${id}`);
    return response.data;
  }

  async createSDKConfiguration(config: Partial<SDKConfiguration>): Promise<ApiResponse<SDKConfiguration>> {
    const response = await this.client.post('/sdk/configurations', config);
    return response.data;
  }

  async updateSDKConfiguration(id: string, config: Partial<SDKConfiguration>): Promise<ApiResponse<SDKConfiguration>> {
    const response = await this.client.put(`/sdk/configurations/${id}`, config);
    return response.data;
  }

  async deleteSDKConfiguration(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/sdk/configurations/${id}`);
    return response.data;
  }

  // Campaigns
  async getCampaigns(): Promise<ApiResponse<Campaign[]>> {
    const response = await this.client.get('/campaigns');
    return response.data;
  }

  async getCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.get(`/campaigns/${id}`);
    return response.data;
  }

  async createCampaign(campaign: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post('/campaigns', campaign);
    return response.data;
  }

  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const response = await this.client.put(`/campaigns/${id}`, campaign);
    return response.data;
  }

  async deleteCampaign(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/campaigns/${id}`);
    return response.data;
  }

  async pauseCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post(`/campaigns/${id}/pause`);
    return response.data;
  }

  async resumeCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post(`/campaigns/${id}/resume`);
    return response.data;
  }

  // Ad Inventory
  async getAdInventory(): Promise<ApiResponse<AdInventory[]>> {
    const response = await this.client.get('/inventory');
    return response.data;
  }

  async getAdInventoryItem(id: string): Promise<ApiResponse<AdInventory>> {
    const response = await this.client.get(`/inventory/${id}`);
    return response.data;
  }

  async createAdInventoryItem(ad: Partial<AdInventory>): Promise<ApiResponse<AdInventory>> {
    const response = await this.client.post('/inventory', ad);
    return response.data;
  }

  async updateAdInventoryItem(id: string, ad: Partial<AdInventory>): Promise<ApiResponse<AdInventory>> {
    const response = await this.client.put(`/inventory/${id}`, ad);
    return response.data;
  }

  async deleteAdInventoryItem(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/inventory/${id}`);
    return response.data;
  }

  // Analytics
  async getAnalytics(params: {
    startDate: string;
    endDate: string;
    campaignId?: string;
    adFormat?: string;
  }): Promise<ApiResponse<AnalyticsData>> {
    const response = await this.client.get('/analytics', { params });
    return response.data;
  }

  async getRealtimeMetrics(): Promise<ApiResponse<{
    activeUsers: number;
    impressionsPerMinute: number;
    clicksPerMinute: number;
    revenuePerMinute: number;
  }>> {
    const response = await this.client.get('/analytics/realtime');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default ApiClient;