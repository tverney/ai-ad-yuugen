// Test application for E2E testing of AI Ad Yuugen SDK
class TestApp {
    constructor() {
        this.sdk = null;
        this.metrics = {
            sdkLoadTime: 0,
            adRequestTime: 0,
            impressions: 0,
            clicks: 0
        };
        this.currentFramework = 'vanilla';
        this.init();
    }

    async init() {
        const startTime = performance.now();
        
        try {
            // Initialize SDK with test configuration
            const { AIYuugenSDK } = await import('/packages/sdk/dist/index.js');
            this.sdk = new AIYuugenSDK();
            
            await this.sdk.initialize({
                apiKey: 'test-api-key',
                environment: 'test',
                privacy: {
                    gdprCompliant: true,
                    ccpaCompliant: true
                },
                targeting: {
                    enableContextAnalysis: true,
                    enableBehavioralTargeting: true
                }
            });

            this.metrics.sdkLoadTime = performance.now() - startTime;
            this.updateMetricsDisplay();
            
            this.setupEventListeners();
            this.setupFrameworkSwitching();
            this.setupPrivacyControls();
            
            console.log('AI Ad Yuugen SDK initialized successfully');
        } catch (error) {
            console.error('Failed to initialize SDK:', error);
            this.showError('SDK initialization failed: ' + error.message);
        }
    }

    setupEventListeners() {
        // Vanilla JS controls
        document.getElementById('vanilla-send-message')?.addEventListener('click', () => {
            this.sendTestMessage('vanilla');
        });

        document.getElementById('vanilla-request-ad')?.addEventListener('click', () => {
            this.requestAd('vanilla', 'banner');
        });

        document.getElementById('vanilla-show-interstitial')?.addEventListener('click', () => {
            this.showInterstitial('vanilla');
        });
    }

