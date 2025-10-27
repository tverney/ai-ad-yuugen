import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AiAd YuugenService } from '../ai-yuugen.service';
import { SDKConfig, AdPlacement, AdType, AdFormat, AdPosition } from '@ai-yuugen/types';

describe('AiAd YuugenService', () => {
  let service: AiAd YuugenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiAd YuugenService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AiAd YuugenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start uninitialized', () => {
    expect(service.isInitialized()).toBe(false);
    expect(service.getConfig()).toBeNull();
  });

  it('should initialize successfully with valid config', async () => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development',
      debugMode: true
    };

    spyOn(console, 'log');

    await service.initialize(config);

    expect(service.isInitialized()).toBe(true);
    expect(service.getConfig()).toEqual(config);
    expect(console.log).toHaveBeenCalledWith('AI Ad Yuugen SDK initialized successfully', config);
  });

  it('should emit initialized state changes', (done) => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development'
    };

    let emissionCount = 0;
    service.initialized$.subscribe(initialized => {
      emissionCount++;
      if (emissionCount === 1) {
        expect(initialized).toBe(false); // Initial state
      } else if (emissionCount === 2) {
        expect(initialized).toBe(true); // After initialization
        done();
      }
    });

    service.initialize(config);
  });

  it('should handle initialization errors', async () => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development'
    };

    // Mock a failure scenario
    spyOn(console, 'error');
    spyOn(window, 'setTimeout').and.callFake((callback: Function) => {
      throw new Error('Initialization failed');
    });

    try {
      await service.initialize(config);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toEqual(new Error('Initialization failed'));
      expect(console.error).toHaveBeenCalledWith('Failed to initialize AI Ad Yuugen SDK:', jasmine.any(Error));
    }
  });

  it('should request ads successfully when initialized', async () => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development',
      debugMode: true
    };

    const placement: AdPlacement = {
      id: 'test-placement',
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      size: { width: 728, height: 90 },
      position: AdPosition.TOP
    };

    await service.initialize(config);
    spyOn(console, 'log');

    const ad = await service.requestAd(placement);

    expect(ad).toBeDefined();
    expect(ad.id).toContain('banner-test-placement');
    expect(ad.type).toBe(AdType.BANNER);
    expect(ad.format).toBe(AdFormat.DISPLAY);
    expect(ad.content).toBeDefined();
    expect(console.log).toHaveBeenCalledWith('Ad requested successfully:', ad);
  });

  it('should throw error when requesting ads without initialization', async () => {
    const placement: AdPlacement = {
      id: 'test-placement',
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      size: { width: 728, height: 90 },
      position: AdPosition.TOP
    };

    try {
      await service.requestAd(placement);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toEqual(new Error('AI Ad Yuugen SDK not initialized. Call initialize() first.'));
    }
  });

  it('should generate different mock content for different ad types', async () => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development'
    };

    await service.initialize(config);

    const bannerPlacement: AdPlacement = {
      id: 'banner-placement',
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      size: { width: 728, height: 90 },
      position: AdPosition.TOP
    };

    const nativePlacement: AdPlacement = {
      id: 'native-placement',
      type: AdType.NATIVE,
      format: AdFormat.DISPLAY,
      size: { width: 300, height: 250 },
      position: AdPosition.INLINE
    };

    const bannerAd = await service.requestAd(bannerPlacement);
    const nativeAd = await service.requestAd(nativePlacement);

    expect(bannerAd.content.title).toBe('Sample Banner Ad');
    expect(nativeAd.content.title).toBe('Discover Amazing AI Tools');
    expect(bannerAd.content.brandName).toBe('Sample Brand');
    expect(nativeAd.content.brandName).toBe('TechCorp Solutions');
  });

  it('should track events when initialized', () => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development',
      debugMode: true
    };

    service.initialize(config);
    spyOn(console, 'log');

    const event = {
      id: 'event-1',
      type: 'click',
      adId: 'ad-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      context: {}
    };

    service.trackEvent(event);

    expect(console.log).toHaveBeenCalledWith('Ad event tracked:', event);
  });

  it('should warn when tracking events without initialization', () => {
    spyOn(console, 'warn');

    const event = {
      id: 'event-1',
      type: 'click',
      adId: 'ad-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      context: {}
    };

    service.trackEvent(event);

    expect(console.warn).toHaveBeenCalledWith('Cannot track event: AI Ad Yuugen SDK not initialized');
  });

  it('should return performance metrics when initialized', async () => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development'
    };

    await service.initialize(config);

    const metrics = await service.getPerformanceMetrics();

    expect(metrics).toBeDefined();
    expect(typeof metrics.impressions).toBe('number');
    expect(typeof metrics.clicks).toBe('number');
    expect(typeof metrics.conversions).toBe('number');
    expect(typeof metrics.ctr).toBe('number');
    expect(typeof metrics.cpm).toBe('number');
    expect(typeof metrics.revenue).toBe('number');
    expect(typeof metrics.engagementScore).toBe('number');
  });

  it('should throw error when getting metrics without initialization', async () => {
    try {
      await service.getPerformanceMetrics();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toEqual(new Error('AI Ad Yuugen SDK not initialized'));
    }
  });

  it('should destroy service and clean up resources', () => {
    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development'
    };

    service.initialize(config);
    expect(service.isInitialized()).toBe(true);

    service.destroy();

    expect(service.isInitialized()).toBe(false);
    expect(service.getConfig()).toBeNull();
  });

  it('should handle server-side rendering', () => {
    // Create service with server platform
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AiAd YuugenService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });

    const serverService = TestBed.inject(AiAd YuugenService);
    spyOn(console, 'warn');

    const config: SDKConfig = {
      apiKey: 'test-api-key',
      environment: 'development'
    };

    serverService.initialize(config);

    expect(console.warn).toHaveBeenCalledWith('AI Ad Yuugen SDK can only be initialized in browser environment');
  });

  it('should handle ad request errors in server environment', async () => {
    // Create service with server platform
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AiAd YuugenService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });

    const serverService = TestBed.inject(AiAd YuugenService);
    
    // Force initialization state for testing
    (serverService as any).initialized.next(true);

    const placement: AdPlacement = {
      id: 'test-placement',
      type: AdType.BANNER,
      format: AdFormat.DISPLAY,
      size: { width: 728, height: 90 },
      position: AdPosition.TOP
    };

    try {
      await serverService.requestAd(placement);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toEqual(new Error('Ad requests can only be made in browser environment'));
    }
  });
});