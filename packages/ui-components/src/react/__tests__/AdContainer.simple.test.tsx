import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdContainer } from '../AdContainer';
import { AdPosition } from '@ai-yuugen/types';

describe('AdContainer - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    const { rerender } = render(
      <AdContainer position={AdPosition.TOP}>
        <div>Content</div>
      </AdContainer>
    );
    
    expect(screen.getByTestId('ad-container')).toHaveAttribute('data-position', 'top');

    rerender(
      <AdContainer position={AdPosition.FLOATING}>
        <div>Content</div>
      </AdContainer>
    );
    
    expect(screen.getByTestId('ad-container')).toHaveAttribute('data-position', 'floating');
  });

  it('applies floating position styles', () => {
    render(
      <AdContainer position={AdPosition.FLOATING}>
        <div>Content</div>
      </AdContainer>
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ 
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    });
  });

  it('shows border when showBorder is true', () => {
    render(
      <AdContainer showBorder={true}>
        <div>Content</div>
      </AdContainer>
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ border: '1px solid #e9ecef' });
  });

  it('applies responsive width when responsive is true', () => {
    render(
      <AdContainer responsive={true}>
        <div>Content</div>
      </AdContainer>
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ width: '100%' });
  });

  it('applies maxWidth correctly', () => {
    render(
      <AdContainer maxWidth="500px">
        <div>Content</div>
      </AdContainer>
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ maxWidth: '500px' });
  });

  it('includes accessibility attributes', () => {
    render(
      <AdContainer ariaLabel="Custom Container Label">
        <div>Content</div>
      </AdContainer>
    );

    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-label', 'Custom Container Label');
  });

  it('applies custom className and style', () => {
    const customStyle = { fontSize: '18px', fontWeight: 'bold' };
    
    render(
      <AdContainer className="custom-class" style={customStyle}>
        <div>Content</div>
      </AdContainer>
    );

    const container = screen.getByTestId('ad-container');
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveStyle(customStyle);
  });

  it('handles multiple children correctly', () => {
    render(
      <AdContainer>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </AdContainer>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });
});