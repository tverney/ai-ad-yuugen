// Main SDK interface and configuration
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

// Basic types
export interface AdSize {
	width: number;
	height: number;
	responsive?: boolean;
}

export enum AdPosition {
	TOP = 'top',
	BOTTOM = 'bottom',
	LEFT = 'left',
	RIGHT = 'right',
	INLINE = 'inline',
	OVERLAY = 'overlay',
	FLOATING = 'floating',
}

export enum AdType {
	BANNER = 'banner',
	INTERSTITIAL = 'interstitial',
	NATIVE = 'native',
	VIDEO = 'video',
	REWARDED = 'rewarded',
}

export enum AdFormat {
	DISPLAY = 'display',
	TEXT = 'text',
	RICH_MEDIA = 'rich_media',
	VIDEO = 'video',
	INTERACTIVE = 'interactive',
}

// Core interfaces
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
	id?: string;
	title: string;
	description: string;
	imageUrl?: string;
	videoUrl?: string;
	ctaText: string;
	landingUrl: string;
	brandName: string;
}

// Context and conversation types
export interface AIContext {
	topics: Topic[];
	intent: UserIntent;
	sentiment: SentimentScore;
	conversationStage: ConversationStage;
	userEngagement: EngagementLevel;
	confidence: number;
	extractedAt: Date;
}

export interface UserContext {
	sessionId: string;
	currentConversation?: string;
	recentTopics: Topic[];
	currentIntent?: UserIntent;
	engagementLevel: EngagementLevel;
	timeOnPlatform: number;
	interactionCount: number;
	behaviorPatterns: BehaviorPattern[];
}

export interface AIConversation {
	id: string;
	messages: AIMessage[];
	topics: Topic[];
	intent: UserIntent;
	startTime: Date;
	lastActivity: Date;
	context?: ConversationContext;
}

export interface AIMessage {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
	metadata?: Record<string, any>;
}

// Enhanced context analysis types
export interface Topic {
	name: string;
	category: string;
	confidence: number;
	keywords: string[];
	relevanceScore: number;
}

export interface UserIntent {
	primary: string;
	secondary?: string[];
	confidence: number;
	category: IntentCategory;
	actionable: boolean;
}

export enum IntentCategory {
	INFORMATIONAL = 'informational',
	TRANSACTIONAL = 'transactional',
	NAVIGATIONAL = 'navigational',
	COMMERCIAL = 'commercial',
	ENTERTAINMENT = 'entertainment',
	SUPPORT = 'support',
}

export interface SentimentScore {
	polarity: number; // -1 to 1 (negative to positive)
	magnitude: number; // 0 to 1 (neutral to strong)
	label: SentimentLabel;
	confidence: number;
}

export enum SentimentLabel {
	VERY_NEGATIVE = 'very_negative',
	NEGATIVE = 'negative',
	NEUTRAL = 'neutral',
	POSITIVE = 'positive',
	VERY_POSITIVE = 'very_positive',
}

export interface ConversationStage {
	stage: ConversationPhase;
	progress: number; // 0 to 1
	duration: number; // in milliseconds
	messageCount: number;
}

export enum ConversationPhase {
	GREETING = 'greeting',
	EXPLORATION = 'exploration',
	PROBLEM_SOLVING = 'problem_solving',
	DECISION_MAKING = 'decision_making',
	CONCLUSION = 'conclusion',
	FOLLOW_UP = 'follow_up',
}

export interface EngagementLevel {
	score: number; // 0 to 1
	level: EngagementTier;
	indicators: EngagementIndicator[];
	trend: EngagementTrend;
}

export enum EngagementTier {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	VERY_HIGH = 'very_high',
}

export interface EngagementIndicator {
	type: EngagementType;
	value: number;
	weight: number;
}

export enum EngagementType {
	MESSAGE_LENGTH = 'message_length',
	RESPONSE_TIME = 'response_time',
	QUESTION_FREQUENCY = 'question_frequency',
	FOLLOW_UP_RATE = 'follow_up_rate',
	SESSION_DURATION = 'session_duration',
	INTERACTION_DEPTH = 'interaction_depth',
}

export enum EngagementTrend {
	INCREASING = 'increasing',
	STABLE = 'stable',
	DECREASING = 'decreasing',
}

export interface BehaviorPattern {
	type: string;
	frequency: number;
	lastOccurrence: Date;
	confidence: number;
}

export interface ConversationContext {
	domain: string;
	language: string;
	formality: FormalityLevel;
	complexity: ComplexityLevel;
	urgency: UrgencyLevel;
}

