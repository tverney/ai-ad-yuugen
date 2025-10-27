import type { Meta } from '@storybook/react';

const meta: Meta = {
  title: 'AI Ad Yuugen/Introduction',
  parameters: {
    docs: {
      page: () => (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <h1>AI Ad Yuugen SDK</h1>
          <p>Welcome to the <strong>AI Ad Yuugen SDK</strong> - an open-source advertising platform designed specifically for AI interfaces and conversational applications.</p>

          <h2>🎯 What is AI Ad Yuugen?</h2>
          <p>AI Ad Yuugen is a comprehensive advertising solution that intelligently places contextual ads within AI conversations, code editors, documentation sites, and other AI-powered interfaces. Unlike traditional display advertising, our SDK analyzes conversation context, user intent, and interaction patterns to serve highly relevant advertisements at natural break points.</p>

          <h2>✨ Key Features</h2>

          <h3>🤖 AI-Powered Targeting</h3>
          <ul>
            <li><strong>Context Analysis</strong>: Understands conversation topics and user intent</li>
            <li><strong>Sentiment Detection</strong>: Adapts ad placement based on conversation mood</li>
            <li><strong>Intent Recognition</strong>: Matches ads to user goals and interests</li>
            <li><strong>Conversation Stage Awareness</strong>: Places ads at optimal moments</li>
          </ul>

          <h3>🎨 Multiple Ad Formats</h3>
          <ul>
            <li><strong>Banner Ads</strong>: Eye-catching display advertisements</li>
            <li><strong>Native Ads</strong>: Seamlessly integrated content-style ads</li>
            <li><strong>Interstitial Ads</strong>: Full-screen promotional content</li>
            <li><strong>Chat-Integrated Ads</strong>: Conversational advertising within AI chats</li>
          </ul>

          <h3>📊 Real-Time Analytics</h3>
          <ul>
            <li><strong>Performance Metrics</strong>: Track impressions, clicks, and conversions</li>
            <li><strong>Revenue Analytics</strong>: Monitor earnings and optimization opportunities</li>
            <li><strong>User Engagement</strong>: Understand how users interact with ads</li>
            <li><strong>A/B Testing</strong>: Optimize ad performance with built-in testing</li>
          </ul>

          <h3>🔒 Privacy-First Design</h3>
          <ul>
            <li><strong>GDPR Compliance</strong>: Full European privacy regulation support</li>
            <li><strong>CCPA Compliance</strong>: California Consumer Privacy Act adherence</li>
            <li><strong>COPPA Support</strong>: Child online privacy protection</li>
            <li><strong>Consent Management</strong>: Built-in user consent handling</li>
          </ul>

          <h3>🛠 Developer-Friendly</h3>
          <ul>
            <li><strong>Multiple Frameworks</strong>: React, Vue, Angular, and Vanilla JS support</li>
            <li><strong>Easy Integration</strong>: Simple SDK with minimal setup required</li>
            <li><strong>Comprehensive Documentation</strong>: Detailed guides and examples</li>
            <li><strong>TypeScript Support</strong>: Full type definitions included</li>
          </ul>

          <h2>🚀 Quick Start</h2>
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
            <code>npm install @ai-yuugen/sdk @ai-yuugen/ui-components</code>
          </pre>

          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
            <code>{`import { AIYuugenSDK } from '@ai-yuugen/sdk';
import { AdBanner } from '@ai-yuugen/ui-components/react';

// Initialize the SDK
const adSense = new AIYuugenSDK({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Use in your React component
function ChatInterface() {
  return (
    <div>
      <AdBanner 
        context={{ keywords: ['ai', 'programming'] }}
        onAdClick={(ad) => console.log('Ad clicked:', ad)}
      />
    </div>
  );
}`}</code>
          </pre>

          <h2>📱 Use Cases</h2>
          <h3>AI Chat Applications</h3>
          <p>Perfect for ChatGPT-like interfaces, customer service bots, and educational AI assistants.</p>

          <h3>Code Editors & IDEs</h3>
          <p>Integrate contextual ads in development environments based on programming languages and frameworks.</p>

          <h3>Documentation Sites</h3>
          <p>Enhance technical documentation with relevant tool and service advertisements.</p>

          <h3>AI-Powered Dashboards</h3>
          <p>Add revenue streams to analytics dashboards and business intelligence tools.</p>

          <h2>🎨 Explore the Components</h2>
          <p>Use the sidebar to explore our component library:</p>
          <ul>
            <li><strong>Ad Components</strong>: See different ad formats in action</li>
            <li><strong>Dashboard Components</strong>: Explore analytics and management interfaces</li>
            <li><strong>Integration Examples</strong>: Real-world implementation scenarios</li>
          </ul>

          <h2>🌟 Why Choose AI Ad Yuugen?</h2>
          <h3>Built for AI Interfaces</h3>
          <p>Unlike traditional ad networks designed for websites, AI Ad Yuugen is purpose-built for conversational and AI-powered interfaces.</p>

          <h3>Contextually Relevant</h3>
          <p>Our AI analyzes conversation context to serve ads that are actually useful to users, improving engagement and reducing ad fatigue.</p>

          <h3>Privacy Compliant</h3>
          <p>Built from the ground up with privacy regulations in mind, ensuring compliance across global markets.</p>

          <h3>Open Source</h3>
          <p>Fully open-source with transparent algorithms and community-driven development.</p>

          <h3>Developer Experience</h3>
          <p>Designed by developers for developers, with comprehensive documentation, TypeScript support, and multiple framework integrations.</p>

          <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
          <p style={{ textAlign: 'center', fontStyle: 'italic' }}>AI Ad Yuugen SDK - Intelligent advertising for the AI era 🚀</p>
        </div>
      ),
    },
  },
};

export default meta;

export const Introduction = {};
