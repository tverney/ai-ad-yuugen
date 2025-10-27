import React, { useState } from 'react';
import * as Separator from '@radix-ui/react-separator';
import { AdBanner } from './AdBanner';
import { AdInterstitial } from './AdInterstitial';
import { AdNative } from './AdNative';
import { AdContainer } from './AdContainer';
import { AdPosition } from '../types/ad';

/**
 * Showcase component demonstrating all ad components with Radix UI integration
 */
export const AdShowcase: React.FC = () => {
  const [showInterstitial, setShowInterstitial] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>AI Ad Yuugen Components - Radix UI Integration</h1>
      
      <Separator.Root 
        style={{ 
          backgroundColor: '#e0e0e0', 
          height: '1px', 
          margin: '20px 0' 
        }} 
      />

      {/* Banner Ads Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Banner Advertisements</h2>
        <p>Responsive banner ads with AspectRatio integration:</p>
        
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          <AdContainer position={AdPosition.INLINE} showBorder addSpacing>
            <AdBanner 
              placementId="banner-1" 
              size={{ width: 728, height: 90, responsive: true }}
              ariaLabel="Sample banner advertisement"
            />
          </AdContainer>
          
          <AdContainer position={AdPosition.INLINE} showBorder addSpacing>
            <AdBanner 
              placementId="banner-2" 
              size={{ width: 300, height: 250, responsive: true }}
              ariaLabel="Square banner advertisement"
            />
          </AdContainer>
        </div>
      </section>

      <Separator.Root 
        style={{ 
          backgroundColor: '#e0e0e0', 
          height: '1px', 
          margin: '20px 0' 
        }} 
      />

      {/* Native Ads Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Native Advertisements</h2>
        <p>Content-style ads with Separator integration:</p>
        
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          <AdContainer position={AdPosition.INLINE} showBorder addSpacing>
            <AdNative 
              placementId="native-1" 
              layout="card"
              ariaLabel="Native card advertisement"
            />
          </AdContainer>
          
          <AdContainer position={AdPosition.INLINE} showBorder addSpacing>
            <AdNative 
              placementId="native-2" 
              layout="inline"
              ariaLabel="Inline native advertisement"
            />
          </AdContainer>
        </div>
      </section>

      <Separator.Root 
        style={{ 
          backgroundColor: '#e0e0e0', 
          height: '1px', 
          margin: '20px 0' 
        }} 
      />

      {/* Interstitial Ads Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Interstitial Advertisements</h2>
        <p>Full-screen overlay ads with Dialog integration:</p>
        
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowInterstitial(true)}
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
            placementId="interstitial-1"
            isOpen={showInterstitial}
            onClose={() => setShowInterstitial(false)}
            showCloseButton
            closeOnEscape
            closeOnOverlayClick
            ariaLabel="Sample interstitial advertisement"
          />
        </div>
      </section>

      <Separator.Root 
        style={{ 
          backgroundColor: '#e0e0e0', 
          height: '1px', 
          margin: '20px 0' 
        }} 
      />

      {/* Container Positions Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Container Positions</h2>
        <p>Different positioning options for ad containers:</p>
        
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          <div>
            <h3>Inline Position</h3>
            <AdContainer position={AdPosition.INLINE} showBorder addSpacing>
              <AdBanner 
                placementId="position-inline" 
                size={{ width: 468, height: 60, responsive: true }}
              />
            </AdContainer>
          </div>
          
          <div>
            <h3>Centered Container</h3>
            <AdContainer position={AdPosition.INLINE} centered showBorder addSpacing>
              <AdBanner 
                placementId="position-centered" 
                size={{ width: 320, height: 50, responsive: true }}
              />
            </AdContainer>
          </div>
        </div>
      </section>

      <Separator.Root 
        style={{ 
          backgroundColor: '#e0e0e0', 
          height: '1px', 
          margin: '20px 0' 
        }} 
      />

      {/* Features Section */}
      <section>
        <h2>Radix UI Integration Features</h2>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>AspectRatio:</strong> Responsive banner ads maintain proper proportions</li>
          <li><strong>Dialog:</strong> Interstitial ads use accessible modal dialogs</li>
          <li><strong>Separator:</strong> Clean visual separation between ad sections</li>
          <li><strong>VisuallyHidden:</strong> Screen reader accessible titles and descriptions</li>
          <li><strong>Portal:</strong> Proper overlay rendering for interstitials</li>
          <li><strong>Focus Management:</strong> Keyboard navigation and focus trapping</li>
          <li><strong>ARIA Support:</strong> Full accessibility compliance</li>
          <li><strong>CSS Modules:</strong> Scoped styling with CSS custom properties</li>
        </ul>
      </section>
    </div>
  );
};

export default AdShowcase;