import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { VueAdNative } from '../VueAdNative';
import type { Ad } from '@ai-yuugen/types';

// Mock timers
vi.useFakeTimers();

describe('VueAdNative', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.find('[data-testid="ad-native-loading"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading content...');
  });

  it('renders ad content after loading', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    expect(wrapper.find('[data-testid="ad-native"]').exists()).toBe(true);
    expect(wrapper.find('h3').text()).toBe('Discover Amazing AI Tools');
  });

  it('renders fallback when showFallback is true and no ad', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        showFallback: true
      }
    });

    // Simulate loading completion with no ad
    wrapper.vm.loading = false;
    wrapper.vm.ad = null;
    await nextTick();

    expect(wrapper.find('[data-testid="ad-native-fallback"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Sponsored Content');
  });

  it('does not render fallback when showFallback is false', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        showFallback: false
      }
    });

    // Simulate loading completion with no ad
    wrapper.vm.loading = false;
    wrapper.vm.ad = null;
    await nextTick();

    expect(wrapper.find('[data-testid="ad-native-fallback"]').exists()).toBe(false);
  });

  it('emits adLoad event when ad loads successfully', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    const adLoadEvents = wrapper.emitted('adLoad');
    expect(adLoadEvents).toBeTruthy();
    expect(adLoadEvents![0]).toBeDefined();
    
    const emittedAd = adLoadEvents![0][0] as Ad;
    expect(emittedAd.id).toContain('native-test-placement');
    expect(emittedAd.content.title).toBe('Discover Amazing AI Tools');
  });

  it('emits adClick event when ad is clicked', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    // Click the ad
    await wrapper.find('[data-testid="ad-native"]').trigger('click');

    const adClickEvents = wrapper.emitted('adClick');
    expect(adClickEvents).toBeTruthy();
    expect(adClickEvents![0]).toBeDefined();
  });

  it('handles keyboard navigation', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    // Press Enter key
    await wrapper.find('[data-testid="ad-native"]').trigger('keydown', { key: 'Enter' });

    const adClickEvents = wrapper.emitted('adClick');
    expect(adClickEvents).toBeTruthy();

    // Press Space key
    await wrapper.find('[data-testid="ad-native"]').trigger('keydown', { key: ' ' });

    expect(wrapper.emitted('adClick')).toHaveLength(2);
  });

  describe('Layout Variants', () => {
    it('renders card layout by default', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement'
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      expect(wrapper.attributes('data-layout')).toBe('card');
      expect(wrapper.find('img').exists()).toBe(true);
      expect(wrapper.find('h3').exists()).toBe(true);
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('renders inline layout correctly', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          layout: 'inline'
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      expect(wrapper.attributes('data-layout')).toBe('inline');
      
      const styles = wrapper.vm.containerStyles;
      expect(styles.display).toBe('flex');
      expect(styles.alignItems).toBe('center');
    });

    it('renders minimal layout correctly', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          layout: 'minimal'
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      expect(wrapper.attributes('data-layout')).toBe('minimal');
      
      const styles = wrapper.vm.containerStyles;
      expect(styles.border).toBe('none');
      expect(styles.boxShadow).toBe('none');
      expect(styles.backgroundColor).toBe('transparent');
    });

    it('renders featured layout correctly', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          layout: 'featured'
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      expect(wrapper.attributes('data-layout')).toBe('featured');
      expect(wrapper.find('h2').exists()).toBe(true); // Featured uses h2 instead of h3
    });
  });

  describe('Component Options', () => {
    it('hides image when showImage is false', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          showImage: false
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      expect(wrapper.find('img').exists()).toBe(false);
    });

    it('hides CTA button when showCTA is false', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          showCTA: false
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      expect(wrapper.find('button').exists()).toBe(false);
    });

    it('hides brand name when showBrandName is false', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          showBrandName: false
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      const brandElements = wrapper.findAll('*').filter(el => 
        el.text().includes('TechCorp Solutions')
      );
      expect(brandElements).toHaveLength(0);
    });

    it('hides ad label when showAdLabel is false', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          showAdLabel: false
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      const adLabelElements = wrapper.findAll('*').filter(el => 
        el.text().includes('Sponsored')
      );
      expect(adLabelElements).toHaveLength(0);
    });

    it('shows custom ad label text', async () => {
      const wrapper = mount(VueAdNative, {
        props: {
          placementId: 'test-placement',
          adLabelText: 'Advertisement'
        }
      });

      // Fast-forward timers to complete loading
      vi.advanceTimersByTime(800);
      await nextTick();

      expect(wrapper.text()).toContain('Advertisement');
    });
  });

  it('applies custom theme styles', async () => {
    const customTheme = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      textColor: '#0000ff',
      titleColor: '#ff00ff',
      ctaBackgroundColor: '#ffff00'
    };

    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        theme: customTheme
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.backgroundColor).toBe('#ff0000');
    expect(styles.borderColor).toBe('#00ff00');
    expect(styles.color).toBe('#0000ff');

    const titleStyles = wrapper.vm.titleStyle;
    expect(titleStyles.color).toBe('#ff00ff');

    const ctaStyles = wrapper.vm.ctaStyle;
    expect(ctaStyles.backgroundColor).toBe('#ffff00');
  });

  it('handles CTA button hover states', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    const ctaButton = wrapper.find('button');
    
    await ctaButton.trigger('mouseenter');
    expect(wrapper.vm.ctaHovered).toBe(true);

    await ctaButton.trigger('mouseleave');
    expect(wrapper.vm.ctaHovered).toBe(false);
  });

  it('handles container hover states', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    const container = wrapper.find('[data-testid="ad-native"]');
    
    await container.trigger('mouseenter');
    expect(wrapper.vm.containerHovered).toBe(true);

    await container.trigger('mouseleave');
    expect(wrapper.vm.containerHovered).toBe(false);
  });

  it('truncates text in inline layout', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        layout: 'inline'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    // The description should be truncated to 100 characters in inline layout
    const description = wrapper.find('p').text();
    expect(description.length).toBeLessThanOrEqual(103); // 100 + "..."
  });

  it('truncates text in minimal layout', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        layout: 'minimal'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    // The description should be truncated to 120 characters in minimal layout
    const description = wrapper.find('p').text();
    expect(description.length).toBeLessThanOrEqual(123); // 120 + "..."
  });

  it('reloads ad when placementId changes', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement-1'
      }
    });

    // Fast-forward initial load
    vi.advanceTimersByTime(800);
    await nextTick();

    const initialAdLoadEvents = wrapper.emitted('adLoad');
    expect(initialAdLoadEvents).toHaveLength(1);

    // Change placement ID
    await wrapper.setProps({ placementId: 'test-placement-2' });

    // Fast-forward second load
    vi.advanceTimersByTime(800);
    await nextTick();

    const updatedAdLoadEvents = wrapper.emitted('adLoad');
    expect(updatedAdLoadEvents).toHaveLength(2);
  });

  it('reloads ad when showImage changes', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        showImage: true
      }
    });

    // Fast-forward initial load
    vi.advanceTimersByTime(800);
    await nextTick();

    const initialAdLoadEvents = wrapper.emitted('adLoad');
    expect(initialAdLoadEvents).toHaveLength(1);

    // Change showImage
    await wrapper.setProps({ showImage: false });

    // Fast-forward second load
    vi.advanceTimersByTime(800);
    await nextTick();

    const updatedAdLoadEvents = wrapper.emitted('adLoad');
    expect(updatedAdLoadEvents).toHaveLength(2);
  });

  it('opens new window when ad is clicked', async () => {
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    // Click the ad
    await wrapper.find('[data-testid="ad-native"]').trigger('click');

    expect(mockOpen).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );

    mockOpen.mockRestore();
  });

  it('sets correct accessibility attributes', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        ariaLabel: 'Custom Native Ad Label'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(800);
    await nextTick();

    const container = wrapper.find('[data-testid="ad-native"]');
    expect(container.attributes('role')).toBe('article');
    expect(container.attributes('aria-label')).toBe('Custom Native Ad Label');
    expect(container.attributes('tabindex')).toBe('0');
  });

  it('tracks visibility with intersection observer', () => {
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn()
    }));

    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(mockObserve).toHaveBeenCalled();

    wrapper.unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('applies custom image aspect ratio', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        imageAspectRatio: '4/3'
      }
    });

    const imageStyles = wrapper.vm.imageStyle;
    expect(imageStyles.aspectRatio).toBe('4/3');
  });
});