import { Ad, AdType } from '../types/ad';

// Namespace protection
declare global {
	interface Window {
		AIAd Yuugen?: {
			AdWidget: typeof AdWidget;
			version: string;
		};
	}
}

export interface AdWidgetConfig {
	container: HTMLElement | string;
	placementId: string;
	type?: AdType;
	autoInit?: boolean;
	size?: {
		width?: number;
		height?: number;
		responsive?: boolean;
	};
	layout?:
		| 'banner'
		| 'native-card'
		| 'native-inline'
		| 'native-minimal'
		| 'interstitial';
	theme?: AdWidgetTheme;
	showLoading?: boolean;
	showFallback?: boolean;
	showAdLabel?: boolean;
	adLabelText?: string;
	showCloseButton?: boolean;
	autoCloseDelay?: number;
	closeOnOverlayClick?: boolean;
	closeOnEscape?: boolean;
	onAdLoad?: (ad: Ad) => void;
	onAdError?: (error: Error) => void;
	onAdClick?: (ad: Ad) => void;
	onClose?: () => void;
	ariaLabel?: string;
	testId?: string;
}

export interface AdWidgetTheme {
	backgroundColor?: string;
	borderColor?: string;
	borderRadius?: string;
	borderWidth?: string;
	textColor?: string;
	titleColor?: string;
	descriptionColor?: string;
	brandColor?: string;
	ctaBackgroundColor?: string;
	ctaTextColor?: string;
	ctaHoverBackgroundColor?: string;
	fontSize?: string;
	titleFontSize?: string;
	descriptionFontSize?: string;
	brandFontSize?: string;
	ctaFontSize?: string;
	fontFamily?: string;
	padding?: string;
	margin?: string;
	boxShadow?: string;
	adLabelColor?: string;
	adLabelBackgroundColor?: string;
	overlayColor?: string;
	closeButtonColor?: string;
	closeButtonHoverColor?: string;
}

interface EventListenerEntry {
	element: HTMLElement | Document | Window;
	event: string;
	handler: (event: Event) => void;
}

/**
 * Vanilla JavaScript AdWidget class for displaying advertisements
 * Framework-agnostic implementation with DOM manipulation and event handling
 * Supports banner, native, and interstitial ad formats with accessibility features
 */
export class AdWidget {
	private static readonly VERSION = '1.0.0';
	private static readonly NAMESPACE = 'AIAd Yuugen';
	private static instances: Map<string, AdWidget> = new Map();

	private readonly _config: AdWidgetConfig;
	private readonly container: HTMLElement;
	private adElement: HTMLElement | null = null;
	private ad: Ad | null = null;
	private loading = false;
	private error: Error | null = null;
	private isVisible = false;
	private isDestroyed = false;
	private intersectionObserver: IntersectionObserver | null = null;
	private eventListeners: EventListenerEntry[] = [];
	private autoCloseTimer: number | null = null;
	private previousFocusElement: HTMLElement | null = null;

	constructor(config: AdWidgetConfig) {
		this._config = this.validateAndNormalizeConfig(config);
		this.container = this.resolveContainer(config.container);

		// Register instance for namespace protection
		const instanceId = this.generateInstanceId();
		AdWidget.instances.set(instanceId, this);
		this.container.setAttribute('data-ai-yuugen-id', instanceId);

		// Inject CSS styles
		this.injectStyles();

		if (config.autoInit !== false) {
			this.init();
		}

		// Initialize global namespace
		this.initializeNamespace();
	}

	/**
	 * Initialize the ad widget
	 */
	init(): void {
		if (this.isDestroyed) {
			throw new Error('Cannot initialize destroyed AdWidget instance');
		}

		this.setupIntersectionObserver();
		this.loadAd();
	}

	/**
	 * Destroy the ad widget and clean up resources
	 */
	destroy(): void {
		if (this.isDestroyed) return;

		this.cleanup();
		this.container.innerHTML = '';
		this.container.removeAttribute('data-ai-yuugen-id');

		// Remove from instances map
		const instanceId = this.container.getAttribute('data-ai-yuugen-id');
		if (instanceId) {
			AdWidget.instances.delete(instanceId);
		}

		this.isDestroyed = true;
	}

