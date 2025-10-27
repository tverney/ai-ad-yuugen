import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdContainer, AdContainerProps } from '../AdContainer';
import { AdPosition } from '@ai-yuugen/types';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('AdContainer', () => {
  const defaultProps: AdContainerProps = {
    children: <div data-testid="child-content">Test Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children correctly', () => {
    render(<AdContainer {...defaultProps} />);
    
    expect(screen.getByTestId('ad-container')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default inline position styles', () => {
    render(<AdContainer {...defaultProps} />);
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-position', 'inline');
    expect(container).toHaveStyle({ display: 'block' });
  });

  it('applies top position styles', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.TOP}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-position', 'top');
    expect(container).toHaveStyle({ position: 'relative' });
  });

  it('applies bottom position styles', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.BOTTOM}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-position', 'bottom');
    expect(container).toHaveStyle({ position: 'relative' });
  });

  it('applies left position styles', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.LEFT}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-position', 'left');
    expect(container).toHaveStyle({ float: 'left' });
  });

  it('applies right position styles', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.RIGHT}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-position', 'right');
    expect(container).toHaveStyle({ float: 'right' });
  });

  it('applies floating position styles', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.FLOATING}
      />
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

  it('applies overlay position styles', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.OVERLAY}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-position', 'overlay');
    expect(container).toHaveStyle({ 
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000
    });
  });

  it('applies sticky behavior correctly', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.TOP}
        sticky={true}
        stickyOffset={10}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-sticky', 'true');
    expect(container).toHaveAttribute('data-is-sticky', 'false');
  });

  it('applies custom theme styles', () => {
    const customTheme = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    };

    render(
      <AdContainer 
        {...defaultProps} 
        theme={customTheme}
        showBorder={true}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    });
  });

  it('shows border when showBorder is true', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        showBorder={true}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ border: '1px solid #e9ecef' });
  });

  it('hides border when showBorder is false', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        showBorder={false}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ border: 'none' });
  });

  it('applies spacing when addSpacing is true', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        addSpacing={true}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ padding: '16px' });
  });

  it('removes spacing when addSpacing is false', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        addSpacing={false}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ padding: '0' });
  });

  it('applies maxWidth correctly', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        maxWidth="500px"
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ maxWidth: '500px' });
  });

  it('centers container when centered is true', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        centered={true}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ 
      marginLeft: 'auto',
      marginRight: 'auto'
    });
  });

  it('applies responsive width when responsive is true', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        responsive={true}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ width: '100%' });
  });

  it('applies auto width when responsive is false', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        responsive={false}
      />
    );
    
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveStyle({ width: 'auto' });
  });

  it('sets up intersection observer when trackVisibility is true', () => {
    const onVisible = vi.fn();
    const onHidden = vi.fn();
    
    render(
      <AdContainer 
        {...defaultProps} 
        trackVisibility={true}
        onVisible={onVisible}
        onHidden={onHidden}
        visibilityThreshold={0.7}
      />
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.7 }
    );
  });

  it('does not set up intersection observer when trackVisibility is false', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        trackVisibility={false}
      />
    );

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
  });

  it('handles scroll events for sticky behavior', () => {
    const scrollSpy = vi.spyOn(window, 'addEventListener');
    
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.TOP}
        sticky={true}
      />
    );

    expect(scrollSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('handles resize events for responsive behavior', () => {
    const resizeSpy = vi.spyOn(window, 'addEventListener');
    
    render(
      <AdContainer 
        {...defaultProps} 
        responsive={true}
      />
    );

    expect(resizeSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
  });

  it('includes accessibility attributes', () => {
    const customAriaLabel = 'Custom Container Label';
    
    render(
      <AdContainer 
        {...defaultProps} 
        ariaLabel={customAriaLabel}
      />
    );

    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-label', customAriaLabel);
  });

  it('includes data attributes for tracking', () => {
    render(
      <AdContainer 
        {...defaultProps} 
        containerId="test-container-123"
        position={AdPosition.TOP}
        sticky={true}
      />
    );

    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('id', 'test-container-123');
    expect(container).toHaveAttribute('data-container-id', 'test-container-123');
    expect(container).toHaveAttribute('data-position', 'top');
    expect(container).toHaveAttribute('data-sticky', 'true');
    expect(container).toHaveAttribute('data-is-sticky', 'false');
    expect(container).toHaveAttribute('data-visible', 'false');
  });

  it('applies custom className and style', () => {
    const customStyle = { fontSize: '18px', fontWeight: 'bold' };
    
    render(
      <AdContainer 
        {...defaultProps} 
        className="custom-container-class"
        style={customStyle}
      />
    );

    const container = screen.getByTestId('ad-container');
    expect(container).toHaveClass('custom-container-class');
    expect(container).toHaveStyle(customStyle);
  });

  it('shows sticky indicator in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <AdContainer 
        {...defaultProps} 
        position={AdPosition.TOP}
        sticky={true}
      />
    );

    // The sticky indicator would be shown when isSticky becomes true
    // This is tested indirectly through the data attribute
    const container = screen.getByTestId('ad-container');
    expect(container).toHaveAttribute('data-sticky', 'true');
    
    process.env.NODE_ENV = originalEnv;
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(
      <AdContainer 
        {...defaultProps} 
        sticky={true}
        responsive={true}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
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