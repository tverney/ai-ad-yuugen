import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as AspectRatio from '@radix-ui/react-aspect-ratio';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import * as Separator from '@radix-ui/react-separator';
import * as Progress from '@radix-ui/react-progress';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Ad, AdComponentProps } from '../types/ad';
import styles from './AdBanner.module.css';
import { generatePlaceholderImage } from '../utils/placeholderImage';

export interface AdBannerProps extends AdComponentProps {
	/** Custom inline styles (deprecated - use CSS classes instead) */
	style?: React.CSSProperties;
	/** Whether to show tooltips (default: true) */
	showTooltips?: boolean;
	/** Loading delay in milliseconds (default: 1000) */
	loadingDelay?: number;
}

/**
 * AdBanner React component for displaying banner advertisements
 * Supports responsive design, customizable styling, and accessibility features
 */
export const AdBanner: React.FC<AdBannerProps> = ({
	placementId,
	size = { width: 728, height: 90, responsive: true },
	className,
	style,
	responsive = true,
	theme,
	onAdLoad,
	onAdError,
	onAdClick,
	showLoading = true,
	loadingComponent,
	showFallback = true,
	fallbackComponent,
	ariaLabel = 'Advertisement',
	testId = 'ad-banner',
	showTooltips = true,
	loadingDelay = 1000,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [ad, setAd] = useState<Ad | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	// Generate CSS classes and custom properties for theming
	const getContainerClasses = useCallback(() => {
		const classes = [styles.adBanner];

		if (responsive && size.responsive) {
			classes.push(styles.adBannerResponsive);
		} else {
			classes.push(styles.adBannerFixed);
		}

		if (className) {
			classes.push(className);
		}

		return classes.join(' ');
	}, [responsive, size.responsive, className]);

	const getCustomProperties = useCallback((): React.CSSProperties => {
		const customProps: Record<string, string> = {};

		if (theme) {
			if (theme.backgroundColor)
				customProps['--ad-bg-color'] = theme.backgroundColor;
			if (theme.borderColor)
				customProps['--ad-border-color'] = theme.borderColor;
			if (theme.borderRadius)
				customProps['--ad-border-radius'] = theme.borderRadius;
			if (theme.borderWidth)
				customProps['--ad-border-width'] = theme.borderWidth;
			if (theme.textColor) customProps['--ad-text-color'] = theme.textColor;
			if (theme.fontSize) customProps['--ad-font-size'] = theme.fontSize;
			if (theme.fontFamily) customProps['--ad-font-family'] = theme.fontFamily;
			if (theme.padding) customProps['--ad-padding'] = theme.padding;
			if (theme.margin) customProps['--ad-margin'] = theme.margin;
			if (theme.boxShadow) customProps['--ad-box-shadow'] = theme.boxShadow;
		}

		if (!responsive || !size.responsive) {
			customProps['--ad-width'] = `${size.width}px`;
			customProps['--ad-height'] = `${size.height}px`;
		} else {
			customProps['--ad-max-width'] = `${size.width}px`;
			customProps['--ad-min-height'] = `${size.height}px`;
			customProps['--ad-aspect-ratio'] = `${size.width} / ${size.height}`;
		}

		return { ...customProps, ...style } as React.CSSProperties;
	}, [theme, size.width, size.height, responsive, style]);

	// Intersection Observer for viewability tracking
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsVisible(entry.isIntersecting);
			},
			{ threshold: 0.5 },
		);

		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		return () => observer.disconnect();
	}, []);

	// Mock ad loading (in real implementation, this would call the SDK)
	useEffect(() => {
		const loadAd = async () => {
			try {
				setLoading(true);
				setError(null);

				// Simulate API call delay
				await new Promise((resolve) => setTimeout(resolve, loadingDelay));

				// Mock ad data
				const mockAd: Ad = {
					id: `banner-${placementId}-${Date.now()}`,
					type: 'banner',
					format: 'display',
					content: {
						title: 'Sample Advertisement',
						description: 'This is a sample banner advertisement',
						imageUrl: generatePlaceholderImage(
							size.width,
							size.height,
							'Ad Banner',
							'#007bff',
							'#ffffff',
						),
						ctaText: 'Learn More',
						landingUrl: 'https://example.com',
						brandName: 'Sample Brand',
					},
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
				};

				setAd(mockAd);
				onAdLoad?.(mockAd);
			} catch (err) {
				const error =
					err instanceof Error ? err : new Error('Failed to load ad');
				setError(error);
				onAdError?.(error);
			} finally {
				setLoading(false);
			}
		};

		loadAd();
	}, [placementId, size.width, size.height, onAdLoad, onAdError, loadingDelay]);

	// Handle ad click
	const handleAdClick = useCallback(() => {
		if (ad) {
			onAdClick?.(ad);
			// Track click event
			if (ad.content.landingUrl) {
				window.open(ad.content.landingUrl, '_blank', 'noopener,noreferrer');
			}
		}
	}, [ad, onAdClick]);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				handleAdClick();
			}
		},
		[handleAdClick],
	);

	// Render loading state
	if (loading && showLoading) {
		return (
			<div
				ref={containerRef}
				className={getContainerClasses()}
				style={getCustomProperties()}
				role="img"
				aria-label="Loading advertisement"
				data-testid={`${testId}-loading`}
			>
				{loadingComponent || (
					<div className={styles.adBannerLoading}>
						{showTooltips ? (
							<>
								<Progress.Root className={styles.adBannerProgress} value={null}>
									<Progress.Indicator
										className={styles.adBannerProgressIndicator}
									/>
								</Progress.Root>
								<VisuallyHidden.Root>
									<span>Loading advertisement content</span>
								</VisuallyHidden.Root>
							</>
						) : (
							<>
								<div className={styles.adBannerProgress}>
									<div className={styles.adBannerProgressIndicator} />
								</div>
								<span className="sr-only">Loading advertisement content</span>
							</>
						)}
						<span aria-hidden="true">Loading ad...</span>
					</div>
				)}
			</div>
		);
	}

	// Render error or fallback state
	if (error || !ad) {
		if (!showFallback) return null;

		const fallbackContent = (
			<div
				ref={containerRef}
				className={getContainerClasses()}
				style={getCustomProperties()}
				role="img"
				aria-label="Advertisement placeholder"
				data-testid={`${testId}-fallback`}
			>
				{fallbackComponent || (
					<div className={styles.adBannerFallback}>
						<div className={styles.adBannerFallbackIcon} aria-hidden="true">
							📢
						</div>
						<div>Advertisement</div>
						{showTooltips ? (
							<VisuallyHidden.Root>
								<span>Advertisement space - content unavailable</span>
							</VisuallyHidden.Root>
						) : (
							<span className="sr-only">
								Advertisement space - content unavailable
							</span>
						)}
					</div>
				)}
			</div>
		);

		if (!showTooltips) {
			return fallbackContent;
		}

		return (
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger asChild>{fallbackContent}</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content className={styles.adBannerTooltip} sideOffset={5}>
							{error
								? `Failed to load ad: ${error.message}`
								: 'Advertisement space'}
							<Tooltip.Arrow className={styles.adBannerTooltipArrow} />
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>
			</Tooltip.Provider>
		);
	}

	// Render ad content
	const bannerDiv = (
		<div
			ref={containerRef}
			className={getContainerClasses()}
			style={getCustomProperties()}
			role="button"
			aria-label={ariaLabel}
			tabIndex={0}
			onClick={handleAdClick}
			onKeyDown={handleKeyDown}
			data-testid={testId}
			data-ad-id={ad.id}
			data-placement-id={placementId}
			data-visible={isVisible}
		>
			{ad.content.imageUrl ? (
				<img
					src={ad.content.imageUrl}
					alt={ad.content.title}
					className={styles.adBannerImage}
					loading="lazy"
				/>
			) : (
				<div className={styles.adBannerContent}>
					<h3 className={styles.adBannerTitle}>{ad.content.title}</h3>

					{showTooltips ? (
						<Separator.Root className={styles.adBannerSeparator} decorative />
					) : (
						<div className={styles.adBannerSeparator} />
					)}

					<p className={styles.adBannerDescription}>{ad.content.description}</p>

					<button
						className={styles.adBannerCta}
						onClick={(e) => {
							e.stopPropagation();
							handleAdClick();
						}}
						aria-describedby={`${testId}-cta-description`}
					>
						{ad.content.ctaText}
					</button>

					{showTooltips ? (
						<VisuallyHidden.Root>
							<span id={`${testId}-cta-description`}>
								Click to visit {ad.content.brandName || 'advertiser'} website
							</span>
						</VisuallyHidden.Root>
					) : (
						<span className="sr-only" id={`${testId}-cta-description`}>
							Click to visit {ad.content.brandName || 'advertiser'} website
						</span>
					)}

					{ad.content.brandName && (
						<>
							{showTooltips ? (
								<Separator.Root
									className={styles.adBannerSeparator}
									decorative
								/>
							) : (
								<div className={styles.adBannerSeparator} />
							)}
							<small className={styles.adBannerBrand}>
								{ad.content.brandName}
							</small>
						</>
					)}
				</div>
			)}

			{/* Ad label for transparency */}
			{showTooltips ? (
				<VisuallyHidden.Root>
					<span>Sponsored advertisement content</span>
				</VisuallyHidden.Root>
			) : (
				<span className="sr-only">Sponsored advertisement content</span>
			)}
			<div className={styles.adBannerLabel} aria-hidden="true">
				Ad
			</div>
		</div>
	);

	const adContent =
		showTooltips && responsive && size.responsive ? (
			<AspectRatio.Root ratio={size.width / size.height}>
				{bannerDiv}
			</AspectRatio.Root>
		) : (
			bannerDiv
		);

	if (!showTooltips) {
		return adContent;
	}

	return (
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger asChild>{adContent}</Tooltip.Trigger>

				<Tooltip.Portal>
					<Tooltip.Content className={styles.adBannerTooltip} sideOffset={5}>
						Click to visit {ad.content.brandName || 'advertiser'} -{' '}
						{ad.content.title}
						<Tooltip.Arrow className={styles.adBannerTooltipArrow} />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
};
