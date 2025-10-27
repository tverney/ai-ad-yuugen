import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Ad } from '../types/ad';
import styles from './AdInterstitial.module.css';
import { generatePlaceholderImage } from '../utils/placeholderImage';

export interface AdInterstitialProps {
  /** Unique identifier for the ad placement */
  placementId: string;
  /** Whether the interstitial is currently visible */
  isOpen: boolean;
  /** Callback when interstitial should be closed */
  onClose: () => void;
  /** Custom CSS class */
  className?: string;

  /** Callback when ad loads successfully */
  onAdLoad?: (ad: Ad) => void;
  /** Callback when ad fails to load */
  onAdError?: (error: Error) => void;
  /** Callback when ad is clicked */
  onAdClick?: (ad: Ad) => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Auto-close delay in milliseconds (0 to disable) */
  autoCloseDelay?: number;
  /** Whether clicking overlay closes the interstitial */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the interstitial */
  closeOnEscape?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom fallback component */
  fallbackComponent?: React.ReactNode;
  /** Accessibility label */
  ariaLabel?: string;
  /** Test ID for testing */
  testId?: string;
}

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
 * AdInterstitial React component for displaying full-screen overlay advertisements
 * Supports modal behavior, auto-close, and accessibility features
 */
export const AdInterstitial: React.FC<AdInterstitialProps> = ({
  placementId,
  isOpen,
  onClose,
  className,
  onAdLoad,
  onAdError,
  onAdClick,
  showCloseButton = true,
  autoCloseDelay = 0,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  loadingComponent,
  fallbackComponent,

  testId = 'ad-interstitial'
}) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle visibility changes
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Restore body scroll
      document.body.style.overflow = '';
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isVisible && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isVisible]);

  // Auto-close timer
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Load ad data
  useEffect(() => {
    if (!isOpen) return;

    const loadAd = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock ad data
        const mockAd: Ad = {
          id: `interstitial-${placementId}-${Date.now()}`,
          type: 'interstitial',
          format: 'display',
          content: {
            title: 'Special Offer!',
            description: 'Don\'t miss out on this amazing opportunity. Limited time offer available now.',
            imageUrl: generatePlaceholderImage(600, 400, 'Interstitial Ad', '#007bff', '#ffffff'),
            ctaText: 'Get Started',
            landingUrl: 'https://example.com',
            brandName: 'Premium Brand',
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        setAd(mockAd);
        onAdLoad?.(mockAd);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load ad');
        setError(error);
        onAdError?.(error);
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, [isOpen, placementId, onAdLoad, onAdError]);

  // Handle ad click
  const handleAdClick = useCallback(() => {
    if (ad) {
      onAdClick?.(ad);
      if (ad.content.landingUrl) {
        window.open(ad.content.landingUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, [ad, onAdClick]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, []);

  if (!isVisible) return null;

  // Render loading state
  if (loading) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay 
            className={`${styles.adInterstitialOverlay} ${className || ''}`}
            onClick={handleOverlayClick}
            data-testid={`${testId}-loading`}
          />
          <Dialog.Content
            ref={modalRef}
            className={styles.adInterstitialContent}
            onKeyDown={handleKeyDown}
          >
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Loading Advertisement</Dialog.Title>
            </VisuallyHidden.Root>
            <VisuallyHidden.Root asChild>
              <Dialog.Description>Please wait while the advertisement loads</Dialog.Description>
            </VisuallyHidden.Root>

            {showCloseButton && (
              <Dialog.Close asChild>
                <button
                  className={styles.adInterstitialClose}
                  aria-label="Close advertisement"
                >
                  ×
                </button>
              </Dialog.Close>
            )}
            
            <div className={styles.adInterstitialLoading}>
              {loadingComponent || (
                <>
                  <div className={styles.adInterstitialSpinner} />
                  <span>Loading advertisement...</span>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Render error or fallback state
  if (error || !ad) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay 
            className={`${styles.adInterstitialOverlay} ${className || ''}`}
            onClick={handleOverlayClick}
            data-testid={`${testId}-fallback`}
          />
          <Dialog.Content
            ref={modalRef}
            className={styles.adInterstitialContent}
            onKeyDown={handleKeyDown}
          >
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Advertisement Unavailable</Dialog.Title>
            </VisuallyHidden.Root>
            <VisuallyHidden.Root asChild>
              <Dialog.Description>
                {error ? 'Failed to load advertisement' : 'No advertisement available'}
              </Dialog.Description>
            </VisuallyHidden.Root>

            {showCloseButton && (
              <Dialog.Close asChild>
                <button
                  className={styles.adInterstitialClose}
                  aria-label="Close"
                >
                  ×
                </button>
              </Dialog.Close>
            )}
            
            <div className={styles.adInterstitialFallback}>
              {fallbackComponent || (
                <>
                  <div className={styles.adInterstitialFallbackIcon}>📢</div>
                  <h3>Advertisement Unavailable</h3>
                  <p>
                    {error ? 'Failed to load advertisement' : 'No advertisement available'}
                  </p>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Render ad content
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className={`${styles.adInterstitialOverlay} ${className || ''}`}
          onClick={handleOverlayClick}
          data-testid={testId}
        />
        <Dialog.Content
          ref={modalRef}
          className={styles.adInterstitialContent}
          onKeyDown={handleKeyDown}
          data-ad-id={ad.id}
          data-placement-id={placementId}
        >
          <VisuallyHidden.Root asChild>
            <Dialog.Title>{ad.content.title}</Dialog.Title>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <Dialog.Description>Advertisement: {ad.content.description}</Dialog.Description>
          </VisuallyHidden.Root>

          {showCloseButton && (
            <Dialog.Close asChild>
              <button
                className={styles.adInterstitialClose}
                aria-label="Close advertisement"
              >
                ×
              </button>
            </Dialog.Close>
          )}
          
          <div
            className={styles.adInterstitialBody}
            onClick={handleAdClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAdClick();
              }
            }}
          >
            {ad.content.imageUrl ? (
              <img
                src={ad.content.imageUrl}
                alt={ad.content.title}
                className={styles.adInterstitialImage}
                loading="lazy"
              />
            ) : (
              <div className={styles.adInterstitialTextContent}>
                <h2 className={styles.adInterstitialTitle}>
                  {ad.content.title}
                </h2>
                <p className={styles.adInterstitialDescription}>
                  {ad.content.description}
                </p>
                <button
                  className={styles.adInterstitialCta}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick();
                  }}
                >
                  {ad.content.ctaText}
                </button>
                <div className={styles.adInterstitialBrand}>
                  {ad.content.brandName}
                </div>
              </div>
            )}
          </div>

          {/* Ad label */}
          <div className={styles.adInterstitialLabel} aria-hidden="true">
            Advertisement
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};