export enum FormalityLevel {
	VERY_INFORMAL = 'very_informal',
	INFORMAL = 'informal',
	NEUTRAL = 'neutral',
	FORMAL = 'formal',
	VERY_FORMAL = 'very_formal',
}

export enum ComplexityLevel {
	SIMPLE = 'simple',
	MODERATE = 'moderate',
	COMPLEX = 'complex',
	VERY_COMPLEX = 'very_complex',
}

export enum UrgencyLevel {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical',
}

// Privacy types
export interface ConsentStatus {
	advertising: boolean;
	analytics: boolean;
	personalization: boolean;
	dataSharing: boolean;
	timestamp: Date;
	jurisdiction: string;
	version: string;
	ipAddress?: string;
	userAgent?: string;
	consentMethod: ConsentMethod;
}

export enum ConsentMethod {
	EXPLICIT = 'explicit',
	IMPLIED = 'implied',
	LEGITIMATE_INTEREST = 'legitimate_interest',
	VITAL_INTEREST = 'vital_interest',
}

export interface PrivacySettings {
	consentStatus: ConsentStatus;
	dataRetentionPeriod: number;
	privacyLevel: PrivacyLevel;
	dataProcessingBasis: DataProcessingBasis;
	optOutRequests: OptOutRequest[];
	complianceFlags: ComplianceFlag[];
	encryptionEnabled: boolean;
	anonymizationLevel: AnonymizationLevel;
}

export enum PrivacyLevel {
	MINIMAL = 'minimal',
	STANDARD = 'standard',
	ENHANCED = 'enhanced',
	MAXIMUM = 'maximum',
}

export enum DataProcessingBasis {
	CONSENT = 'consent',
	CONTRACT = 'contract',
	LEGAL_OBLIGATION = 'legal_obligation',
	VITAL_INTERESTS = 'vital_interests',
	PUBLIC_TASK = 'public_task',
	LEGITIMATE_INTERESTS = 'legitimate_interests',
}

export interface OptOutRequest {
	id: string;
	userId: string;
	requestType: OptOutType;
	status: OptOutStatus;
	requestedAt: Date;
	processedAt?: Date;
	reason?: string;
	verificationToken?: string;
}

export enum OptOutType {
	DATA_PROCESSING = 'data_processing',
	MARKETING = 'marketing',
	ANALYTICS = 'analytics',
	DATA_SHARING = 'data_sharing',
	COMPLETE_DELETION = 'complete_deletion',
}

export enum OptOutStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	PROCESSED = 'processed',
	REJECTED = 'rejected',
}

export interface ComplianceFlag {
	regulation: PrivacyRegulation;
	status: ComplianceStatus;
	lastChecked: Date;
	issues: ComplianceIssue[];
}

export enum PrivacyRegulation {
	GDPR = 'gdpr',
	CCPA = 'ccpa',
	PIPEDA = 'pipeda',
	LGPD = 'lgpd',
	COPPA = 'coppa',
}

export enum ComplianceStatus {
	COMPLIANT = 'compliant',
	NON_COMPLIANT = 'non_compliant',
	PENDING_REVIEW = 'pending_review',
	UNKNOWN = 'unknown',
}

export interface ComplianceIssue {
	id: string;
	type: ComplianceIssueType;
	severity: IssueSeverity;
	description: string;
	detectedAt: Date;
	resolved: boolean;
	resolvedAt?: Date;
}

export enum ComplianceIssueType {
	MISSING_CONSENT = 'missing_consent',
	EXPIRED_CONSENT = 'expired_consent',
	INVALID_DATA_PROCESSING = 'invalid_data_processing',
	DATA_RETENTION_VIOLATION = 'data_retention_violation',
	UNAUTHORIZED_SHARING = 'unauthorized_sharing',
	MISSING_PRIVACY_NOTICE = 'missing_privacy_notice',
}

export enum IssueSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical',
}

export enum AnonymizationLevel {
	NONE = 'none',
	PSEUDONYMIZATION = 'pseudonymization',
	ANONYMIZATION = 'anonymization',
	FULL_DELETION = 'full_deletion',
}

export interface UserDataExport {
	userId: string;
	requestedAt: Date;
	generatedAt: Date;
	format: ExportFormat;
	data: {
		profile: any;
		conversations: AIConversation[];
		adInteractions: AdEvent[];
		consentHistory: ConsentStatus[];
		privacySettings: PrivacySettings;
	};
	metadata: {
		version: string;
		dataRetentionPeriod: number;
		exportReason: string;
	};
}

