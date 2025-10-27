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
  PLATFORM_ID,
  HostListener
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Ad } from '@ai-yuugen/types';

export interface AdInterstitialTheme {
  overlayColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  padding?: string;
  boxShadow?: string;
  closeButtonColor?: string;
  closeButtonHoverColor?: string;
}

/**
 * Angular AdInterstitial component for displaying full-screen overlay advertisements
 * Supports modal behavior, auto-close, and accessibility features
 */
@Component({
  selector: 'ng-ad-interstitial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="isVisible"
      #overlayRef
      [ngStyle]="overlayStyles"
      (click)="handleOverlayClick($event)"
      [attr.data-testid]="loading ? testId + '-loading' : (error || !ad) ? testId + '-fallback' : testId"
      [attr.data-ad-id]="ad?.id"
      [attr.data-placement-id]="placementId"
    >
      <div
        #modalRef
        [ngStyle]="modalStyles"
        role="dialog"
        [attr.aria-label]="loading ? 'Loading advertisement' : (error || !ad) ? 'Advertisement unavailable' : ariaLabel"
        aria-modal="true"
        tabindex="-1"
        (keydown)="handleKeyDown($event)"
      >
        <!-- Close Button -->
        <button
          *ngIf="showCloseButton"
          [ngStyle]="closeButtonStyles"
          (click)="close()"
          (mouseenter)="onCloseButtonHover(true)"
          (mouseleave)="onCloseButtonHover(false)"
          aria-label="Close advertisement"
        >
          ×
        </button>

        <!-- Loading State -->
        <div *ngIf="loading" style="padding: 40px; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
            <div
              style="
                width: 24px;
                height: 24px;
                border: 3px solid #e9ecef;
                border-top: 3px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              "
            ></div>
            <span>Loading advertisement...</span>
          </div>
        </div>

        <!-- Error/Fallback State -->
        <div *ngIf="(error || !ad) && !loading" style="padding: 40px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">📢</div>
          <h3 style="margin: 0 0 8px 0;">Advertisement Unavailable</h3>
          <p style="margin: 0; opacity: 0.7;">
            {{ error ? 'Failed to load advertisement' : 'No advertisement available' }}
          </p>
        </div>

        <!-- Ad Content -->
        <div
          *ngIf="ad && !loading"
          style="cursor: pointer;"
          (click)="handleAdClick()"
          role="button"
          tabindex="0"
          (keydown)="handleAdKeyDown($event)"
        >
          <!-- Image Ad -->
          <img
            *ngIf="ad.content.imageUrl"
            [src]="ad.content.imageUrl"
            [alt]="ad.content.title"
            style="
              width: 100%;
              height: auto;
              display: block;
            "
            loading="lazy"
          />

          <!-- Text Ad -->
          <div *ngIf="!ad.content.imageUrl" style="padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold;">
              {{ ad.content.title }}
            </h2>
            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; opacity: 0.8;">
              {{ ad.content.description }}
            </p>
            <button
              [ngStyle]="ctaButtonStyles"
              (click)="handleAdClick(); $event.stopPropagation()"
              (mouseenter)="onCtaButtonHover(true)"
              (mouseleave)="onCtaButtonHover(false)"
            >
              {{ ad.content.ctaText }}
            </button>
            <div style="margin-top: 16px; font-size: 14px; opacity: 0.6;">
              {{ ad.content.brandName }}
            </div>
          </div>
        </div>

        <!-- Ad Label -->
        <div
          *ngIf="ad && !loading"
          style="
            position: absolute;
            bottom: 8px;
            left: 8px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            pointer-events: none;
          "
        >
          Advertisement
        </div>
      </div>
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
export class NgAdInterstitial implements OnInit, OnDestroy {
  @ViewChild('modalRef') modalRef!: ElementRef<HTMLDivElement>;
  @ViewChild('overlayRef') overlayRef!: ElementRef<HTMLDivElement>;

  /** Unique identifier for the ad placement */
  @Input() placementId!: string;
  
  /** Whether the interstitial is currently visible */
  @Input() isOpen: boolean = false;
  
  /** Custom theme configuration */
  @Input() theme: AdInterstitialTheme = {};
  
  /** Whether to show close button */
  @Input() showCloseButton: boolean = true;
  
  /** Auto-close delay in milliseconds (0 to disable) */
  @Input() autoCloseDelay: number = 0;
  
  /** Whether clicking overlay closes the interstitial */
  @Input() closeOnOverlayClick: boolean = true;
  
  /** Whether pressing Escape closes the interstitial */
  @Input() closeOnEscape: boolean = true;
  
  /** Accessibility label */
  @Input() ariaLabel: string = 'Interstitial Advertisement';
  
  /** Test ID for testing */
  @Input() testId: string = 'ad-interstitial';

  /** Callback when interstitial should be closed */
  @Output() closeEvent = new EventEmitter<void>();
  
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
  closeButtonHovered: boolean = false;
  ctaButtonHovered: boolean = false;

  private previousFocusElement: HTMLElement | null = null;
  private autoCloseTimer?: number;
  private isBrowser: boolean;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser && this.isOpen) {
      this.show();
    }
  }

  ngOnDestroy(): void {
    this.hide();
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnEscape && this.isVisible) {
      this.close();
    }
  }

  private show(): void {
    this.isVisible = true;
    // Store previous focus
    this.previousFocusElement = this.document.activeElement as HTMLElement;
    // Prevent body scroll
    this.document.body.style.overflow = 'hidden';
    
    this.loadAd();
    this.setupAutoClose();
    this.cdr.markForCheck();

    // Focus modal after view update
    setTimeout(() => {
      if (this.modalRef?.nativeElement) {
        this.modalRef.nativeElement.focus();
      }
    });
  }

  private hide(): void {
    this.isVisible = false;
    // Restore body scroll
    this.document.body.style.overflow = '';
    // Restore focus
    if (this.previousFocusElement) {
      this.previousFocusElement.focus();
    }
    this.cdr.markForCheck();
  }

  private setupAutoClose(): void {
    if (this.autoCloseDelay > 0) {
      this.autoCloseTimer = window.setTimeout(() => {
        this.close();
      }, this.autoCloseDelay);
    }
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
        id: `interstitial-${this.placementId}-${Date.now()}`,
        type: 'interstitial' as any,
        format: 'display' as any,
        content: {
          title: 'Special Offer!',
          description: 'Don\'t miss out on this amazing opportunity. Limited time offer available now.',
          imageUrl: 'https://via.placeholder.com/600x400/007bff/ffffff?text=Interstitial+Ad',
          ctaText: 'Get Started',
          landingUrl: 'https://example.com',
          brandName: 'Premium Brand',
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

  get overlayStyles(): { [key: string]: string } {
    return {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      'background-color': this.theme.overlayColor || 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'z-index': '9999',
      padding: '20px',
    };
  }

  get modalStyles(): { [key: string]: string } {
    return {
      position: 'relative',
      'background-color': this.theme.backgroundColor || '#ffffff',
      border: `${this.theme.borderWidth || '1px'} solid ${this.theme.borderColor || '#e9ecef'}`,
      'border-radius': this.theme.borderRadius || '8px',
      padding: this.theme.padding || '0',
      'box-shadow': this.theme.boxShadow || '0 10px 30px rgba(0, 0, 0, 0.3)',
      'max-width': '90vw',
      'max-height': '90vh',
      overflow: 'hidden',
      color: this.theme.textColor || '#333',
      'font-size': this.theme.fontSize || '16px',
      'font-family': this.theme.fontFamily || 'system-ui, -apple-system, sans-serif',
    };
  }

  get closeButtonStyles(): { [key: string]: string } {
    return {
      position: 'absolute',
      top: '12px',
      right: '12px',
      width: '32px',
      height: '32px',
      border: 'none',
      'border-radius': '50%',
      'background-color': this.closeButtonHovered 
        ? (this.theme.closeButtonHoverColor || 'rgba(0, 0, 0, 0.7)')
        : (this.theme.closeButtonColor || 'rgba(0, 0, 0, 0.5)'),
      color: 'white',
      'font-size': '18px',
      cursor: 'pointer',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'z-index': '1',
      transition: 'background-color 0.2s ease',
    };
  }

  get ctaButtonStyles(): { [key: string]: string } {
    return {
      'background-color': this.ctaButtonHovered ? '#0056b3' : '#007bff',
      color: 'white',
      border: 'none',
      'border-radius': '6px',
      padding: '12px 24px',
      'font-size': '16px',
      cursor: 'pointer',
      'font-weight': 'bold',
      transition: 'background-color 0.2s ease',
    };
  }

  close(): void {
    this.hide();
    this.closeEvent.emit();
  }

  handleOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && this.closeOnOverlayClick) {
      this.close();
    }
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
    if (event.key === 'Tab') {
      // Trap focus within modal
      const focusableElements = this.modalRef?.nativeElement?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && this.document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && this.document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  handleAdKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleAdClick();
    }
  }

  onCloseButtonHover(hovered: boolean): void {
    this.closeButtonHovered = hovered;
    this.cdr.markForCheck();
  }

  onCtaButtonHover(hovered: boolean): void {
    this.ctaButtonHovered = hovered;
    this.cdr.markForCheck();
  }

  // Watch for isOpen changes
  ngOnChanges(): void {
    if (this.isBrowser) {
      if (this.isOpen && !this.isVisible) {
        this.show();
      } else if (!this.isOpen && this.isVisible) {
        this.hide();
      }
    }
  }
}