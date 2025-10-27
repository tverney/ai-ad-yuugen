import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Ad } from '../types/ad';
import { generatePlaceholderImage } from '../utils/placeholderImage';

export interface AdNativeProps {
  /** Unique identifier for the ad placement */
  placementId: string;
  /** Layout variant for the native ad */
  layout?: 'card' | 'inline' | 'minimal' | 'featured';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Custom theme configuration */
  theme?: AdNativeTheme;
  /** Callback when ad loads successfully */
  onAdLoad?: (ad: Ad) => void;
  /** Callback when ad fails to load */
  onAdError?: (error: Error) => void;
  /** Callback when ad is clicked */
  onAdClick?: (ad: Ad) => void;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Whether to show fallback when no ad is available */
  showFallback?: boolean;
  /** Custom fallback component */
  fallbackComponent?: React.ReactNode;
  /** Whether to show ad disclosure label */
  showAdLabel?: boolean;
  /** Custom ad label text */
  adLabelText?: string;
  /** Whether to show brand name */
  showBrandName?: boolean;
  /** Whether to show CTA button */
  showCTA?: boolean;
  /** Whether to show image */
  showImage?: boolean;
  /** Image aspect ratio */
  imageAspectRatio?: string;
  /** Accessibility label */
  ariaLabel?: string;
  /** Test ID for testing */
  testId?: string;
}

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
 * AdNative React component for displaying native advertisements that blend with content
 * Supports multiple layouts, customizable styling, and accessibility features
 */