export enum ExportFormat {
	JSON = 'json',
	CSV = 'csv',
	XML = 'xml',
	PDF = 'pdf',
}

export interface PrivacyAuditLog {
	id: string;
	userId: string;
	action: PrivacyAction;
	timestamp: Date;
	details: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	result: AuditResult;
}

export enum PrivacyAction {
	CONSENT_GRANTED = 'consent_granted',
	CONSENT_WITHDRAWN = 'consent_withdrawn',
	DATA_ACCESSED = 'data_accessed',
	DATA_MODIFIED = 'data_modified',
	DATA_DELETED = 'data_deleted',
	DATA_EXPORTED = 'data_exported',
	OPT_OUT_REQUESTED = 'opt_out_requested',
	COMPLIANCE_CHECK = 'compliance_check',
}

export enum AuditResult {
	SUCCESS = 'success',
	FAILURE = 'failure',
	PARTIAL = 'partial',
	BLOCKED = 'blocked',
}

// Ad Request and Response types
export interface AdRequest {
	placementId: string;
	context: AIContext;
	userProfile?: UserProfile;
	privacySettings: PrivacySettings;
	deviceInfo: DeviceInfo;
	sessionId: string;
	timestamp: Date;
	requestId: string;
}

export interface AdResponse {
	requestId: string;
	ads: Ad[];
	fallbackAds?: Ad[];
	metadata: AdResponseMetadata;
	timestamp: Date;
	ttl: number; // Time to live in seconds
}

export interface AdResponseMetadata {
	processingTime: number;
	targetingScore: number;
	auctionId?: string;
	bidPrice?: number;
	currency?: string;
	impressionUrl?: string;
	clickUrl?: string;
	conversionUrl?: string;
}

export interface DeviceInfo {
	userAgent: string;
	screenWidth: number;
	screenHeight: number;
	deviceType: DeviceType;
	platform: string;
	language: string;
	timezone: string;
	connectionType?: ConnectionType;
}

export enum DeviceType {
	DESKTOP = 'desktop',
	MOBILE = 'mobile',
	TABLET = 'tablet',
	TV = 'tv',
	UNKNOWN = 'unknown',
}

export enum ConnectionType {
	WIFI = 'wifi',
	CELLULAR = 'cellular',
	ETHERNET = 'ethernet',
	UNKNOWN = 'unknown',
}

export interface UserProfile {
	id: string;
	demographics?: Demographics;
	interests: Interest[];
	behaviorHistory: BehaviorEvent[];
	aiInteractionHistory: AIInteraction[];
	createdAt: Date;
	lastUpdated: Date;
}

export interface Demographics {
	ageRange?: AgeRange;
	gender?: Gender;
	location?: Location;
	language: string;
	timezone: string;
}

export enum AgeRange {
	UNDER_18 = 'under_18',
	AGE_18_24 = '18_24',
	AGE_25_34 = '25_34',
	AGE_35_44 = '35_44',
	AGE_45_54 = '45_54',
	AGE_55_64 = '55_64',
	OVER_65 = 'over_65',
}

