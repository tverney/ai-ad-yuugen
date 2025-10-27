import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import * as Separator from '@radix-ui/react-separator';

// Import actual Radix UI integrated components directly from source
import { AdBanner } from '../../ui-components/src/react/AdBanner';
import { AdInterstitial } from '../../ui-components/src/react/AdInterstitial';
import { AdNative } from '../../ui-components/src/react/AdNative';
import { AdContainer } from '../../ui-components/src/react/AdContainer';
import { AdShowcase } from '../../ui-components/src/react/AdShowcase';
import { AdPosition } from '../../ui-components/src/types/ad';
// Wrapper component for interstitial demo
const InterstitialDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Show Interstitial Ad
      </button>
      
      <AdInterstitial
        placementId="storybook-interstitial"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showCloseButton
        closeOnEscape
        closeOnOverlayClick
        ariaLabel="Storybook demo interstitial advertisement"
      />
    </div>
  );
};

// Chat Interface Component
const ChatInterface = ({ children }: { children: React.ReactNode }) => (
  <div className="chat-container">
    <div className="chat-header">
      🤖 AI Assistant
    </div>
    <div className="chat-messages">
      <div className="message assistant">
        <div className="message-avatar">🤖</div>
        <div className="message-content">
          Hello! I'm your AI assistant. How can I help you today?
        </div>
      </div>
      
      <div className="message user">
        <div className="message-avatar">👤</div>
        <div className="message-content">
          Can you help me with some coding questions?
        </div>
      </div>
      
      <div className="message assistant">
        <div className="message-avatar">🤖</div>
        <div className="message-content">
          Absolutely! I'd be happy to help with coding. What programming language or specific topic are you working on?
        </div>
      </div>
      
      {/* Ad placement */}
      <div className="ad-container">
        <div className="ad-label">Sponsored</div>
        {children}
      </div>
      
      <div className="message user">
        <div className="message-avatar">👤</div>
        <div className="message-content">
          I'm working on a React project and need help with state management.
        </div>
      </div>
    </div>
  </div>
);

const meta: Meta<typeof AdBanner> = {
  title: 'AI Ad Yuugen/Radix UI Components',
  component: AdBanner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'AI Ad Yuugen components built with Radix UI primitives for better accessibility and professional behavior.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Banner: Story = {
  render: () => (
    <AdBanner 
      placementId="storybook-banner" 
      size={{ width: 728, height: 90, responsive: true }}
      ariaLabel="Sample banner advertisement"
      showTooltips={false}
      loadingDelay={200}
      onAdClick={(ad) => alert(`Banner ad clicked: ${ad.content.title}`)}
    />
  ),
};

export const ResponsiveBanner: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <AdBanner 
        placementId="storybook-responsive" 
        size={{ width: 320, height: 100, responsive: true }}
        ariaLabel="Responsive banner advertisement"
        showTooltips={false}
        loadingDelay={200}
        onAdClick={(ad) => alert(`Responsive ad clicked: ${ad.content.title}`)}
      />
    </div>
  ),
};

export const CustomThemedBanner: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '728px' }}>
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Dark Theme with Radix UI</h4>
        <AdBanner 
          placementId="storybook-dark-theme" 
          size={{ width: 728, height: 90, responsive: true }}
          showTooltips={false}
          theme={{
            backgroundColor: '#1a1a1a',
            borderColor: '#333333',
            borderRadius: '12px',
            borderWidth: '2px',
            textColor: '#ffffff',
            fontSize: '18px',
            fontFamily: 'Georgia, serif',
            padding: '16px',
            margin: '8px 0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
          ariaLabel="Dark themed banner advertisement with enhanced accessibility"
        />
      </div>
      
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Colorful Theme with Tooltips</h4>
        <AdBanner 
          placementId="storybook-colorful-theme" 
          size={{ width: 728, height: 90, responsive: true }}
          showTooltips={true}
          theme={{
            backgroundColor: '#fff3cd',
            borderColor: '#ffc107',
            borderRadius: '16px',
            borderWidth: '3px',
            textColor: '#856404',
            fontSize: '16px',
            padding: '12px',
            boxShadow: '0 6px 16px rgba(255, 193, 7, 0.3)',
          }}
          ariaLabel="Colorful themed banner advertisement with hover tooltips"
        />
      </div>
      
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Minimal Theme with Separators</h4>
        <AdBanner 
          placementId="storybook-minimal-theme" 
          size={{ width: 728, height: 90, responsive: true }}
          showTooltips={false}
          theme={{
            backgroundColor: '#f8f9fa',
            borderColor: '#dee2e6',
            borderRadius: '4px',
            borderWidth: '1px',
            textColor: '#495057',
            fontSize: '14px',
            fontFamily: 'monospace',
            padding: '8px',
            boxShadow: 'none',
          }}
          ariaLabel="Minimal themed banner advertisement with visual separators"
        />
      </div>
    </div>
  ),
};

