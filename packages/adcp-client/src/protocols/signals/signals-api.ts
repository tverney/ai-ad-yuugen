/**
 * Signals Activation Protocol API
 *
 * Implements the ADCP Signals Activation Protocol for discovering and activating
 * audience signals from various providers.
 */

import { MCPClient, MCPRequest } from '../../client/mcp-client';
import { AuthManager } from '../../client/auth-manager';
import { Logger } from '../../utils/logger';
import { ADCPError, ADCPErrorCode } from '../../utils/error-handler';
import {
	Signal,
	SignalQuery,
	ActivationConfig,
	Activation,
	ActivationStatus,
} from '../../types/signal-types';
import { SignalDiscovery } from './signal-discovery';
import { SignalActivation } from './signal-activation';

/**
 * Signals API for ADCP Signals Activation Protocol
 */
export class SignalsAPI {
	private mcpClient: MCPClient;
	private authManager: AuthManager;
	private logger: Logger;
	private discovery: SignalDiscovery;
	private activation: SignalActivation;

	constructor(mcpClient: MCPClient, authManager: AuthManager, logger: Logger) {
		this.mcpClient = mcpClient;
		this.authManager = authManager;
		this.logger = logger;
		this.discovery = new SignalDiscovery(mcpClient, logger);
		this.activation = new SignalActivation(mcpClient, logger);
	}

	/**
	 * Discover signals based on query parameters
	 *
	 * @param query - Signal query parameters
	 * @returns Array of discovered signals
	 */
	async discover(query: SignalQuery): Promise<Signal[]> {
		this.logger.info('Discovering signals', { query });

		try {
			// Validate query
			this.validateQuery(query);

			// Get authentication token
			const token = await this.authManager.getToken();

			// Build and execute discovery request
			const signals = await this.discovery.discover(query, token.value);

			this.logger.info('Signals discovered', {
				count: signals.length,
				providers: [...new Set(signals.map((s) => s.provider))],
			});

			return signals;
		} catch (error) {
			this.logger.error('Signal discovery failed', { error, query });
			throw error;
		}
	}

	/**
	 * Activate a signal for targeting
	 *
	 * @param signalId - ID of the signal to activate
	 * @param config - Activation configuration
	 * @returns Activation details
	 */
	async activate(
		signalId: string,
		config: ActivationConfig,
	): Promise<Activation> {
		this.logger.info('Activating signal', { signalId, config });

		try {
			// Validate inputs
			this.validateSignalId(signalId);
			this.validateActivationConfig(config);

			// Get authentication token
			const token = await this.authManager.getToken();

			// Execute activation
			const activation = await this.activation.activate(
				signalId,
				config,
				token.value,
			);

			this.logger.info('Signal activated', {
				activationId: activation.id,
				signalId,
				status: activation.status,
				cost: activation.cost,
			});

			return activation;
		} catch (error) {
			this.logger.error('Signal activation failed', {
				error,
				signalId,
				config,
			});
			throw error;
		}
	}

	/**
	 * Get activation status
	 *
	 * @param activationId - ID of the activation
	 * @returns Current activation status and details
	 */
	async getStatus(activationId: string): Promise<Activation> {
		this.logger.debug('Getting activation status', { activationId });

		try {
			// Validate activation ID
			this.validateActivationId(activationId);

			// Get authentication token
			const token = await this.authManager.getToken();

			// Build request
			const request: MCPRequest = {
				method: 'signals.getStatus',
				params: {
					activationId,
					apiKey: token.value,
				},
			};

			// Execute request
			const response = await this.mcpClient.request<{
				activation: any;
			}>(request);

			// Parse and normalize response
			const activation = this.activation.parseActivation(response.activation);

			this.logger.debug('Activation status retrieved', {
				activationId,
				status: activation.status,
			});

			return activation;
		} catch (error) {
			this.logger.error('Failed to get activation status', {
				error,
				activationId,
			});
			throw error;
		}
	}

	/**
	 * Deactivate a signal
	 *
	 * @param activationId - ID of the activation to deactivate
	 */
	async deactivate(activationId: string): Promise<void> {
		this.logger.info('Deactivating signal', { activationId });

		try {
			// Validate activation ID
			this.validateActivationId(activationId);

			// Get authentication token
			const token = await this.authManager.getToken();

			// Build request
			const request: MCPRequest = {
				method: 'signals.deactivate',
				params: {
					activationId,
					apiKey: token.value,
				},
			};

			// Execute request
			await this.mcpClient.request<{ success: boolean }>(request);

			this.logger.info('Signal deactivated', { activationId });
		} catch (error) {
			this.logger.error('Signal deactivation failed', { error, activationId });
			throw error;
		}
	}

	// ==================== Validation Methods ====================