export enum Gender {
	MALE = 'male',
	FEMALE = 'female',
	NON_BINARY = 'non_binary',
	PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export interface Location {
	country: string;
	region?: string;
	city?: string;
	postalCode?: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
}

export interface Interest {
	category: string;
	subcategory?: string;
	score: number; // 0 to 1
	source: InterestSource;
	lastUpdated: Date;
}

export enum InterestSource {
	EXPLICIT = 'explicit',
	INFERRED = 'inferred',
	BEHAVIORAL = 'behavioral',
	CONTEXTUAL = 'contextual',
}

export interface BehaviorEvent {
	type: BehaviorEventType;
	timestamp: Date;
	context: Record<string, any>;
	value?: number;
}

export enum BehaviorEventType {
	PAGE_VIEW = 'page_view',
	CLICK = 'click',
	SCROLL = 'scroll',
	TIME_SPENT = 'time_spent',
	INTERACTION = 'interaction',
	CONVERSION = 'conversion',
}

export interface AIInteraction {
	id: string;
	conversationId: string;
	timestamp: Date;
	duration: number;
	messageCount: number;
	topics: Topic[];
	intent: UserIntent;
	satisfaction?: number; // 0 to 1
}

// Ad Request Builder types
export interface AdRequestBuilder {
	setPlacement(placement: AdPlacement): AdRequestBuilder;
	setContext(context: AIContext): AdRequestBuilder;
	setUserProfile(profile: UserProfile): AdRequestBuilder;
	setPrivacySettings(settings: PrivacySettings): AdRequestBuilder;
	setDeviceInfo(info: DeviceInfo): AdRequestBuilder;
	setSessionId(sessionId: string): AdRequestBuilder;
	build(): AdRequest;
}

// Fallback configuration
export interface FallbackConfig {
	enabled: boolean;
	maxRetries: number;
	retryDelay: number; // milliseconds
	fallbackAds: Ad[];
	fallbackStrategy: FallbackStrategy;
}

export enum FallbackStrategy {
	CACHED_ADS = 'cached_ads',
	DEFAULT_ADS = 'default_ads',
	NO_ADS = 'no_ads',
	RETRY_ONLY = 'retry_only',
}

// Error types for ad requests
export enum AdRequestErrorType {
	NETWORK_ERROR = 'network_error',
	TIMEOUT = 'timeout',
	INVALID_REQUEST = 'invalid_request',
	AUTHENTICATION_ERROR = 'authentication_error',
	RATE_LIMITED = 'rate_limited',
	SERVER_ERROR = 'server_error',
	NO_ADS_AVAILABLE = 'no_ads_available',
	PRIVACY_VIOLATION = 'privacy_violation',
}

export interface AdRequestError {
	type: AdRequestErrorType;
	message: string;
	code: string;
	retryable: boolean;
	retryAfter?: number; // seconds
	details?: Record<string, any>;
}

// Analytics types
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

export interface AnalyticsInsight {
	id: string;
	type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
	title: string;
	description: string;
	impact: 'low' | 'medium' | 'high';
	actionable: boolean;
	recommendations?: string[];
	confidence: number;
	detectedAt: Date;
}

export interface AnalyticsAlert {
	id: string;
	severity: 'info' | 'warning' | 'error' | 'critical';
	title: string;
	message: string;
	metric: string;
	threshold: number;
	currentValue: number;
	triggeredAt: Date;
	acknowledged: boolean;
}

export interface DashboardData {
	realTimeMetrics: PerformanceMetrics;
	historicalData: PerformanceMetrics[];
	insights: AnalyticsInsight[];
	alerts: AnalyticsAlert[];
	lastUpdated: Date;
}

export interface MetricsFilter {
	startDate?: Date;
	endDate?: Date;
	adIds?: string[];
	eventTypes?: string[];
	userId?: string;
	sessionId?: string;
}

export interface ReportConfig {
	type: 'performance' | 'engagement' | 'revenue' | 'custom';
	timeRange: {
		start: Date;
		end: Date;
	};
	groupBy?: 'hour' | 'day' | 'week' | 'month';
	metrics: string[];
	filters?: MetricsFilter;
}

// Context Analyzer interface
export interface ContextAnalyzer {
	analyzeConversation(conversation: AIConversation): AIContext;
	extractTopics(text: string): Topic[];
	detectIntent(conversation: AIConversation): UserIntent;
	analyzeSentiment(text: string): SentimentScore;
	detectConversationStage(conversation: AIConversation): ConversationStage;
	calculateEngagement(
		conversation: AIConversation,
		userContext?: UserContext,
	): EngagementLevel;
	updateContext(currentContext: AIContext, newMessage: AIMessage): AIContext;
}

// Main SDK interface
export interface AIYuugenSDK {
	// Initialization
	initialize(config: SDKConfig): Promise<void>;

	// Ad Management
	requestAd(placement: AdPlacement, context: AIContext): Promise<Ad>;
	displayAd(ad: Ad, container: HTMLElement): void;
	hideAd(adId: string): void;

	// Context Analysis
	analyzeContext(conversation: AIConversation): AIContext;
	updateUserContext(context: UserContext): void;

	// Privacy Management
	setConsentStatus(consent: ConsentStatus): void;
	getPrivacySettings(): PrivacySettings;

	// Analytics
	trackEvent(event: AdEvent): void;
	getPerformanceMetrics(): Promise<PerformanceMetrics>;

