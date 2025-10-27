import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { Ad } from '@ai-yuugen/types';

export interface AdNativeTheme {
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
}

export const VueAdNative = defineComponent({
  name: 'VueAdNative',
  props: {
    /** Unique identifier for the ad placement */
    placementId: {
      type: String,
      required: true
    },
    /** Layout variant for the native ad */
    layout: {
      type: String as () => 'card' | 'inline' | 'minimal' | 'featured',
      default: 'card'
    },
    /** Custom theme configuration */
    theme: {
      type: Object as () => AdNativeTheme,
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
    /** Whether to show ad disclosure label */
    showAdLabel: {
      type: Boolean,
      default: true
    },
    /** Custom ad label text */
    adLabelText: {
      type: String,
      default: 'Sponsored'
    },
    /** Whether to show brand name */
    showBrandName: {
      type: Boolean,
      default: true
    },
    /** Whether to show CTA button */
    showCTA: {
      type: Boolean,
      default: true
    },
    /** Whether to show image */
    showImage: {
      type: Boolean,
      default: true
    },
    /** Image aspect ratio */
    imageAspectRatio: {
      type: String,
      default: '16/9'
    },
    /** Accessibility label */
    ariaLabel: {
      type: String,
      default: 'Native Advertisement'
    },
    /** Test ID for testing */
    testId: {
      type: String,
      default: 'ad-native'
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
    const imageLoaded = ref(false);
    const ctaHovered = ref(false);
    const containerHovered = ref(false);
    
    let intersectionObserver: IntersectionObserver | null = null;

    // Get layout-specific styles
    const containerStyles = computed(() => {
      const baseStyles = {
        backgroundColor: props.theme.backgroundColor || '#ffffff',
        border: (props.theme.borderWidth || '1px') + ' solid ' + (props.theme.borderColor || '#e9ecef'),
        borderRadius: props.theme.borderRadius || '8px',
        padding: props.theme.padding || '16px',
        margin: props.theme.margin || '0',
        boxShadow: props.theme.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.1)',
        color: props.theme.textColor || '#333',
        fontSize: props.theme.fontSize || '14px',
        fontFamily: props.theme.fontFamily || 'system-ui, -apple-system, sans-serif',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative' as const,
      };

      // Apply hover effects for non-minimal layouts
      if (containerHovered.value && props.layout !== 'minimal') {
        return {
          ...baseStyles,
          transform: 'translateY(-2px)',
          boxShadow: props.theme.boxShadow?.replace('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.15)') || '0 4px 8px rgba(0, 0, 0, 0.15)',
        };
      }

      switch (props.layout) {
        case 'inline':
          return {
            ...baseStyles,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: props.theme.padding || '12px',
          };
        case 'minimal':
          return {
            ...baseStyles,
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            padding: props.theme.padding || '8px',
          };
        case 'featured':
          return {
            ...baseStyles,
            padding: props.theme.padding || '24px',
            boxShadow: props.theme.boxShadow || '0 4px 12px rgba(0, 0, 0, 0.15)',
          };
        case 'card':
        default:
          return baseStyles;
      }
    });

    // Style helpers
    const titleStyle = computed(() => ({
      margin: '0 0 8px 0',
      fontSize: props.theme.titleFontSize || '18px',
      fontWeight: 'bold',
      color: props.theme.titleColor || props.theme.textColor || '#333',
      lineHeight: '1.3',
    }));

    const descriptionStyle = computed(() => ({
      margin: '0 0 12px 0',
      fontSize: props.theme.descriptionFontSize || '14px',
      color: props.theme.descriptionColor || props.theme.textColor || '#666',
      lineHeight: '1.4',
    }));

    const brandStyle = computed(() => ({
      fontSize: props.theme.brandFontSize || '12px',
      color: props.theme.brandColor || props.theme.textColor || '#888',
      fontWeight: '500',
    }));

    const ctaStyle = computed(() => ({
      backgroundColor: ctaHovered.value 
        ? (props.theme.ctaHoverBackgroundColor || '#0056b3')
        : (props.theme.ctaBackgroundColor || '#007bff'),
      color: props.theme.ctaTextColor || 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      fontSize: props.theme.ctaFontSize || '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    }));

    const imageStyle = computed(() => ({
      width: '100%',
      height: 'auto',
      borderRadius: '4px',
      objectFit: 'cover' as const,
      aspectRatio: props.imageAspectRatio,
    }));

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
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock ad data
        const mockAd: Ad = {
          id: `native-${props.placementId}-${Date.now()}`,
          type: 'native' as any,
          format: 'display' as any,
          content: {
            title: 'Discover Amazing AI Tools',
            description: 'Boost your productivity with cutting-edge AI solutions. Join thousands of satisfied users who have transformed their workflow.',
            imageUrl: props.showImage ? 'https://via.placeholder.com/400x225/28a745/ffffff?text=Native+Ad+Image' : undefined,
            ctaText: 'Learn More',
            landingUrl: 'https://example.com',
            brandName: 'TechCorp Solutions',
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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

    // Truncate text helper
    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    // Watch for placement changes to reload ad
    watch(() => props.placementId, () => {
      loadAd();
    });

    // Watch for showImage changes to reload ad
    watch(() => props.showImage, () => {
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
      imageLoaded,
      ctaHovered,
      containerHovered,
      containerStyles,
      titleStyle,
      descriptionStyle,
      brandStyle,
      ctaStyle,
      imageStyle,
      handleAdClick,
      handleKeyDown,
      truncateText
    };
  },
  template: `
    <div
      ref="containerRef"
      :style="containerStyles"
      :role="loading && showLoading ? 'img' : (error || !ad) && showFallback ? 'img' : 'article'"
      :aria-label="loading && showLoading ? 'Loading native advertisement' : (error || !ad) && showFallback ? 'Native advertisement placeholder' : ariaLabel"
      :tabindex="ad ? 0 : undefined"
      :data-testid="loading && showLoading ? \`\${testId}-loading\` : (error || !ad) && showFallback ? \`\${testId}-fallback\` : testId"
      :data-ad-id="ad?.id"
      :data-placement-id="placementId"
      :data-layout="layout"
      :data-visible="isVisible"
      @click="ad ? handleAdClick() : undefined"
      @keydown="ad ? handleKeyDown($event) : undefined"
      @mouseenter="containerHovered = true"
      @mouseleave="containerHovered = false"
    >
      <!-- Loading State -->
      <div v-if="loading && showLoading" style="display: flex; align-items: center; gap: 8px; justify-content: center; padding: 20px;">
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
        <span>Loading content...</span>
      </div>

      <!-- Error/Fallback State -->
      <div v-else-if="(error || !ad) && showFallback" style="text-align: center; padding: 20px; opacity: 0.6;">
        <div style="font-size: 24px; margin-bottom: 8px;">📰</div>
        <div>Sponsored Content</div>
      </div>

      <!-- Ad Content -->
      <template v-else-if="ad">
        <!-- Inline Layout -->
        <template v-if="layout === 'inline'">
          <div v-if="showImage && ad.content.imageUrl" style="flex-shrink: 0; width: 80px; height: 80px;">
            <img
              :src="ad.content.imageUrl"
              :alt="ad.content.title"
              style="width: 80px; height: 80px; aspect-ratio: 1; border-radius: 4px; object-fit: cover;"
              loading="lazy"
              @load="imageLoaded = true"
            />
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 :style="{ ...titleStyle, fontSize: '16px', marginBottom: '4px' }">
              {{ ad.content.title }}
            </h3>
            <p :style="{ ...descriptionStyle, fontSize: '13px', marginBottom: '8px' }">
              {{ truncateText(ad.content.description, 100) }}
            </p>
            <div v-if="showBrandName" :style="brandStyle">{{ ad.content.brandName }}</div>
          </div>
        </template>

        <!-- Minimal Layout -->
        <template v-else-if="layout === 'minimal'">
          <h3 :style="{ ...titleStyle, fontSize: '16px' }">
            {{ ad.content.title }}
          </h3>
          <p :style="{ ...descriptionStyle, fontSize: '13px' }">
            {{ truncateText(ad.content.description, 120) }}
          </p>
          <div v-if="showBrandName" :style="brandStyle">{{ ad.content.brandName }}</div>
        </template>

        <!-- Featured Layout -->
        <template v-else-if="layout === 'featured'">
          <div v-if="showImage && ad.content.imageUrl" style="margin-bottom: 16px;">
            <img
              :src="ad.content.imageUrl"
              :alt="ad.content.title"
              :style="imageStyle"
              loading="lazy"
              @load="imageLoaded = true"
            />
          </div>
          <h2 :style="{ ...titleStyle, fontSize: '22px', marginBottom: '12px' }">
            {{ ad.content.title }}
          </h2>
          <p :style="{ ...descriptionStyle, fontSize: '16px', marginBottom: '16px' }">
            {{ ad.content.description }}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div v-if="showBrandName" :style="brandStyle">{{ ad.content.brandName }}</div>
            <button
              v-if="showCTA"
              :style="ctaStyle"
              @click.stop="handleAdClick"
              @mouseenter="ctaHovered = true"
              @mouseleave="ctaHovered = false"
            >
              {{ ad.content.ctaText }}
            </button>
          </div>
        </template>

        <!-- Card Layout (Default) -->
        <template v-else>
          <div v-if="showImage && ad.content.imageUrl" style="margin-bottom: 12px;">
            <img
              :src="ad.content.imageUrl"
              :alt="ad.content.title"
              :style="imageStyle"
              loading="lazy"
              @load="imageLoaded = true"
            />
          </div>
          <h3 :style="titleStyle">{{ ad.content.title }}</h3>
          <p :style="descriptionStyle">{{ ad.content.description }}</p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div v-if="showBrandName" :style="brandStyle">{{ ad.content.brandName }}</div>
            <button
              v-if="showCTA"
              :style="ctaStyle"
              @click.stop="handleAdClick"
              @mouseenter="ctaHovered = true"
              @mouseleave="ctaHovered = false"
            >
              {{ ad.content.ctaText }}
            </button>
          </div>
        </template>

        <!-- Ad Disclosure Label -->
        <div
          v-if="showAdLabel"
          :style="{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: theme.adLabelBackgroundColor || 'rgba(0, 0, 0, 0.7)',
            color: theme.adLabelColor || 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '2px',
            pointerEvents: 'none',
            fontWeight: '500',
          }"
        >
          {{ adLabelText }}
        </div>
      </template>
    </div>


  `
});