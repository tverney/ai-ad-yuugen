import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdBanner } from '../AdBanner';

describe('AdBanner - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AdBanner placementId="test-banner" />);
    
    expect(screen.getByTestId('ad-banner-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading ad...')).toBeInTheDocument();
  });

  it('renders ad content after loading', async () => {
    render(<AdBanner placementId="test-banner" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Sample Advertisement')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('handles ad click correctly', async () => {
    const onAdClick = vi.fn();
    
    render(<AdBanner placementId="test-banner" onAdClick={onAdClick} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('ad-banner'));
    expect(onAdClick).toHaveBeenCalledTimes(1);
  });

  it('includes accessibility attributes', async () => {
    render(<AdBanner placementId="test-banner" ariaLabel="Test Ad" />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('ad-banner');
    expect(banner).toHaveAttribute('role', 'img');
    expect(banner).toHaveAttribute('aria-label', 'Test Ad');
    expect(banner).toHaveAttribute('tabIndex', '0');
  });

  it('applies responsive styles correctly', () => {
    const size = { width: 300, height: 250, responsive: true };
    
    render(<AdBanner placementId="test-banner" size={size} responsive={true} />);

    const loadingBanner = screen.getByTestId('ad-banner-loading');
    expect(loadingBanner).toHaveStyle({
      width: '100%',
      maxWidth: '300px',
    });
  });

  it('shows ad transparency label', async () => {
    render(<AdBanner placementId="test-banner" />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-banner')).toBeInTheDocument();
    });

    expect(screen.getByText('Ad')).toBeInTheDocument();
  });
});