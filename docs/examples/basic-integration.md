# Basic Integration Example

A simple example showing how to integrate AI Ad Yuugen into any web application.

## HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat with Ads</title>
    <style>
        .chat-container {
            max-width: 800px;
            margin: 0 auto;
            display: flex;
            gap: 20px;
        }
        .chat-main {
            flex: 1;
        }
        .chat-sidebar {
            width: 300px;
        }
        .ad-container {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 8px;
        }
        .user-message {
            background: #e3f2fd;
            text-align: right;
        }
        .ai-message {
            background: #f5f5f5;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-main">
            <h1>AI Assistant</h1>
            <div id="chat-messages"></div>
            <div>
                <input type="text" id="user-input" placeholder="Ask me anything..." style="width: 70%;">
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        <div class="chat-sidebar">
            <div id="ad-container" class="ad-container">
                <p>Loading ad...</p>
            </div>
        </div>
    </div>

    <script type="module" src="app.js"></script>
</body>
</html>
```

## JavaScript Implementation

```javascript
// app.js
import { AIYuugenSDK, AdType, AdFormat, AdPosition } from '@ai-yuugen/sdk';

class ChatApp {
    constructor() {
        this.sdk = null;
        this.conversation = {
            id: 'conv-' + Date.now(),
            messages: [],
            topics: [],
            intent: { primary: 'general', confidence: 0.5, category: 'informational', actionable: false },
            startTime: new Date(),
            lastActivity: new Date()
        };
        this.init();
    }

    async init() {
        try {
            // Initialize SDK
            this.sdk = new AIYuugenSDK();
            await this.sdk.initialize({
                apiKey: 'your-api-key-here',
                environment: 'production',
                enableAnalytics: true,
                debugMode: false
            });

            console.log('AI Ad Yuugen SDK initialized successfully');
            
            // Load initial ad
            await this.loadAd();
            
        } catch (error) {
            console.error('Failed to initialize SDK:', error);
            document.getElementById('ad-container').innerHTML = 
                '<p>Advertisement unavailable</p>';
        }
    }

    async loadAd() {
        if (!this.sdk) return;

        try {
            // Define ad placement
            const placement = {
                id: 'sidebar-banner',
                type: AdType.BANNER,
                format: AdFormat.DISPLAY,
                size: { width: 300, height: 250 },
                position: AdPosition.RIGHT
            };

            // Analyze conversation context
            const context = this.sdk.analyzeContext(this.conversation);
            
            // Request ad
            const ad = await this.sdk.requestAd(placement, context);
            
            // Display ad
            const container = document.getElementById('ad-container');
            this.displayAd(ad, container);
            
            // Track impression
            this.sdk.trackEvent({
                id: 'impression-' + Date.now(),
                type: 'ad_impression',
                adId: ad.id,
                sessionId: this.conversation.id,
                timestamp: new Date(),
                context: { placement: 'sidebar' }
            });

        } catch (error) {
            console.error('Failed to load ad:', error);
            document.getElementById('ad-container').innerHTML = 
                '<p>Advertisement unavailable</p>';
        }
    }

    displayAd(ad, container) {
        const adHtml = `
            <div class="ad-content">
                <div class="ad-label" style="font-size: 12px; color: #666; margin-bottom: 8px;">
                    Advertisement
                </div>
                ${ad.content.imageUrl ? `<img src="${ad.content.imageUrl}" alt="${ad.content.title}" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 12px;">` : ''}
                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">
                    ${ad.content.title}
                </h3>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #666; line-height: 1.4;">
                    ${ad.content.description}
                </p>
                <div style="text-align: center;">
                    <a href="${ad.content.landingUrl}" 
                       target="_blank" 
                       onclick="chatApp.trackAdClick('${ad.id}')"
                       style="display: inline-block; background: #0066cc; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                        ${ad.content.ctaText}
                    </a>
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #999; text-align: center;">
                    by ${ad.content.brandName}
                </div>
            </div>
        `;
        
        container.innerHTML = adHtml;
    }

    trackAdClick(adId) {
        if (this.sdk) {
            this.sdk.trackEvent({
                id: 'click-' + Date.now(),
                type: 'ad_click',
                adId: adId,
                sessionId: this.conversation.id,
                timestamp: new Date(),
                context: { placement: 'sidebar' }
            });
        }
    }

    async sendMessage() {
        const input = document.getElementById('user-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';

        // Simulate AI response (replace with actual AI integration)
        setTimeout(() => {
            const aiResponse = this.generateAIResponse(message);
            this.addMessage('assistant', aiResponse);
            
            // Update conversation context and reload ad
            this.updateConversationContext();
            this.loadAd();
        }, 1000);
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add to conversation
        this.conversation.messages.push({
            id: 'msg-' + Date.now(),
            role: role,
            content: content,
            timestamp: new Date()
        });

        this.conversation.lastActivity = new Date();
    }

    generateAIResponse(userMessage) {
        // Simple response generation (replace with actual AI)
        const responses = {
            'laptop': 'For laptops, I recommend considering your primary use case. Are you looking for gaming, programming, or general use?',
            'programming': 'For programming, you\'ll want a laptop with good processing power, plenty of RAM, and a comfortable keyboard.',
            'gaming': 'Gaming laptops should have a dedicated graphics card, fast processor, and good cooling system.',
            'default': 'That\'s an interesting question. Let me help you with that.'
        };

        const lowerMessage = userMessage.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return responses.default;
    }

    updateConversationContext() {
        // Simple context analysis (the SDK will do more sophisticated analysis)
        const lastMessage = this.conversation.messages[this.conversation.messages.length - 1];
        const content = lastMessage.content.toLowerCase();

        // Update intent based on message content
        if (content.includes('buy') || content.includes('purchase') || content.includes('price')) {
            this.conversation.intent = {
                primary: 'purchase_intent',
                confidence: 0.8,
                category: 'commercial',
                actionable: true
            };
        } else if (content.includes('help') || content.includes('how') || content.includes('what')) {
            this.conversation.intent = {
                primary: 'information_seeking',
                confidence: 0.7,
                category: 'informational',
                actionable: true
            };
        }
    }
}

// Initialize the chat app
const chatApp = new ChatApp();

// Make sendMessage available globally
window.sendMessage = () => chatApp.sendMessage();

// Handle Enter key in input
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        chatApp.sendMessage();
    }
});
```

## Key Features Demonstrated

1. **SDK Initialization** - Basic setup with error handling
2. **Ad Placement Configuration** - Defining where and how ads appear
3. **Context Analysis** - Analyzing conversation for better targeting
4. **Ad Display** - Custom HTML rendering of ad content
5. **Event Tracking** - Tracking impressions and clicks
6. **Dynamic Updates** - Refreshing ads based on conversation changes

## Next Steps

- Replace the mock AI responses with actual AI integration
- Add more sophisticated context analysis
- Implement user consent management
- Add error boundaries and fallback handling
- Customize the ad styling to match your brand

## Related Examples

- [React Integration](./react-chat-app.md)
- [OpenAI Integration](./openai-integration.md)
- [Privacy Compliance](./privacy-compliance.md)