	// Lifecycle
	destroy(): void;
}

// ============================================================================
// ADCP Integration Types
// ============================================================================

/**
 * Configuration for ADCP (Ad Context Protocol) integration
 */
export interface ADCPConfig {
	/** MCP (Model Context Protocol) configuration */
	mcp: MCPConfig;
	/** Authentication configuration */
	auth: AuthConfig;
	/** Cache configuration */
	cache?: CacheConfig;
	/** Endpoint configuration */
	endpoints?: EndpointConfig;
	/** Enable/disable ADCP features */
	enabled?: boolean;
}

/**
 * Model Context Protocol configuration
 */
export interface MCPConfig {
	/** MCP server URL */
	serverUrl: string;
	/** Connection timeout in milliseconds */
	timeout?: number;
	/** Maximum number of concurrent connections */
	maxConnections?: number;
	/** Enable connection pooling */
	pooling?: boolean;
	/** Retry configuration */
	retry?: {
		maxAttempts: number;
		backoffMs: number;
	};
}

/**
 * Authentication configuration for ADCP
 */
export interface AuthConfig {
	/** API key for authentication */
	apiKey: string;
	/** API secret (optional) */
	apiSecret?: string;
	/** OAuth 2.0 configuration (optional) */
	oauth?: {
		clientId: string;
		clientSecret: string;
		tokenUrl: string;
		scopes?: string[];
	};
	/** Key rotation settings */
	rotation?: {
		enabled: boolean;
		intervalDays: number;
	};
}

/**
 * Cache configuration for signal data
 */
export interface CacheConfig {
	/** Enable caching */
	enabled: boolean;
	/** Cache TTL in seconds */
	ttl: number;
	/** Redis connection URL */
	redisUrl?: string;
	/** Maximum cache size in MB */
	maxSize?: number;
	/** Eviction policy */
	evictionPolicy?: 'lru' | 'lfu' | 'ttl';
}

/**
 * Endpoint configuration for ADCP platforms
 */
export interface EndpointConfig {
	/** Signals API endpoint */
	signalsUrl?: string;
	/** Media Buy API endpoint */
	mediaBuyUrl?: string;
	/** Analytics API endpoint */
	analyticsUrl?: string;
}

/**
 * Signal provider enumeration
 */
export enum SignalProvider {
	SCOPE3 = 'scope3',
	LIVERAMP = 'liveramp',
	NIELSEN = 'nielsen',
	COMSCORE = 'comscore',
	ORACLE = 'oracle',
	NEUSTAR = 'neustar',
}

/**
 * Signal category enumeration
 */
export enum SignalCategory {
	DEMOGRAPHIC = 'demographic',
	BEHAVIORAL = 'behavioral',
	CONTEXTUAL = 'contextual',
	GEOGRAPHIC = 'geographic',
	TEMPORAL = 'temporal',
	PSYCHOGRAPHIC = 'psychographic',
	TECHNOGRAPHIC = 'technographic',
}

/**
 * Audience signal for ad targeting
 */
export interface Signal {
	/** Unique signal identifier */
	id: string;
	/** Human-readable signal name */
	name: string;
	/** Detailed description of the signal */
	description: string;
	/** Signal provider */
	provider: SignalProvider;
	/** Signal category */
	category: SignalCategory;
	/** Cost per thousand impressions */
	cpm: number;
	/** Estimated audience reach */
	reach: number;
	/** Signal quality confidence (0-1) */
	confidence: number;
	/** Additional signal metadata */
	metadata: SignalMetadata;
	/** Signal creation timestamp */
	createdAt: Date;
	/** Signal last update timestamp */
	updatedAt: Date;
}

/**
 * Additional metadata for signals
 */
export interface SignalMetadata {
	/** Related topics */
	topics?: string[];
	/** User intents */
	intents?: string[];
	/** Demographic information */
	demographics?: Demographics;
	/** Geographic targeting */
	geography?: Geography;
	/** Data freshness score (0-1) */
	dataFreshness?: number;
	/** Original data source */
	dataSource?: string;
	/** Custom attributes */
	attributes?: Record<string, any>;
}

/**
 * Geographic targeting information
 */
export interface Geography {
	/** Country codes (ISO 3166-1 alpha-2) */
	countries?: string[];
	/** Region/state codes */
	regions?: string[];
	/** City names */
	cities?: string[];
	/** Postal/ZIP codes */
	postalCodes?: string[];
	/** DMA (Designated Market Area) codes */
	dmas?: string[];
}

/**
 * Price range for signal queries
 */
export interface PriceRange {
	/** Minimum CPM */
	min: number;
	/** Maximum CPM */
	max: number;
	/** Currency code (ISO 4217) */
	currency?: string;
}

/**
 * Query parameters for signal discovery
 */
export interface SignalQuery {
	/** Free-text search query */
	text?: string;
	/** Filter by signal categories */
	categories?: SignalCategory[];
	/** Filter by signal providers */
	providers?: SignalProvider[];
	/** Price range filter */
	priceRange?: PriceRange;
	/** Minimum audience reach */
	minReach?: number;
	/** Maximum audience reach */
	maxReach?: number;
	/** Geographic targeting */
	geography?: Geography;
	/** Topics to match */
	topics?: string[];
	/** Intents to match */
	intents?: string[];
	/** Demographics to match */
	demographics?: Demographics;
	/** Maximum number of results */
	limit?: number;
	/** Result offset for pagination */
	offset?: number;
}

/**
 * Configuration for signal activation
 */
export interface ActivationConfig {
	/** Signal ID to activate */
	signalId: string;
	/** Activation duration in hours */
	durationHours: number;
	/** Maximum budget for activation */
	budget: number;
	/** Currency code (ISO 4217) */
	currency?: string;
	/** Target impressions */
	targetImpressions?: number;
	/** Activation priority (1-10) */
	priority?: number;
	/** Custom activation parameters */
	parameters?: Record<string, any>;
}

/**
 * Signal activation status enumeration
 */
export enum ActivationStatus {
	PENDING = 'pending',
	ACTIVE = 'active',
	PAUSED = 'paused',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

/**
 * Signal activation record
 */
export interface Activation {
	/** Unique activation identifier */
	id: string;
	/** Signal ID that was activated */
	signalId: string;
	/** Current activation status */
	status: ActivationStatus;
	/** Total cost incurred */
	cost: number;
	/** Currency code (ISO 4217) */
	currency: string;
	/** Actual audience reach */
	reach: number;
	/** Performance metrics (if available) */
	performance?: {
		impressions: number;
		clicks: number;
		conversions: number;
		ctr: number;
		cpa: number;
	};
	/** Activation creation timestamp */
	createdAt: Date;
	/** Activation last update timestamp */
	updatedAt: Date;
	/** Activation expiration timestamp */
	expiresAt: Date;
}

/**
 * Signal scores for ranking
 */
export interface SignalScores {
	/** Relevance score (0-1) */
	relevance: number;
	/** Quality score (0-1) */
	quality: number;
	/** Cost efficiency score (0-1) */
	costEfficiency: number;
	/** Reach score (0-1) */
	reach: number;
	/** Weighted total score (0-1) */
	total: number;
}

/**
 * Scored signal with ranking information
 */
export interface ScoredSignal extends Signal {
	/** Calculated scores */
	scores: SignalScores;
	/** Whether this signal was selected for activation */
	selected?: boolean;
	/** Activation ID if activated */
	activationId?: string;
}

/**
 * Enhancement metadata for AI context
 */
export interface EnhancementMetadata {
	/** When the context was enhanced */
	enhancedAt: Date;
	/** Number of signals added */
	signalCount: number;
	/** Total cost of signal activations */
	totalCost: number;
	/** Expected performance lift (0-1) */
	expectedLift: number;
	/** Enhancement confidence (0-1) */
	confidence: number;
	/** Processing time in milliseconds */
	processingTimeMs?: number;
}

/**
 * Enhanced AI context with ADCP signals
 * Extends the base AIContext with optional ADCP signal data
 */
export interface EnhancedAIContext extends AIContext {
	/** ADCP signals discovered and scored */
	adcpSignals?: ScoredSignal[];
	/** IDs of activated signals */
	signalActivations?: string[];
	/** Enhancement metadata */
	enhancementMetadata?: EnhancementMetadata;
}

/**
 * Media buy status enumeration
 */
export enum BuyStatus {
	PENDING = 'pending',
	SUBMITTED = 'submitted',
	APPROVED = 'approved',
	ACTIVE = 'active',
	PAUSED = 'paused',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

/**
 * Duration specification for media buys
 */
export interface Duration {
	/** Start date/time */
	start: Date;
	/** End date/time */
	end: Date;
	/** Duration in hours (calculated) */
	hours?: number;
}

/**
 * Targeting configuration for media buys
 */
export interface TargetingConfig {
	/** Geographic targeting */
	geography?: Geography;
	/** Demographic targeting */
	demographics?: Demographics;
	/** Interest categories */
	interests?: string[];
	/** Behavioral segments */
	behaviors?: string[];
	/** Contextual keywords */
	keywords?: string[];
	/** Device types */
	devices?: DeviceType[];
	/** Time of day targeting (24-hour format) */
	timeOfDay?: {
		start: number;
		end: number;
	};
	/** Day of week targeting (0=Sunday, 6=Saturday) */
	daysOfWeek?: number[];
}

/**
 * Optimization configuration for media buys
 */
export interface OptimizationConfig {
	/** Optimization goal */
	goal: OptimizationGoal;
	/** Target metric value */
	targetValue?: number;
	/** Bid adjustment strategy */
	bidStrategy?: BidStrategy;
	/** Budget pacing strategy */
	pacingStrategy?: PacingStrategy;
	/** Enable automatic optimization */
	autoOptimize?: boolean;
	/** Optimization frequency in hours */
	optimizationFrequencyHours?: number;
}

/**
 * Optimization goal enumeration
 */
export enum OptimizationGoal {
	MAXIMIZE_IMPRESSIONS = 'maximize_impressions',
	MAXIMIZE_CLICKS = 'maximize_clicks',
	MAXIMIZE_CONVERSIONS = 'maximize_conversions',
	MINIMIZE_CPA = 'minimize_cpa',
	MAXIMIZE_ROAS = 'maximize_roas',
	TARGET_CPA = 'target_cpa',
	TARGET_ROAS = 'target_roas',
}

/**
 * Bid strategy enumeration
 */
export enum BidStrategy {
	MANUAL = 'manual',
	AUTO = 'auto',
	TARGET_CPA = 'target_cpa',
	TARGET_ROAS = 'target_roas',
	MAXIMIZE_CONVERSIONS = 'maximize_conversions',
	MAXIMIZE_CLICKS = 'maximize_clicks',
}

/**
 * Budget pacing strategy enumeration
 */
export enum PacingStrategy {
	STANDARD = 'standard',
	ACCELERATED = 'accelerated',
	EVEN = 'even',
	ASAP = 'asap',
}

/**
 * Media buy request
 */
export interface MediaBuyRequest {
	/** Total budget for the buy */
	budget: number;
	/** Currency code (ISO 4217) */
	currency?: string;
	/** Campaign duration */
	duration: Duration;
	/** Targeting configuration */
	targeting: TargetingConfig;
	/** DSP platforms to use */
	platforms: string[];
	/** Base bid amount */
	baseBid: number;
	/** Optimization configuration */
	optimization?: OptimizationConfig;
	/** Campaign name */
	campaignName?: string;
	/** Campaign description */
	campaignDescription?: string;
	/** Custom parameters */
	customParameters?: Record<string, any>;
}

/**
 * Media buy response
 */
export interface MediaBuyResponse {
	/** Unique buy identifier */
	buyId: string;
	/** Current buy status */
	status: BuyStatus;
	/** Total cost incurred */
	cost: number;
	/** Currency code (ISO 4217) */
	currency: string;
	/** Total impressions delivered */
	impressions: number;
	/** Delivery timeline with milestones */
	deliveryTimeline: Date[];
	/** Campaign performance metrics */
	performance?: PerformanceMetrics;
	/** Platform-specific buy IDs */
	platformBuyIds?: Record<string, string>;
	/** Creation timestamp */
	createdAt: Date;
	/** Last update timestamp */
	updatedAt: Date;
}

/**
 * Signal preferences for ad requests
 */
export interface SignalPreferences {
	/** Preferred signal providers */
	providers?: SignalProvider[];
	/** Preferred signal categories */
	categories?: SignalCategory[];
	/** Maximum CPM willing to pay */
	maxCPM?: number;
	/** Minimum audience reach required */
	minReach?: number;
	/** Budget allocated for signals */
	budget?: number;
	/** Currency code (ISO 4217) */
	currency?: string;
}

/**
 * Signal insight for served ads
 */
export interface SignalInsight {
	/** Signal ID */
	signalId: string;
	/** Signal name */
	signalName: string;
	/** Signal provider */
	provider: SignalProvider;
	/** Signal category */
	category: SignalCategory;
	/** Contribution to ad selection (0-1) */
	contribution: number;
	/** Performance impact */
	impact?: {
		ctrLift: number;
		conversionLift: number;
		engagementLift: number;
	};
}

/**
 * ADCP error codes
 */
export enum ADCPErrorCode {
	// Connection errors
	CONNECTION_FAILED = 'CONNECTION_FAILED',
	TIMEOUT = 'TIMEOUT',
	NETWORK_ERROR = 'NETWORK_ERROR',

