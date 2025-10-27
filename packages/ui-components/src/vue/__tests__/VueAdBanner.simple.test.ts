import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { VueAdBanner } from '../VueAdBanner';

describe('VueAdBanner - Simple Tests', () => {
  it('renders with required props', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('placementId')).toBe('test-placement');
  });

  it('applies responsive styles correctly', () => {
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
    expect(styles.color).toBe('#0000ff');
    expect(styles.fontSize).toBe('16px');
    // Check border construction
    expect(styles.border).toBe('1px solid #00ff00');
  });

  it('has correct default props', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.props('responsive')).toBe(true);
    expect(wrapper.props('showLoading')).toBe(true);
    expect(wrapper.props('showFallback')).toBe(true);
    expect(wrapper.props('ariaLabel')).toBe('Advertisement');
    expect(wrapper.props('testId')).toBe('ad-banner');
  });

  it('renders loading state initially', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      }
    });

    // Component should be in loading state initially
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.vm.ad).toBe(null);
    expect(wrapper.text()).toContain('Loading ad...');
  });

  it('can be configured to hide loading state', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        showLoading: false
      }
    });

    expect(wrapper.props('showLoading')).toBe(false);
  });

  it('can be configured to hide fallback state', () => {
    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement',
        showFallback: false
      }
    });

    expect(wrapper.props('showFallback')).toBe(false);
  });

  it('sets up intersection observer on mount', async () => {
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn()
    }));

    const wrapper = mount(VueAdBanner, {
      props: {
        placementId: 'test-placement'
      },
      attachTo: document.body
    });

    // Wait for component to mount and setup observer
    await wrapper.vm.$nextTick();

    expect(global.IntersectionObserver).toHaveBeenCalled();

    wrapper.unmount();
  });
});