	/**
	 * Get the current configuration
	 */
	getConfig(): AdWidgetConfig {
		return { ...this._config };
	}

	/**
	 * Update configuration and re-render if necessary
	 */
	updateConfig(newConfig: Partial<AdWidgetConfig>): void {
		if (this.isDestroyed) {
			throw new Error('Cannot update config of destroyed AdWidget instance');
		}

		Object.assign(this._config, newConfig);
		this.loadAd();
	}

	/**
	 * Show the ad (for interstitial ads)
	 */
	show(): void {
		if (this._config.layout === 'interstitial' && this.adElement) {
			this.adElement.classList.remove('ai-yuugen-hidden');
			this.setupInterstitialBehavior();
		}
	}

	/**
	 * Hide the ad (for interstitial ads)
	 */
	hide(): void {
		if (this._config.layout === 'interstitial' && this.adElement) {
			this.adElement.classList.add('ai-yuugen-hidden');
			this.cleanupInterstitialBehavior();
		}
	}

	/**
	 * Check if the ad is currently visible
	 */
	isAdVisible(): boolean {
		return this.isVisible;
	}

	/**
	 * Get the current ad data
	 */
	getCurrentAd(): Ad | null {
		return this.ad;
	}

	// Private methods

	private validateAndNormalizeConfig(config: AdWidgetConfig): AdWidgetConfig {
		if (!config.container) {
			throw new Error('Container is required');
		}
		if (!config.placementId) {
			throw new Error('Placement ID is required');
		}

		return {
			type: 'banner',
			autoInit: true,
			size: { width: 728, height: 90, responsive: true },
			layout: 'banner',
			showLoading: true,
			showFallback: true,
			showAdLabel: true,
			adLabelText: 'Ad',
			showCloseButton: true,
			autoCloseDelay: 0,
			closeOnOverlayClick: true,
			closeOnEscape: true,
			ariaLabel: 'Advertisement',
			testId: 'ad-widget',
			...config,
		};
	}

  private resolveContainer(container: HTMLElement | string): HTMLElement {
    const element =
      typeof container === 'string'
        ? document.getElementById(container) ||
          document.querySelector(container)
        : container;

    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('Container element not found or invalid');
    }

