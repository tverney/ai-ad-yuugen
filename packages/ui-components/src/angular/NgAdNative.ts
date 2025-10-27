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
import { Ad } from '@ai-yuugen/types';

export interface AdNativeTheme {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  textColor?: string;
  titleColor?: string;
  descriptionColor?: string;
  brandColor?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  ctaHoverBackgroundColor?: string;
  fontSize?: string;
  titleFontSize?: string;
  descriptionFontSize?: string;
  brandFontSize?: string;
  ctaFontSize?: string;
  fontFamily?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
  adLabelColor?: string;
  adLabelBackgroundColor?: string;
}

/**
 * Angular AdNative component for displaying native advertisements that blend with content
 * Supports multiple layouts, customizable styling, and accessibility features
 */
@Component({
  selector: 'ng-ad-native',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #containerRef
      [ngStyle]="containerStyles"
      [attr.role]="loading && showLoading ? 'img' : (error || !ad) && showFallback ? 'img' : 'article'"
      [attr.aria-label]="loading && showLoading ? 'Loading native advertisement' : (error || !ad) && showFallback ? 'Native advertisement placeholder' : ariaLabel"
      [attr.tabindex]="ad ? 0 : null"
      [attr.data-testid]="loading && showLoading ? testId + '-loading' : (error || !ad) && showFallback ? testId + '-fallback' : testId"
      [attr.data-ad-id]="ad?.id"
      [attr.data-placement-id]="placementId"
      [attr.data-layout]="layout"
      [attr.data-visible]="isVisible"
      (click)="ad ? handleAdClick() : null"
      (keydown)="ad ? handleKeyDown($event) : null"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Loading State -->
      <div *ngIf="loading && showLoading" style="display: flex; align-items: center; gap: 8px; justify-content: center; padding: 20px;">
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
        <span>Loading content...</span>
      </div>

      <!-- Error/Fallback State -->
      <div *ngIf="(error || !ad) && showFallback && !loading" style="text-align: center; padding: 20px; opacity: 0.6;">
        <div style="font-size: 24px; margin-bottom: 8px;">📰</div>
        <div>Sponsored Content</div>
      </div>

      <!-- Ad Content -->
      <ng-container *ngIf="ad && !loading">
        <!-- Inline Layout -->
        <ng-container *ngIf="layout === 'inline'">
          <div *ngIf="showImage && ad.content.imageUrl" style="flex-shrink: 0; width: 80px; height: 80px;">
            <img
              [src]="ad.content.imageUrl"
              [alt]="ad.content.title"
              style="
                width: 80px;
                height: 80px;
                border-radius: 4px;
                object-fit: cover;
                aspect-ratio: 1;
              "
              loading="lazy"
              (load)="onImageLoad()"
            />
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 [ngStyle]="getTitleStyles('16px', '4px')">
              {{ ad.content.title }}
            </h3>
            <p [ngStyle]="getDescriptionStyles('13px', '8px')">
              {{ getShortDescription(100) }}
            </p>
            <div *ngIf="showBrandName" [ngStyle]="getBrandStyles()">
              {{ ad.content.brandName }}
            </div>
          </div>
        </ng-container>

        <!-- Minimal Layout -->
        <ng-container *ngIf="layout === 'minimal'">
          <div>
            <h3 [ngStyle]="getTitleStyles('16px')">
              {{ ad.content.title }}
            </h3>
            <p [ngStyle]="getDescriptionStyles('13px')">
              {{ getShortDescription(120) }}
            </p>
            <div *ngIf="showBrandName" [ngStyle]="getBrandStyles()">
              {{ ad.content.brandName }}
            </div>
          </div>
        </ng-container>

        <!-- Featured Layout -->
        <ng-container *ngIf="layout === 'featured'">
          <div>
            <div *ngIf="showImage && ad.content.imageUrl" style="margin-bottom: 16px;">
              <img
                [src]="ad.content.imageUrl"
                [alt]="ad.content.title"
                [ngStyle]="getImageStyles()"
                loading="lazy"
                (load)="onImageLoad()"
              />
            </div>
            <h2 [ngStyle]="getTitleStyles('22px', '12px')">
              {{ ad.content.title }}
            </h2>
            <p [ngStyle]="getDescriptionStyles('16px', '16px')">
              {{ ad.content.description }}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div *ngIf="showBrandName" [ngStyle]="getBrandStyles()">
                {{ ad.content.brandName }}
              </div>
              <button
                *ngIf="showCTA"
                [ngStyle]="getCtaStyles()"
                (click)="handleAdClick(); $event.stopPropagation()"
                (mouseenter)="onCtaHover(true)"
                (mouseleave)="onCtaHover(false)"
              >
                {{ ad.content.ctaText }}
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Card Layout (Default) -->
        <ng-container *ngIf="layout === 'card' || !layout">
          <div>
            <div *ngIf="showImage && ad.content.imageUrl" style="margin-bottom: 12px;">
              <img
                [src]="ad.content.imageUrl"
                [alt]="ad.content.title"
                [ngStyle]="getImageStyles()"
                loading="lazy"
                (load)="onImageLoad()"
              />
            </div>
            <h3 [ngStyle]="getTitleStyles()">
              {{ ad.content.title }}
            </h3>
            <p [ngStyle]="getDescriptionStyles()">
              {{ ad.content.description }}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div *ngIf="showBrandName" [ngStyle]="getBrandStyles()">
                {{ ad.content.brandName }}
              </div>
              <button
                *ngIf="showCTA"
                [ngStyle]="getCtaStyles()"
                (click)="handleAdClick(); $event.stopPropagation()"
                (mouseenter)="onCtaHover(true)"
                (mouseleave)="onCtaHover(false)"
              >
                {{ ad.content.ctaText }}
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Ad disclosure label -->
        <div
          *ngIf="showAdLabel"
          style="
            position: absolute;
            top: 8px;
            right: 8px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 2px;
            pointer-events: none;
            font-weight: 500;
          "
          [ngStyle]="{
            'background-color': theme.adLabelBackgroundColor || 'rgba(0, 0, 0, 0.7)',
            'color': theme.adLabelColor || 'white'
          }"
        >
          {{ adLabelText }}
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
export class NgAdNative implements OnInit, OnDestroy {
  @ViewChild('containerRef', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  /** Unique identifier for the ad placement */
  @Input() placementId!: string;
  
  /** Layout variant for the native ad */
  @Input() layout: 'card' | 'inline' | 'minimal' | 'featured' = 'card';
  
  /** Custom theme configuration */
  @Input() theme: AdNativeTheme = {};
  
  /** Whether to show loading state */
  @Input() showLoading: boolean = true;
  
  /** Whether to show fallback when no ad is available */
  @Input() showFallback: boolean = true;
  
  /** Whether to show ad disclosure label */
  @Input() showAdLabel: boolean = true;
  
  /** Custom ad label text */
  @Input() adLabelText: string = 'Sponsored';
  
  /** Whether to show brand name */
  @Input() showBrandName: boolean = true;
  
  /** Whether to show CTA button */
  @Input() showCTA: boolean = true;
  
  /** Whether to show image */
  @Input() showImage: boolean = true;
  
  /** Image aspect ratio */
  @Input() imageAspectRatio: string = '16/9';
  
  /** Accessibility label */
  @Input() ariaLabel: string = 'Native Advertisement';
  
  /** Test ID for testing */
  @Input() testId: string = 'ad-native';

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
  imageLoaded: boolean = false;
  ctaHovered: boolean = false;
  containerHovered: boolean = false;

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
      'background-color': this.theme.backgroundColor || '#ffffff',
      border: `${this.theme.borderWidth || '1px'} solid ${this.theme.borderColor || '#e9ecef'}`,
      'border-radius': this.theme.borderRadius || '8px',
      padding: this.theme.padding || '16px',
      margin: this.theme.margin || '0',
      'box-shadow': this.getBoxShadow(),
      color: this.theme.textColor || '#333',
      'font-size': this.theme.fontSize || '14px',
      'font-family': this.theme.fontFamily || 'system-ui, -apple-system, sans-serif',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      position: 'relative',
      transform: this.getTransform(),
    };

    switch (this.layout) {
      case 'inline':
        return {
          ...baseStyles,
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
          padding: this.theme.padding || '12px',
        };
      case 'minimal':
        return {
          ...baseStyles,
          border: 'none',
          'box-shadow': 'none',
          'background-color': 'transparent',
          padding: this.theme.padding || '8px',
        };
      case 'featured':
        return {
          ...baseStyles,
          padding: this.theme.padding || '24px',
          'box-shadow': this.theme.boxShadow || '0 4px 12px rgba(0, 0, 0, 0.15)',
        };
      case 'card':
      default:
        return baseStyles;
    }
  }

  private getBoxShadow(): string {
    if (this.layout === 'minimal') return 'none';
    
    const baseShadow = this.theme.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.1)';
    
    const shouldHover = this.containerHovered && 
      (this.layout === 'card' || this.layout === 'inline' || this.layout === 'featured');
    
    if (shouldHover) {
      return baseShadow.replace('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.15)') || '0 4px 8px rgba(0, 0, 0, 0.15)';
    }
    
    return baseShadow;
  }

  private getTransform(): string {
    const shouldHover = this.containerHovered && 
      (this.layout === 'card' || this.layout === 'inline' || this.layout === 'featured');
    
    if (shouldHover) {
      return 'translateY(-2px)';
    }
    return 'translateY(0)';
  }

  getTitleStyles(fontSize?: string, marginBottom?: string): { [key: string]: string } {
    return {
      margin: `0 0 ${marginBottom || '8px'} 0`,
      'font-size': fontSize || this.theme.titleFontSize || '18px',
      'font-weight': 'bold',
      color: this.theme.titleColor || this.theme.textColor || '#333',
      'line-height': '1.3',
    };
  }

  getDescriptionStyles(fontSize?: string, marginBottom?: string): { [key: string]: string } {
    return {
      margin: `0 0 ${marginBottom || '12px'} 0`,
      'font-size': fontSize || this.theme.descriptionFontSize || '14px',
      color: this.theme.descriptionColor || this.theme.textColor || '#666',
      'line-height': '1.4',
    };
  }

  getBrandStyles(): { [key: string]: string } {
    return {
      'font-size': this.theme.brandFontSize || '12px',
      color: this.theme.brandColor || this.theme.textColor || '#888',
      'font-weight': '500',
    };
  }

  getCtaStyles(): { [key: string]: string } {
    return {
      'background-color': this.ctaHovered 
        ? (this.theme.ctaHoverBackgroundColor || '#0056b3')
        : (this.theme.ctaBackgroundColor || '#007bff'),
      color: this.theme.ctaTextColor || 'white',
      border: 'none',
      'border-radius': '4px',
      padding: '8px 16px',
      'font-size': this.theme.ctaFontSize || '14px',
      'font-weight': 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    };
  }

  getImageStyles(): { [key: string]: string } {
    return {
      width: '100%',
      height: 'auto',
      'border-radius': '4px',
      'object-fit': 'cover',
      'aspect-ratio': this.imageAspectRatio,
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
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock ad data
      const mockAd: Ad = {
        id: `native-${this.placementId}-${Date.now()}`,
        type: 'native' as any,
        format: 'display' as any,
        content: {
          title: 'Discover Amazing AI Tools',
          description: 'Boost your productivity with cutting-edge AI solutions. Join thousands of satisfied users who have transformed their workflow.',
          imageUrl: this.showImage ? 'https://via.placeholder.com/400x225/28a745/ffffff?text=Native+Ad+Image' : undefined,
          ctaText: 'Learn More',
          landingUrl: 'https://example.com',
          brandName: 'TechCorp Solutions',
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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

  getShortDescription(maxLength: number): string {
    if (!this.ad?.content.description) return '';
    
    if (this.ad.content.description.length > maxLength) {
      return `${this.ad.content.description.substring(0, maxLength)}...`;
    }
    
    return this.ad.content.description;
  }

  handleAdClick(): void {
    if (this.ad) {
      this.adClick.emit(this.ad);
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

  onImageLoad(): void {
    this.imageLoaded = true;
    this.cdr.markForCheck();
  }

  onCtaHover(hovered: boolean): void {
    this.ctaHovered = hovered;
    this.cdr.markForCheck();
  }

  onMouseEnter(): void {
    this.containerHovered = true;
    this.cdr.markForCheck();
  }

  onMouseLeave(): void {
    this.containerHovered = false;
    this.cdr.markForCheck();
  }
}