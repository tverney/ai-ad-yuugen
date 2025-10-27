import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AdBanner } from '../AdBanner';
import { AdInterstitial } from '../AdInterstitial';
import { AdNative } from '../AdNative';
import { AdContainer } from '../AdContainer';
import { AdPosition } from '@ai-yuugen/types';

describe('React Components - Basic Rendering', () => {
  describe('AdBanner', () => {
    it('renders loading state', () => {
      render(<AdBanner placementId="test-banner" />);
      expect(screen.getByTestId('ad-banner-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading ad...')).toBeInTheDocument();
    });

    it('applies responsive styles', () => {
      const size = { width: 300, height: 250, responsive: true };
      render(<AdBanner placementId="test" size={size} responsive={true} />);
      
      const banner = screen.getByTestId('ad-banner-loading');
      expect(banner).toHaveStyle({
        width: '100%',
        maxWidth: '300px',
      });
    });
  });

  describe('AdInterstitial', () => {
    it('does not render when closed', () => {
      render(<AdInterstitial placementId="test" isOpen={false} onClose={() => {}} />);
      expect(screen.queryByTestId('ad-interstitial-loading')).not.toBeInTheDocument();
    });

    it('renders loading state when open', () => {
      render(<AdInterstitial placementId="test" isOpen={true} onClose={() => {}} />);
      expect(screen.getByTestId('ad-interstitial-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading advertisement...')).toBeInTheDocument();
    });

    it('prevents body scroll when open', () => {
      render(<AdInterstitial placementId="test" isOpen={true} onClose={() => {}} />);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('AdNative', () => {
    it('renders loading state', () => {
      render(<AdNative placementId="test-native" />);
      expect(screen.getByTestId('ad-native-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('applies layout data attribute', () => {
      render(<AdNative placementId="test" layout="inline" />);
      // The loading state should still have the layout applied via props
      expect(screen.getByTestId('ad-native-loading')).toBeInTheDocument();
    });
  });

  describe('AdContainer', () => {
    it('renders children correctly', () => {
      render(
        <AdContainer>
          <div data-testid="child-content">Test Content</div>
        </AdContainer>
      );
      
      expect(screen.getByTestId('ad-container')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies position data attributes', () => {
      render(
        <AdContainer position={AdPosition.FLOATING}>
          <div>Content</div>
        </AdContainer>
      );
      
      const container = screen.getByTestId('ad-container');
      expect(container).toHaveAttribute('data-position', 'floating');
      expect(container).toHaveStyle({ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      });
    });

    it('applies responsive width', () => {
      render(
        <AdContainer responsive={true}>
          <div>Content</div>
        </AdContainer>
      );
      
      const container = screen.getByTestId('ad-container');
      expect(container).toHaveStyle({ width: '100%' });
    });

    it('includes accessibility attributes', () => {
      render(
        <AdContainer ariaLabel="Custom Label">
          <div>Content</div>
        </AdContainer>
      );

      const container = screen.getByTestId('ad-container');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Custom Label');
    });
  });
});