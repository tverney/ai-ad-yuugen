import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdInterstitial, AdInterstitialProps } from '../AdInterstitial';

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

// Mock document.body.style
Object.defineProperty(document.body, 'style', {
  value: {
    overflow: '',
  },
  writable: true,
});

describe('AdInterstitial', () => {
  const defaultProps: AdInterstitialProps = {
    placementId: 'test-interstitial-placement',
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = '';
  });

  it('does not render when isOpen is false', () => {
    render(
      <AdInterstitial 
        {...defaultProps} 
        isOpen={false}
      />
    );
    
    expect(screen.queryByTestId('ad-interstitial-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ad-interstitial')).not.toBeInTheDocument();
  });

  it('renders loading state when isOpen is true', () => {
    render(<AdInterstitial {...defaultProps} />);
    
    expect(screen.getByTestId('ad-interstitial-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading advertisement...')).toBeInTheDocument();
  });

  it('renders custom loading component when provided', () => {
    const customLoading = <div data-testid="custom-loading">Custom Loading</div>;
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        loadingComponent={customLoading}
      />
    );
    
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('renders ad content after loading', async () => {
    render(<AdInterstitial {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Special Offer!')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Premium Brand')).toBeInTheDocument();
  });

  it('shows close button by default', async () => {
    render(<AdInterstitial {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Close advertisement')).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', async () => {
    render(
      <AdInterstitial 
        {...defaultProps} 
        showCloseButton={false}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Close advertisement')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onClose={onClose}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Close advertisement'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked and closeOnOverlayClick is true', async () => {
    const onClose = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onClose={onClose}
        closeOnOverlayClick={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    // Click on the overlay (parent div)
    const overlay = screen.getByTestId('ad-interstitial').parentElement;
    fireEvent.click(overlay!);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when overlay is clicked and closeOnOverlayClick is false', async () => {
    const onClose = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onClose={onClose}
        closeOnOverlayClick={false}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('ad-interstitial').parentElement;
    fireEvent.click(overlay!);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed and closeOnEscape is true', async () => {
    const onClose = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onClose={onClose}
        closeOnEscape={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when Escape key is pressed and closeOnEscape is false', async () => {
    const onClose = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onClose={onClose}
        closeOnEscape={false}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('auto-closes after specified delay', async () => {
    const onClose = vi.fn();
    vi.useFakeTimers();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onClose={onClose}
        autoCloseDelay={3000}
      />
    );

    // Fast-forward time
    vi.advanceTimersByTime(3000);
    
    expect(onClose).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('does not auto-close when autoCloseDelay is 0', async () => {
    const onClose = vi.fn();
    vi.useFakeTimers();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onClose={onClose}
        autoCloseDelay={0}
      />
    );

    vi.advanceTimersByTime(5000);
    expect(onClose).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('handles ad click correctly', async () => {
    const onAdClick = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onAdClick={onAdClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    const adContent = screen.getByRole('button', { name: /special offer/i });
    fireEvent.click(adContent);

    expect(onAdClick).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('handles keyboard navigation on ad content', async () => {
    const onAdClick = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onAdClick={onAdClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    const adContent = screen.getByRole('button', { name: /special offer/i });
    
    fireEvent.keyDown(adContent, { key: 'Enter' });
    expect(onAdClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(adContent, { key: ' ' });
    expect(onAdClick).toHaveBeenCalledTimes(2);
  });

  it('applies custom theme styles', async () => {
    const customTheme = {
      overlayColor: 'rgba(255, 0, 0, 0.8)',
      backgroundColor: '#00ff00',
      borderRadius: '15px',
      textColor: '#0000ff',
    };

    render(
      <AdInterstitial 
        {...defaultProps} 
        theme={customTheme}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveStyle({
      backgroundColor: '#00ff00',
      borderRadius: '15px',
      color: '#0000ff',
    });
  });

  it('prevents body scroll when open', () => {
    render(<AdInterstitial {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<AdInterstitial {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <AdInterstitial 
        {...defaultProps} 
        isOpen={false}
      />
    );
    
    expect(document.body.style.overflow).toBe('');
  });

  it('renders fallback when ad fails to load', async () => {
    // Mock failed ad loading
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    render(<AdInterstitial {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial-fallback')).toBeInTheDocument();
    });

    expect(screen.getByText('Advertisement Unavailable')).toBeInTheDocument();
  });

  it('renders custom fallback component when provided', async () => {
    const customFallback = <div data-testid="custom-fallback">Custom Fallback</div>;
    
    // Mock failed ad loading
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    render(
      <AdInterstitial 
        {...defaultProps} 
        fallbackComponent={customFallback}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });

  it('includes accessibility attributes', async () => {
    const customAriaLabel = 'Custom Interstitial Label';
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        ariaLabel={customAriaLabel}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-label', customAriaLabel);
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('tabIndex', '-1');
  });

  it('includes data attributes for tracking', async () => {
    render(<AdInterstitial {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    const container = screen.getByTestId('ad-interstitial');
    expect(container).toHaveAttribute('data-placement-id', 'test-interstitial-placement');
    expect(container).toHaveAttribute('data-ad-id', expect.stringContaining('interstitial-'));
  });

  it('shows advertisement label', async () => {
    render(<AdInterstitial {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    expect(screen.getByText('Advertisement')).toBeInTheDocument();
  });

  it('calls onAdLoad callback when ad loads successfully', async () => {
    const onAdLoad = vi.fn();
    
    render(
      <AdInterstitial 
        {...defaultProps} 
        onAdLoad={onAdLoad}
      />
    );

    await waitFor(() => {
      expect(onAdLoad).toHaveBeenCalledTimes(1);
    });

    expect(onAdLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringContaining('interstitial-test-interstitial-placement'),
        content: expect.objectContaining({
          title: 'Special Offer!',
          brandName: 'Premium Brand',
        }),
      })
    );
  });
});