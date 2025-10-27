import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { Ad, AdSize } from '@ai-yuugen/types';

export interface AdBannerTheme {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  padding?: string;
  margin?: string;
  boxShadow?: string;
}

export const VueAdBanner = defineComponent({
  name: 'VueAdBanner',
  props: {
    /** Unique identifier for the ad placement */
    placementId: {
      type: String,
      required: true
    },
    /** Ad size configuration */
    size: {
      type: Object as () => AdSize,
      default: () => ({ width: 728, height: 90, responsive: true })
    },
    /** Whether the banner should be responsive */
    responsive: {
      type: Boolean,
      default: true
    },
    /** Custom theme configuration */
    theme: {
      type: Object as () => AdBannerTheme,
      default: () => ({})
    },
    /** Whether to show loading state */
    showLoading: {
      type: Boolean,
      default: true
    },
    /** Whether to show fallback when no ad is available */
    showFallback: {
      type: Boolean,
      default: true
    },
    /** Accessibility label */
    ariaLabel: {
      type: String,
      default: 'Advertisement'
    },
    /** Test ID for testing */
    testId: {
      type: String,
      default: 'ad-banner'
    }
  },
  emits: {
    /** Callback when ad loads successfully */
    adLoad: (ad: Ad) => !!ad,
    /** Callback when ad fails to load */
    adError: (error: Error) => !!error,
    /** Callback when ad is clicked */
    adClick: (ad: Ad) => !!ad
  },
  setup(props, { emit }) {
    const containerRef = ref<HTMLDivElement>();
    const ad = ref<Ad | null>(null);
    const loading = ref(true);
    const error = ref<Error | null>(null);
    const isVisible = ref(false);
    
    let intersectionObserver: IntersectionObserver | null = null;

    // Generate responsive styles
    const containerStyles = computed(() => {
      const baseStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        backgroundColor: props.theme.backgroundColor || '#f8f9fa',
        border: (props.theme.borderWidth || '1px') + ' solid ' + (props.theme.borderColor || '#e9ecef'),
        borderRadius: props.theme.borderRadius || '4px',
        padding: props.theme.padding || '8px',
        margin: props.theme.margin || '0',
        boxShadow: props.theme.boxShadow || 'none',
        color: props.theme.textColor || '#333',
        fontSize: props.theme.fontSize || '14px',
        fontFamily: props.theme.fontFamily || 'system-ui, -apple-system, sans-serif',
      };

      if (props.responsive && props.size.responsive) {
        return {
          ...baseStyles,
          width: '100%',
          maxWidth: props.size.width + 'px',
          minHeight: props.size.height + 'px',
          aspectRatio: props.size.width + ' / ' + props.size.height,
        };
      }

      return {
        ...baseStyles,
        width: props.size.width + 'px',
        height: props.size.height + 'px',
      };
    });

    // Setup intersection observer for viewability tracking
    const setupIntersectionObserver = () => {
      if (containerRef.value) {
        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            isVisible.value = entry.isIntersecting;
          },
          { threshold: 0.5 }
        );
        intersectionObserver.observe(containerRef.value);
      }
    };

    // Load ad data
    const loadAd = async () => {
      try {
        loading.value = true;
        error.value = null;

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock ad data
        const mockAd: Ad = {
          id: `banner-${props.placementId}-${Date.now()}`,
          type: 'banner' as any,
          format: 'display' as any,
          content: {
            title: 'Sample Advertisement',
            description: 'This is a sample banner advertisement',
            imageUrl: `https://via.placeholder.com/${props.size.width}x${props.size.height}/007bff/ffffff?text=Ad+Banner`,
            ctaText: 'Learn More',
            landingUrl: 'https://example.com',
            brandName: 'Sample Brand',
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        ad.value = mockAd;
        emit('adLoad', mockAd);
      } catch (err) {
        const adError = err instanceof Error ? err : new Error('Failed to load ad');
        error.value = adError;
        emit('adError', adError);
      } finally {
        loading.value = false;
      }
    };

    // Handle ad click
    const handleAdClick = () => {
      if (ad.value) {
        emit('adClick', ad.value);
        // Track click event
        if (ad.value.content.landingUrl) {
          window.open(ad.value.content.landingUrl, '_blank', 'noopener,noreferrer');
        }
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleAdClick();
      }
    };

    // Watch for placement changes to reload ad
    watch(() => props.placementId, () => {
      loadAd();
    });

    // Watch for size changes to reload ad
    watch(() => [props.size.width, props.size.height], () => {
      loadAd();
    });

    onMounted(async () => {
      await nextTick();
      setupIntersectionObserver();
      loadAd();
    });

    onUnmounted(() => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
    });

    return {
      containerRef,
      ad,
      loading,
      error,
      isVisible,
      containerStyles,
      handleAdClick,
      handleKeyDown
    };
  },
  template: `
    <div
      ref="containerRef"
      :style="containerStyles"
      :role="loading && showLoading ? 'img' : (error || !ad) && showFallback ? 'img' : 'img'"
      :aria-label="loading && showLoading ? 'Loading advertisement' : (error || !ad) && showFallback ? 'Advertisement placeholder' : ariaLabel"
      :tabindex="ad ? 0 : undefined"
      :data-testid="loading && showLoading ? \`\${testId}-loading\` : (error || !ad) && showFallback ? \`\${testId}-fallback\` : testId"
      :data-ad-id="ad?.id"
      :data-placement-id="placementId"
      :data-visible="isVisible"
      @click="ad ? handleAdClick() : undefined"
      @keydown="ad ? handleKeyDown($event) : undefined"
    >
      <!-- Loading State -->
      <div v-if="loading && showLoading" style="display: flex; align-items: center; gap: 8px;">
        <div
          style="
            width: 16px;
            height: 16px;
            border: 2px solid #e9ecef;
            border-top: 2px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "
        />
        <span>Loading ad...</span>
      </div>

      <!-- Error/Fallback State -->
      <div v-else-if="(error || !ad) && showFallback" style="text-align: center; opacity: 0.6;">
        <div style="font-size: 18px; margin-bottom: 4px;">📢</div>
        <div>Advertisement</div>
      </div>

      <!-- Ad Content -->
      <template v-else-if="ad">
        <!-- Image Ad -->
        <img
          v-if="ad.content.imageUrl"
          :src="ad.content.imageUrl"
          :alt="ad.content.title"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: pointer;
          "
          loading="lazy"
        />

        <!-- Text Ad -->
        <div
          v-else
          style="
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            padding: 16px;
          "
        >
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            {{ ad.content.title }}
          </h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.8;">
            {{ ad.content.description }}
          </p>
          <button
            style="
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              font-size: 14px;
              cursor: pointer;
              font-weight: bold;
            "
            @click.stop="handleAdClick"
          >
            {{ ad.content.ctaText }}
          </button>
          <small style="margin-top: 8px; opacity: 0.6; font-size: 12px;">
            {{ ad.content.brandName }}
          </small>
        </div>

        <!-- Ad Label -->
        <div
          style="
            position: absolute;
            top: 4px;
            right: 4px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 2px;
            pointer-events: none;
          "
        >
          Ad
        </div>
      </template>
    </div>


  `
});