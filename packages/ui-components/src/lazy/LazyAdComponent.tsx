import React, { useState, useEffect, useRef, Suspense } from 'react';
import { LazyLoader, LazyComponent } from '@ai-yuugen/sdk/core/lazy-loader';

/**
 * Props for lazy ad component
 */
export interface LazyAdComponentProps {
  componentId: string;
  loader: () => Promise<React.ComponentType<any>>;
  fallback?: React.ComponentType;
  priority?: number;
  dependencies?: string[];
  enablePreloading?: boolean;
  rootMargin?: string;
  threshold?: number;
  [key: string]: any; // Props to pass to the loaded component
}

/**
 * Loading fallback component
 */
const DefaultFallback: React.FC = () => (
  <div 
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100px',
      backgroundColor: '#f5f5f5',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      color: '#666'
    }}
  >
    <div>Loading ad...</div>
  </div>
);

/**
 * Lazy loading wrapper for ad components
 */
export const LazyAdComponent: React.FC<LazyAdComponentProps> = ({
  componentId,
  loader,
  fallback: Fallback = DefaultFallback,
  priority = 5,
  dependencies = [],
  enablePreloading = true,
  rootMargin = '50px',
  threshold = 0.1,
  ...componentProps
}) => {
  const [LoadedComponent, setLoadedComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lazyLoaderRef = useRef<LazyLoader | null>(null);

  useEffect(() => {
    // Initialize lazy loader
    lazyLoaderRef.current = new LazyLoader({
      rootMargin,
      threshold,
      enablePreloading,
      chunkSize: 3,
      debounceDelay: 100
    });

    const lazyLoader = lazyLoaderRef.current;

    // Create lazy component configuration
    const lazyComponent: LazyComponent = {
      id: componentId,
      element: containerRef.current!,
      loader: async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const Component = await loader();
          setLoadedComponent(() => Component);
        } catch (err) {
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
      loaded: false,
      loading: false,
      priority,
      dependencies
    };

    // Register component with lazy loader
    if (containerRef.current) {
      lazyLoader.registerComponent(lazyComponent);
    }

    return () => {
      if (lazyLoaderRef.current) {
        lazyLoaderRef.current.unregisterComponent(componentId);
        lazyLoaderRef.current.destroy();
      }
    };
  }, [componentId, loader, priority, dependencies, enablePreloading, rootMargin, threshold]);

  // Handle manual loading
  const handleLoadComponent = async () => {
    if (lazyLoaderRef.current && !LoadedComponent && !isLoading) {
      try {
        await lazyLoaderRef.current.loadComponent(componentId);
      } catch (err) {
        setError(err as Error);
      }
    }
  };

  if (error) {
    return (
      <div 
        ref={containerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px',
          backgroundColor: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '4px',
          color: '#e53e3e',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div>Failed to load ad component</div>
        <button 
          onClick={handleLoadComponent}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (LoadedComponent) {
    return (
      <div ref={containerRef}>
        <Suspense fallback={<Fallback />}>
          <LoadedComponent {...componentProps} />
        </Suspense>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div ref={containerRef}>
        <Fallback />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        color: '#999',
        cursor: 'pointer'
      }}
      onClick={handleLoadComponent}
    >
      <div>Click to load ad</div>
    </div>
  );
};

/**
 * Higher-order component for lazy loading
 */
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    componentId: string;
    priority?: number;
    dependencies?: string[];
    fallback?: React.ComponentType;
  }
) {
  return React.forwardRef<any, P>((props, ref) => {
    const loader = async () => {
      // Simulate dynamic import delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return Component;
    };

    return (
      <LazyAdComponent
        {...options}
        loader={loader}
        ref={ref}
        {...props}
      />
    );
  });
}

/**
 * Hook for lazy loading components
 */
export function useLazyLoading<T>(
  loader: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = React.useCallback(async () => {
    if (isLoading || component) return;

    setIsLoading(true);
    setError(null);

    try {
      const loadedComponent = await loader();
      setComponent(loadedComponent);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [loader, isLoading, component]);

  useEffect(() => {
    load();
  }, dependencies);

  return {
    component,
    isLoading,
    error,
    reload: load
  };
}

export default LazyAdComponent;