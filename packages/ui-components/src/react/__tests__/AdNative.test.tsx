import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdNative, AdNativeProps } from '../AdNative';

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

describe('AdNative', () => {
  const defaultProps: AdNativeProps = {
    placementId: 'test-native-placement',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AdNative {...defaultProps} />);
    
    expect(screen.getByTestId('ad-native-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('renders custom loading component when provided', () => {
    const customLoading = <div data-testid="custom-loading">Custom Loading</div>;
    
    render(
      <AdNative 
        {...defaultProps} 
        loadingComponent={customLoading}
      />
    );
    
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('renders ad content after loading', async () => {
    render(<AdNative {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    }, { timeout: 1500 });

    expect(screen.getByText('Discover Amazing AI Tools')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument();
  });

  it('renders different layouts correctly', async () => {
    const layouts: Array<'card' | 'inline' | 'minimal' | 'featured'> = ['card', 'inline', 'minimal', 'featured'];
    
    for (const layout of layouts) {
      const { unmount } = render(
        <AdNative 
          {...defaultProps} 
          layout={layout}
          testId={`ad-native-${layout}`}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId(`ad-native-${layout}`)).toBeInTheDocument();
      });

      const container = screen.getByTestId(`ad-native-${layout}`);
      expect(container).toHaveAttribute('data-layout', layout);
      
      unmount();
    }
  });

  it('renders card layout with all elements', async () => {
    render(
      <AdNative 
        {...defaultProps} 
        layout="card"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    expect(screen.getByText('Discover Amazing AI Tools')).toBeInTheDocument();
    expect(screen.getByText(/Boost your productivity/)).toBeInTheDocument();
    expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders inline layout with compact design', async () => {
    render(
      <AdNative 
        {...defaultProps} 
        layout="inline"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const container = screen.getByTestId('ad-native');
    expect(container).toHaveStyle({ display: 'flex' });
  });

  it('renders minimal layout without border and shadow', async () => {
    render(
      <AdNative 
        {...defaultProps} 
        layout="minimal"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const container = screen.getByTestId('ad-native');
    expect(container).toHaveStyle({ 
      border: 'none',
      boxShadow: 'none',
      backgroundColor: 'transparent'
    });
  });

  it('renders featured layout with enhanced styling', async () => {
    render(
      <AdNative 
        {...defaultProps} 
        layout="featured"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    // Featured layout should have larger title
    const title = screen.getByText('Discover Amazing AI Tools');
    expect(title.tagName).toBe('H2');
  });

  it('handles showImage prop correctly', async () => {
    const { rerender } = render(
      <AdNative 
        {...defaultProps} 
        showImage={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    expect(screen.getByRole('img')).toBeInTheDocument();

    rerender(
      <AdNative 
        {...defaultProps} 
        showImage={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  it('handles showBrandName prop correctly', async () => {
    const { rerender } = render(
      <AdNative 
        {...defaultProps} 
        showBrandName={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument();

    rerender(
      <AdNative 
        {...defaultProps} 
        showBrandName={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('TechCorp Solutions')).not.toBeInTheDocument();
    });
  });

  it('handles showCTA prop correctly', async () => {
    const { rerender } = render(
      <AdNative 
        {...defaultProps} 
        showCTA={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    expect(screen.getByText('Learn More')).toBeInTheDocument();

    rerender(
      <AdNative 
        {...defaultProps} 
        showCTA={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Learn More')).not.toBeInTheDocument();
    });
  });

  it('handles showAdLabel prop correctly', async () => {
    const { rerender } = render(
      <AdNative 
        {...defaultProps} 
        showAdLabel={true}
        adLabelText="Sponsored"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    expect(screen.getByText('Sponsored')).toBeInTheDocument();

    rerender(
      <AdNative 
        {...defaultProps} 
        showAdLabel={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Sponsored')).not.toBeInTheDocument();
    });
  });

  it('handles ad click correctly', async () => {
    const onAdClick = vi.fn();
    
    render(
      <AdNative 
        {...defaultProps} 
        onAdClick={onAdClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('ad-native'));

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
      <AdNative 
        {...defaultProps} 
        onAdClick={onAdClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const nativeAd = screen.getByTestId('ad-native');
    nativeAd.focus();
    
    fireEvent.keyDown(nativeAd, { key: 'Enter' });
    expect(onAdClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(nativeAd, { key: ' ' });
    expect(onAdClick).toHaveBeenCalledTimes(2);
  });

  it('handles CTA button click separately from container click', async () => {
    const onAdClick = vi.fn();
    
    render(
      <AdNative 
        {...defaultProps} 
        onAdClick={onAdClick}
        showCTA={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
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

  it('applies custom theme styles', async () => {
    const customTheme = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      borderRadius: '10px',
      textColor: '#0000ff',
      titleColor: '#ff00ff',
    };

    render(
      <AdNative 
        {...defaultProps} 
        theme={customTheme}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const nativeAd = screen.getByTestId('ad-native');
    expect(nativeAd).toHaveStyle({
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      borderRadius: '10px',
      color: '#0000ff',
    });
  });

  it('renders fallback when showFallback is true and no ad loads', async () => {
    // Mock failed ad loading
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    render(
      <AdNative 
        {...defaultProps} 
        showFallback={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-native-fallback')).toBeInTheDocument();
    });

    expect(screen.getByText('Sponsored Content')).toBeInTheDocument();
  });

  it('renders custom fallback component when provided', async () => {
    const customFallback = <div data-testid="custom-fallback">Custom Fallback</div>;
    
    // Mock failed ad loading
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    render(
      <AdNative 
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
      <AdNative 
        {...defaultProps} 
        showFallback={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('ad-native')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ad-native-fallback')).not.toBeInTheDocument();
    });
  });

  it('truncates description in inline layout', async () => {
    render(
      <AdNative 
        {...defaultProps} 
        layout="inline"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    // The description should be truncated in inline layout
    const description = screen.getByText(/Boost your productivity/);
    expect(description.textContent).toMatch(/\.\.\.$/);
  });

  it('sets up intersection observer for visibility tracking', () => {
    render(<AdNative {...defaultProps} />);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.5 }
    );
  });

  it('includes accessibility attributes', async () => {
    const customAriaLabel = 'Custom Native Ad Label';
    
    render(
      <AdNative 
        {...defaultProps} 
        ariaLabel={customAriaLabel}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const nativeAd = screen.getByTestId('ad-native');
    expect(nativeAd).toHaveAttribute('role', 'article');
    expect(nativeAd).toHaveAttribute('aria-label', customAriaLabel);
    expect(nativeAd).toHaveAttribute('tabIndex', '0');
  });

  it('includes data attributes for tracking', async () => {
    render(<AdNative {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const nativeAd = screen.getByTestId('ad-native');
    expect(nativeAd).toHaveAttribute('data-placement-id', 'test-native-placement');
    expect(nativeAd).toHaveAttribute('data-ad-id', expect.stringContaining('native-'));
    expect(nativeAd).toHaveAttribute('data-layout', 'card');
    expect(nativeAd).toHaveAttribute('data-visible', 'false');
  });

  it('applies hover effects on mouse enter/leave', async () => {
    render(<AdNative {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const nativeAd = screen.getByTestId('ad-native');
    
    fireEvent.mouseEnter(nativeAd);
    expect(nativeAd).toHaveStyle({ transform: 'translateY(-2px)' });

    fireEvent.mouseLeave(nativeAd);
    expect(nativeAd).toHaveStyle({ transform: 'translateY(0)' });
  });

  it('calls onAdLoad callback when ad loads successfully', async () => {
    const onAdLoad = vi.fn();
    
    render(
      <AdNative 
        {...defaultProps} 
        onAdLoad={onAdLoad}
      />
    );

    await waitFor(() => {
      expect(onAdLoad).toHaveBeenCalledTimes(1);
    });

    expect(onAdLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringContaining('native-test-native-placement'),
        content: expect.objectContaining({
          title: 'Discover Amazing AI Tools',
          brandName: 'TechCorp Solutions',
        }),
      })
    );
  });
});