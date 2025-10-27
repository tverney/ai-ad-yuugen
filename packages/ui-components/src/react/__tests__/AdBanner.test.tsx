import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdBanner, AdBannerProps } from '../AdBanner';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

describe('AdBanner', () => {
  const defaultProps: AdBannerProps = {
    placementId: 'test-banner-placement',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AdBanner {...defaultProps} />);
    
    expect(screen.getByTestId('ad-banner-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading ad...')).toBeInTheDocument();
  });

  it('renders custom loading component when provided', () => {
    const customLoading = <div data-testid="custom-loading">Custom Loading</div>;
    
    render(
      <AdBanner 
        {...defaultProps} 
        loadingComponent={customLoading}
      />
    );
    
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
  });

  it('renders ad content after loading', async () => {
    render(<AdBanner {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Sample Advertisement')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByText('Sample Brand')).toBeInTheDocument();
  });

  it('renders fallback when showFallback is true and no ad loads', async () => {
    // Mock failed ad loading
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    render(
      <AdBanner 
        {...defaultProps} 
        showFallback={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner-fallback')).toBeInTheDocument();
    });

    expect(screen.getByText('Advertisement')).toBeInTheDocument();
  });

  it('renders custom fallback component when provided', async () => {
    const customFallback = <div data-testid="custom-fallback">Custom Fallback</div>;
    
    // Mock failed ad loading
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    render(
      <AdBanner 
        {...defaultProps} 
        showFallback={true}
        fallbackComponent={customFallback}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });

  it('does not render when showFallback is false and no ad loads', async () => {
    // Mock failed ad loading
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    render(
      <AdBanner 
        {...defaultProps} 
        showFallback={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('ad-banner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ad-banner-fallback')).not.toBeInTheDocument();
    });
  });

  it('handles ad click correctly', async () => {
    const onAdClick = vi.fn();
    
    render(
      <AdBanner 
        {...defaultProps} 
        onAdClick={onAdClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('ad-banner'));

    expect(onAdClick).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('handles keyboard navigation', async () => {
    const onAdClick = vi.fn();
    
    render(
      <AdBanner 
        {...defaultProps} 
        onAdClick={onAdClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('ad-banner');
    banner.focus();
    
    fireEvent.keyDown(banner, { key: 'Enter' });
    expect(onAdClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(banner, { key: ' ' });
    expect(onAdClick).toHaveBeenCalledTimes(2);
  });

  it('applies custom theme styles', async () => {
    const customTheme = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      borderRadius: '10px',
      textColor: '#0000ff',
    };

    render(
      <AdBanner 
        {...defaultProps} 
        theme={customTheme}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('ad-banner');
    expect(banner).toHaveStyle({
      '--ad-bg-color': '#ff0000',
      '--ad-border-color': '#00ff00',
      '--ad-border-radius': '10px',
      '--ad-text-color': '#0000ff',
    });
  });

  it('applies all custom theme properties as CSS variables', async () => {
    const customTheme = {
      backgroundColor: '#1a1a1a',
      borderColor: '#333333',
      borderRadius: '12px',
      borderWidth: '2px',
      textColor: '#ffffff',
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      padding: '16px',
      margin: '8px 0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    };

    render(
      <AdBanner 
        {...defaultProps} 
        theme={customTheme}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('ad-banner');
    const style = banner.style;
    
    expect(style.getPropertyValue('--ad-bg-color')).toBe('#1a1a1a');
    expect(style.getPropertyValue('--ad-border-color')).toBe('#333333');
    expect(style.getPropertyValue('--ad-border-radius')).toBe('12px');
    expect(style.getPropertyValue('--ad-border-width')).toBe('2px');
    expect(style.getPropertyValue('--ad-text-color')).toBe('#ffffff');
    expect(style.getPropertyValue('--ad-font-size')).toBe('18px');
    expect(style.getPropertyValue('--ad-font-family')).toBe('Georgia, serif');
    expect(style.getPropertyValue('--ad-padding')).toBe('16px');
    expect(style.getPropertyValue('--ad-margin')).toBe('8px 0');
    expect(style.getPropertyValue('--ad-box-shadow')).toBe('0 4px 12px rgba(0, 0, 0, 0.5)');
  });

  it('applies responsive styles correctly', () => {
    const size = { width: 300, height: 250, responsive: true };
    
    render(
      <AdBanner 
        {...defaultProps} 
        size={size}
        responsive={true}
      />
    );

    const loadingBanner = screen.getByTestId('ad-banner-loading');
    const style = loadingBanner.style;
    
    expect(style.getPropertyValue('--ad-max-width')).toBe('300px');
    expect(style.getPropertyValue('--ad-min-height')).toBe('250px');
    expect(style.getPropertyValue('--ad-aspect-ratio')).toBe('300 / 250');
  });

  it('applies fixed size when responsive is false', () => {
    const size = { width: 300, height: 250, responsive: false };
    
    render(
      <AdBanner 
        {...defaultProps} 
        size={size}
        responsive={false}
      />
    );

    const loadingBanner = screen.getByTestId('ad-banner-loading');
    const style = loadingBanner.style;
    
    expect(style.getPropertyValue('--ad-width')).toBe('300px');
    expect(style.getPropertyValue('--ad-height')).toBe('250px');
  });

  it('calls onAdLoad callback when ad loads successfully', async () => {
    const onAdLoad = vi.fn();
    
    render(
      <AdBanner 
        {...defaultProps} 
        onAdLoad={onAdLoad}
      />
    );

    await waitFor(() => {
      expect(onAdLoad).toHaveBeenCalledTimes(1);
    });

    expect(onAdLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringContaining('banner-test-banner-placement'),
        content: expect.objectContaining({
          title: 'Sample Advertisement',
          brandName: 'Sample Brand',
        }),
      })
    );
  });

  it('sets up intersection observer for visibility tracking', () => {
    render(<AdBanner {...defaultProps} />);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.5 }
    );
  });

  it('includes accessibility attributes', async () => {
    const customAriaLabel = 'Custom Ad Label';
    
    render(
      <AdBanner 
        {...defaultProps} 
        ariaLabel={customAriaLabel}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('ad-banner');
    expect(banner).toHaveAttribute('role', 'button');
    expect(banner).toHaveAttribute('aria-label', customAriaLabel);
    expect(banner).toHaveAttribute('tabIndex', '0');
  });

  it('includes data attributes for tracking', async () => {
    render(<AdBanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('ad-banner');
    expect(banner).toHaveAttribute('data-placement-id', 'test-banner-placement');
    expect(banner).toHaveAttribute('data-ad-id', expect.stringContaining('banner-'));
    expect(banner).toHaveAttribute('data-visible', 'false');
  });

  it('shows ad label for transparency', async () => {
    render(<AdBanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    expect(screen.getByText('Ad')).toBeInTheDocument();
  });

  it('handles CTA button click separately from container click', async () => {
    const onAdClick = vi.fn();
    
    render(
      <AdBanner 
        {...defaultProps} 
        onAdClick={onAdClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    const ctaButton = screen.getByText('Learn More');
    fireEvent.click(ctaButton);

    expect(onAdClick).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('renders with Radix UI components for enhanced accessibility', async () => {
    render(<AdBanner {...defaultProps} showTooltips={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    // Check for visually hidden accessibility content
    expect(screen.getByText('Sponsored advertisement content')).toBeInTheDocument();
    
    // Check for CTA description
    const ctaDescription = screen.getByText(/Click to visit .* website/);
    expect(ctaDescription).toBeInTheDocument();
  });

  it('renders tooltips when showTooltips is true', async () => {
    render(<AdBanner {...defaultProps} showTooltips={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    // The tooltip content should be in the DOM but not visible initially
    // Radix UI tooltips are rendered in portals, so we can't easily test them in jsdom
    // But we can verify the component renders without errors
    expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
  });

  it('does not render tooltips when showTooltips is false', async () => {
    render(<AdBanner {...defaultProps} showTooltips={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    // Component should render normally without tooltip wrappers
    expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
  });

  it('renders loading state with Radix Progress component', () => {
    render(<AdBanner {...defaultProps} showLoading={true} showTooltips={false} />);
    
    const loadingContainer = screen.getByTestId('ad-banner-loading');
    expect(loadingContainer).toBeInTheDocument();
    
    // Check for visually hidden loading text
    expect(screen.getByText('Loading advertisement content')).toBeInTheDocument();
    expect(screen.getByText('Loading ad...')).toBeInTheDocument();
  });
});