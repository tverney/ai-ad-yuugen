import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { VueAdNative } from '../VueAdNative';

describe('VueAdNative - Simple Tests', () => {
  it('renders with required props', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('placementId')).toBe('test-placement');
  });

  it('has correct default props', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.props('layout')).toBe('card');
    expect(wrapper.props('showLoading')).toBe(true);
    expect(wrapper.props('showFallback')).toBe(true);
    expect(wrapper.props('showAdLabel')).toBe(true);
    expect(wrapper.props('adLabelText')).toBe('Sponsored');
    expect(wrapper.props('showBrandName')).toBe(true);
    expect(wrapper.props('showCTA')).toBe(true);
    expect(wrapper.props('showImage')).toBe(true);
    expect(wrapper.props('imageAspectRatio')).toBe('16/9');
    expect(wrapper.props('ariaLabel')).toBe('Native Advertisement');
    expect(wrapper.props('testId')).toBe('ad-native');
  });

  it('applies layout-specific styles for card layout', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        layout: 'card'
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.backgroundColor).toBe('#ffffff');
    expect(styles.border).toBe('1px solid #e9ecef');
    expect(styles.borderRadius).toBe('8px');
    expect(styles.padding).toBe('16px');
  });

  it('applies layout-specific styles for inline layout', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        layout: 'inline'
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.display).toBe('flex');
    expect(styles.alignItems).toBe('center');
    expect(styles.gap).toBe('12px');
    expect(styles.padding).toBe('12px');
  });

  it('applies layout-specific styles for minimal layout', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        layout: 'minimal'
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.border).toBe('none');
    expect(styles.boxShadow).toBe('none');
    expect(styles.backgroundColor).toBe('transparent');
    expect(styles.padding).toBe('8px');
  });

  it('applies layout-specific styles for featured layout', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        layout: 'featured'
      }
    });

    const styles = wrapper.vm.containerStyles;
    expect(styles.padding).toBe('24px');
    expect(styles.boxShadow).toBe('0 4px 12px rgba(0, 0, 0, 0.15)');
  });

  it('applies custom theme styles', () => {
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

    const containerStyles = wrapper.vm.containerStyles;
    expect(containerStyles.backgroundColor).toBe('#ff0000');
    expect(containerStyles.color).toBe('#0000ff');
    expect(containerStyles.border).toBe('1px solid #00ff00');

    const titleStyles = wrapper.vm.titleStyle;
    expect(titleStyles.color).toBe('#ff00ff');

    const ctaStyles = wrapper.vm.ctaStyle;
    expect(ctaStyles.backgroundColor).toBe('#ffff00');
  });

  it('handles hover states correctly', async () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.vm.ctaHovered).toBe(false);
    expect(wrapper.vm.containerHovered).toBe(false);

    // Simulate hover states
    wrapper.vm.ctaHovered = true;
    wrapper.vm.containerHovered = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.ctaHovered).toBe(true);
    expect(wrapper.vm.containerHovered).toBe(true);

    // Check that hover affects styles
    const ctaStyles = wrapper.vm.ctaStyle;
    expect(ctaStyles.backgroundColor).toBe('#0056b3'); // hover color

    const containerStyles = wrapper.vm.containerStyles;
    expect(containerStyles.transform).toBe('translateY(-2px)');
  });

  it('computes style helpers correctly', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        theme: {
          titleFontSize: '20px',
          descriptionFontSize: '16px',
          brandFontSize: '14px',
          ctaFontSize: '18px'
        }
      }
    });

    const titleStyle = wrapper.vm.titleStyle;
    expect(titleStyle.fontSize).toBe('20px');
    expect(titleStyle.fontWeight).toBe('bold');

    const descriptionStyle = wrapper.vm.descriptionStyle;
    expect(descriptionStyle.fontSize).toBe('16px');

    const brandStyle = wrapper.vm.brandStyle;
    expect(brandStyle.fontSize).toBe('14px');

    const ctaStyle = wrapper.vm.ctaStyle;
    expect(ctaStyle.fontSize).toBe('18px');
  });

  it('computes image styles correctly', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement',
        imageAspectRatio: '4/3'
      }
    });

    const imageStyle = wrapper.vm.imageStyle;
    expect(imageStyle.width).toBe('100%');
    expect(imageStyle.height).toBe('auto');
    expect(imageStyle.aspectRatio).toBe('4/3');
    expect(imageStyle.objectFit).toBe('cover');
  });

  it('initializes with correct reactive state', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    expect(wrapper.vm.ad).toBe(null);
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.vm.error).toBe(null);
    expect(wrapper.vm.isVisible).toBe(false);
    expect(wrapper.vm.imageLoaded).toBe(false);
    expect(wrapper.vm.ctaHovered).toBe(false);
    expect(wrapper.vm.containerHovered).toBe(false);
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

    const wrapper = mount(VueAdNative, {
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

  it('has truncateText helper function', () => {
    const wrapper = mount(VueAdNative, {
      props: {
        placementId: 'test-placement'
      }
    });

    const longText = 'This is a very long text that should be truncated when it exceeds the maximum length specified';
    const truncated = wrapper.vm.truncateText(longText, 50);
    
    expect(truncated.length).toBeLessThanOrEqual(53); // 50 + "..."
    expect(truncated).toContain('...');

    const shortText = 'Short text';
    const notTruncated = wrapper.vm.truncateText(shortText, 50);
    expect(notTruncated).toBe(shortText);
  });
});