import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { NgAdBanner } from '../NgAdBanner';
import { Ad } from '@ai-yuugen/types';

describe('NgAdBanner', () => {
  let component: NgAdBanner;
  let fixture: ComponentFixture<NgAdBanner>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    await TestBed.configureTestingModule({
      declarations: [NgAdBanner],
      providers: [
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgAdBanner);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.placementId = 'test-placement';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.placementId).toBe('test-placement');
    expect(component.size).toEqual({ width: 728, height: 90, responsive: true });
    expect(component.responsive).toBe(true);
    expect(component.showLoading).toBe(true);
    expect(component.showFallback).toBe(true);
    expect(component.ariaLabel).toBe('Advertisement');
    expect(component.testId).toBe('ad-banner');
  });

  it('should start in loading state', () => {
    expect(component.loading).toBe(true);
    expect(component.ad).toBeNull();
    expect(component.error).toBeNull();
  });

  it('should generate responsive container styles', () => {
    component.responsive = true;
    component.size = { width: 300, height: 250, responsive: true };
    
    const styles = component.containerStyles;
    
    expect(styles['width']).toBe('100%');
    expect(styles['max-width']).toBe('300px');
    expect(styles['min-height']).toBe('250px');
    expect(styles['aspect-ratio']).toBe('300 / 250');
  });

  it('should generate fixed container styles', () => {
    component.responsive = false;
    component.size = { width: 300, height: 250, responsive: false };
    
    const styles = component.containerStyles;
    
    expect(styles['width']).toBe('300px');
    expect(styles['height']).toBe('250px');
    expect(styles['max-width']).toBeUndefined();
    expect(styles['aspect-ratio']).toBeUndefined();
  });

  it('should apply custom theme styles', () => {
    component.theme = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      textColor: '#0000ff',
      fontSize: '16px'
    };
    
    const styles = component.containerStyles;
    
    expect(styles['background-color']).toBe('#ff0000');
    expect(styles['border']).toContain('#00ff00');
    expect(styles['color']).toBe('#0000ff');
    expect(styles['font-size']).toBe('16px');
  });

  it('should emit adLoad event when ad loads successfully', (done) => {
    component.adLoad.subscribe((ad: Ad) => {
      expect(ad).toBeDefined();
      expect(ad.id).toContain('banner-test-placement');
      expect(ad.type).toBe('banner');
      done();
    });

    // Trigger ngOnInit to start ad loading
    component.ngOnInit();
  });

  it('should emit adClick event when ad is clicked', () => {
    const mockAd: Ad = {
      id: 'test-ad',
      type: 'banner' as any,
      format: 'display' as any,
      content: {
        title: 'Test Ad',
        description: 'Test Description',
        ctaText: 'Click Me',
        landingUrl: 'https://example.com',
        brandName: 'Test Brand'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    };

    component.ad = mockAd;
    spyOn(component.adClick, 'emit');
    spyOn(window, 'open');

    component.handleAdClick();

    expect(component.adClick.emit).toHaveBeenCalledWith(mockAd);
    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('should handle keyboard navigation', () => {
    const mockAd: Ad = {
      id: 'test-ad',
      type: 'banner' as any,
      format: 'display' as any,
      content: {
        title: 'Test Ad',
        description: 'Test Description',
        ctaText: 'Click Me',
        landingUrl: 'https://example.com',
        brandName: 'Test Brand'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    };

    component.ad = mockAd;
    spyOn(component, 'handleAdClick');

    // Test Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(enterEvent, 'preventDefault');
    component.handleKeyDown(enterEvent);

    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(component.handleAdClick).toHaveBeenCalled();

    // Test Space key
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(spaceEvent, 'preventDefault');
    component.handleKeyDown(spaceEvent);

    expect(spaceEvent.preventDefault).toHaveBeenCalled();
    expect(component.handleAdClick).toHaveBeenCalledTimes(2);
  });

  it('should clean up intersection observer on destroy', () => {
    const mockObserver = jasmine.createSpyObj('IntersectionObserver', ['disconnect', 'observe']);
    spyOn(window, 'IntersectionObserver').and.returnValue(mockObserver);

    component.ngOnInit();
    component.ngOnDestroy();

    expect(mockObserver.disconnect).toHaveBeenCalled();
  });

  it('should not initialize in non-browser environment', () => {
    // Create a new component with server platform
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [NgAdBanner],
      providers: [
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });

    const serverFixture = TestBed.createComponent(NgAdBanner);
    const serverComponent = serverFixture.componentInstance;
    serverComponent.placementId = 'test-placement';

    spyOn(serverComponent as any, 'setupIntersectionObserver');
    spyOn(serverComponent as any, 'loadAd');

    serverComponent.ngOnInit();

    expect((serverComponent as any).setupIntersectionObserver).not.toHaveBeenCalled();
    expect((serverComponent as any).loadAd).not.toHaveBeenCalled();
  });
});