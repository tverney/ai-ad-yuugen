import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { NgAdNative } from '../NgAdNative';
import { Ad } from '@ai-yuugen/types';

describe('NgAdNative', () => {
  let component: NgAdNative;
  let fixture: ComponentFixture<NgAdNative>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    await TestBed.configureTestingModule({
      declarations: [NgAdNative],
      providers: [
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgAdNative);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.placementId = 'test-placement';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.placementId).toBe('test-placement');
    expect(component.layout).toBe('card');
    expect(component.showLoading).toBe(true);
    expect(component.showFallback).toBe(true);
    expect(component.showAdLabel).toBe(true);
    expect(component.adLabelText).toBe('Sponsored');
    expect(component.showBrandName).toBe(true);
    expect(component.showCTA).toBe(true);
    expect(component.showImage).toBe(true);
    expect(component.imageAspectRatio).toBe('16/9');
    expect(component.ariaLabel).toBe('Native Advertisement');
    expect(component.testId).toBe('ad-native');
  });

  it('should start in loading state', () => {
    expect(component.loading).toBe(true);
    expect(component.ad).toBeNull();
    expect(component.error).toBeNull();
  });

  it('should generate card layout styles', () => {
    component.layout = 'card';
    const styles = component.containerStyles;
    
    expect(styles['background-color']).toBe('#ffffff');
    expect(styles['border']).toContain('#e9ecef');
    expect(styles['border-radius']).toBe('8px');
    expect(styles['padding']).toBe('16px');
    expect(styles['cursor']).toBe('pointer');
  });

  it('should generate inline layout styles', () => {
    component.layout = 'inline';
    const styles = component.containerStyles;
    
    expect(styles['display']).toBe('flex');
    expect(styles['align-items']).toBe('center');
    expect(styles['gap']).toBe('12px');
    expect(styles['padding']).toBe('12px');
  });

  it('should generate minimal layout styles', () => {
    component.layout = 'minimal';
    const styles = component.containerStyles;
    
    expect(styles['border']).toBe('none');
    expect(styles['box-shadow']).toBe('none');
    expect(styles['background-color']).toBe('transparent');
    expect(styles['padding']).toBe('8px');
  });

  it('should generate featured layout styles', () => {
    component.layout = 'featured';
    const styles = component.containerStyles;
    
    expect(styles['padding']).toBe('24px');
    expect(styles['box-shadow']).toBe('0 4px 12px rgba(0, 0, 0, 0.15)');
  });

  it('should apply custom theme styles', () => {
    component.theme = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      textColor: '#0000ff',
      fontSize: '16px',
      titleColor: '#ff00ff',
      ctaBackgroundColor: '#ffff00'
    };
    
    const containerStyles = component.containerStyles;
    const titleStyles = component.getTitleStyles();
    const ctaStyles = component.getCtaStyles();
    
    expect(containerStyles['background-color']).toBe('#ff0000');
    expect(containerStyles['border']).toContain('#00ff00');
    expect(containerStyles['color']).toBe('#0000ff');
    expect(containerStyles['font-size']).toBe('16px');
    expect(titleStyles['color']).toBe('#ff00ff');
    expect(ctaStyles['background-color']).toBe('#ffff00');
  });

  it('should generate title styles with custom parameters', () => {
    const styles = component.getTitleStyles('20px', '10px');
    
    expect(styles['font-size']).toBe('20px');
    expect(styles['margin']).toBe('0 0 10px 0');
    expect(styles['font-weight']).toBe('bold');
    expect(styles['line-height']).toBe('1.3');
  });

  it('should generate description styles with custom parameters', () => {
    const styles = component.getDescriptionStyles('14px', '8px');
    
    expect(styles['font-size']).toBe('14px');
    expect(styles['margin']).toBe('0 0 8px 0');
    expect(styles['line-height']).toBe('1.4');
  });

  it('should generate brand styles', () => {
    const styles = component.getBrandStyles();
    
    expect(styles['font-size']).toBe('12px');
    expect(styles['font-weight']).toBe('500');
  });

  it('should generate CTA styles with hover state', () => {
    component.ctaHovered = false;
    let styles = component.getCtaStyles();
    expect(styles['background-color']).toBe('#007bff');

    component.ctaHovered = true;
    styles = component.getCtaStyles();
    expect(styles['background-color']).toBe('#0056b3');
  });

  it('should generate image styles', () => {
    component.imageAspectRatio = '4/3';
    const styles = component.getImageStyles();
    
    expect(styles['width']).toBe('100%');
    expect(styles['height']).toBe('auto');
    expect(styles['border-radius']).toBe('4px');
    expect(styles['object-fit']).toBe('cover');
    expect(styles['aspect-ratio']).toBe('4/3');
  });

  it('should emit adLoad event when ad loads successfully', (done) => {
    component.adLoad.subscribe((ad: Ad) => {
      expect(ad).toBeDefined();
      expect(ad.id).toContain('native-test-placement');
      expect(ad.type).toBe('native');
      done();
    });

    component.ngOnInit();
  });

  it('should emit adClick event when ad is clicked', () => {
    const mockAd: Ad = {
      id: 'test-ad',
      type: 'native' as any,
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
      type: 'native' as any,
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

  it('should truncate description for short descriptions', () => {
    const mockAd: Ad = {
      id: 'test-ad',
      type: 'native' as any,
      format: 'display' as any,
      content: {
        title: 'Test Ad',
        description: 'This is a very long description that should be truncated when it exceeds the maximum length specified by the component for better display and user experience.',
        ctaText: 'Click Me',
        landingUrl: 'https://example.com',
        brandName: 'Test Brand'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    };

    component.ad = mockAd;
    
    const shortDescription = component.getShortDescription(50);
    expect(shortDescription.length).toBeLessThanOrEqual(53); // 50 + '...'
    expect(shortDescription).toContain('...');
  });

  it('should not truncate short descriptions', () => {
    const mockAd: Ad = {
      id: 'test-ad',
      type: 'native' as any,
      format: 'display' as any,
      content: {
        title: 'Test Ad',
        description: 'Short description',
        ctaText: 'Click Me',
        landingUrl: 'https://example.com',
        brandName: 'Test Brand'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    };

    component.ad = mockAd;
    
    const shortDescription = component.getShortDescription(100);
    expect(shortDescription).toBe('Short description');
    expect(shortDescription).not.toContain('...');
  });

  it('should handle mouse hover states', () => {
    component.onMouseEnter();
    expect(component.containerHovered).toBe(true);
    expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalled();

    component.onMouseLeave();
    expect(component.containerHovered).toBe(false);
  });

  it('should handle CTA hover states', () => {
    component.onCtaHover(true);
    expect(component.ctaHovered).toBe(true);
    expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalled();

    component.onCtaHover(false);
    expect(component.ctaHovered).toBe(false);
  });

  it('should handle image load event', () => {
    component.onImageLoad();
    expect(component.imageLoaded).toBe(true);
    expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalled();
  });

  it('should apply hover effects to container styles', () => {
    component.layout = 'card';
    component.containerHovered = false;
    
    let styles = component.containerStyles;
    expect(styles['transform']).toBe('translateY(0)');
    
    component.containerHovered = true;
    styles = component.containerStyles;
    expect(styles['transform']).toBe('translateY(-2px)');
  });

  it('should not apply hover effects for minimal layout', () => {
    component.layout = 'minimal';
    component.containerHovered = true;
    
    const styles = component.containerStyles;
    expect(styles['transform']).toBe('translateY(0)');
  });

  it('should clean up intersection observer on destroy', () => {
    const mockObserver = jasmine.createSpyObj('IntersectionObserver', ['disconnect', 'observe']);
    spyOn(window, 'IntersectionObserver').and.returnValue(mockObserver);

    component.ngOnInit();
    component.ngOnDestroy();

    expect(mockObserver.disconnect).toHaveBeenCalled();
  });
});