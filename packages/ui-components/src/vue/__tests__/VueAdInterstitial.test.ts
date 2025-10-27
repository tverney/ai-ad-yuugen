import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { VueAdInterstitial } from '../VueAdInterstitial';
import type { Ad } from '@ai-yuugen/types';

// Mock timers
vi.useFakeTimers();

describe('VueAdInterstitial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  it('does not render when isOpen is false', () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: false
      }
    });

    expect(wrapper.find('[data-testid="ad-interstitial-loading"]').exists()).toBe(false);
  });

  it('renders loading state when isOpen is true', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    await nextTick();
    expect(wrapper.find('[data-testid="ad-interstitial-loading"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading advertisement...');
  });

  it('renders ad content after loading', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(wrapper.find('[data-testid="ad-interstitial"]').exists()).toBe(true);
    expect(wrapper.find('img').exists()).toBe(true);
  });

  it('prevents body scroll when open', async () => {
    mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.setProps({ isOpen: false });
    await nextTick();
    expect(document.body.style.overflow).toBe('');
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        showCloseButton: true
      }
    });

    await nextTick();
    
    const closeButton = wrapper.find('button[aria-label="Close advertisement"]');
    expect(closeButton.exists()).toBe(true);
    
    await closeButton.trigger('click');
    
    const closeEvents = wrapper.emitted('close');
    expect(closeEvents).toBeTruthy();
    expect(closeEvents).toHaveLength(1);
  });

  it('emits close event when overlay is clicked and closeOnOverlayClick is true', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        closeOnOverlayClick: true
      }
    });

    await nextTick();
    
    // Click on the overlay (not the modal content)
    const overlay = wrapper.find('[data-testid="ad-interstitial-loading"]').element.parentElement;
    await wrapper.trigger('click');
    
    const closeEvents = wrapper.emitted('close');
    expect(closeEvents).toBeTruthy();
  });

  it('does not emit close event when overlay is clicked and closeOnOverlayClick is false', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        closeOnOverlayClick: false
      }
    });

    await nextTick();
    
    await wrapper.trigger('click');
    
    const closeEvents = wrapper.emitted('close');
    expect(closeEvents).toBeFalsy();
  });

  it('emits adLoad event when ad loads successfully', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    const adLoadEvents = wrapper.emitted('adLoad');
    expect(adLoadEvents).toBeTruthy();
    expect(adLoadEvents![0]).toBeDefined();
    
    const emittedAd = adLoadEvents![0][0] as Ad;
    expect(emittedAd.id).toContain('interstitial-test-placement');
    expect(emittedAd.content.title).toBe('Special Offer!');
  });

  it('emits adClick event when ad is clicked', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    // Click the ad content
    const adContent = wrapper.find('[role="button"][tabindex="0"]');
    await adContent.trigger('click');

    const adClickEvents = wrapper.emitted('adClick');
    expect(adClickEvents).toBeTruthy();
    expect(adClickEvents![0]).toBeDefined();
  });

  it('handles keyboard navigation for ad content', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    const adContent = wrapper.find('[role="button"][tabindex="0"]');
    
    // Press Enter key
    await adContent.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('adClick')).toBeTruthy();

    // Press Space key
    await adContent.trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('adClick')).toHaveLength(2);
  });

  it('auto-closes after specified delay', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        autoCloseDelay: 5000
      }
    });

    await nextTick();

    // Fast-forward the auto-close timer
    vi.advanceTimersByTime(5000);
    await nextTick();

    const closeEvents = wrapper.emitted('close');
    expect(closeEvents).toBeTruthy();
    expect(closeEvents).toHaveLength(1);
  });

  it('does not auto-close when autoCloseDelay is 0', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        autoCloseDelay: 0
      }
    });

    await nextTick();

    // Fast-forward a long time
    vi.advanceTimersByTime(10000);
    await nextTick();

    const closeEvents = wrapper.emitted('close');
    expect(closeEvents).toBeFalsy();
  });

  it('applies custom theme styles', async () => {
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

    await nextTick();

    const overlayStyles = wrapper.vm.overlayStyles;
    expect(overlayStyles.backgroundColor).toBe('rgba(255, 0, 0, 0.8)');

    const modalStyles = wrapper.vm.modalStyles;
    expect(modalStyles.backgroundColor).toBe('#00ff00');
    expect(modalStyles.borderColor).toBe('#0000ff');
    expect(modalStyles.color).toBe('#ff00ff');
  });

  it('renders fallback when no ad is available', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    // Simulate loading completion with no ad
    wrapper.vm.loading = false;
    wrapper.vm.ad = null;
    await nextTick();

    expect(wrapper.find('[data-testid="ad-interstitial-fallback"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Advertisement Unavailable');
  });

  it('renders text ad when no image URL is provided', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    // Mock ad without image
    wrapper.vm.ad = {
      id: 'test-ad',
      type: 'interstitial' as any,
      format: 'display' as any,
      content: {
        title: 'Text Interstitial',
        description: 'This is a text-based interstitial ad',
        ctaText: 'Get Started',
        landingUrl: 'https://example.com',
        brandName: 'Test Brand'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    };
    wrapper.vm.loading = false;
    await nextTick();

    expect(wrapper.find('h2').text()).toBe('Text Interstitial');
    expect(wrapper.find('p').text()).toBe('This is a text-based interstitial ad');
    expect(wrapper.find('button').text()).toBe('Get Started');
  });

  it('opens new window when ad is clicked', async () => {
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true
      }
    });

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(1000);
    await nextTick();

    // Click the ad
    const adContent = wrapper.find('[role="button"][tabindex="0"]');
    await adContent.trigger('click');

    expect(mockOpen).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );

    mockOpen.mockRestore();
  });

  it('sets correct accessibility attributes', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        ariaLabel: 'Custom Interstitial Label'
      }
    });

    await nextTick();

    const modal = wrapper.find('[role="dialog"]');
    expect(modal.exists()).toBe(true);
    expect(modal.attributes('aria-modal')).toBe('true');
    expect(modal.attributes('aria-label')).toBe('Loading advertisement');
  });

  it('handles close button hover states', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        showCloseButton: true
      }
    });

    await nextTick();

    const closeButton = wrapper.find('button[aria-label="Close advertisement"]');
    
    await closeButton.trigger('mouseenter');
    expect(wrapper.vm.closeButtonHovered).toBe(true);

    await closeButton.trigger('mouseleave');
    expect(wrapper.vm.closeButtonHovered).toBe(false);
  });

  it('handles escape key when closeOnEscape is true', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        closeOnEscape: true
      }
    });

    await nextTick();

    // Simulate escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    await nextTick();

    const closeEvents = wrapper.emitted('close');
    expect(closeEvents).toBeTruthy();
  });

  it('does not close on escape key when closeOnEscape is false', async () => {
    const wrapper = mount(VueAdInterstitial, {
      props: {
        placementId: 'test-placement',
        isOpen: true,
        closeOnEscape: false
      }
    });

    await nextTick();

    // Simulate escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    await nextTick();

    const closeEvents = wrapper.emitted('close');
    expect(closeEvents).toBeFalsy();
  });
});