export const AdNative: React.FC<AdNativeProps> = ({
  placementId,
  layout = 'card',
  className,
  style,
  theme,
  onAdLoad,
  onAdError,
  onAdClick,
  showLoading = true,
  loadingComponent,
  showFallback = true,
  fallbackComponent,
  showAdLabel = true,
  adLabelText = 'Sponsored',
  showBrandName = true,
  showCTA = true,
  showImage = true,
  imageAspectRatio = '16/9',
  ariaLabel = 'Native Advertisement',
  testId = 'ad-native'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [, setImageLoaded] = useState(false);

  // Intersection Observer for viewability tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load ad data
  useEffect(() => {
    const loadAd = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock ad data
        const mockAd: Ad = {
          id: `native-${placementId}-${Date.now()}`,
          type: 'native',
          format: 'display',
          content: {
            title: 'Discover Amazing AI Tools',
            description: 'Boost your productivity with cutting-edge AI solutions. Join thousands of satisfied users who have transformed their workflow.',
            imageUrl: showImage ? generatePlaceholderImage(400, 225, 'Native Ad', '#28a745', '#ffffff') : undefined,
            ctaText: 'Learn More',
            landingUrl: 'https://example.com',
            brandName: 'TechCorp Solutions',
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
  }, [placementId, showImage, onAdLoad, onAdError]);

  // Handle ad click
  const handleAdClick = useCallback(() => {
    if (ad) {
      onAdClick?.(ad);
      if (ad.content.landingUrl) {
        window.open(ad.content.landingUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, [ad, onAdClick]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleAdClick();
    }
  }, [handleAdClick]);

  // Get layout-specific styles
  const getLayoutStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      backgroundColor: theme?.backgroundColor || '#ffffff',
      border: `${theme?.borderWidth || '1px'} solid ${theme?.borderColor || '#e9ecef'}`,
      borderRadius: theme?.borderRadius || '8px',
      padding: theme?.padding || '16px',
      margin: theme?.margin || '0',
      boxShadow: theme?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.1)',
      color: theme?.textColor || '#333',
      fontSize: theme?.fontSize || '14px',
      fontFamily: theme?.fontFamily || 'system-ui, -apple-system, sans-serif',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      position: 'relative',
      ...style,
    };

    switch (layout) {
      case 'inline':
        return {
          ...baseStyles,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: theme?.padding || '12px',
        };
      case 'minimal':
        return {
          ...baseStyles,
          border: 'none',
          boxShadow: 'none',
          backgroundColor: 'transparent',
          padding: theme?.padding || '8px',
        };
      case 'featured':
        return {
          ...baseStyles,
          padding: theme?.padding || '24px',
          boxShadow: theme?.boxShadow || '0 4px 12px rgba(0, 0, 0, 0.15)',
        };
      case 'card':
      default:
        return baseStyles;
    }
  }, [layout, theme, style]);

  // Render loading state
  if (loading && showLoading) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={getLayoutStyles()}
        role="img"
        aria-label="Loading native advertisement"
        data-testid={`${testId}-loading`}
      >
        {loadingComponent || (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '20px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e9ecef',
                borderTop: '2px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>Loading content...</span>
          </div>
        )}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Render error or fallback state
  if (error || !ad) {
    if (!showFallback) return null;

    return (
      <div
        ref={containerRef}
        className={className}
        style={getLayoutStyles()}
        role="img"
        aria-label="Native advertisement placeholder"
        data-testid={`${testId}-fallback`}
      >
        {fallbackComponent || (
          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📰</div>
            <div>Sponsored Content</div>
          </div>
        )}
      </div>
    );
  }

  // Render native ad content based on layout
  const renderContent = () => {
    const titleStyle: React.CSSProperties = {
      margin: '0 0 8px 0',
      fontSize: theme?.titleFontSize || '18px',
      fontWeight: 'bold',
      color: theme?.titleColor || theme?.textColor || '#333',
      lineHeight: '1.3',
    };

    const descriptionStyle: React.CSSProperties = {
      margin: '0 0 12px 0',
      fontSize: theme?.descriptionFontSize || '14px',
      color: theme?.descriptionColor || theme?.textColor || '#666',
      lineHeight: '1.4',
    };

    const brandStyle: React.CSSProperties = {
      fontSize: theme?.brandFontSize || '12px',
      color: theme?.brandColor || theme?.textColor || '#888',
      fontWeight: '500',
    };

    const ctaStyle: React.CSSProperties = {
      backgroundColor: theme?.ctaBackgroundColor || '#007bff',
      color: theme?.ctaTextColor || 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      fontSize: theme?.ctaFontSize || '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    };

    const imageStyle: React.CSSProperties = {
      width: '100%',
      height: 'auto',
      borderRadius: '4px',
      objectFit: 'cover',
      aspectRatio: imageAspectRatio,
    };

    switch (layout) {
      case 'inline':
        return (
          <>
            {showImage && ad.content.imageUrl && (
              <div style={{ flexShrink: 0, width: '80px', height: '80px' }}>
                <img
                  src={ad.content.imageUrl}
                  alt={ad.content.title}
                  style={{
                    ...imageStyle,
                    width: '80px',
                    height: '80px',
                    aspectRatio: '1',
                  }}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ ...titleStyle, fontSize: '16px', marginBottom: '4px' }}>
                {ad.content.title}
              </h3>
              <p style={{ ...descriptionStyle, fontSize: '13px', marginBottom: '8px' }}>
                {ad.content.description.length > 100 
                  ? `${ad.content.description.substring(0, 100)}...` 
                  : ad.content.description}
              </p>
              {showBrandName && (
                <div style={brandStyle}>{ad.content.brandName}</div>
              )}
            </div>
          </>
        );

      case 'minimal':
        return (
          <div>
            <h3 style={{ ...titleStyle, fontSize: '16px' }}>
              {ad.content.title}
            </h3>
            <p style={{ ...descriptionStyle, fontSize: '13px' }}>
              {ad.content.description.length > 120 
                ? `${ad.content.description.substring(0, 120)}...` 
                : ad.content.description}
            </p>
            {showBrandName && (
              <div style={brandStyle}>{ad.content.brandName}</div>
            )}
          </div>
        );

      case 'featured':
        return (
          <div>
            {showImage && ad.content.imageUrl && (
              <div style={{ marginBottom: '16px' }}>
                <img
                  src={ad.content.imageUrl}
                  alt={ad.content.title}
                  style={imageStyle}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            )}
            <h2 style={{ ...titleStyle, fontSize: '22px', marginBottom: '12px' }}>
              {ad.content.title}
            </h2>
            <p style={{ ...descriptionStyle, fontSize: '16px', marginBottom: '16px' }}>
              {ad.content.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {showBrandName && (
                <div style={brandStyle}>{ad.content.brandName}</div>
              )}
              {showCTA && (
                <button
                  style={ctaStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme?.ctaHoverBackgroundColor || '#0056b3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme?.ctaBackgroundColor || '#007bff';
                  }}
                >
                  {ad.content.ctaText}
                </button>
              )}
            </div>
          </div>
        );

      case 'card':
      default:
        return (
          <div>
            {showImage && ad.content.imageUrl && (
              <div style={{ marginBottom: '12px' }}>
                <img
                  src={ad.content.imageUrl}
                  alt={ad.content.title}
                  style={imageStyle}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            )}
            <h3 style={titleStyle}>{ad.content.title}</h3>
            <p style={descriptionStyle}>{ad.content.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {showBrandName && (
                <div style={brandStyle}>{ad.content.brandName}</div>
              )}
              {showCTA && (
                <button
                  style={ctaStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme?.ctaHoverBackgroundColor || '#0056b3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme?.ctaBackgroundColor || '#007bff';
                  }}
                >
                  {ad.content.ctaText}
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={getLayoutStyles()}
      role="article"
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={handleAdClick}
      onKeyDown={handleKeyDown}
      data-testid={testId}
      data-ad-id={ad.id}
      data-placement-id={placementId}
      data-layout={layout}
      data-visible={isVisible}
      onMouseEnter={(e) => {
        if (layout !== 'minimal') {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = theme?.boxShadow?.replace('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.15)') || '0 4px 8px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (layout !== 'minimal') {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = theme?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {renderContent()}

      {/* Ad disclosure label */}
      {showAdLabel && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: theme?.adLabelBackgroundColor || 'rgba(0, 0, 0, 0.7)',
            color: theme?.adLabelColor || 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '2px',
            pointerEvents: 'none',
            fontWeight: '500',
          }}
        >
          {adLabelText}
        </div>
      )}
    </div>
  );
};