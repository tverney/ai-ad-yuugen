import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { VueAdInterstitial } from '../VueAdInterstitial';

describe('VueAdInterstitial - Simple Tests', () => {
  it('renders with required props', () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: false
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('placementId')).toBe('test-placement');
    expect(wrapper.props('isOpen')).toBe(false);
  });

  it('does not render when isOpen is false', () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: false
      }
    });

    expect(wrapper.vm.isVisible).toBe(false);
  });

  it('applies custom theme styles', () => {
    const customTheme = {
      overlayColor: 'rgba(255, 0, 0, 0.8)',
      backgroundColor: '#00ff00',
      borderColor: '#0000ff',
      textColor: '#ff00ff'
    };

    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        theme: customTheme
      }
    });

    const overlayStyles = wrapper.vm.overlayStyles;
    expect(overlayStyles.backgroundColor).toBe('rgba(255, 0, 0, 0.8)');

    const modalStyles = wrapper.vm.modalStyles;
    expect(modalStyles.backgroundColor).toBe('#00ff00');
    expect(modalStyles.color).toBe('#ff00ff');
    // Check border construction
    expect(modalStyles.border).toBe('1px solid #0000ff');
  });

  it('has correct default props', () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: false
      }
    });

    expect(wrapper.props('showCloseButton')).toBe(true);
    expect(wrapper.props('autoCloseDelay')).toBe(0);
    expect(wrapper.props('closeOnOverlayClick')).toBe(true);
    expect(wrapper.props('closeOnEscape')).toBe(true);
    expect(wrapper.props('ariaLabel')).toBe('Interstitial Advertisement');
    expect(wrapper.props('testId')).toBe('ad-interstitial');
  });

  it('can be configured with custom settings', () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        showCloseButton: false,
        autoCloseDelay: 5000,
        closeOnOverlayClick: false,
        closeOnEscape: false,
        ariaLabel: 'Custom Label',
        testId: 'custom-test-id'
      }
    });

    expect(wrapper.props('showCloseButton')).toBe(false);
    expect(wrapper.props('autoCloseDelay')).toBe(5000);
    expect(wrapper.props('closeOnOverlayClick')).toBe(false);
    expect(wrapper.props('closeOnEscape')).toBe(false);
    expect(wrapper.props('ariaLabel')).toBe('Custom Label');
    expect(wrapper.props('testId')).toBe('custom-test-id');
  });

  it('initializes with correct reactive state', () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: false
      }
    });

    expect(wrapper.vm.ad).toBe(null);
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.vm.error).toBe(null);
    expect(wrapper.vm.isVisible).toBe(false);
    expect(wrapper.vm.closeButtonHovered).toBe(false);
  });

  it('handles close button hover states', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        showCloseButton: true
      }
    });

    expect(wrapper.vm.closeButtonHovered).toBe(false);

    // Simulate hover state change
    wrapper.vm.closeButtonHovered = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.closeButtonHovered).toBe(true);

    const closeButtonStyles = wrapper.vm.closeButtonStyles;
    expect(closeButtonStyles.backgroundColor).toBe('rgba(0, 0, 0, 0.7)'); // hover color
  });

  it('computes close button styles correctly', () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        theme: {
          closeButtonColor: '#ff0000',
          closeButtonHoverColor: '#00ff00'
        }
      }
    });

    // Default state
    const defaultStyles = wrapper.vm.closeButtonStyles;
    expect(defaultStyles.backgroundColor).toBe('#ff0000');

    // Hover state
    wrapper.vm.closeButtonHovered = true;
    const hoverStyles = wrapper.vm.closeButtonStyles;
    expect(hoverStyles.backgroundColor).toBe('#00ff00');
  });
});