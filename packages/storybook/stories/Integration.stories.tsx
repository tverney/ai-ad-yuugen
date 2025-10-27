import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState, useEffect } from 'react';

// AI Chat Interface with Dynamic Ad Placement
const AIChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'assistant', content: 'Hello! I\'m your AI assistant. How can I help you today?' },
    { id: 2, type: 'user', content: 'I need help with React state management' },
    { id: 3, type: 'assistant', content: 'Great! React state management is crucial for building scalable applications. There are several approaches you can use...' },
  ]);
  
  const [showAd, setShowAd] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  useEffect(() => {
    // Show ad after 3 messages
    if (messages.length >= 3) {
      const timer = setTimeout(() => setShowAd(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const addMessage = (content: string, type: 'user' | 'assistant') => {
    const newMessage = {
      id: messages.length + 1,
      type,
      content
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = () => {
    if (!currentInput.trim()) return;
    
    addMessage(currentInput, 'user');
    setCurrentInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'That\'s a great question! Let me help you with that...',
        'Here\'s what I recommend for your use case...',
        'You can solve this by implementing the following approach...',
      ];
      addMessage(responses[Math.floor(Math.random() * responses.length)], 'assistant');
    }, 1000);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        🤖 AI Code Assistant
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        
        {showAd && (
          <div className="ad-container fade-in">
            <div className="ad-label">Sponsored</div>
            <div 
              style={{
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                background: 'white',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onClick={() => alert('React Course ad clicked!')}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                Master React State Management
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '0.75rem' }}>
                Learn Redux, Context API, and Zustand with hands-on projects. Perfect for your current question!
              </div>
              <div 
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'inline-block'
                }}
              >
                Enroll Now - 50% Off
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about React, JavaScript, or any coding topic..."
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Code Editor Interface with Contextual Ads
const CodeEditor = () => {
  const [code, setCode] = useState(`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`);

  const [showOptimizationAd, setShowOptimizationAd] = useState(false);

  useEffect(() => {
    // Show performance ad when inefficient code is detected
    if (code.includes('fibonacci') && code.includes('fibonacci(n - 1)')) {
      const timer = setTimeout(() => setShowOptimizationAd(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [code]);

  return (
    <div style={{ 
      display: 'flex', 
      height: '600px',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      background: 'white'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          background: '#1f2937', 
          color: 'white', 
          padding: '0.75rem 1rem',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          📝 Code Editor - fibonacci.js
        </div>
        
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            outline: 'none',
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            background: '#1e1e1e',
            color: '#d4d4d4',
            resize: 'none'
          }}
        />
      </div>
      
      {showOptimizationAd && (
        <div style={{ 
          width: '300px', 
          borderLeft: '1px solid #e5e7eb',
          background: '#f9fafb',
          padding: '1rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.5rem' }}>
              💡 OPTIMIZATION SUGGESTION
            </div>
            <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '1rem' }}>
              Your fibonacci function could be optimized for better performance!
            </div>
          </div>
          
          <div className="ad-container">
            <div className="ad-label">Sponsored</div>
            <div 
              style={{
                padding: '1rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
              onClick={() => alert('Algorithm course ad clicked!')}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                Algorithm Optimization Masterclass
              </div>
              <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '0.75rem' }}>
                Learn dynamic programming, memoization, and advanced optimization techniques
              </div>
              <div 
                style={{
                  background: '#059669',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'inline-block'
                }}
              >
                Optimize Your Code
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Documentation Site with Native Ads
const DocumentationSite = () => {
  return (
    <div style={{ 
      display: 'flex',
      height: '600px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: '250px',
        background: '#f9fafb',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', fontWeight: '600' }}>
          React Documentation
        </h3>
        <nav style={{ fontSize: '14px' }}>
          <div style={{ marginBottom: '0.5rem', color: '#3b82f6', fontWeight: '500' }}>
            → State Management
          </div>
          <div style={{ marginBottom: '0.5rem', color: '#6b7280', paddingLeft: '1rem' }}>
            useState Hook
          </div>
          <div style={{ marginBottom: '0.5rem', color: '#6b7280', paddingLeft: '1rem' }}>
            useEffect Hook
          </div>
          <div style={{ marginBottom: '0.5rem', color: '#6b7280', paddingLeft: '1rem' }}>
            Context API
          </div>
          <div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>
            Performance
          </div>
          <div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>
            Testing
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: '700' }}>
          State Management in React
        </h1>
        
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: '#374151' }}>
          State management is one of the most important concepts in React. It allows you to 
          create dynamic and interactive user interfaces by managing data that changes over time.
        </p>
        
        <h2 style={{ margin: '2rem 0 1rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
          useState Hook
        </h2>
        
        <p style={{ marginBottom: '1rem', lineHeight: '1.6', color: '#374151' }}>
          The useState hook is the most basic way to add state to functional components:
        </p>
        
        <pre style={{ 
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          overflow: 'auto',
          fontSize: '14px'
        }}>
{`const [count, setCount] = useState(0);

function increment() {
  setCount(count + 1);
}`}
        </pre>
        
        {/* Native Ad Integration */}
        <div className="ad-container" style={{ margin: '2rem 0' }}>
          <div className="ad-label">Sponsored</div>
          <div 
            style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
            onClick={() => alert('React course ad clicked!')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '3rem' }}>⚛️</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  Complete React Developer Course
                </div>
                <div style={{ opacity: 0.9, marginBottom: '1rem' }}>
                  Master React from basics to advanced concepts with hands-on projects
                </div>
                <div 
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'inline-block'
                  }}
                >
                  Start Learning Today
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <h2 style={{ margin: '2rem 0 1rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
          Best Practices
        </h2>
        
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#374151' }}>
          <li>Keep state as simple as possible</li>
          <li>Use multiple state variables for unrelated data</li>
          <li>Consider useReducer for complex state logic</li>
          <li>Lift state up when multiple components need it</li>
        </ul>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'AI Ad Yuugen/Integration Examples',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-world integration examples showing how AI Ad Yuugen works in different contexts.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const ChatInterface: StoryObj = {
  render: () => <AIChat />,
  globals: {
    viewport: {
      value: 'chat',
      isRotated: false
    }
  },
};

export const CodeEditorWithAds: StoryObj = {
  render: () => <CodeEditor />,
  parameters: {
    layout: 'fullscreen',
  },
};

export const DocumentationWithNativeAds: StoryObj = {
  render: () => <DocumentationSite />,
  parameters: {
    layout: 'fullscreen',
  },
};

export const ResponsiveChatMobile: StoryObj = {
  render: () => <AIChat />,
  globals: {
    viewport: {
      value: 'mobile',
      isRotated: false
    }
  },
};

export const ResponsiveChatTablet: StoryObj = {
  render: () => <AIChat />,
  globals: {
    viewport: {
      value: 'tablet',
      isRotated: false
    }
  },
};