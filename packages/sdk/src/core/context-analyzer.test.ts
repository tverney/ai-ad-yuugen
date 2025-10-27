import { describe, it, expect, beforeEach } from 'vitest';
import { ContextAnalyzer } from './context-analyzer';
import {
	AIConversation,
	AIMessage,
	AIContext,
	IntentCategory,
	SentimentLabel,
	ConversationPhase,
	EngagementTier,
	EngagementTrend,
	UserContext,
} from '@ai-yuugen/types';

describe('ContextAnalyzer', () => {
	let analyzer: ContextAnalyzer;
	let mockConversation: AIConversation;

	beforeEach(() => {
		analyzer = new ContextAnalyzer({
			debugMode: false,
			enableSentimentAnalysis: true,
			enableTopicExtraction: true,
			enableIntentDetection: true,
			enableEngagementTracking: true,
			minTopicConfidence: 0.3,
			minIntentConfidence: 0.4,
			maxTopicsPerAnalysis: 5,
		});

		mockConversation = {
			id: 'test-conversation-1',
			messages: [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Hello, I need help with my computer software',
					timestamp: new Date('2024-01-01T10:00:00Z'),
					metadata: {},
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content:
						"I'd be happy to help you with your computer software. What specific issue are you experiencing?",
					timestamp: new Date('2024-01-01T10:00:30Z'),
					metadata: {},
				},
				{
					id: 'msg-3',
					role: 'user',
					content:
						"My application keeps crashing when I try to save files. It's really frustrating!",
					timestamp: new Date('2024-01-01T10:01:00Z'),
					metadata: {},
				},
			],
			topics: ['technology', 'support'],
			intent: IntentCategory.SUPPORT,
			startTime: new Date('2024-01-01T10:00:00Z'),
			lastActivity: new Date('2024-01-01T10:01:00Z'),
		};
	});

	describe('analyzeConversation', () => {
		it('should analyze conversation and return complete context', () => {
			const context = analyzer.analyzeConversation(mockConversation);

			expect(context).toBeDefined();
			expect(context.topics).toBeInstanceOf(Array);
			expect(context.intent).toBeDefined();
			expect(context.sentiment).toBeDefined();
			expect(context.conversationStage).toBeDefined();
			expect(context.userEngagement).toBeDefined();
			expect(context.confidence).toBeGreaterThanOrEqual(0);
			expect(context.confidence).toBeLessThanOrEqual(1);
			expect(context.extractedAt).toBeInstanceOf(Date);
		});

		it('should handle empty conversation gracefully', () => {
			const emptyConversation: AIConversation = {
				...mockConversation,
				messages: [],
			};

			const context = analyzer.analyzeConversation(emptyConversation);
			expect(context.topics).toHaveLength(0);
			expect(context.intent.primary).toBe(IntentCategory.INFORMATIONAL);
			expect(context.sentiment.label).toBe(SentimentLabel.NEUTRAL);
		});

		it('should return default context on analysis error', () => {
			// Create a conversation that might cause errors
			const problematicConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user' as const,
						content: null as any, // This might cause issues
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const context = analyzer.analyzeConversation(problematicConversation);
			expect(context).toBeDefined();
			expect(context.confidence).toBe(0);
		});
	});

	describe('extractTopics', () => {
		it('should extract technology topics from tech-related text', () => {
			const text = 'I need help with my computer software and programming code';
			const topics = analyzer.extractTopics(text);

			expect(topics).toBeInstanceOf(Array);
			expect(topics.length).toBeGreaterThan(0);

			const techTopic = topics.find((t) => t.name === 'technology');
			expect(techTopic).toBeDefined();
			expect(techTopic?.confidence).toBeGreaterThan(0);
			expect(techTopic?.keywords).toContain('computer');
			expect(techTopic?.keywords).toContain('software');
		});

		it('should extract business topics from business-related text', () => {
			const text =
				'Our company needs to improve sales revenue and market strategy';
			const topics = analyzer.extractTopics(text);

			const businessTopic = topics.find((t) => t.name === 'business');
			expect(businessTopic).toBeDefined();
			expect(businessTopic?.confidence).toBeGreaterThan(0);
			expect(businessTopic?.keywords).toContain('company');
			expect(businessTopic?.keywords).toContain('sales');
		});

		it('should return empty array for empty text', () => {
			const topics = analyzer.extractTopics('');
			expect(topics).toHaveLength(0);
		});

		it('should return empty array for text with no recognizable topics', () => {
			const topics = analyzer.extractTopics('xyz abc def ghi');
			expect(topics).toHaveLength(0);
		});

		it('should limit topics to maxTopicsPerAnalysis', () => {
			const text =
				'technology computer software business company sales health medical education school entertainment movie finance money travel hotel food restaurant shopping store';
			const topics = analyzer.extractTopics(text);

			expect(topics.length).toBeLessThanOrEqual(5); // maxTopicsPerAnalysis = 5
		});

		it('should sort topics by confidence', () => {
			const text =
				'computer software technology programming code business company';
			const topics = analyzer.extractTopics(text);

			if (topics.length > 1) {
				for (let i = 1; i < topics.length; i++) {
					expect(topics[i - 1].confidence).toBeGreaterThanOrEqual(
						topics[i].confidence,
					);
				}
			}
		});
	});

	describe('detectIntent', () => {
		it('should detect informational intent from question patterns', () => {
			const conversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'What is machine learning and how does it work?',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const intent = analyzer.detectIntent(conversation);
			expect(intent.primary).toBe(IntentCategory.INFORMATIONAL);
			expect(intent.confidence).toBeGreaterThanOrEqual(0.4);
			expect(intent.category).toBe(IntentCategory.INFORMATIONAL);
		});

		it('should detect transactional intent from purchase patterns', () => {
			const conversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'I want to buy this product and pay with my credit card',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const intent = analyzer.detectIntent(conversation);
			expect(intent.primary).toBe(IntentCategory.TRANSACTIONAL);
			expect(intent.actionable).toBe(true);
		});

		it('should detect support intent from help patterns', () => {
			const conversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'I need help fixing this problem with my application',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const intent = analyzer.detectIntent(conversation);
			expect(intent.primary).toBe(IntentCategory.SUPPORT);
			expect(intent.actionable).toBe(true);
		});

		it('should return default intent for empty conversation', () => {
			const emptyConversation: AIConversation = {
				...mockConversation,
				messages: [],
			};

			const intent = analyzer.detectIntent(emptyConversation);
			expect(intent.primary).toBe(IntentCategory.INFORMATIONAL);
			expect(intent.confidence).toBe(0.4);
			expect(intent.actionable).toBe(false);
		});

		it('should include secondary intents when multiple patterns match', () => {
			const conversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content:
							'I want to learn about this product and then buy it if it looks good',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const intent = analyzer.detectIntent(conversation);
			expect(intent.secondary).toBeDefined();
			expect(intent.secondary!.length).toBeGreaterThan(0);
		});
	});

	describe('analyzeSentiment', () => {
		it('should detect positive sentiment', () => {
			const text =
				'This is great! I love it and I am very happy with the results';
			const sentiment = analyzer.analyzeSentiment(text);

			expect(sentiment.polarity).toBeGreaterThan(0);
			expect([SentimentLabel.POSITIVE, SentimentLabel.VERY_POSITIVE]).toContain(
				sentiment.label,
			);
			expect(sentiment.magnitude).toBeGreaterThan(0);
			expect(sentiment.confidence).toBeGreaterThan(0);
		});

		it('should detect negative sentiment', () => {
			const text =
				'This is terrible! I hate it and I am very frustrated and angry';
			const sentiment = analyzer.analyzeSentiment(text);

			expect(sentiment.polarity).toBeLessThan(0);
			expect([SentimentLabel.NEGATIVE, SentimentLabel.VERY_NEGATIVE]).toContain(
				sentiment.label,
			);
			expect(sentiment.magnitude).toBeGreaterThan(0);
			expect(sentiment.confidence).toBeGreaterThan(0);
		});

		it('should detect neutral sentiment', () => {
			const text = 'This is a normal day with average weather conditions';
			const sentiment = analyzer.analyzeSentiment(text);

			expect(sentiment.label).toBe(SentimentLabel.NEUTRAL);
			expect(Math.abs(sentiment.polarity)).toBeLessThan(0.2);
		});

		it('should return default sentiment for empty text', () => {
			const sentiment = analyzer.analyzeSentiment('');
			expect(sentiment.polarity).toBe(0);
			expect(sentiment.magnitude).toBe(0);
			expect(sentiment.label).toBe(SentimentLabel.NEUTRAL);
			expect(sentiment.confidence).toBe(0);
		});

		it('should handle text with no sentiment words', () => {
			const text = 'xyz abc def ghi jkl mno';
			const sentiment = analyzer.analyzeSentiment(text);

			expect(sentiment.polarity).toBe(0);
			expect(sentiment.magnitude).toBe(0);
			expect(sentiment.label).toBe(SentimentLabel.NEUTRAL);
			expect(sentiment.confidence).toBe(0);
		});

		it('should normalize polarity to [-1, 1] range', () => {
			const text =
				'excellent amazing wonderful fantastic brilliant perfect awesome great good';
			const sentiment = analyzer.analyzeSentiment(text);

			expect(sentiment.polarity).toBeGreaterThanOrEqual(-1);
			expect(sentiment.polarity).toBeLessThanOrEqual(1);
		});
	});

	describe('detectConversationStage', () => {
		it('should detect greeting stage for short conversations', () => {
			const shortConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'Hello',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const stage = analyzer.detectConversationStage(shortConversation);
			expect(stage.stage).toBe(ConversationPhase.GREETING);
			expect(stage.progress).toBeLessThan(1);
			expect(stage.messageCount).toBe(1);
		});

		it('should detect exploration stage for medium conversations', () => {
			const mediumConversation: AIConversation = {
				...mockConversation,
				messages: Array.from({ length: 4 }, (_, i) => ({
					id: `msg-${i + 1}`,
					role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
					content: `Message ${i + 1}`,
					timestamp: new Date(),
					metadata: {},
				})),
			};

			const stage = analyzer.detectConversationStage(mediumConversation);
			expect(stage.stage).toBe(ConversationPhase.EXPLORATION);
			expect(stage.messageCount).toBe(4);
		});

		it('should detect decision-making stage with decision indicators', () => {
			const decisionConversation: AIConversation = {
				...mockConversation,
				messages: [
					...Array.from({ length: 8 }, (_, i) => ({
						id: `msg-${i + 1}`,
						role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
						content: `Message ${i + 1}`,
						timestamp: new Date(),
						metadata: {},
					})),
					{
						id: 'msg-decision',
						role: 'user',
						content: 'I need to decide between these two options',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const stage = analyzer.detectConversationStage(decisionConversation);
			expect(stage.stage).toBe(ConversationPhase.DECISION_MAKING);
			expect(stage.progress).toBeGreaterThan(0.5);
		});

		it('should detect conclusion stage with conclusion indicators', () => {
			const conclusionConversation: AIConversation = {
				...mockConversation,
				messages: [
					...Array.from({ length: 8 }, (_, i) => ({
						id: `msg-${i + 1}`,
						role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
						content: `Message ${i + 1}`,
						timestamp: new Date(),
						metadata: {},
					})),
					{
						id: 'msg-conclusion',
						role: 'user',
						content: 'Thank you for your help, I think we are done here',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const stage = analyzer.detectConversationStage(conclusionConversation);
			expect(stage.stage).toBe(ConversationPhase.CONCLUSION);
			expect(stage.progress).toBeGreaterThan(0.8);
		});

		it('should calculate duration correctly', () => {
			const now = Date.now();
			const conversation: AIConversation = {
				...mockConversation,
				startTime: new Date(now - 300000), // 5 minutes ago
			};

			const stage = analyzer.detectConversationStage(conversation);
			expect(stage.duration).toBeGreaterThan(250000); // Should be around 5 minutes
			expect(stage.duration).toBeLessThan(350000);
		});
	});

	describe('calculateEngagement', () => {
		it('should calculate engagement with all indicators', () => {
			const engagement = analyzer.calculateEngagement(mockConversation);

			expect(engagement.score).toBeGreaterThanOrEqual(0);
			expect(engagement.score).toBeLessThanOrEqual(1);
			expect(engagement.level).toBeDefined();
			expect(engagement.indicators).toBeInstanceOf(Array);
			expect(engagement.indicators.length).toBeGreaterThan(0);
			expect(engagement.trend).toBeDefined();
		});

		it('should assign higher engagement for longer messages', () => {
			const longMessageConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content:
							'This is a very long message with lots of detail and information that shows high user engagement and interest in the conversation topic. The user is providing comprehensive context and asking detailed questions.',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const shortMessageConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'Hi',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const longEngagement = analyzer.calculateEngagement(
				longMessageConversation,
			);
			const shortEngagement = analyzer.calculateEngagement(
				shortMessageConversation,
			);

			const longMessageIndicator = longEngagement.indicators.find(
				(i) => i.type === 'message_length',
			);
			const shortMessageIndicator = shortEngagement.indicators.find(
				(i) => i.type === 'message_length',
			);

			expect(longMessageIndicator?.value).toBeGreaterThan(
				shortMessageIndicator?.value || 0,
			);
		});

		it('should assign higher engagement for more questions', () => {
			const questionConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'What is this? How does it work? Why is it important?',
						timestamp: new Date(),
						metadata: {},
					},
					{
						id: 'msg-2',
						role: 'user',
						content: 'Can you explain more? What are the benefits?',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const engagement = analyzer.calculateEngagement(questionConversation);
			const questionIndicator = engagement.indicators.find(
				(i) => i.type === 'question_frequency',
			);

			expect(questionIndicator?.value).toBeGreaterThan(0);
		});

		it('should determine engagement tier correctly', () => {
			// Test with a high-engagement conversation
			const highEngagementConversation: AIConversation = {
				...mockConversation,
				messages: Array.from({ length: 20 }, (_, i) => ({
					id: `msg-${i + 1}`,
					role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
					content: `This is a detailed message number ${
						i + 1
					} with lots of content and questions? How does this work?`,
					timestamp: new Date(Date.now() - (20 - i) * 30000), // Spaced 30 seconds apart
					metadata: {},
				})),
				startTime: new Date(Date.now() - 600000), // 10 minutes ago
			};

			const engagement = analyzer.calculateEngagement(
				highEngagementConversation,
			);
			expect([EngagementTier.HIGH, EngagementTier.VERY_HIGH]).toContain(
				engagement.level,
			);
		});

		it('should calculate engagement trend', () => {
			const trendConversation: AIConversation = {
				...mockConversation,
				messages: [
					// Older messages (shorter)
					{
						id: 'msg-1',
						role: 'user',
						content: 'Hi',
						timestamp: new Date(),
						metadata: {},
					},
					{
						id: 'msg-2',
						role: 'assistant',
						content: 'Hello',
						timestamp: new Date(),
						metadata: {},
					},
					{
						id: 'msg-3',
						role: 'user',
						content: 'Ok',
						timestamp: new Date(),
						metadata: {},
					},
					{
						id: 'msg-4',
						role: 'assistant',
						content: 'Sure',
						timestamp: new Date(),
						metadata: {},
					},
					// Recent messages (longer)
					{
						id: 'msg-5',
						role: 'user',
						content:
							'This is a much longer message showing increased engagement',
						timestamp: new Date(),
						metadata: {},
					},
					{
						id: 'msg-6',
						role: 'assistant',
						content: 'Great to see more detail',
						timestamp: new Date(),
						metadata: {},
					},
					{
						id: 'msg-7',
						role: 'user',
						content:
							'Yes, I am becoming more interested in this topic and want to learn more',
						timestamp: new Date(),
						metadata: {},
					},
					{
						id: 'msg-8',
						role: 'assistant',
						content: 'Excellent',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const engagement = analyzer.calculateEngagement(trendConversation);
			expect([EngagementTrend.INCREASING, EngagementTrend.STABLE]).toContain(
				engagement.trend,
			);
		});
	});

	describe('updateContext', () => {
		it('should update context with new message', () => {
			const initialContext = analyzer.analyzeConversation(mockConversation);

			const newMessage: AIMessage = {
				id: 'msg-new',
				role: 'user',
				content: 'I am very happy with the solution you provided!',
				timestamp: new Date(),
				metadata: {},
			};

			const updatedContext = analyzer.updateContext(initialContext, newMessage);

			expect(updatedContext.extractedAt.getTime()).toBeGreaterThanOrEqual(
				initialContext.extractedAt.getTime(),
			);
			expect(updatedContext.sentiment.polarity).toBeGreaterThan(0); // Should be positive due to "happy"
		});

		it('should merge topics correctly', () => {
			const techContext: AIContext = {
				topics: [
					{
						name: 'technology',
						category: 'tech',
						confidence: 0.8,
						keywords: ['computer'],
						relevanceScore: 0.7,
					},
				],
				intent: {
					primary: IntentCategory.INFORMATIONAL,
					confidence: 0.5,
					category: IntentCategory.INFORMATIONAL,
					actionable: false,
				},
				sentiment: {
					polarity: 0,
					magnitude: 0,
					label: SentimentLabel.NEUTRAL,
					confidence: 0.5,
				},
				conversationStage: {
					stage: ConversationPhase.GREETING,
					progress: 0.5,
					duration: 1000,
					messageCount: 2,
				},
				userEngagement: {
					score: 0.5,
					level: EngagementTier.MEDIUM,
					indicators: [],
					trend: EngagementTrend.STABLE,
				},
				confidence: 0.6,
				extractedAt: new Date(),
			};

			const businessMessage: AIMessage = {
				id: 'msg-business',
				role: 'user',
				content:
					'I also need help with business strategy and company management',
				timestamp: new Date(),
				metadata: {},
			};

			const updatedContext = analyzer.updateContext(
				techContext,
				businessMessage,
			);

			// Should have both technology and business topics
			const topicNames = updatedContext.topics.map((t) => t.name);
			expect(topicNames).toContain('technology');
			expect(topicNames).toContain('business');
		});
	});

	describe('configuration options', () => {
		it('should respect minTopicConfidence setting', () => {
			const strictAnalyzer = new ContextAnalyzer({
				minTopicConfidence: 0.8, // Very high threshold
			});

			const text = 'computer software'; // Should have low confidence
			const topics = strictAnalyzer.extractTopics(text);

			// With high threshold, might not find any topics
			topics.forEach((topic) => {
				expect(topic.confidence).toBeGreaterThanOrEqual(0.8);
			});
		});

		it('should respect maxTopicsPerAnalysis setting', () => {
			const limitedAnalyzer = new ContextAnalyzer({
				maxTopicsPerAnalysis: 2,
			});

			const text =
				'technology computer software business company sales health medical education school';
			const topics = limitedAnalyzer.extractTopics(text);

			expect(topics.length).toBeLessThanOrEqual(2);
		});

		it('should disable features when configured', () => {
			const disabledAnalyzer = new ContextAnalyzer({
				enableTopicExtraction: false,
				enableSentimentAnalysis: false,
				enableIntentDetection: false,
				enableEngagementTracking: false,
			});

			const context = disabledAnalyzer.analyzeConversation(mockConversation);

			expect(context.topics).toHaveLength(0);
			expect(context.intent.primary).toBe(IntentCategory.INFORMATIONAL);
			expect(context.sentiment.label).toBe(SentimentLabel.NEUTRAL);
			expect(context.userEngagement.level).toBe(EngagementTier.MEDIUM);
		});
	});

	describe('edge cases and error handling', () => {
		it('should handle conversation with only assistant messages', () => {
			const assistantOnlyConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'assistant',
						content: 'Hello, how can I help you?',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const context = analyzer.analyzeConversation(assistantOnlyConversation);
			expect(context).toBeDefined();
			expect(context.topics).toHaveLength(0); // No user messages to analyze
		});

		it('should handle messages with very long content', () => {
			const longContent = 'word '.repeat(10000); // Very long message
			const longMessageConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: longContent,
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			expect(() =>
				analyzer.analyzeConversation(longMessageConversation),
			).not.toThrow();
		});

		it('should handle special characters and emojis', () => {
			const specialConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: '🚀 This is great! 💻 I love technology & programming 🎉',
						timestamp: new Date(),
						metadata: {},
					},
				],
			};

			const context = analyzer.analyzeConversation(specialConversation);
			expect(context).toBeDefined();
			expect(context.sentiment.polarity).toBeGreaterThan(0); // Should detect positive sentiment
		});

		it('should handle malformed timestamps', () => {
			const malformedConversation: AIConversation = {
				...mockConversation,
				messages: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'Hello',
						timestamp: new Date('invalid-date'),
						metadata: {},
					},
				],
			};

			expect(() =>
				analyzer.analyzeConversation(malformedConversation),
			).not.toThrow();
		});
	});
});
