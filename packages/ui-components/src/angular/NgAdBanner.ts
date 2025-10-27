import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  ElementRef, 
  ViewChild, 
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Ad, AdSize } from '@ai-yuugen/types';

export interface AdBannerTheme {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
}

/**
 * Angular AdBanner component for displaying banner advertisements
 * Supports responsive design, customizable styling, and accessibility features
 */
@Component({
  selector: 'ng-ad-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #containerRef
      [ngStyle]="containerStyles"
      [attr.role]="loading && showLoading ? 'img' : (error || !ad) && showFallback ? 'img' : 'img'"
      [attr.aria-label]="loading && showLoading ? 'Loading advertisement' : (error || !ad) && showFallback ? 'Advertisement placeholder' : ariaLabel"
      [attr.tabindex]="ad ? 0 : null"
      [attr.data-testid]="loading && showLoading ? testId + '-loading' : (error || !ad) && showFallback ? testId + '-fallback' : testId"
      [attr.data-ad-id]="ad?.id"
      [attr.data-placement-id]="placementId"
      [attr.data-visible]="isVisible"
      (click)="ad ? handleAdClick() : null"
      (keydown)="ad ? handleKeyDown($event) : null"
    >
      <!-- Loading State -->
      <div *ngIf="loading && showLoading" style="display: flex; align-items: center; gap: 8px;">
        <div
          style="
            width: 16px;
            height: 16px;
            border: 2px solid #e9ecef;
            border-top: 2px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "
        ></div>
        <span>Loading ad...</span>
      </div>

      <!-- Error/Fallback State -->
      <div *ngIf="(error || !ad) && showFallback && !loading" style="text-align: center; opacity: 0.6;">
        <div style="font-size: 18px; margin-bottom: 4px;">📢</div>
        <div>Advertisement</div>
      </div>

      <!-- Ad Content -->
      <ng-container *ngIf="ad && !loading">
        <!-- Image Ad -->
        <img
          *ngIf="ad.content.imageUrl"
          [src]="ad.content.imageUrl"
          [alt]="ad.content.title"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: pointer;
          "
          loading="lazy"
        />

        <!-- Text Ad -->
        <div
          *ngIf="!ad.content.imageUrl"
          style="
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            padding: 16px;
          "
        >
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            {{ ad.content.title }}
          </h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.8;">
            {{ ad.content.description }}
          </p>
          <button
            style="
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              font-size: 14px;
              cursor: pointer;
              font-weight: bold;
            "
            (click)="handleAdClick(); $event.stopPropagation()"
          >
            {{ ad.content.ctaText }}
          </button>
          <small style="margin-top: 8px; opacity: 0.6; font-size: 12px;">
            {{ ad.content.brandName }}
          </small>
        </div>

        <!-- Ad Label -->
        <div
          style="
            position: absolute;
            top: 4px;
            right: 4px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 2px;
            pointer-events: none;
          "
        >
          Ad
        </div>
      </ng-container>
    </div>

    <!-- CSS Animation -->
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `
})
export class NgAdBanner implements OnInit, OnDestroy {
  @ViewChild('containerRef', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  /** Unique identifier for the ad placement */
  @Input() placementId!: string;
  
  /** Ad size configuration */
  @Input() size: AdSize = { width: 728, height: 90, responsive: true };
  
  /** Whether the banner should be responsive */
  @Input() responsive: boolean = true;
  
  /** Custom theme configuration */
  @Input() theme: AdBannerTheme = {};
  
  /** Whether to show loading state */
  @Input() showLoading: boolean = true;
  
  /** Whether to show fallback when no ad is available */
  @Input() showFallback: boolean = true;
  
  /** Accessibility label */
  @Input() ariaLabel: string = 'Advertisement';
  
  /** Test ID for testing */
  @Input() testId: string = 'ad-banner';

  /** Callback when ad loads successfully */
  @Output() adLoad = new EventEmitter<Ad>();
  
  /** Callback when ad fails to load */
  @Output() adError = new EventEmitter<Error>();
  
  /** Callback when ad is clicked */
  @Output() adClick = new EventEmitter<Ad>();

  // Component state
  ad: Ad | null = null;
  loading: boolean = true;
  error: Error | null = null;
  isVisible: boolean = false;

  private intersectionObserver?: IntersectionObserver;
  private isBrowser: boolean;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.setupIntersectionObserver();
      this.loadAd();
    }
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  get containerStyles(): { [key: string]: string } {
    const baseStyles = {
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      position: 'relative',
      overflow: 'hidden',
      'background-color': this.theme.backgroundColor || '#f8f9fa',
      border: `${this.theme.borderWidth || '1px'} solid ${this.theme.borderColor || '#e9ecef'}`,
      'border-radius': this.theme.borderRadius || '4px',
      padding: this.theme.padding || '8px',
      margin: this.theme.margin || '0',
      'box-shadow': this.theme.boxShadow || 'none',
      color: this.theme.textColor || '#333',
      'font-size': this.theme.fontSize || '14px',
      'font-family': this.theme.fontFamily || 'system-ui, -apple-system, sans-serif',
    };

    if (this.responsive && this.size.responsive) {
      return {
        ...baseStyles,
        width: '100%',
        'max-width': `${this.size.width}px`,
        'min-height': `${this.size.height}px`,
        'aspect-ratio': `${this.size.width} / ${this.size.height}`,
      };
    }

    return {
      ...baseStyles,
      width: `${this.size.width}px`,
      height: `${this.size.height}px`,
    };
  }

  private setupIntersectionObserver(): void {
    if (!this.isBrowser || !this.containerRef?.nativeElement) return;

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        this.cdr.markForCheck();
      },
      { threshold: 0.5 }
    );

    this.intersectionObserver.observe(this.containerRef.nativeElement);
  }

  private async loadAd(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.cdr.markForCheck();

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock ad data
      const mockAd: Ad = {
        id: `banner-${this.placementId}-${Date.now()}`,
        type: 'banner' as any,
        format: 'display' as any,
        content: {
          title: 'Sample Advertisement',
          description: 'This is a sample banner advertisement',
          imageUrl: `https://via.placeholder.com/${this.size.width}x${this.size.height}/007bff/ffffff?text=Ad+Banner`,
          ctaText: 'Learn More',
          landingUrl: 'https://example.com',
          brandName: 'Sample Brand',
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      this.ad = mockAd;
      this.adLoad.emit(mockAd);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load ad');
      this.error = error;
      this.adError.emit(error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  handleAdClick(): void {
    if (this.ad) {
      this.adClick.emit(this.ad);
      // Track click event
      if (this.ad.content.landingUrl) {
        window.open(this.ad.content.landingUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleAdClick();
    }
  }
}