		return element;
	}

	private generateInstanceId(): string {
		return `ai-yuugen-${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;
	}

	private initializeNamespace(): void {
		if (!window.AIAd Yuugen) {
			window.AIAd Yuugen = {
				AdWidget,
				version: AdWidget.VERSION,
			};
		}
	}

	private injectStyles(): void {
		const styleId = 'ai-yuugen-styles';
		if (document.getElementById(styleId)) return;

		const link = document.createElement('link');
		link.id = styleId;
		link.rel = 'stylesheet';
		link.href =
			'data:text/css;base64,' +
			btoa(`
      .ai-yuugen-hidden { display: none !important; }
      .ai-yuugen-widget { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        position: relative; 
        overflow: hidden; 
        background-color: var(--ai-yuugen-bg-color, #f8f9fa);
        border: var(--ai-yuugen-border-width, 1px) solid var(--ai-yuugen-border-color, #e9ecef);
        border-radius: var(--ai-yuugen-border-radius, 4px);
        padding: var(--ai-yuugen-padding, 8px);
        color: var(--ai-yuugen-text-color, #333);
        font-family: var(--ai-yuugen-font-family, system-ui, -apple-system, sans-serif);
      }
      .ai-yuugen-loading { display: flex; align-items: center; justify-content: center; }
      .ai-yuugen-spinner { 
        width: 16px; height: 16px; 
        border: 2px solid #e9ecef; 
        border-top: 2px solid #007bff; 
        border-radius: 50%; 
        animation: ai-yuugen-spin 1s linear infinite; 
        margin-right: 8px; 
      }
      @keyframes ai-yuugen-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .ai-yuugen-fallback { text-align: center; opacity: 0.6; }
      .ai-yuugen-ad { cursor: pointer; }
      .ai-yuugen-ad-label { 
        position: absolute; top: 4px; right: 4px; 
        background: rgba(0,0,0,0.7); color: white; 
        font-size: 10px; padding: 2px 6px; 
        border-radius: 2px; pointer-events: none; 
      }
    `);

		document.head.appendChild(link);
	}

	private setupIntersectionObserver(): void {
		if ('IntersectionObserver' in window) {
			this.intersectionObserver = new IntersectionObserver(
				([entry]) => {
					this.isVisible = entry.isIntersecting;
					this.container.setAttribute('data-visible', String(this.isVisible));
				},
				{ threshold: 0.5 },
			);

			this.intersectionObserver.observe(this.container);
		}
	}

	private async loadAd(): Promise<void> {
		if (this.loading) return;

		try {
			this.loading = true;
			this.error = null;
			this.renderLoadingState();

			// Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Mock ad data based on layout
			const mockAd = this.generateMockAd();

			this.ad = mockAd;
			this.renderAd();
			this._config.onAdLoad?.(mockAd);
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to load ad');
			this.error = error;
			this.renderErrorState();
			this._config.onAdError?.(error);
		} finally {
			this.loading = false;
		}
	}

	private generateMockAd(): Ad {
		const { layout, size } = this._config;
		const width = size?.width || 728;
		const height = size?.height || 90;

		const adContent = {
			banner: {
				title: 'Sample Advertisement',
				description: 'This is a sample banner advertisement',
				imageUrl: `https://via.placeholder.com/${width}x${height}/007bff/ffffff?text=Ad+Banner`,
				ctaText: 'Learn More',
				landingUrl: 'https://example.com',
				brandName: 'Sample Brand',
			},
			native: {
				title: 'Discover Amazing AI Tools',
				description: 'Boost your productivity with cutting-edge AI solutions.',
				imageUrl:
					'https://via.placeholder.com/400x225/28a745/ffffff?text=Native+Ad',
				ctaText: 'Get Started',
				landingUrl: 'https://example.com',
				brandName: 'TechCorp Solutions',
			},
			interstitial: {
				title: 'Special Offer!',
				description: "Don't miss out on this amazing opportunity.",
				imageUrl:
					'https://via.placeholder.com/600x400/007bff/ffffff?text=Interstitial+Ad',
				ctaText: 'Claim Now',
				landingUrl: 'https://example.com',
				brandName: 'Premium Brand',
			},
		};

		const contentType = layout?.startsWith('native')
			? 'native'
			: layout || 'banner';
		const content =
			adContent[contentType as keyof typeof adContent] || adContent.banner;

		return {
			id: `${layout}-${this._config.placementId}-${Date.now()}`,
			type: this._config.type || 'banner',
			format: 'display',
			content,
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		};
	}

	private renderLoadingState(): void {
		if (!this._config.showLoading) return;

		const loadingElement = this.createElement('div', {
			className: 'ai-yuugen-widget ai-yuugen-loading',
			role: 'img',
			'aria-label': 'Loading advertisement',
			'data-testid': `${this._config.testId}-loading`,
		});

		const content = this.createElement('div', {
			className: 'ai-yuugen-loading-content',
		});

		const spinner = this.createElement('div', {
			className: 'ai-yuugen-spinner',
		});

		const text = this.createElement('span', {
			textContent: 'Loading ad...',
		});

		content.appendChild(spinner);
		content.appendChild(text);
		loadingElement.appendChild(content);

		this.replaceContent(loadingElement);
	}

	private renderErrorState(): void {
		if (!this._config.showFallback) return;

		const fallbackElement = this.createElement('div', {
			className: 'ai-yuugen-widget ai-yuugen-fallback',
			role: 'img',
			'aria-label': 'Advertisement placeholder',
			'data-testid': `${this._config.testId}-fallback`,
		});

		const icon = this.createElement('div', {
			textContent: '📢',
			className: 'ai-yuugen-fallback-icon',
		});

		const text = this.createElement('div', {
			textContent: 'Advertisement',
		});

		fallbackElement.appendChild(icon);
		fallbackElement.appendChild(text);

		this.replaceContent(fallbackElement);
	}

	private renderAd(): void {
		if (!this.ad) return;

		const adElement = this.createElement('div', {
			className: this.getAdClasses(),
			role: this._config.layout?.startsWith('native') ? 'article' : 'img',
			'aria-label': this._config.ariaLabel,
			tabIndex: '0',
			'data-testid': this._config.testId,
			'data-ad-id': this.ad.id,
			'data-placement-id': this._config.placementId,
			'data-layout': this._config.layout,
		});

		this.applyThemeVariables(adElement);

		// Add event listeners
		this.addEventListener(adElement, 'click', this.handleAdClick.bind(this));
		this.addEventListener(adElement, 'keydown', this.handleKeyDown.bind(this));

		// Render content based on layout
		const content = this.renderAdContent();
		adElement.appendChild(content);

		// Add ad label
		if (this._config.showAdLabel) {
			const label = this.createAdLabel();
			adElement.appendChild(label);
		}

		this.replaceContent(adElement);
		this.adElement = adElement;

		// Setup interstitial behavior if needed
		if (this._config.layout === 'interstitial') {
			this.setupInterstitialBehavior();
		}
	}

	private getAdClasses(): string {
		const classes = ['ai-yuugen-widget', 'ai-yuugen-ad'];

		if (this._config.layout) {
			classes.push(`ai-yuugen-${this._config.layout}`);
		}

		if (this._config.size?.responsive) {
			classes.push('ai-yuugen-widget-responsive');
		} else {
			classes.push('ai-yuugen-widget-fixed');
		}

		return classes.join(' ');
	}

	private applyThemeVariables(element: HTMLElement): void {
		const { theme, size } = this._config;

		if (theme) {
			const variables: Record<string, string> = {};

			if (theme.backgroundColor)
				variables['--ai-yuugen-bg-color'] = theme.backgroundColor;
			if (theme.borderColor)
				variables['--ai-yuugen-border-color'] = theme.borderColor;
			if (theme.borderRadius)
				variables['--ai-yuugen-border-radius'] = theme.borderRadius;
			if (theme.borderWidth)
				variables['--ai-yuugen-border-width'] = theme.borderWidth;
			if (theme.textColor)
				variables['--ai-yuugen-text-color'] = theme.textColor;
			if (theme.fontSize) variables['--ai-yuugen-font-size'] = theme.fontSize;
			if (theme.fontFamily)
				variables['--ai-yuugen-font-family'] = theme.fontFamily;
			if (theme.padding) variables['--ai-yuugen-padding'] = theme.padding;
			if (theme.boxShadow)
				variables['--ai-yuugen-box-shadow'] = theme.boxShadow;

			Object.entries(variables).forEach(([property, value]) => {
				element.style.setProperty(property, value);
			});
		}

		if (size && !size.responsive) {
			element.style.setProperty('--ai-yuugen-width', `${size.width || 728}px`);
			element.style.setProperty(
				'--ai-yuugen-height',
				`${size.height || 90}px`,
			);
		}
	}

	private renderAdContent(): HTMLElement {
		if (!this.ad) throw new Error('No ad data available');

		const content = this.createElement('div', {
			className: 'ai-yuugen-ad-content',
		});

		if (this.ad.content.imageUrl) {
			const img = this.createElement('img', {
				src: this.ad.content.imageUrl,
				alt: this.ad.content.title,
				className: 'ai-yuugen-ad-image',
				loading: 'lazy',
			}) as HTMLImageElement;

			content.appendChild(img);
		} else {
			const textContent = this.createElement('div', {
				className: 'ai-yuugen-ad-text',
			});

			const title = this.createElement('h3', {
				textContent: this.ad.content.title,
				className: 'ai-yuugen-ad-title',
			});

			const description = this.createElement('p', {
				textContent: this.ad.content.description,
				className: 'ai-yuugen-ad-description',
			});

			const cta = this.createElement('button', {
				textContent: this.ad.content.ctaText,
				className: 'ai-yuugen-ad-cta',
			});

			textContent.appendChild(title);
			textContent.appendChild(description);
			textContent.appendChild(cta);

			if (this.ad.content.brandName) {
				const brand = this.createElement('small', {
					textContent: this.ad.content.brandName,
					className: 'ai-yuugen-ad-brand',
				});
				textContent.appendChild(brand);
			}

			content.appendChild(textContent);
		}

		return content;
	}

	private createAdLabel(): HTMLElement {
		return this.createElement('div', {
			textContent: this._config.adLabelText || 'Ad',
			className: 'ai-yuugen-ad-label',
		});
	}

	private handleAdClick(): void {
		if (!this.ad) return;

		this._config.onAdClick?.(this.ad);

		if (this.ad.content.landingUrl) {
			window.open(this.ad.content.landingUrl, '_blank', 'noopener,noreferrer');
		}
	}

	private handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			this.handleAdClick(event);
		}
	}

	private setupInterstitialBehavior(): void {
		if (this._config.closeOnEscape) {
			this.addEventListener(document, 'keydown', (event: Event) => {
				const keyEvent = event as KeyboardEvent;
				if (keyEvent.key === 'Escape') {
					this.hide();
					this._config.onClose?.();
				}
			});
		}

		// Store current focus and set focus to modal
		this.previousFocusElement = document.activeElement as HTMLElement;
		if (this.adElement) {
			this.adElement.focus();
		}

		// Auto-close timer
		if (this._config.autoCloseDelay && this._config.autoCloseDelay > 0) {
			this.autoCloseTimer = window.setTimeout(() => {
				this.hide();
				this._config.onClose?.();
			}, this._config.autoCloseDelay);
		}
	}

	private cleanupInterstitialBehavior(): void {
		// Restore previous focus
		if (this.previousFocusElement) {
			this.previousFocusElement.focus();
			this.previousFocusElement = null;
		}

		// Clear auto-close timer
		if (this.autoCloseTimer) {
			clearTimeout(this.autoCloseTimer);
			this.autoCloseTimer = null;
		}
	}

	private createElement(
		tagName: string,
		attributes: Record<string, string> = {},
	): HTMLElement {
		const element = document.createElement(tagName);

		Object.entries(attributes).forEach(([key, value]) => {
			if (key === 'textContent') {
				element.textContent = value;
			} else if (key === 'className') {
				element.className = value;
			} else {
				element.setAttribute(key, value);
			}
		});

		return element;
	}

	private addEventListener(
		element: HTMLElement | Document | Window,
		event: string,
		handler: (event: Event) => void,
	): void {
		element.addEventListener(event, handler);
		this.eventListeners.push({ element, event, handler });
	}

	private replaceContent(newElement: HTMLElement): void {
		this.container.innerHTML = '';
		this.container.appendChild(newElement);
	}

	private cleanup(): void {
		// Remove event listeners
		this.eventListeners.forEach(({ element, event, handler }) => {
			element.removeEventListener(event, handler);
		});
		this.eventListeners = [];

		// Cleanup intersection observer
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}

		// Cleanup interstitial behavior
		this.cleanupInterstitialBehavior();
	}

	// Static methods for global access
	static getInstance(containerId: string): AdWidget | undefined {
		const container = document.querySelector(
			`[data-ai-yuugen-id="${containerId}"]`,
		);
		if (container) {
			const instanceId = container.getAttribute('data-ai-yuugen-id');
			return instanceId ? AdWidget.instances.get(instanceId) : undefined;
		}
		return undefined;
	}

	static destroyAll(): void {
		AdWidget.instances.forEach((instance) => instance.destroy());
		AdWidget.instances.clear();
	}
}

// Auto-initialize from data attributes
document.addEventListener('DOMContentLoaded', () => {
	const elements = document.querySelectorAll('[data-ai-yuugen-auto-init]');
	elements.forEach((element) => {
		const config: AdWidgetConfig = {
			container: element as HTMLElement,
			placementId: element.getAttribute('data-placement-id') || 'auto',
			type: (element.getAttribute('data-ad-type') as AdType) || 'banner',
			layout:
				(element.getAttribute('data-layout') as AdWidgetConfig['layout']) ||
				'banner',
		};

		new AdWidget(config);
	});
});

export default AdWidget;
