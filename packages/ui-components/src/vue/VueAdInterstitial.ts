import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { Ad } from '@ai-yuugen/types';

export interface AdInterstitialTheme {
  overlayColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  padding?: string;
  boxShadow?: string;
  closeButtonColor?: string;
  closeButtonHoverColor?: string;
}

export const VueAdInterstitial = defineComponent({
  name: 'VueAdInterstitial',
  props: {
    /** Unique identifier for the ad placement */
    placementId: {
      type: String,
      required: true
    },
    /** Whether the interstitial is currently visible */
    isOpen: {
      type: Boolean,
      required: true
    },
    /** Custom theme configuration */
    theme: {
      type: Object as () => AdInterstitialTheme,
      default: () => ({})
    },
    /** Whether to show close button */
    showCloseButton: {
      type: Boolean,
      default: true
    },
    /** Auto-close delay in milliseconds (0 to disable) */
    autoCloseDelay: {
      type: Number,
      default: 0
    },
    /** Whether clicking overlay closes the interstitial */
    closeOnOverlayClick: {
      type: Boolean,
      default: true
    },
    /** Whether pressing Escape closes the interstitial */
    closeOnEscape: {
      type: Boolean,
      default: true
    },
    /** Accessibility label */
    ariaLabel: {
      type: String,
      default: 'Interstitial Advertisement'
    },
    /** Test ID for testing */
    testId: {
      type: String,
      default: 'ad-interstitial'
    }
  },
  emits: {
    /** Callback when interstitial should be closed */
    close: () => true,
    /** Callback when ad loads successfully */
    adLoad: (ad: Ad) => !!ad,
    /** Callback when ad fails to load */
    adError: (error: Error) => !!error,
    /** Callback when ad is clicked */
    adClick: (ad: Ad) => !!ad
  },
  setup(props, { emit }) {
    const modalRef = ref<HTMLDivElement>();
    const ad = ref<Ad | null>(null);
    const loading = ref(true);
    const error = ref<Error | null>(null);
    const isVisible = ref(false);
    const closeButtonHovered = ref(false);
    
    let previousFocusElement: HTMLElement | null = null;
    let autoCloseTimer: number | null = null;

    // Computed styles
    const overlayStyles = computed(() => ({
      position: 'fixed' as const,
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: props.theme.overlayColor || 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }));

    const modalStyles = computed(() => ({
      position: 'relative' as const,
      backgroundColor: props.theme.backgroundColor || '#ffffff',
      border: (props.theme.borderWidth || '1px') + ' solid ' + (props.theme.borderColor || '#e9ecef'),
      borderRadius: props.theme.borderRadius || '8px',
      padding: props.theme.padding || '0',
      boxShadow: props.theme.boxShadow || '0 10px 30px rgba(0, 0, 0, 0.3)',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'hidden' as const,
      color: props.theme.textColor || '#333',
      fontSize: props.theme.fontSize || '16px',
      fontFamily: props.theme.fontFamily || 'system-ui, -apple-system, sans-serif',
    }));

    const closeButtonStyles = computed(() => ({
      position: 'absolute' as const,
      top: '12px',
      right: '12px',
      width: '32px',
      height: '32px',
      border: 'none',
      borderRadius: '50%',
      backgroundColor: closeButtonHovered.value 
        ? (props.theme.closeButtonHoverColor || 'rgba(0, 0, 0, 0.7)')
        : (props.theme.closeButtonColor || 'rgba(0, 0, 0, 0.5)'),
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      transition: 'background-color 0.2s ease',
    }));

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (props.isOpen) {
        isVisible.value = true;
        // Store previous focus
        previousFocusElement = document.activeElement as HTMLElement;
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
      } else {
        isVisible.value = false;
        // Restore body scroll
        document.body.style.overflow = '';
        // Restore focus
        if (previousFocusElement) {
          previousFocusElement.focus();
        }
      }
    };

    // Focus management
    const focusModal = async () => {
      if (isVisible.value && modalRef.value) {
        await nextTick();
        modalRef.value.focus();
      }
    };

    // Auto-close timer
    const setupAutoCloseTimer = () => {
      if (props.isOpen && props.autoCloseDelay > 0) {
        autoCloseTimer = window.setTimeout(() => {
          emit('close');
        }, props.autoCloseDelay);
      }
    };

    const clearAutoCloseTimer = () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
      }
    };

    // Escape key handler
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && props.closeOnEscape && props.isOpen) {
        emit('close');
      }
    };

    // Load ad data
    const loadAd = async () => {
      if (!props.isOpen) return;

      try {
        loading.value = true;
        error.value = null;

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock ad data
        const mockAd: Ad = {
          id: `interstitial-${props.placementId}-${Date.now()}`,
          type: 'interstitial' as any,
          format: 'display' as any,
          content: {
            title: 'Special Offer!',
            description: 'Don\'t miss out on this amazing opportunity. Limited time offer available now.',
            imageUrl: 'https://via.placeholder.com/600x400/007bff/ffffff?text=Interstitial+Ad',
            ctaText: 'Get Started',
            landingUrl: 'https://example.com',
            brandName: 'Premium Brand',
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

    // Handle overlay click
    const handleOverlayClick = (event: MouseEvent) => {
      if (event.target === event.currentTarget && props.closeOnOverlayClick) {
        emit('close');
      }
    };

    // Handle keyboard navigation (focus trap)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        // Trap focus within modal
        const focusableElements = modalRef.value?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Handle ad content keyboard interaction
    const handleAdKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleAdClick();
      }
    };

    // Watch for isOpen changes
    watch(() => props.isOpen, (newValue) => {
      handleVisibilityChange();
      if (newValue) {
        focusModal();
        setupAutoCloseTimer();
        loadAd();
      } else {
        clearAutoCloseTimer();
      }
    }, { immediate: true });

    onMounted(() => {
      if (props.isOpen) {
        document.addEventListener('keydown', handleEscape);
      }
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      clearAutoCloseTimer();
    });

    // Watch for escape key handling
    watch(() => props.isOpen, (newValue) => {
      if (newValue) {
        document.addEventListener('keydown', handleEscape);
      } else {
        document.removeEventListener('keydown', handleEscape);
      }
    });

    return {
      modalRef,
      ad,
      loading,
      error,
      isVisible,
      closeButtonHovered,
      overlayStyles,
      modalStyles,
      closeButtonStyles,
      handleAdClick,
      handleOverlayClick,
      handleKeyDown,
      handleAdKeyDown,
      emit
    };
  },
  template: `
    <Teleport to="body">
      <div
        v-if="isVisible"
        :style="overlayStyles"
        :data-testid="loading ? \`\${testId}-loading\` : (error || !ad) ? \`\${testId}-fallback\` : testId"
        :data-ad-id="ad?.id"
        :data-placement-id="placementId"
        @click="handleOverlayClick"
      >
        <div
          ref="modalRef"
          :style="modalStyles"
          role="dialog"
          :aria-label="loading ? 'Loading advertisement' : (error || !ad) ? 'Advertisement unavailable' : ariaLabel"
          aria-modal="true"
          tabindex="-1"
          @keydown="handleKeyDown"
        >
          <!-- Close Button -->
          <button
            v-if="showCloseButton"
            :style="closeButtonStyles"
            @click="emit('close')"
            @mouseenter="closeButtonHovered = true"
            @mouseleave="closeButtonHovered = false"
            aria-label="Close advertisement"
          >
            ×
          </button>

          <!-- Loading State -->
          <div v-if="loading" style="padding: 40px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
              <div
                style="
                  width: 24px;
                  height: 24px;
                  border: 3px solid #e9ecef;
                  border-top: 3px solid #007bff;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                "
              />
              <span>Loading advertisement...</span>
            </div>
          </div>

          <!-- Error/Fallback State -->
          <div v-else-if="error || !ad" style="padding: 40px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">📢</div>
            <h3 style="margin: 0 0 8px 0;">Advertisement Unavailable</h3>
            <p style="margin: 0; opacity: 0.7;">
              {{ error ? 'Failed to load advertisement' : 'No advertisement available' }}
            </p>
          </div>

          <!-- Ad Content -->
          <div
            v-else-if="ad"
            style="cursor: pointer;"
            role="button"
            tabindex="0"
            @click="handleAdClick"
            @keydown="handleAdKeyDown"
          >
            <!-- Image Ad -->
            <img
              v-if="ad.content.imageUrl"
              :src="ad.content.imageUrl"
              :alt="ad.content.title"
              style="width: 100%; height: auto; display: block;"
              loading="lazy"
            />

            <!-- Text Ad -->
            <div v-else style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold;">
                {{ ad.content.title }}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; opacity: 0.8;">
                {{ ad.content.description }}
              </p>
              <button
                style="
                  background-color: #007bff;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  padding: 12px 24px;
                  font-size: 16px;
                  cursor: pointer;
                  font-weight: bold;
                  transition: background-color 0.2s ease;
                "
                @click.stop="handleAdClick"
                @mouseenter="$event.target.style.backgroundColor = '#0056b3'"
                @mouseleave="$event.target.style.backgroundColor = '#007bff'"
              >
                {{ ad.content.ctaText }}
              </button>
              <div style="margin-top: 16px; font-size: 14px; opacity: 0.6;">
                {{ ad.content.brandName }}
              </div>
            </div>

            <!-- Ad Label -->
            <div
              style="
                position: absolute;
                bottom: 8px;
                left: 8px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 4px;
                pointer-events: none;
              "
            >
              Advertisement
            </div>
          </div>
        </div>
      </div>
    </Teleport>


  `
});