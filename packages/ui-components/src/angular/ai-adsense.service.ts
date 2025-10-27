import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Ad, AdPlacement, AIContext, SDKConfig, PerformanceMetrics, AdEvent } from '@ai-yuugen/types';

/**
 * Angular service for AI Ad Yuugen SDK integration
 * Provides reactive state management and dependency injection for ad operations
 */
@Injectable({
  providedIn: 'root'
})
export class AiAd YuugenService {
  private initialized = new BehaviorSubject<boolean>(false);
  private config: SDKConfig | null = null;
  private isBrowser: boolean;

  // Observable streams for reactive state management
  public readonly initialized$ = this.initialized.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Initialize the AI Ad Yuugen SDK
   */
  async initialize(config: SDKConfig): Promise<void> {
    if (!this.isBrowser) {
      console.warn('AI Ad Yuugen SDK can only be initialized in browser environment');
      return;
    }

    try {
      this.config = config;
      
      // Simulate SDK initialization
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.initialized.next(true);
      
      if (config.debugMode) {
        console.log('AI Ad Yuugen SDK initialized successfully', config);
      }
    } catch (error) {
      console.error('Failed to initialize AI Ad Yuugen SDK:', error);
      throw error;
    }
  }

  /**
   * Request an ad for a specific placement
   */
  async requestAd(placement: AdPlacement, _context?: AIContext): Promise<Ad> {
    if (!this.initialized.value) {
      throw new Error('AI Ad Yuugen SDK not initialized. Call initialize() first.');
    }

    if (!this.isBrowser) {
      throw new Error('Ad requests can only be made in browser environment');
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      // Mock ad response based on placement type
      const mockAd: Ad = {
        id: `${placement.type}-${placement.id}-${Date.now()}`,
        type: placement.type,
        format: placement.format,
        content: this.generateMockAdContent(placement.type),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      if (this.config?.debugMode) {
        console.log('Ad requested successfully:', mockAd);
      }

      return mockAd;
    } catch (error) {
      console.error('Failed to request ad:', error);
      throw error;
    }
  }

  /**
   * Track an ad event
   */
  trackEvent(event: AdEvent): void {
    if (!this.initialized.value) {
      console.warn('Cannot track event: AI Ad Yuugen SDK not initialized');
      return;
    }

    if (!this.isBrowser) {
      return;
    }

    if (this.config?.debugMode) {
      console.log('Ad event tracked:', event);
    }

    // In a real implementation, this would send the event to analytics
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    if (!this.initialized.value) {
      throw new Error('AI Ad Yuugen SDK not initialized');
    }

    // Mock performance metrics
    return {
      impressions: Math.floor(Math.random() * 10000),
      clicks: Math.floor(Math.random() * 500),
      conversions: Math.floor(Math.random() * 50),
      ctr: Math.random() * 0.1,
      cpm: Math.random() * 5 + 1,
      revenue: Math.random() * 1000,
      engagementScore: Math.random(),
    };
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized.value;
  }

  /**
   * Get current configuration
   */
  getConfig(): SDKConfig | null {
    return this.config;
  }

  /**
   * Destroy the service and clean up resources
   */
  destroy(): void {
    this.initialized.next(false);
    this.config = null;
  }

  private generateMockAdContent(adType: string): any {
    const contents = {
      banner: {
        title: 'Sample Banner Ad',
        description: 'This is a sample banner advertisement',
        imageUrl: 'https://via.placeholder.com/728x90/007bff/ffffff?text=Banner+Ad',
        ctaText: 'Learn More',
        landingUrl: 'https://example.com',
        brandName: 'Sample Brand',
      },
      interstitial: {
        title: 'Special Offer!',
        description: 'Don\'t miss out on this amazing opportunity. Limited time offer available now.',
        imageUrl: 'https://via.placeholder.com/600x400/007bff/ffffff?text=Interstitial+Ad',
        ctaText: 'Get Started',
        landingUrl: 'https://example.com',
        brandName: 'Premium Brand',
      },
      native: {
        title: 'Discover Amazing AI Tools',
        description: 'Boost your productivity with cutting-edge AI solutions. Join thousands of satisfied users.',
        imageUrl: 'https://via.placeholder.com/400x225/28a745/ffffff?text=Native+Ad',
        ctaText: 'Learn More',
        landingUrl: 'https://example.com',
        brandName: 'TechCorp Solutions',
      },
    };

    return contents[adType as keyof typeof contents] || contents.banner;
  }
}