/**
 * Authentication manager for ADCP client
 * Handles API key storage, rotation, and OAuth 2.0 flows
 */

import { AuthConfig } from '../types/adcp-types';
import { ADCPError, ADCPErrorCode } from '../utils/error-handler';
import { Logger } from '../utils/logger';
import * as crypto from 'crypto';

export interface AuthToken {
	value: string;
	type: 'api_key' | 'bearer';
	expiresAt?: Date;
	refreshToken?: string;
}

export interface OAuthTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
}

/**
 * Manages authentication credentials and token lifecycle
 */
export class AuthManager {
	private config: AuthConfig;
	private logger: Logger;
	private currentToken: AuthToken | null = null;
	private rotationTimer: NodeJS.Timeout | null = null;
	private encryptionKey: Buffer;

	constructor(config: AuthConfig, logger: Logger) {
		this.config = config;
		this.logger = logger;

		// Generate encryption key from a secure source
		// In production, this should come from environment or secure vault
		this.encryptionKey = crypto.randomBytes(32);

		this.initialize();
	}

	/**
	 * Initialize authentication
	 */
	private initialize(): void {
		if (this.config.apiKey) {
			this.currentToken = {
				value: this.config.apiKey,
				type: 'api_key',
			};
			this.logger.info('Authentication initialized with API key');
		}

		if (this.config.keyRotation?.enabled) {
			this.startKeyRotation();
		}
	}

	/**
	 * Get current authentication token
	 */
	async getToken(): Promise<AuthToken> {
		if (!this.currentToken) {
			throw new ADCPError(
				'No authentication token available',
				ADCPErrorCode.UNAUTHORIZED,
			);
		}

		// Check if token is expired
		if (
			this.currentToken.expiresAt &&
			this.currentToken.expiresAt < new Date()
		) {
			this.logger.info('Token expired, refreshing');
			await this.refreshToken();
		}

		return this.currentToken;
	}

	/**
	 * Get authorization header value
	 */
	async getAuthHeader(): Promise<string> {
		const token = await this.getToken();

		if (token.type === 'api_key') {
			return `ApiKey ${token.value}`;
		} else {
			return `Bearer ${token.value}`;
		}
	}

	/**
	 * Refresh the authentication token
	 */
	async refreshToken(): Promise<void> {
		if (!this.currentToken?.refreshToken) {
			throw new ADCPError(
				'No refresh token available',
				ADCPErrorCode.UNAUTHORIZED,
			);
		}

		if (!this.config.oauth) {
			throw new ADCPError(
				'OAuth configuration not provided',
				ADCPErrorCode.INVALID_REQUEST,
			);
		}

		try {
			this.logger.info('Refreshing OAuth token');

			const response = await this.requestOAuthToken({
				grant_type: 'refresh_token',
				refresh_token: this.currentToken.refreshToken,
				client_id: this.config.oauth.clientId,
				client_secret: this.config.oauth.clientSecret,
			});

			this.updateToken(response);
			this.logger.info('Token refreshed successfully');
		} catch (error) {
			this.logger.error('Token refresh failed', { error });
			throw new ADCPError(
				'Failed to refresh authentication token',
				ADCPErrorCode.UNAUTHORIZED,
				{ originalError: error },
			);
		}
	}

	/**
	 * Rotate API key
	 */
	async rotateApiKey(newApiKey: string): Promise<void> {
		this.logger.info('Rotating API key');

		// Encrypt and store the new key (for future secure storage integration)
		// const encryptedKey = this.encryptApiKey(newApiKey);

		// Update current token
		this.currentToken = {
			value: newApiKey,
			type: 'api_key',
		};

		this.logger.info('API key rotated successfully');
	}

	/**
	 * Start automatic key rotation
	 */
	private startKeyRotation(): void {
		if (!this.config.keyRotation) return;

		const interval = this.config.keyRotation.interval;

		this.logger.info('Starting key rotation', { interval });

		this.rotationTimer = setInterval(() => {
			this.logger.info('Key rotation interval reached');
			// In production, this would fetch a new key from a secure source
			// For now, we just log the event
		}, interval);
	}

	/**
	 * Stop automatic key rotation
	 */
	private stopKeyRotation(): void {
		if (this.rotationTimer) {
			clearInterval(this.rotationTimer);
			this.rotationTimer = null;
			this.logger.info('Key rotation stopped');
		}
	}

	/**
	 * Authenticate using OAuth 2.0
	 */
	async authenticateOAuth(): Promise<void> {
		if (!this.config.oauth) {
			throw new ADCPError(
				'OAuth configuration not provided',
				ADCPErrorCode.INVALID_REQUEST,
			);
		}

		try {
			this.logger.info('Authenticating with OAuth 2.0');

			const response = await this.requestOAuthToken({
				grant_type: 'client_credentials',
				client_id: this.config.oauth.clientId,
				client_secret: this.config.oauth.clientSecret,
			});

			this.updateToken(response);
			this.logger.info('OAuth authentication successful');
		} catch (error) {
			this.logger.error('OAuth authentication failed', { error });
			throw new ADCPError(
				'OAuth authentication failed',
				ADCPErrorCode.UNAUTHORIZED,
				{ originalError: error },
			);
		}
	}

	/**
	 * Request OAuth token from authorization server
	 */
	private async requestOAuthToken(
		_params: Record<string, string>,
	): Promise<OAuthTokenResponse> {
		if (!this.config.oauth) {
			throw new ADCPError(
				'OAuth configuration not provided',
				ADCPErrorCode.INVALID_REQUEST,
			);
		}

		// In a real implementation, this would make an HTTP request to the OAuth server
		// For now, we return a mock response
		this.logger.debug('Requesting OAuth token', {
			tokenUrl: this.config.oauth.tokenUrl,
		});

		// Mock response - in production, use fetch or axios
		return {
			access_token: 'mock_access_token',
			token_type: 'Bearer',
			expires_in: 3600,
			refresh_token: 'mock_refresh_token',
		};
	}

	/**
	 * Update current token from OAuth response
	 */
	private updateToken(response: OAuthTokenResponse): void {
		const expiresAt = new Date();
		expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);

		this.currentToken = {
			value: response.access_token,
			type: 'bearer',
			expiresAt,
			refreshToken: response.refresh_token,
		};
	}

	/**
	 * Encrypt API key for secure storage
	 * @internal - Will be used for secure vault integration
	 */
	private encryptApiKey(apiKey: string): string {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

		let encrypted = cipher.update(apiKey, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		return iv.toString('hex') + ':' + encrypted;
	}

	/**
	 * Decrypt API key from secure storage
	 * @internal - Will be used for secure vault integration
	 */
	private decryptApiKey(encryptedKey: string): string {
		const parts = encryptedKey.split(':');
		const iv = Buffer.from(parts[0], 'hex');
		const encrypted = parts[1];

		const decipher = crypto.createDecipheriv(
			'aes-256-cbc',
			this.encryptionKey,
			iv,
		);

		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	}

	/**
	 * Validate API key format
	 */
	validateApiKey(apiKey: string): boolean {
		// Basic validation - in production, this would be more sophisticated
		return apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
	}

	/**
	 * Clear authentication state
	 */
	clear(): void {
		this.logger.info('Clearing authentication state');
		this.stopKeyRotation();
		this.currentToken = null;
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.clear();
		this.logger.info('Auth manager destroyed');
	}
}
