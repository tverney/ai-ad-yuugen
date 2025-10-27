import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { NgAdInterstitial } from '../NgAdInterstitial';
import { Ad } from '@ai-yuugen/types';

describe('NgAdInterstitial', () => {
  let component: NgAdInterstitial;
  let fixture: ComponentFixture<NgAdInterstitial>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;
  let mockDocument: jasmine.SpyObj<Document>;

  beforeEach(async () => {
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);
    mockDocument = jasmine.createSpyObj('Document', [], {
      body: { style: {} },
      activeElement: document.createElement('div')
    });

    await TestBed.configureTestingModule({
      declarations: [NgAdInterstitial],
      providers: [
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: mockDocument }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgAdInterstitial);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.placementId = 'test-placement';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.placementId).toBe('test-placement');
    expect(component.isOpen).toBe(false);
    expect(component.showCloseButton).toBe(true);
    expect(component.autoCloseDelay).toBe(0);
    expect(component.closeOnOverlayClick).toBe(true);
    expect(component.closeOnEscape).toBe(true);
    expect(component.ariaLabel).toBe('Interstitial Advertisement');
    expect(component.testId).toBe('ad-interstitial');
  });

  it('should start in loading state when opened', () => {
    expect(component.loading).toBe(true);
    expect(component.ad).toBeNull();
    expect(component.error).toBeNull();
    expect(component.isVisible).toBe(false);
  });

  it('should show when isOpen is true', () => {
    component.isOpen = true;
    component.ngOnInit();
    
    expect(component.isVisible).toBe(true);
    expect(mockDocument.body.style.overflow).toBe('hidden');
  });

  it('should hide when isOpen is false', () => {
    component.isOpen = true;
    component.ngOnInit();
    
    component.isOpen = false;
    component.ngOnChanges();
    
    expect(component.isVisible).toBe(false);
    expect(mockDocument.body.style.overflow).toBe('');
  });

  it('should generate overlay styles', () => {
    const styles = component.overlayStyles;
    
    expect(styles['position']).toBe('fixed');
    expect(styles['top']).toBe('0');
    expect(styles['left']).toBe('0');
    expect(styles['right']).toBe('0');
    expect(styles['bottom']).toBe('0');
    expect(styles['z-index']).toBe('9999');
  });

  it('should generate modal styles', () => {
    const styles = component.modalStyles;
    
    expect(styles['position']).toBe('relative');
    expect(styles['background-color']).toBe('#ffffff');
    expect(styles['max-width']).toBe('90vw');
    expect(styles['max-height']).toBe('90vh');
  });

  it('should apply custom theme styles', () => {
    component.theme = {
      overlayColor: 'rgba(255, 0, 0, 0.8)',
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      textColor: '#0000ff'
    };
    
    const overlayStyles = component.overlayStyles;
    const modalStyles = component.modalStyles;
    
    expect(overlayStyles['background-color']).toBe('rgba(255, 0, 0, 0.8)');
    expect(modalStyles['background-color']).toBe('#ff0000');
    expect(modalStyles['border']).toContain('#00ff00');
    expect(modalStyles['color']).toBe('#0000ff');
  });

  it('should emit closeEvent when close is called', () => {
    spyOn(component.closeEvent, 'emit');
    
    component.close();
    
    expect(component.closeEvent.emit).toHaveBeenCalled();
    expect(component.isVisible).toBe(false);
  });

  it('should emit adLoad event when ad loads successfully', (done) => {
    component.adLoad.subscribe((ad: Ad) => {
      expect(ad).toBeDefined();
      expect(ad.id).toContain('interstitial-test-placement');
      expect(ad.type).toBe('interstitial');
      done();
    });

    component.isOpen = true;
    component.ngOnInit();
  });

  it('should emit adClick event when ad is clicked', () => {
    const mockAd: Ad = {
      id: 'test-ad',
      type: 'interstitial' as any,
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

  it('should close on overlay click when enabled', () => {
    component.closeOnOverlayClick = true;
    spyOn(component, 'close');

    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div')
    } as any;
    mockEvent.target = mockEvent.currentTarget; // Same element

    component.handleOverlayClick(mockEvent);

    expect(component.close).toHaveBeenCalled();
  });

  it('should not close on overlay click when disabled', () => {
    component.closeOnOverlayClick = false;
    spyOn(component, 'close');

    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div')
    } as any;
    mockEvent.target = mockEvent.currentTarget;

    component.handleOverlayClick(mockEvent);

    expect(component.close).not.toHaveBeenCalled();
  });

  it('should close on Escape key when enabled', () => {
    component.closeOnEscape = true;
    component.isVisible = true;
    spyOn(component, 'close');

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onDocumentKeyDown(escapeEvent);

    expect(component.close).toHaveBeenCalled();
  });

  it('should not close on Escape key when disabled', () => {
    component.closeOnEscape = false;
    component.isVisible = true;
    spyOn(component, 'close');

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onDocumentKeyDown(escapeEvent);

    expect(component.close).not.toHaveBeenCalled();
  });

  it('should handle ad keyboard navigation', () => {
    const mockAd: Ad = {
      id: 'test-ad',
      type: 'interstitial' as any,
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
    component.handleAdKeyDown(enterEvent);

    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(component.handleAdClick).toHaveBeenCalled();
  });

  it('should setup auto-close timer when delay is set', (done) => {
    component.autoCloseDelay = 100; // 100ms for testing
    spyOn(component, 'close');

    component.isOpen = true;
    component.ngOnInit();

    setTimeout(() => {
      expect(component.close).toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should update button hover states', () => {
    component.onCloseButtonHover(true);
    expect(component.closeButtonHovered).toBe(true);
    expect(mockChangeDetectorRef.markForCheck).toHaveBeenCalled();

    component.onCtaButtonHover(false);
    expect(component.ctaButtonHovered).toBe(false);
  });

  it('should clean up on destroy', () => {
    component.autoCloseDelay = 1000;
    component.isOpen = true;
    component.ngOnInit();

    spyOn(window, 'clearTimeout');
    
    component.ngOnDestroy();

    expect(component.isVisible).toBe(false);
    expect(mockDocument.body.style.overflow).toBe('');
  });
});