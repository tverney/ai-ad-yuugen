import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdInterstitial } from '../AdInterstitial';

describe('AdInterstitial - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('does not render when isOpen is false', () => {
    render(<AdInterstitial placementId="test" isOpen={false} onClose={vi.fn()} />);
    
    expect(screen.queryByTestId('ad-interstitial-loading')).not.toBeInTheDocument();
  });

  it('renders loading state when isOpen is true', () => {
    render(<AdInterstitial placementId="test" isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByTestId('ad-interstitial-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading advertisement...')).toBeInTheDocument();
  });

  it('shows close button by default', async () => {
    render(<AdInterstitial placementId="test" isOpen={true} onClose={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByLabelText('Close advertisement')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    
    render(<AdInterstitial placementId="test" isOpen={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Close advertisement'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    
    render(<AdInterstitial placementId="test" isOpen={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('prevents body scroll when open', () => {
    render(<AdInterstitial placementId="test" isOpen={true} onClose={vi.fn()} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('includes accessibility attributes', async () => {
    render(<AdInterstitial placementId="test" isOpen={true} onClose={vi.fn()} ariaLabel="Test Modal" />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-label', 'Test Modal');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('shows advertisement label', async () => {
    render(<AdInterstitial placementId="test" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('ad-interstitial')).toBeInTheDocument();
    });

    expect(screen.getByText('Advertisement')).toBeInTheDocument();
  });
});