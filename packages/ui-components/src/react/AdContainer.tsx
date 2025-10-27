import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AdPosition } from '../types/ad';
import styles from './AdContainer.module.css';

export interface AdContainerProps {
  /** Child components (typically ad components) */
  children: React.ReactNode;
  /** Unique identifier for the container */
  containerId?: string;
  /** Position behavior of the container */
  position?: AdPosition;
  /** Whether the container should be sticky */
  sticky?: boolean;
  /** Sticky offset from top/bottom */
  stickyOffset?: number;
  /** Custom CSS class */
  className?: string;
  /** Custom theme configuration (deprecated - use CSS custom properties instead) */
  theme?: AdContainerTheme;
  /** Whether to show container border */
  showBorder?: boolean;
  /** Whether to add spacing around content */
  addSpacing?: boolean;
  /** Maximum width of the container */
  maxWidth?: string;
  /** Whether to center the container */
  centered?: boolean;
  /** Whether the container should be responsive */
  responsive?: boolean;
  /** Callback when container becomes visible */
  onVisible?: () => void;
  /** Callback when container becomes hidden */
  onHidden?: () => void;
  /** Whether to track visibility */
  trackVisibility?: boolean;
  /** Visibility threshold (0-1) */
  visibilityThreshold?: number;
  /** Accessibility label */
  ariaLabel?: string;
  /** Test ID for testing */
  testId?: string;
}

export interface AdContainerTheme {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
  backdropFilter?: string;
}

/**
 * AdContainer React component for wrapping and positioning ad components
 * Provides layout management, positioning, and visibility tracking
 */
export const AdContainer: React.FC<AdContainerProps> = ({
  children,
  containerId,
  position = AdPosition.INLINE,
  sticky = false,
  stickyOffset = 0,
  className,

  theme,
  showBorder = false,
  addSpacing = true,
  maxWidth,
  centered = false,
  responsive = true,
  onVisible,
  onHidden,
  trackVisibility = false,
  visibilityThreshold = 0.5,
  ariaLabel = 'Advertisement Container',
  testId = 'ad-container'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Visibility tracking with Intersection Observer
  useEffect(() => {
    if (!trackVisibility) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && onVisible) {
          onVisible();
        } else if (!visible && onHidden) {
          onHidden();
        }
      },
      { threshold: visibilityThreshold }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [trackVisibility, visibilityThreshold, onVisible, onHidden]);

  // Sticky behavior tracking
  useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const shouldBeSticky = position === AdPosition.TOP 
        ? rect.top <= stickyOffset 
        : rect.bottom >= window.innerHeight - stickyOffset;
      
      setIsSticky(shouldBeSticky);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sticky, position, stickyOffset]);

  // Generate container classes based on position and configuration
  const getContainerClasses = useCallback((): string => {
    const classes = [styles.adContainer];

    // Base modifiers
    if (responsive) classes.push(styles.adContainerResponsive);
    if (centered) classes.push(styles.adContainerCentered);
    if (showBorder) classes.push(styles.adContainerWithBorder);
    if (addSpacing) classes.push(styles.adContainerWithSpacing);

    // Position-specific classes
    switch (position) {
      case AdPosition.TOP:
        classes.push(styles.adContainerTop);
        if (sticky && isSticky) classes.push(styles.adContainerTopSticky);
        break;
      case AdPosition.BOTTOM:
        classes.push(styles.adContainerBottom);
        if (sticky && isSticky) classes.push(styles.adContainerBottomSticky);
        break;
      case AdPosition.LEFT:
        classes.push(styles.adContainerLeft);
        break;
      case AdPosition.RIGHT:
        classes.push(styles.adContainerRight);
        break;
      case AdPosition.FLOATING:
        classes.push(styles.adContainerFloating);
        break;
      case AdPosition.OVERLAY:
        classes.push(styles.adContainerOverlay);
        break;
      case AdPosition.INLINE:
      default:
        classes.push(styles.adContainerInline);
        break;
    }

    if (className) classes.push(className);

    return classes.join(' ');
  }, [position, sticky, isSticky, responsive, centered, showBorder, addSpacing, className]);

  // Generate CSS custom properties for theming
  const getCustomProperties = useCallback((): React.CSSProperties => {
    const customProps: Record<string, string> = {};

    if (theme) {
      if (theme.backgroundColor) customProps['--ad-container-bg-color'] = theme.backgroundColor;
      if (theme.borderColor) customProps['--ad-container-border-color'] = theme.borderColor;
      if (theme.borderRadius) customProps['--ad-container-border-radius'] = theme.borderRadius;
      if (theme.borderWidth) customProps['--ad-container-border-width'] = theme.borderWidth;
      if (theme.padding) customProps['--ad-container-padding'] = theme.padding;
      if (theme.margin) customProps['--ad-container-margin'] = theme.margin;
      if (theme.boxShadow) customProps['--ad-container-box-shadow'] = theme.boxShadow;
      if (theme.backdropFilter) customProps['--ad-container-backdrop-filter'] = theme.backdropFilter;
    }

    if (maxWidth) customProps['--ad-container-max-width'] = maxWidth;
    if (stickyOffset) customProps['--ad-container-sticky-offset'] = `${stickyOffset}px`;

    return customProps as React.CSSProperties;
  }, [theme, maxWidth, stickyOffset]);

  // Handle responsive behavior
  useEffect(() => {
    if (!responsive) return;

    const handleResize = () => {
      // Trigger re-render on resize for responsive adjustments
      if (containerRef.current) {
        containerRef.current.style.width = '100%';
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={getContainerClasses()}
      style={getCustomProperties()}
      role="region"
      aria-label={ariaLabel}
      data-testid={testId}
      data-position={position}
      data-sticky={sticky}
      data-is-sticky={isSticky}
      data-visible={isVisible}
      data-container-id={containerId}
    >
      {children}
      
      {/* Sticky indicator for debugging */}
      {sticky && isSticky && false && (
        <div className={styles.stickyIndicator}>
          STICKY
        </div>
      )}
    </div>
  );
};