	/**
	 * Validate signal query
	 */
	private validateQuery(query: SignalQuery): void {
		if (!query) {
			throw new ADCPError(
				'Signal query is required',
				ADCPErrorCode.INVALID_REQUEST,
				{ query },
			);
		}

		// At least one search criterion must be provided
		if (
			!query.text &&
			!query.categories?.length &&
			!query.providers?.length &&
			!query.geography
		) {
			throw new ADCPError(
				'At least one search criterion must be provided (text, categories, providers, or geography)',
				ADCPErrorCode.INVALID_REQUEST,
				{ query },
			);
		}

		// Validate price range if provided
		if (query.priceRange) {
			if (query.priceRange.min < 0 || query.priceRange.max < 0) {
				throw new ADCPError(
					'Price range values must be non-negative',
					ADCPErrorCode.INVALID_REQUEST,
					{ priceRange: query.priceRange },
				);
			}
			if (query.priceRange.min > query.priceRange.max) {
				throw new ADCPError(
					'Price range min must be less than or equal to max',
					ADCPErrorCode.INVALID_REQUEST,
					{ priceRange: query.priceRange },
				);
			}
		}

		// Validate reach range if provided
		if (query.minReach !== undefined && query.minReach < 0) {
			throw new ADCPError(
				'Minimum reach must be non-negative',
				ADCPErrorCode.INVALID_REQUEST,
				{ minReach: query.minReach },
			);
		}

		if (query.maxReach !== undefined && query.maxReach < 0) {
			throw new ADCPError(
				'Maximum reach must be non-negative',
				ADCPErrorCode.INVALID_REQUEST,
				{ maxReach: query.maxReach },
			);
		}

		if (
			query.minReach !== undefined &&
			query.maxReach !== undefined &&
			query.minReach > query.maxReach
		) {
			throw new ADCPError(
				'Minimum reach must be less than or equal to maximum reach',
				ADCPErrorCode.INVALID_REQUEST,
				{ minReach: query.minReach, maxReach: query.maxReach },
			);
		}

		// Validate limit if provided
		if (query.limit !== undefined && query.limit <= 0) {
			throw new ADCPError(
				'Limit must be a positive number',
				ADCPErrorCode.INVALID_REQUEST,
				{ limit: query.limit },
			);
		}
	}

	/**
	 * Validate signal ID
	 */
	private validateSignalId(signalId: string): void {
		if (
			!signalId ||
			typeof signalId !== 'string' ||
			signalId.trim().length === 0
		) {
			throw new ADCPError(
				'Valid signal ID is required',
				ADCPErrorCode.INVALID_REQUEST,
				{ signalId },
			);
		}
	}

	/**
	 * Validate activation configuration
	 */
	private validateActivationConfig(config: ActivationConfig): void {
		if (!config) {
			throw new ADCPError(
				'Activation configuration is required',
				ADCPErrorCode.INVALID_REQUEST,
				{ config },
			);
		}

		// Validate budget
		if (config.budget === undefined || config.budget <= 0) {
			throw new ADCPError(
				'Budget must be a positive number',
				ADCPErrorCode.INVALID_REQUEST,
				{ budget: config.budget },
			);
		}

		// Validate duration
		if (!config.duration) {
			throw new ADCPError(
				'Duration is required',
				ADCPErrorCode.INVALID_REQUEST,
				{ config },
			);
		}

		const { days, hours, startDate, endDate } = config.duration;

		// Must have either days/hours or startDate/endDate
		if (!days && !hours && !startDate && !endDate) {
			throw new ADCPError(
				'Duration must specify either days/hours or startDate/endDate',
				ADCPErrorCode.INVALID_REQUEST,
				{ duration: config.duration },
			);
		}

		// Validate days and hours if provided
		if (days !== undefined && days <= 0) {
			throw new ADCPError(
				'Days must be a positive number',
				ADCPErrorCode.INVALID_REQUEST,
				{ days },
			);
		}

		if (hours !== undefined && hours <= 0) {
			throw new ADCPError(
				'Hours must be a positive number',
				ADCPErrorCode.INVALID_REQUEST,
				{ hours },
			);
		}

		// Validate date range if provided
		if (startDate && endDate && startDate >= endDate) {
			throw new ADCPError(
				'Start date must be before end date',
				ADCPErrorCode.INVALID_REQUEST,
				{ startDate, endDate },
			);
		}
	}

	/**
	 * Validate activation ID
	 */
	private validateActivationId(activationId: string): void {
		if (
			!activationId ||
			typeof activationId !== 'string' ||
			activationId.trim().length === 0
		) {
			throw new ADCPError(
				'Valid activation ID is required',
				ADCPErrorCode.INVALID_REQUEST,
				{ activationId },
			);
		}
	}
}
