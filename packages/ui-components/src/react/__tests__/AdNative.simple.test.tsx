import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdNative } from '../AdNative';

describe('AdNative - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AdNative placementId="test-native" />);
    
    expect(screen.getByTestId('ad-native-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('renders ad content after loading', async () => {
    render(<AdNative placementId="test-native" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    }, { timeout: 1500 });

    expect(screen.getByText('Discover Amazing AI Tools')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders different layouts correctly', async () => {
    const { rerender } = render(<AdNative placementId="test" layout="card" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });
    expect(screen.getByTestId('ad-native')).toHaveAttribute('data-layout', 'card');

    rerender(<AdNative placementId="test" layout="inline" />);
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toHaveAttribute('data-layout', 'inline');
    });
  });

  it('handles ad click correctly', async () => {
    const onAdClick = vi.fn();
    
    render(<AdNative placementId="test-native" onAdClick={onAdClick} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('ad-native'));
    expect(onAdClick).toHaveBeenCalledTimes(1);
  });

  it('shows/hides elements based on props', async () => {
    const { rerender } = render(
      <AdNative placementId="test" showBrandName={true} showCTA={true} showAdLabel={true} />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByText('Sponsored')).toBeInTheDocument();

    rerender(
      <AdNative placementId="test" showBrandName={false} showCTA={false} showAdLabel={false} />
    );

    await waitFor(() => {
      expect(screen.queryByText('TechCorp Solutions')).not.toBeInTheDocument();
      expect(screen.queryByText('Learn More')).not.toBeInTheDocument();
      expect(screen.queryByText('Sponsored')).not.toBeInTheDocument();
    });
  });

  it('includes accessibility attributes', async () => {
    render(<AdNative placementId="test-native" ariaLabel="Test Native Ad" />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const nativeAd = screen.getByTestId('ad-native');
    expect(nativeAd).toHaveAttribute('role', 'article');
    expect(nativeAd).toHaveAttribute('aria-label', 'Test Native Ad');
    expect(nativeAd).toHaveAttribute('tabIndex', '0');
  });

  it('includes tracking data attributes', async () => {
    render(<AdNative placementId="test-native" layout="inline" />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-native')).toBeInTheDocument();
    });

    const nativeAd = screen.getByTestId('ad-native');
    expect(nativeAd).toHaveAttribute('data-placement-id', 'test-native');
    expect(nativeAd).toHaveAttribute('data-layout', 'inline');
    expect(nativeAd).toHaveAttribute('data-ad-id');
  });
});