	// Authentication errors
	INVALID_API_KEY = 'INVALID_API_KEY',
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	API_KEY_EXPIRED = 'API_KEY_EXPIRED',

	// Request errors
	INVALID_REQUEST = 'INVALID_REQUEST',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	SIGNAL_NOT_FOUND = 'SIGNAL_NOT_FOUND',
	ACTIVATION_NOT_FOUND = 'ACTIVATION_NOT_FOUND',
	INSUFFICIENT_BUDGET = 'INSUFFICIENT_BUDGET',
	INVALID_SIGNAL_QUERY = 'INVALID_SIGNAL_QUERY',

	// Platform errors
	PLATFORM_UNAVAILABLE = 'PLATFORM_UNAVAILABLE',
	PLATFORM_ERROR = 'PLATFORM_ERROR',
	RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

	// Data errors
	CACHE_ERROR = 'CACHE_ERROR',
	DATA_INCONSISTENCY = 'DATA_INCONSISTENCY',

	// Unknown errors
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Cache statistics
 */
export interface CacheStats {
	/** Total cache hits */
	hits: number;
	/** Total cache misses */
	misses: number;
	/** Cache hit ratio (0-1) */
	hitRatio: number;
	/** Current cache size in bytes */
	size: number;
	/** Number of cached items */
	itemCount: number;
	/** Number of evictions */
	evictions: number;
}

/**
 * Analytics request parameters
 */
export interface AnalyticsRequest {
	/** Start date for analytics */
	startDate: Date;
	/** End date for analytics */
	endDate: Date;
	/** Metrics to retrieve */
	metrics?: string[];
	/** Dimensions to group by */
	dimensions?: string[];
	/** Filters to apply */
	filters?: Record<string, any>;
	/** Campaign IDs to include */
	campaignIds?: string[];
	/** Signal IDs to include */
	signalIds?: string[];
	/** Platform IDs to include */
	platformIds?: string[];
}

/**
 * Analytics data response
 */
export interface AnalyticsData {
	/** Request parameters */
	request: AnalyticsRequest;
	/** Aggregated metrics */
	metrics: Record<string, number>;
	/** Time-series data */
	timeSeries?: Array<{
		timestamp: Date;
		metrics: Record<string, number>;
	}>;
	/** Breakdown by dimensions */
	breakdown?: Array<{
		dimension: string;
		value: string;
		metrics: Record<string, number>;
	}>;
	/** Performance comparison */
	comparison?: {
		baseline: Record<string, number>;
		enhanced: Record<string, number>;
		lift: Record<string, number>;
	};
	/** Generated timestamp */
	generatedAt: Date;
}

/**
 * Campaign configuration
 */
export interface CampaignConfig {
	/** Campaign name */
	name: string;
	/** Campaign description */
	description?: string;
	/** Campaign budget */
	budget: number;
	/** Currency code (ISO 4217) */
	currency?: string;
	/** Campaign duration */
	duration: Duration;
	/** Targeting configuration */
	targeting: TargetingConfig;
	/** Signal preferences */
	signalPreferences?: SignalPreferences;
	/** Optimization configuration */
	optimization?: OptimizationConfig;
	/** Platforms to use */
	platforms?: string[];
}

/**
 * Campaign status
 */
export interface CampaignStatus {
	/** Campaign ID */
	campaignId: string;
	/** Current status */
	status: BuyStatus;
	/** Budget information */
	budget: {
		total: number;
		spent: number;
		remaining: number;
		currency: string;
	};
	/** Performance metrics */
	performance: PerformanceMetrics;
	/** Active signals */
	activeSignals: number;
	/** Active media buys */
	activeBuys: number;
	/** Last update timestamp */
	lastUpdated: Date;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
	/** Campaign ID */
	campaignId: string;
	/** Optimization timestamp */
	optimizedAt: Date;
	/** Changes applied */
	changes: Array<{
		parameter: string;
		oldValue: any;
		newValue: any;
		reason: string;
	}>;
	/** Expected impact */
	expectedImpact: {
		metric: string;
		currentValue: number;
		projectedValue: number;
		improvement: number;
	}[];
	/** Optimization confidence (0-1) */
	confidence: number;
}

/**
 * Report generation result
 */
export interface Report {
	/** Report ID */
	id: string;
	/** Report type */
	type: string;
	/** Report configuration */
	config: ReportConfig;
	/** Report data */
	data: AnalyticsData;
	/** Generated insights */
	insights?: AnalyticsInsight[];
	/** Export URLs */
	exports?: {
		json?: string;
		csv?: string;
		pdf?: string;
	};
	/** Generation timestamp */
	generatedAt: Date;
}

/**
 * Metrics callback for streaming
 */
export type MetricsCallback = (metrics: AnalyticsData) => void;

/**
 * Insight generation result
 */
export interface Insight {
	/** Insight ID */
	id: string;
	/** Insight type */
	type: 'trend' | 'anomaly' | 'opportunity' | 'recommendation';
	/** Insight title */
	title: string;
	/** Insight description */
	description: string;
	/** Impact level */
	impact: 'low' | 'medium' | 'high';
	/** Confidence score (0-1) */
	confidence: number;
	/** Actionable recommendations */
	recommendations?: string[];
	/** Related metrics */
	relatedMetrics?: string[];
	/** Detection timestamp */
	detectedAt: Date;
}
