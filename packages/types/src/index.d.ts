export interface SDKConfig {
    apiKey: string;
    environment: 'development' | 'staging' | 'production';
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
    enableAnalytics?: boolean;
    enablePrivacyMode?: boolean;
    debugMode?: boolean;
}
export interface AdSize {
    width: number;
    height: number;
    responsive?: boolean;
}
export declare enum AdPosition {
    TOP = "top",
    BOTTOM = "bottom",
    LEFT = "left",
    RIGHT = "right",
    INLINE = "inline",
    OVERLAY = "overlay",
    FLOATING = "floating"
}
export declare enum AdType {
    BANNER = "banner",
    INTERSTITIAL = "interstitial",
    NATIVE = "native",
    VIDEO = "video",
    REWARDED = "rewarded"
}
export declare enum AdFormat {
    DISPLAY = "display",
    TEXT = "text",
    RICH_MEDIA = "rich_media",
    VIDEO = "video",
    INTERACTIVE = "interactive"
}
export interface AdPlacement {
    id: string;
    type: AdType;
    format: AdFormat;
    size: AdSize;
    position: AdPosition;
}
export interface Ad {
    id: string;
    type: AdType;
    format: AdFormat;
    content: AdContent;
    createdAt: Date;
    expiresAt: Date;
}
export interface AdContent {
    title: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText: string;
    landingUrl: string;
    brandName: string;
}
export interface AIContext {
    topics: string[];
    intent: string;
    sentiment: string;
    conversationStage: string;
    userEngagement: string;
}
export interface UserContext {
    sessionId: string;
    currentConversation?: string;
    recentTopics: string[];
    currentIntent?: string;
    engagementLevel: string;
    timeOnPlatform: number;
    interactionCount: number;
}
export interface AIConversation {
    id: string;
    messages: AIMessage[];
    topics: string[];
    intent: string;
    startTime: Date;
    lastActivity: Date;
}
export interface AIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface ConsentStatus {
    advertising: boolean;
    analytics: boolean;
    personalization: boolean;
    dataSharing: boolean;
    timestamp: Date;
    jurisdiction: string;
    version: string;
}
export interface PrivacySettings {
    consentStatus: ConsentStatus;
    dataRetentionPeriod: number;
    privacyLevel: string;
    dataProcessingBasis: string;
}
export interface AdEvent {
    id: string;
    type: string;
    adId: string;
    userId?: string;
    sessionId: string;
    timestamp: Date;
    context: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface PerformanceMetrics {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpm: number;
    revenue: number;
    engagementScore: number;
}
export interface AIYuugenSDK {
    initialize(config: SDKConfig): Promise<void>;
    requestAd(placement: AdPlacement, context: AIContext): Promise<Ad>;
    displayAd(ad: Ad, container: HTMLElement): void;
    hideAd(adId: string): void;
    analyzeContext(conversation: AIConversation): AIContext;
    updateUserContext(context: UserContext): void;
    setConsentStatus(consent: ConsentStatus): void;
    getPrivacySettings(): PrivacySettings;
    trackEvent(event: AdEvent): void;
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map