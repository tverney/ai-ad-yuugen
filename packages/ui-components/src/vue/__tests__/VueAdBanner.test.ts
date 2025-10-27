import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { VueAdBanner } from '../VueAdBanner';
import type { Ad } from '@ai-yuugen/types';

// Mock timers
vi.useFakeTimers();

describe('VueAdBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.find('[data-testid="ad-banner-loading"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading ad...');
  });

  it('renders ad content after loading', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(wrapper.find('[data-testid="ad-banner"]').exists()).toBe(true);
    expect(wrapper.find('img').exists()).toBe(true);
  });

  it('renders fallback when showFallback is true and no ad', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        showFallback: true
      }
    });

    // Simulate loading completion with no ad
    await wrapper.vm.$nextTick();
    wrapper.vm.loading = false;
    wrapper.vm.ad = null;
    await nextTick();

    expect(wrapper.find('[data-testid="ad-banner-fallback"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Advertisement');
  });

  it('does not render fallback when showFallback is false', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        showFallback: false
      }
    });

    // Simulate loading completion with no ad
    await wrapper.vm.$nextTick();
    wrapper.vm.loading = false;
    wrapper.vm.ad = null;
    await nextTick();

    expect(wrapper.find('[data-testid="ad-banner-fallback"]').exists()).toBe(false);
  });

  it('emits adLoad event when ad loads successfully', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    const adLoadEvents = wrapper.emitted('adLoad');
    expect(adLoadEvents).toBeTruthy();
    expect(adLoadEvents![0]).toBeDefined();
    
    const emittedAd = adLoadEvents![0][0] as Ad;
    expect(emittedAd.id).toContain('banner-test-placement');
    expect(emittedAd.content.title).toBe('Sample Advertisement');
  });

  it('emits adClick event when ad is clicked', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    // Click the ad
    await wrapper.find('[data-testid="ad-banner"]').trigger('click');

    const adClickEvents = wrapper.emitted('adClick');
    expect(adClickEvents).toBeTruthy();
    expect(adClickEvents![0]).toBeDefined();
  });

  it('handles keyboard navigation', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    // Press Enter key
    await wrapper.find('[data-testid="ad-banner"]').trigger('keydown', { key: 'Enter' });

    const adClickEvents = wrapper.emitted('adClick');
    expect(adClickEvents).toBeTruthy();

    // Press Space key
    await wrapper.find('[data-testid="ad-banner"]').trigger('keydown', { key: ' ' });

    expect(wrapper.emitted('adClick')).toHaveLength(2);
  });

  it('applies responsive styles when responsive is true', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        responsive: true,
        size: { width: 728, height: 90, responsive: true }
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.width).toBe('100%');
    expect(styles.maxWidth).toBe('728px');
    expect(styles.aspectRatio).toBe('728 / 90');
  });

  it('applies fixed styles when responsive is false', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        responsive: false,
        size: { width: 300, height: 250, responsive: false }
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.width).toBe('300px');
    expect(styles.height).toBe('250px');
  });

  it('applies custom theme styles', () => {
    const customTheme = {
      backgroundColor: '#ff0000',
      borderColor: '#00ff00',
      textColor: '#0000ff',
      fontSize: '16px'
    };

    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        theme: customTheme
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.backgroundColor).toBe('#ff0000');
    expect(styles.borderColor).toBe('#00ff00');
    expect(styles.color).toBe('#0000ff');
    expect(styles.fontSize).toBe('16px');
  });

  it('reloads ad when placementId changes', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement-1'
      }
    });

    // Fast-forward initial load
    vi.advanceTimersByTime(1000);
    await nextTick();

    const initialAdLoadEvents = wrapper.emitted('adLoad');
    expect(initialAdLoadEvents).toHaveLength(1);

    // Change placement ID
    await wrapper.setProps({ placementId: 'test-placement-2' });

    // Fast-forward second load
    vi.advanceTimersByTime(1000);
    await nextTick();

    const updatedAdLoadEvents = wrapper.emitted('adLoad');
    expect(updatedAdLoadEvents).toHaveLength(2);
  });

  it('opens new window when ad is clicked', async () => {
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    // Click the ad
    await wrapper.find('[data-testid="ad-banner"]').trigger('click');

    expect(mockOpen).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );

    mockOpen.mockRestore();
  });

  it('renders text ad when no image URL is provided', async () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Mock ad without image
    wrapper.vm.ad = {
      id: 'test-ad',
      type: 'banner' as any,
      format: 'display' as any,
      content: {
        title: 'Text Ad Title',
        description: 'Text ad description',
        ctaText: 'Click Here',
        landingUrl: 'https://example.com',
        brandName: 'Test Brand'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    };
    wrapper.vm.loading = false;
    await nextTick();

    expect(wrapper.find('h3').text()).toBe('Text Ad Title');
    expect(wrapper.find('p').text()).toBe('Text ad description');
    expect(wrapper.find('button').text()).toBe('Click Here');
    expect(wrapper.find('small').text()).toBe('Test Brand');
  });

  it('sets correct accessibility attributes', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        ariaLabel: 'Custom Ad Label'
      }
    });

    const container = wrapper.find('[data-testid="ad-banner-loading"]');
    expect(container.attributes('role')).toBe('img');
    expect(container.attributes('aria-label')).toBe('Loading advertisement');
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

    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(mockObserve).toHaveBeenCalled();

    wrapper.unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});