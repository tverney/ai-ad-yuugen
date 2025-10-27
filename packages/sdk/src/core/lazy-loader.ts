import { sdkLogger } from './logger';

/**
 * Lazy loading configuration
 */
export interface LazyLoadConfig {
  rootMargin: string; // Intersection observer root margin
  threshold: number; // Intersection threshold
  enablePreloading: boolean; // Enable preloading of nearby components
  preloadDistance: number; // Distance in pixels to preload components
  enableVirtualization: boolean; // Enable virtual scrolling for large lists
  chunkSize: number; // Number of components to load per chunk
  debounceDelay: number; // Debounce delay for scroll events
}

/**
 * Lazy loadable component interface
 */
export interface LazyComponent {
  id: string;
  element: HTMLElement;
  loader: () => Promise<void>;
  loaded: boolean;
  loading: boolean;
  priority: number; // Loading priority (higher = more important)
  dependencies?: string[]; // Component dependencies
}

/**
 * Bundle splitting configuration
 */
export interface BundleSplitConfig {
  enableCodeSplitting: boolean;
  chunkNames: Record<string, string[]>; // Chunk name to modules mapping
  preloadChunks: string[]; // Chunks to preload
  criticalChunks: string[]; // Critical chunks to load immediately
}

/**
 * Virtual scrolling configuration
 */
export interface VirtualScrollConfig {
  itemHeight: number; // Fixed item height
  containerHeight: number; // Container height
  overscan: number; // Number of items to render outside viewport
  enableDynamicHeight: boolean; // Support dynamic item heights
}

/**
 * Lazy loading and performance optimization system
 */
export class LazyLoader {
  private config: LazyLoadConfig;
  private bundleConfig: BundleSplitConfig;
  private components = new Map<string, LazyComponent>();
  private intersectionObserver: IntersectionObserver | null = null;
  private loadingQueue: LazyComponent[] = [];
  private loadedChunks = new Set<string>();
  private preloadedChunks = new Set<string>();
  private virtualScrollers = new Map<string, VirtualScroller>();

  constructor(
    config: Partial<LazyLoadConfig> = {},
    bundleConfig: Partial<BundleSplitConfig> = {}
  ) {
    this.config = {
      rootMargin: '50px',
      threshold: 0.1,
      enablePreloading: true,
      preloadDistance: 200,
      enableVirtualization: false,
      chunkSize: 5,
      debounceDelay: 100,
      ...config
    };

    this.bundleConfig = {
      enableCodeSplitting: true,
      chunkNames: {},
      preloadChunks: [],
      criticalChunks: [],
      ...bundleConfig
    };

    this.initializeIntersectionObserver();
    this.preloadCriticalChunks();
  }

  /**
   * Register a component for lazy loading
   */
  registerComponent(component: LazyComponent): void {
    this.components.set(component.id, component);
    
    // Observe element for intersection
    if (this.intersectionObserver && component.element) {
      this.intersectionObserver.observe(component.element);
    }

    sdkLogger.debug('Registered lazy component', { id: component.id, priority: component.priority });
  }

  /**
   * Unregister a component
   */
  unregisterComponent(id: string): void {
    const component = this.components.get(id);
    if (component) {
      if (this.intersectionObserver && component.element) {
        this.intersectionObserver.unobserve(component.element);
      }
      this.components.delete(id);
      sdkLogger.debug('Unregistered lazy component', { id });
    }
  }