    setupFrameworkSwitching() {
        const tabs = document.querySelectorAll('.framework-tab');
        const contents = document.querySelectorAll('.framework-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const framework = tab.dataset.framework;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                contents.forEach(c => c.classList.remove('active'));
                document.querySelector(`[data-framework="${framework}"]`).classList.add('active');
                
                this.currentFramework = framework;
                this.loadFrameworkImplementation(framework);
            });
        });
    }

    setupPrivacyControls() {
        document.getElementById('update-consent')?.addEventListener('click', () => {
            this.updateConsent();
        });

        document.getElementById('opt-out-all')?.addEventListener('click', () => {
            this.optOutAll();
        });
    }

    async loadFrameworkImplementation(framework) {
        try {
            switch (framework) {
                case 'react':
                    await this.loadReactApp();
                    break;
                case 'vue':
                    await this.loadVueApp();
                    break;
                case 'angular':
                    await this.loadAngularApp();
                    break;
                case 'vanilla':
                    // Already loaded
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${framework} implementation:`, error);
            this.showError(`Failed to load ${framework} implementation`);
        }
    }

    async loadReactApp() {
        // Dynamically load React implementation
        const container = document.getElementById('react-app');
        container.innerHTML = `
            <div class="chat-container" data-testid="react-chat">
                <div class="message ai-message">React AI Assistant ready!</div>
            </div>
            <div class="ad-container" data-testid="react-banner-ad" data-ad-type="banner">
                <!-- React Banner Ad Component -->
            </div>
            <div class="controls">
                <button data-testid="react-send-message">Send Test Message</button>
                <button data-testid="react-request-ad">Request Ad</button>
                <button data-testid="react-show-interstitial">Show Interstitial</button>
            </div>
            <div class="ad-container" data-testid="react-native-ad" data-ad-type="native">
                <!-- React Native Ad Component -->
            </div>
        `;

        // Setup React-specific event listeners
        container.querySelector('[data-testid="react-send-message"]').addEventListener('click', () => {
            this.sendTestMessage('react');
        });
        container.querySelector('[data-testid="react-request-ad"]').addEventListener('click', () => {
            this.requestAd('react', 'banner');
        });
        container.querySelector('[data-testid="react-show-interstitial"]').addEventListener('click', () => {
            this.showInterstitial('react');
        });
    }

    async loadVueApp() {
        // Dynamically load Vue implementation
        const container = document.getElementById('vue-app');
        container.innerHTML = `
            <div class="chat-container" data-testid="vue-chat">
                <div class="message ai-message">Vue AI Assistant ready!</div>
            </div>
            <div class="ad-container" data-testid="vue-banner-ad" data-ad-type="banner">
                <!-- Vue Banner Ad Component -->
            </div>
            <div class="controls">
                <button data-testid="vue-send-message">Send Test Message</button>
                <button data-testid="vue-request-ad">Request Ad</button>
                <button data-testid="vue-show-interstitial">Show Interstitial</button>
            </div>
            <div class="ad-container" data-testid="vue-native-ad" data-ad-type="native">
                <!-- Vue Native Ad Component -->
            </div>
        `;

        // Setup Vue-specific event listeners
        container.querySelector('[data-testid="vue-send-message"]').addEventListener('click', () => {
            this.sendTestMessage('vue');
        });
        container.querySelector('[data-testid="vue-request-ad"]').addEventListener('click', () => {
            this.requestAd('vue', 'banner');
        });
        container.querySelector('[data-testid="vue-show-interstitial"]').addEventListener('click', () => {
            this.showInterstitial('vue');
        });
    }

    async loadAngularApp() {
        // Dynamically load Angular implementation
        const container = document.getElementById('angular-app');
        container.innerHTML = `
            <div class="chat-container" data-testid="angular-chat">
                <div class="message ai-message">Angular AI Assistant ready!</div>
            </div>
            <div class="ad-container" data-testid="angular-banner-ad" data-ad-type="banner">
                <!-- Angular Banner Ad Component -->
            </div>
            <div class="controls">
                <button data-testid="angular-send-message">Send Test Message</button>
                <button data-testid="angular-request-ad">Request Ad</button>
                <button data-testid="angular-show-interstitial">Show Interstitial</button>
            </div>
            <div class="ad-container" data-testid="angular-native-ad" data-ad-type="native">
                <!-- Angular Native Ad Component -->
            </div>
        `;

        // Setup Angular-specific event listeners
        container.querySelector('[data-testid="angular-send-message"]').addEventListener('click', () => {
            this.sendTestMessage('angular');
        });
        container.querySelector('[data-testid="angular-request-ad"]').addEventListener('click', () => {
            this.requestAd('angular', 'banner');
        });
        container.querySelector('[data-testid="angular-show-interstitial"]').addEventListener('click', () => {
            this.showInterstitial('angular');
        });
    }

    async sendTestMessage(framework) {
        const chatContainer = document.querySelector(`[data-testid="${framework}-chat"]`);
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.textContent = 'I need help with machine learning algorithms';
        chatContainer.appendChild(userMessage);

        // Simulate AI response with context for ad targeting
        setTimeout(() => {
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai-message';
            aiMessage.textContent = 'I can help you with machine learning! There are several popular algorithms like neural networks, decision trees, and support vector machines. What specific area interests you?';
            chatContainer.appendChild(aiMessage);

            // Update context for ad targeting
            if (this.sdk) {
                this.sdk.updateUserContext({
                    topics: ['machine learning', 'algorithms', 'technology'],
                    intent: 'learning',
                    engagement: 'high'
                });
            }
        }, 1000);
    }

    async requestAd(framework, adType) {
        if (!this.sdk) {
            this.showError('SDK not initialized');
            return;
        }

        const startTime = performance.now();
        
        try {
            const adContainer = document.querySelector(`[data-testid="${framework}-${adType}-ad"]`);
            
            const ad = await this.sdk.requestAd({
                placement: `${framework}-${adType}`,
                format: adType,
                size: adType === 'banner' ? '728x90' : 'auto'
            }, {
                topics: ['machine learning', 'technology'],
                intent: 'learning',
                conversationStage: 'engaged'
            });

            this.metrics.adRequestTime = performance.now() - startTime;
            this.updateMetricsDisplay();

            if (ad) {
                this.displayAd(ad, adContainer, framework);
                this.metrics.impressions++;
                this.updateMetricsDisplay();
            } else {
                adContainer.innerHTML = '<p>No ad available</p>';
            }
        } catch (error) {
            console.error('Ad request failed:', error);
            this.showError('Ad request failed: ' + error.message);
        }
    }

    displayAd(ad, container, framework) {
        container.innerHTML = `
            <div class="ad-content" data-testid="${framework}-ad-content" data-ad-id="${ad.id}">
                <div class="ad-header">
                    <span class="ad-label">Advertisement</span>
                    <button class="ad-close" data-testid="${framework}-ad-close">×</button>
                </div>
                <div class="ad-body">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}" style="max-width: 100%; height: auto;">` : ''}
                    <button class="ad-cta" data-testid="${framework}-ad-cta">${ad.ctaText}</button>
                </div>
            </div>
        `;

        // Setup ad interaction handlers
        const ctaButton = container.querySelector('.ad-cta');
        const closeButton = container.querySelector('.ad-close');

        ctaButton?.addEventListener('click', () => {
            this.handleAdClick(ad.id, framework);
        });

        closeButton?.addEventListener('click', () => {
            this.hideAd(ad.id, container);
        });
    }

    async showInterstitial(framework) {
        if (!this.sdk) {
            this.showError('SDK not initialized');
            return;
        }

        try {
            const ad = await this.sdk.requestAd({
                placement: `${framework}-interstitial`,
                format: 'interstitial',
                size: 'fullscreen'
            }, {
                topics: ['machine learning', 'technology'],
                intent: 'learning',
                conversationStage: 'transition'
            });

            if (ad) {
                this.displayInterstitial(ad, framework);
                this.metrics.impressions++;
                this.updateMetricsDisplay();
            }
        } catch (error) {
            console.error('Interstitial request failed:', error);
            this.showError('Interstitial request failed: ' + error.message);
        }
    }

    displayInterstitial(ad, framework) {
        const container = document.getElementById('interstitial-container');
        container.style.display = 'block';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.backgroundColor = 'rgba(0,0,0,0.8)';
        container.style.zIndex = '10000';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        container.innerHTML = `
            <div class="interstitial-ad" data-testid="${framework}-interstitial-ad" data-ad-id="${ad.id}" 
                 style="background: white; padding: 40px; border-radius: 8px; max-width: 600px; position: relative;">
                <button class="interstitial-close" data-testid="${framework}-interstitial-close" 
                        style="position: absolute; top: 10px; right: 15px; border: none; background: none; font-size: 24px; cursor: pointer;">×</button>
                <div class="ad-content">
                    <h2>${ad.title}</h2>
                    <p>${ad.description}</p>
                    ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}" style="max-width: 100%; height: auto; margin: 20px 0;">` : ''}
                    <div style="text-align: center; margin-top: 30px;">
                        <button class="ad-cta" data-testid="${framework}-interstitial-cta" 
                                style="padding: 15px 30px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">
                            ${ad.ctaText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Setup interstitial interaction handlers
        const ctaButton = container.querySelector('.ad-cta');
        const closeButton = container.querySelector('.interstitial-close');

        ctaButton?.addEventListener('click', () => {
            this.handleAdClick(ad.id, framework);
            this.hideInterstitial();
        });

        closeButton?.addEventListener('click', () => {
            this.hideInterstitial();
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            this.hideInterstitial();
        }, 10000);
    }

    hideInterstitial() {
        const container = document.getElementById('interstitial-container');
        container.style.display = 'none';
        container.innerHTML = '';
    }

    handleAdClick(adId, framework) {
        if (this.sdk) {
            this.sdk.trackEvent({
                type: 'click',
                adId: adId,
                framework: framework,
                timestamp: Date.now()
            });
        }
        
        this.metrics.clicks++;
        this.updateMetricsDisplay();
        
        // Simulate opening ad landing page
        console.log(`Ad clicked: ${adId} (${framework})`);
    }

    hideAd(adId, container) {
        container.innerHTML = '<p>Ad closed by user</p>';
        
        if (this.sdk) {
            this.sdk.trackEvent({
                type: 'close',
                adId: adId,
                timestamp: Date.now()
            });
        }
    }

    updateConsent() {
        const advertisingConsent = document.getElementById('advertising-consent').checked;
        const analyticsConsent = document.getElementById('analytics-consent').checked;
        const dataSharingConsent = document.getElementById('data-sharing-consent').checked;

        if (this.sdk) {
            this.sdk.setConsentStatus({
                advertising: advertisingConsent,
                analytics: analyticsConsent,
                personalization: advertisingConsent,
                dataSharing: dataSharingConsent,
                timestamp: new Date(),
                jurisdiction: 'test'
            });
        }

        this.showSuccess('Consent preferences updated');
    }

    optOutAll() {
        document.getElementById('advertising-consent').checked = false;
        document.getElementById('analytics-consent').checked = false;
        document.getElementById('data-sharing-consent').checked = false;
        
        this.updateConsent();
        this.showSuccess('Opted out of all data collection');
    }

    updateMetricsDisplay() {
        document.getElementById('sdk-load-time').textContent = Math.round(this.metrics.sdkLoadTime);
        document.getElementById('ad-request-time').textContent = Math.round(this.metrics.adRequestTime);
        document.getElementById('total-impressions').textContent = this.metrics.impressions;
        document.getElementById('total-clicks').textContent = this.metrics.clicks;
        
        const ctr = this.metrics.impressions > 0 ? (this.metrics.clicks / this.metrics.impressions * 100).toFixed(2) : 0;
        document.getElementById('ctr').textContent = ctr + '%';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '4px';
        notification.style.color = 'white';
        notification.style.zIndex = '10001';
        notification.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
        notification.textContent = message;
        notification.setAttribute('data-testid', `notification-${type}`);

        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    }
}

// Initialize the test app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.testApp = new TestApp();
});

// Expose test utilities for E2E tests
window.testUtils = {
    getMetrics: () => window.testApp?.metrics || {},
    getSDK: () => window.testApp?.sdk || null,
    simulateError: (type) => {
        if (type === 'network') {
            // Simulate network error
            window.testApp?.showError('Network error simulated');
        } else if (type === 'privacy') {
            // Simulate privacy violation
            window.testApp?.showError('Privacy violation detected');
        }
    }
};