export const RadixUIFeatures: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '728px' }}>
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Loading State with Progress</h4>
        <AdBanner 
          placementId="storybook-loading-demo" 
          size={{ width: 728, height: 90, responsive: true }}
          showLoading={true}
          showTooltips={false}
          ariaLabel="Loading advertisement with progress indicator"
        />
      </div>
      
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Fallback with Tooltip</h4>
        <AdBanner 
          placementId="storybook-fallback-demo" 
          size={{ width: 728, height: 90, responsive: true }}
          showFallback={true}
          showTooltips={true}
          ariaLabel="Fallback advertisement with error tooltip"
        />
      </div>
      
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Interactive Banner (Hover for Tooltip)</h4>
        <AdBanner 
          placementId="storybook-interactive-demo" 
          size={{ width: 728, height: 90, responsive: true }}
          showTooltips={true}
          ariaLabel="Interactive banner advertisement with hover tooltip"
          onAdClick={(ad) => alert(`Clicked: ${ad.content.title}`)}
        />
      </div>
    </div>
  ),
};

export const Native: Story = {
  render: () => (
    <AdNative
      placementId="storybook-native"
      layout="card"
      ariaLabel="Native card advertisement"
      onAdClick={(ad) => alert(`Native ad clicked: ${ad.content.title}`)}
    />
  ),
};

export const NativeInline: Story = {
  render: () => (
    <AdNative
      placementId="storybook-native-inline"
      layout="inline"
      ariaLabel="Inline native advertisement"
      onAdClick={(ad) => alert(`Inline native ad clicked: ${ad.content.title}`)}
    />
  ),
};

export const Interstitial: Story = {
  render: () => <InterstitialDemo />,
  parameters: {
    layout: 'fullscreen',
  },
};

export const ContainerPositions: Story = {
  render: () => (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3>Inline Container</h3>
        <AdContainer position={AdPosition.INLINE} showBorder addSpacing>
          <AdBanner 
            placementId="container-inline" 
            size={{ width: 468, height: 60, responsive: true }}
            showTooltips={false}
          />
        </AdContainer>
      </div>
      
      <Separator.Root style={{ height: '1px', backgroundColor: '#e0e0e0' }} />
      
      <div>
        <h3>Centered Container</h3>
        <AdContainer position={AdPosition.INLINE} centered showBorder addSpacing>
          <AdBanner 
            placementId="container-centered" 
            size={{ width: 320, height: 50, responsive: true }}
            showTooltips={false}
          />
        </AdContainer>
      </div>
    </div>
  ),
};

export const BannerInChat: Story = {
  render: () => (
    <ChatInterface>
      <AdContainer position={AdPosition.INLINE} showBorder addSpacing>
        <AdBanner
          placementId="chat-banner"
          size={{ width: 300, height: 100, responsive: true }}
          showTooltips={false}
          ariaLabel="Chat advertisement"
          onAdClick={(ad) => alert(`Chat ad clicked: ${ad.content.title}`)}
        />
      </AdContainer>
    </ChatInterface>
  ),
  globals: {
    viewport: {
      value: 'chat',
      isRotated: false
    }
  },
};

export const NativeInChat: Story = {
  render: () => (
    <ChatInterface>
      <AdContainer position={AdPosition.INLINE} addSpacing>
        <AdNative
          placementId="chat-native"
          layout="minimal"
          ariaLabel="Chat native advertisement"
          onAdClick={(ad) => alert(`Chat native ad clicked: ${ad.content.title}`)}
        />
      </AdContainer>
    </ChatInterface>
  ),
  globals: {
    viewport: {
      value: 'chat',
      isRotated: false
    }
  },
};

export const RadixShowcase: Story = {
  render: () => <AdShowcase />,
  parameters: {
    layout: 'fullscreen',
  },
};