  /**
   * Load a component immediately
   */
  async loadComponent(id: string): Promise<void> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component ${id} not found`);
    }

    if (component.loaded || component.loading) {
      return;
    }

    component.loading = true;
    
    try {
      // Load dependencies first
      if (component.dependencies) {
        await this.loadDependencies(component.dependencies);
      }

      // Load the component
      await component.loader();
      component.loaded = true;
      component.loading = false;

      sdkLogger.debug('Component loaded', { id });
    } catch (error) {
      component.loading = false;
      sdkLogger.error('Failed to load component', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Load multiple components in chunks
   */
  async loadComponentsInChunks(ids: string[]): Promise<void> {
    const chunks = this.chunkArray(ids, this.config.chunkSize);
    
    for (const chunk of chunks) {
      const loadPromises = chunk.map(id => this.loadComponent(id));
      await Promise.allSettled(loadPromises);
      
      // Small delay between chunks to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Preload components near the viewport
   */
  async preloadNearbyComponents(centerElement: HTMLElement): Promise<void> {
    if (!this.config.enablePreloading) {
      return;
    }

    const centerRect = centerElement.getBoundingClientRect();
    const nearbyComponents: LazyComponent[] = [];

    for (const component of this.components.values()) {
      if (component.loaded || component.loading) {
        continue;
      }

      const rect = component.element.getBoundingClientRect();
      const distance = this.calculateDistance(centerRect, rect);

      if (distance <= this.config.preloadDistance) {
        nearbyComponents.push(component);
      }
    }

    // Sort by priority and distance
    nearbyComponents.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      const distanceA = this.calculateDistance(centerRect, a.element.getBoundingClientRect());
      const distanceB = this.calculateDistance(centerRect, b.element.getBoundingClientRect());
      return distanceA - distanceB;
    });

    // Load nearby components
    const preloadIds = nearbyComponents.slice(0, this.config.chunkSize).map(c => c.id);
    await this.loadComponentsInChunks(preloadIds);
  }

  /**
   * Create virtual scroller for large lists
   */
  createVirtualScroller(
    containerId: string,
    items: any[],
    renderItem: (item: any, index: number) => HTMLElement,
    config: Partial<VirtualScrollConfig> = {}
  ): VirtualScroller {
    const virtualConfig: VirtualScrollConfig = {
      itemHeight: 50,
      containerHeight: 400,
      overscan: 5,
      enableDynamicHeight: false,
      ...config
    };

    const scroller = new VirtualScroller(containerId, items, renderItem, virtualConfig);
    this.virtualScrollers.set(containerId, scroller);
    
    sdkLogger.debug('Created virtual scroller', { containerId, itemCount: items.length });
    
    return scroller;
  }

  /**
   * Load code chunk dynamically
   */
  async loadChunk(chunkName: string): Promise<void> {
    if (this.loadedChunks.has(chunkName)) {
      return;
    }

    if (!this.bundleConfig.enableCodeSplitting) {
      sdkLogger.warn('Code splitting is disabled');
      return;
    }

    try {
      // Dynamic import simulation (in real implementation, use actual dynamic imports)
      const modules = this.bundleConfig.chunkNames[chunkName] || [];
      
      for (const moduleName of modules) {
        await this.loadModule(moduleName);
      }

      this.loadedChunks.add(chunkName);
      sdkLogger.debug('Chunk loaded', { chunkName, modules });
    } catch (error) {
      sdkLogger.error('Failed to load chunk', {
        chunkName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Preload chunks for better performance
   */
  async preloadChunks(chunkNames: string[]): Promise<void> {
    const preloadPromises = chunkNames
      .filter(name => !this.preloadedChunks.has(name))
      .map(async (name) => {
        try {
          await this.loadChunk(name);
          this.preloadedChunks.add(name);
        } catch (error) {
          sdkLogger.warn('Failed to preload chunk', { chunkName: name });
        }
      });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get bundle size optimization suggestions
   */
  getBundleOptimizations(): Array<{ type: string; suggestion: string; impact: string }> {
    const optimizations: Array<{ type: string; suggestion: string; impact: string }> = [];

    // Check for unused chunks
    const unusedChunks = Object.keys(this.bundleConfig.chunkNames)
      .filter(name => !this.loadedChunks.has(name));

    if (unusedChunks.length > 0) {
      optimizations.push({
        type: 'unused-chunks',
        suggestion: `Remove or lazy load ${unusedChunks.length} unused chunks`,
        impact: 'Reduce initial bundle size by 20-40%'
      });
    }

    // Check for large components
    const largeComponents = Array.from(this.components.values())
      .filter(c => c.priority < 5 && !c.loaded);

    if (largeComponents.length > 0) {
      optimizations.push({
        type: 'large-components',
        suggestion: `Lazy load ${largeComponents.length} large components`,
        impact: 'Improve initial load time by 30-60%'
      });
    }

    return optimizations;
  }

  /**
   * Initialize intersection observer
   */
  private initializeIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      sdkLogger.warn('IntersectionObserver not supported');
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      this.debounce((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.handleIntersection(entry.target as HTMLElement);
          }
        }
      }, this.config.debounceDelay),
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );
  }

  /**
   * Handle element intersection
   */
  private async handleIntersection(element: HTMLElement): Promise<void> {
    const component = Array.from(this.components.values())
      .find(c => c.element === element);

    if (!component || component.loaded || component.loading) {
      return;
    }

    // Add to loading queue
    this.loadingQueue.push(component);
    
    // Process queue
    await this.processLoadingQueue();

    // Preload nearby components
    if (this.config.enablePreloading) {
      await this.preloadNearbyComponents(element);
    }
  }

  /**
   * Process loading queue with priority
   */
  private async processLoadingQueue(): Promise<void> {
    if (this.loadingQueue.length === 0) {
      return;
    }

    // Sort by priority
    this.loadingQueue.sort((a, b) => b.priority - a.priority);

    // Load components in chunks
    const chunk = this.loadingQueue.splice(0, this.config.chunkSize);
    const loadPromises = chunk.map(component => this.loadComponent(component.id));
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Load component dependencies
   */
  private async loadDependencies(dependencies: string[]): Promise<void> {
    const loadPromises = dependencies.map(dep => this.loadComponent(dep));
    await Promise.allSettled(loadPromises);
  }

  /**
   * Load module dynamically
   */
  private async loadModule(moduleName: string): Promise<void> {
    // Simulate dynamic module loading
    // In real implementation, use dynamic imports: import(`./modules/${moduleName}`)
    await new Promise(resolve => setTimeout(resolve, 50));
    sdkLogger.debug('Module loaded', { moduleName });
  }

  /**
   * Preload critical chunks
   */
  private async preloadCriticalChunks(): Promise<void> {
    if (this.bundleConfig.criticalChunks.length > 0) {
      await this.preloadChunks(this.bundleConfig.criticalChunks);
    }
  }

  /**
   * Calculate distance between two rectangles
   */
  private calculateDistance(rect1: DOMRect, rect2: DOMRect): number {
    const dx = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right));
    const dy = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom));
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Debounce function
   */
  private debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    }) as T;
  }

  /**
   * Destroy lazy loader
   */
  destroy(): void {
    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Destroy virtual scrollers
    for (const scroller of this.virtualScrollers.values()) {
      scroller.destroy();
    }
    this.virtualScrollers.clear();

    // Clear data
    this.components.clear();
    this.loadingQueue = [];
    this.loadedChunks.clear();
    this.preloadedChunks.clear();

    sdkLogger.info('Lazy loader destroyed');
  }
}

/**
 * Virtual scroller for efficient rendering of large lists
 */
export class VirtualScroller {
  private container: HTMLElement;
  private items: any[];
  private renderItem: (item: any, index: number) => HTMLElement;
  private config: VirtualScrollConfig;
  private scrollTop = 0;
  private renderedItems = new Map<number, HTMLElement>();
  private itemHeights = new Map<number, number>();

  constructor(
    containerId: string,
    items: any[],
    renderItem: (item: any, index: number) => HTMLElement,
    config: VirtualScrollConfig
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    this.container = container;
    this.items = items;
    this.renderItem = renderItem;
    this.config = config;

    this.setupContainer();
    this.setupScrollListener();
    this.render();
  }

  /**
   * Update items and re-render
   */
  updateItems(items: any[]): void {
    this.items = items;
    this.renderedItems.clear();
    this.itemHeights.clear();
    this.render();
  }

  /**
   * Scroll to specific item
   */
  scrollToItem(index: number): void {
    const offset = this.getItemOffset(index);
    this.container.scrollTop = offset;
  }

  /**
   * Setup container styles
   */
  private setupContainer(): void {
    this.container.style.height = `${this.config.containerHeight}px`;
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
  }

  /**
   * Setup scroll event listener
   */
  private setupScrollListener(): void {
    this.container.addEventListener('scroll', () => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    });
  }

  /**
   * Render visible items
   */
  private render(): void {
    const { startIndex, endIndex } = this.getVisibleRange();
    
    // Remove items outside visible range
    for (const [index, element] of this.renderedItems) {
      if (index < startIndex || index > endIndex) {
        element.remove();
        this.renderedItems.delete(index);
      }
    }

    // Add items in visible range
    for (let i = startIndex; i <= endIndex; i++) {
      if (!this.renderedItems.has(i) && i < this.items.length) {
        const element = this.renderItem(this.items[i], i);
        const offset = this.getItemOffset(i);
        
        element.style.position = 'absolute';
        element.style.top = `${offset}px`;
        element.style.width = '100%';
        
        this.container.appendChild(element);
        this.renderedItems.set(i, element);

        // Measure height if dynamic heights are enabled
        if (this.config.enableDynamicHeight) {
          const height = element.offsetHeight;
          this.itemHeights.set(i, height);
        }
      }
    }

    // Update container height
    const totalHeight = this.getTotalHeight();
    this.container.style.height = `${totalHeight}px`;
  }

  /**
   * Get visible item range
   */
  private getVisibleRange(): { startIndex: number; endIndex: number } {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.config.itemHeight) - this.config.overscan);
    const visibleCount = Math.ceil(this.config.containerHeight / this.config.itemHeight);
    const endIndex = Math.min(this.items.length - 1, startIndex + visibleCount + this.config.overscan);

    return { startIndex, endIndex };
  }

  /**
   * Get item offset from top
   */
  private getItemOffset(index: number): number {
    if (!this.config.enableDynamicHeight) {
      return index * this.config.itemHeight;
    }

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.itemHeights.get(i) || this.config.itemHeight;
    }
    return offset;
  }

  /**
   * Get total height of all items
   */
  private getTotalHeight(): number {
    if (!this.config.enableDynamicHeight) {
      return this.items.length * this.config.itemHeight;
    }

    let height = 0;
    for (let i = 0; i < this.items.length; i++) {
      height += this.itemHeights.get(i) || this.config.itemHeight;
    }
    return height;
  }

  /**
   * Destroy virtual scroller
   */
  destroy(): void {
    for (const element of this.renderedItems.values()) {
      element.remove();
    }
    this.renderedItems.clear();
    this.itemHeights.clear();
  }
}