import {
  ConsentStatus,
  PrivacySettings,
  OptOutRequest,
  OptOutType,
  OptOutStatus,
  ComplianceFlag,
  PrivacyRegulation,
  ComplianceStatus,
  ComplianceIssue,
  ComplianceIssueType,
  IssueSeverity,
  AnonymizationLevel,
  UserDataExport,
  ExportFormat,
  PrivacyAuditLog,
  PrivacyAction,
  AuditResult,
  ConsentMethod,
  PrivacyLevel,
  DataProcessingBasis
} from '@ai-yuugen/types';

/**
 * Privacy manager for consent and compliance with GDPR, CCPA, and other regulations
 */
export class PrivacyManager {
  private consentStorage: Map<string, ConsentStatus> = new Map();
  private privacySettings: Map<string, PrivacySettings> = new Map();
  private auditLogs: PrivacyAuditLog[] = [];
  private encryptionKey: string;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || this.generateEncryptionKey();
  }

  /**
   * Check if user has given consent for a specific purpose
   */
  async checkConsent(userId: string, purpose: keyof ConsentStatus): Promise<boolean> {
    try {
      const consent = this.consentStorage.get(userId);
      
      if (!consent) {
        await this.logPrivacyAction(userId, PrivacyAction.DATA_ACCESSED, {
          purpose,
          result: 'no_consent_found'
        }, AuditResult.FAILURE);
        return false;
      }

      // Check if consent is still valid (not expired)
      const isValid = await this.isConsentValid(consent);
      if (!isValid) {
        await this.logPrivacyAction(userId, PrivacyAction.DATA_ACCESSED, {
          purpose,
          result: 'consent_expired'
        }, AuditResult.FAILURE);
        return false;
      }

      const hasConsent = consent[purpose] === true;
      
      await this.logPrivacyAction(userId, PrivacyAction.DATA_ACCESSED, {
        purpose,
        hasConsent,
        consentTimestamp: consent.timestamp
      }, hasConsent ? AuditResult.SUCCESS : AuditResult.BLOCKED);

      return hasConsent;
    } catch (error) {
      await this.logPrivacyAction(userId, PrivacyAction.DATA_ACCESSED, {
        purpose,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, AuditResult.FAILURE);
      return false;
    }
  }

  /**
   * Update user consent status
   */
  async updateConsent(userId: string, consent: ConsentStatus): Promise<void> {
    try {
      // Validate consent data
      this.validateConsentData(consent);

      // Encrypt sensitive data if needed
      const encryptedConsent = await this.encryptConsentData(consent);
      
      // Store consent
      this.consentStorage.set(userId, encryptedConsent);

      // Update privacy settings
      await this.updatePrivacySettingsForConsent(userId, consent);

      await this.logPrivacyAction(userId, PrivacyAction.CONSENT_GRANTED, {
        consentTypes: Object.keys(consent).filter(key => consent[key as keyof ConsentStatus] === true),
        jurisdiction: consent.jurisdiction,
        method: consent.consentMethod
      }, AuditResult.SUCCESS);

    } catch (error) {
      await this.logPrivacyAction(userId, PrivacyAction.CONSENT_GRANTED, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, AuditResult.FAILURE);
      throw error;
    }
  }

  /**
   * Process opt-out request
   */
  async processOptOut(userId: string, optOutType: OptOutType = OptOutType.DATA_PROCESSING): Promise<OptOutRequest> {
    try {
      const optOutRequest: OptOutRequest = {
        id: this.generateId(),
        userId,
        requestType: optOutType,
        status: OptOutStatus.PENDING,
        requestedAt: new Date(),
        verificationToken: this.generateVerificationToken()
      };

      // Add to user's privacy settings
      const settings = this.getOrCreatePrivacySettings(userId);
      settings.optOutRequests.push(optOutRequest);
      this.privacySettings.set(userId, settings);

      // Process the opt-out based on type
      await this.executeOptOut(userId, optOutType, optOutRequest);

      await this.logPrivacyAction(userId, PrivacyAction.OPT_OUT_REQUESTED, {
        optOutType,
        requestId: optOutRequest.id
      }, AuditResult.SUCCESS);

      return optOutRequest;
    } catch (error) {
      await this.logPrivacyAction(userId, PrivacyAction.OPT_OUT_REQUESTED, {
        optOutType,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, AuditResult.FAILURE);
      throw error;
    }
  }

  /**
   * Validate compliance with privacy regulations
   */
  async validateCompliance(userId: string): Promise<ComplianceFlag[]> {
    try {
      const complianceFlags: ComplianceFlag[] = [];
      const consent = this.consentStorage.get(userId);
      const settings = this.privacySettings.get(userId);

      // Check GDPR compliance
      const gdprFlag = await this.checkGDPRCompliance(userId, consent, settings);
      complianceFlags.push(gdprFlag);

      // Check CCPA compliance
      const ccpaFlag = await this.checkCCPACompliance(userId, consent, settings);
      complianceFlags.push(ccpaFlag);

      // Update privacy settings with compliance flags
      if (settings) {
        settings.complianceFlags = complianceFlags;
        this.privacySettings.set(userId, settings);
      }

      await this.logPrivacyAction(userId, PrivacyAction.COMPLIANCE_CHECK, {
        regulations: complianceFlags.map(f => f.regulation),
        overallStatus: complianceFlags.every(f => f.status === ComplianceStatus.COMPLIANT) ? 'compliant' : 'issues_found'
      }, AuditResult.SUCCESS);

      return complianceFlags;
    } catch (error) {
      await this.logPrivacyAction(userId, PrivacyAction.COMPLIANCE_CHECK, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, AuditResult.FAILURE);
      throw error;
    }
  }

  /**
   * Anonymize user data
   */
  async anonymizeData(userId: string, level: AnonymizationLevel = AnonymizationLevel.ANONYMIZATION): Promise<void> {
    try {
      const settings = this.getOrCreatePrivacySettings(userId);
      
      switch (level) {
        case AnonymizationLevel.PSEUDONYMIZATION:
          await this.pseudonymizeUserData(userId);
          break;
        case AnonymizationLevel.ANONYMIZATION:
          await this.anonymizeUserData(userId);
          break;
        case AnonymizationLevel.FULL_DELETION:
          await this.deleteUserData(userId);
          return;
      }

      settings.anonymizationLevel = level;
      this.privacySettings.set(userId, settings);

      await this.logPrivacyAction(userId, PrivacyAction.DATA_MODIFIED, {
        anonymizationLevel: level,
        timestamp: new Date()
      }, AuditResult.SUCCESS);

    } catch (error) {
      await this.logPrivacyAction(userId, PrivacyAction.DATA_MODIFIED, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, AuditResult.FAILURE);
      throw error;
    }
  }

  /**
   * Export user data for GDPR/CCPA compliance
   */
  async exportUserData(userId: string, format: ExportFormat = ExportFormat.JSON): Promise<UserDataExport> {
    try {
      const consent = this.consentStorage.get(userId);
      const settings = this.privacySettings.get(userId);

      const exportData: UserDataExport = {
        userId,
        requestedAt: new Date(),
        generatedAt: new Date(),
        format,
        data: {
          profile: await this.getUserProfile(userId),
          conversations: await this.getUserConversations(userId),
          adInteractions: await this.getUserAdInteractions(userId),
          consentHistory: consent ? [consent] : [],
          privacySettings: settings || this.createDefaultPrivacySettings()
        },
        metadata: {
          version: '1.0.0',
          dataRetentionPeriod: settings?.dataRetentionPeriod || 365,
          exportReason: 'User data portability request'
        }
      };

      await this.logPrivacyAction(userId, PrivacyAction.DATA_EXPORTED, {
        format,
        dataTypes: Object.keys(exportData.data),
        exportSize: JSON.stringify(exportData).length
      }, AuditResult.SUCCESS);

      return exportData;
    } catch (error) {
      await this.logPrivacyAction(userId, PrivacyAction.DATA_EXPORTED, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, AuditResult.FAILURE);
      throw error;
    }
  }

  /**
   * Delete all user data
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      // Remove consent data
      this.consentStorage.delete(userId);
      
      // Remove privacy settings
      this.privacySettings.delete(userId);

      // Remove audit logs (keep for legal compliance period)
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() - 7); // 7 years retention
      
      this.auditLogs = this.auditLogs.filter(log => 
        log.userId !== userId || log.timestamp > retentionDate
      );

      // Delete user profile and related data
      await this.deleteUserProfile(userId);
      await this.deleteUserConversations(userId);
      await this.deleteUserAdInteractions(userId);

      await this.logPrivacyAction(userId, PrivacyAction.DATA_DELETED, {
        deletionType: 'complete',
        timestamp: new Date()
      }, AuditResult.SUCCESS);

    } catch (error) {
      await this.logPrivacyAction(userId, PrivacyAction.DATA_DELETED, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, AuditResult.FAILURE);
      throw error;
    }
  }

  /**
   * Get privacy settings for a user
   */
  getPrivacySettings(userId: string): PrivacySettings | null {
    return this.privacySettings.get(userId) || null;
  }

  /**
   * Set privacy settings for a user
   */
  async setPrivacySettings(userId: string, settings: PrivacySettings): Promise<void> {
    this.privacySettings.set(userId, settings);
    
    await this.logPrivacyAction(userId, PrivacyAction.DATA_MODIFIED, {
      settingsUpdated: Object.keys(settings),
      privacyLevel: settings.privacyLevel
    }, AuditResult.SUCCESS);
  }

  /**
   * Get audit logs for a user
   */
  getAuditLogs(userId: string): PrivacyAuditLog[] {
    return this.auditLogs.filter(log => log.userId === userId);
  }

  // Private helper methods

  private validateConsentData(consent: ConsentStatus): void {
    if (!consent.timestamp || !consent.jurisdiction || !consent.version) {
      throw new Error('Invalid consent data: missing required fields');
    }

    if (consent.timestamp > new Date()) {
      throw new Error('Invalid consent data: timestamp cannot be in the future');
    }
  }

  private async encryptConsentData(consent: ConsentStatus): Promise<ConsentStatus> {
    // In a real implementation, this would use proper encryption
    // For now, we'll return the consent as-is but mark it as encrypted
    return {
      ...consent,
      // Add encryption metadata
      ipAddress: consent.ipAddress ? this.simpleEncrypt(consent.ipAddress) : undefined,
      userAgent: consent.userAgent ? this.simpleEncrypt(consent.userAgent) : undefined
    };
  }

  private simpleEncrypt(data: string): string {
    // Simple encryption simulation - in production use proper encryption with this.encryptionKey
    return Buffer.from(data + this.encryptionKey.slice(0, 8)).toString('base64');
  }

  private async isConsentValid(consent: ConsentStatus): Promise<boolean> {
    const now = new Date();
    const consentAge = now.getTime() - consent.timestamp.getTime();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    
    return consentAge < maxAge;
  }

  private getOrCreatePrivacySettings(userId: string): PrivacySettings {
    let settings = this.privacySettings.get(userId);
    if (!settings) {
      settings = this.createDefaultPrivacySettings();
      this.privacySettings.set(userId, settings);
    }
    return settings;
  }

  private createDefaultPrivacySettings(): PrivacySettings {
    return {
      consentStatus: {
        advertising: false,
        analytics: false,
        personalization: false,
        dataSharing: false,
        timestamp: new Date(),
        jurisdiction: 'unknown',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      },
      dataRetentionPeriod: 365,
      privacyLevel: PrivacyLevel.STANDARD,
      dataProcessingBasis: DataProcessingBasis.CONSENT,
      optOutRequests: [],
      complianceFlags: [],
      encryptionEnabled: true,
      anonymizationLevel: AnonymizationLevel.NONE
    };
  }

  private async updatePrivacySettingsForConsent(userId: string, consent: ConsentStatus): Promise<void> {
    const settings = this.getOrCreatePrivacySettings(userId);
    settings.consentStatus = consent;
    this.privacySettings.set(userId, settings);
  }

  private async executeOptOut(userId: string, optOutType: OptOutType, request: OptOutRequest): Promise<void> {
    switch (optOutType) {
      case OptOutType.DATA_PROCESSING:
        await this.stopDataProcessing(userId);
        break;
      case OptOutType.MARKETING:
        await this.stopMarketing(userId);
        break;
      case OptOutType.ANALYTICS:
        await this.stopAnalytics(userId);
        break;
      case OptOutType.DATA_SHARING:
        await this.stopDataSharing(userId);
        break;
      case OptOutType.COMPLETE_DELETION:
        await this.deleteUserData(userId);
        break;
    }

    request.status = OptOutStatus.PROCESSED;
    request.processedAt = new Date();
  }

  private async checkGDPRCompliance(_userId: string, consent?: ConsentStatus, settings?: PrivacySettings): Promise<ComplianceFlag> {
    const issues: ComplianceIssue[] = [];

    if (!consent) {
      issues.push({
        id: this.generateId(),
        type: ComplianceIssueType.MISSING_CONSENT,
        severity: IssueSeverity.HIGH,
        description: 'No consent record found for user',
        detectedAt: new Date(),
        resolved: false
      });
    } else if (!await this.isConsentValid(consent)) {
      issues.push({
        id: this.generateId(),
        type: ComplianceIssueType.EXPIRED_CONSENT,
        severity: IssueSeverity.MEDIUM,
        description: 'User consent has expired',
        detectedAt: new Date(),
        resolved: false
      });
    }

    if (settings && settings.dataRetentionPeriod > 365) {
      issues.push({
        id: this.generateId(),
        type: ComplianceIssueType.DATA_RETENTION_VIOLATION,
        severity: IssueSeverity.MEDIUM,
        description: 'Data retention period exceeds recommended limits',
        detectedAt: new Date(),
        resolved: false
      });
    }

    return {
      regulation: PrivacyRegulation.GDPR,
      status: issues.length === 0 ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT,
      lastChecked: new Date(),
      issues
    };
  }

  private async checkCCPACompliance(_userId: string, consent?: ConsentStatus, settings?: PrivacySettings): Promise<ComplianceFlag> {
    const issues: ComplianceIssue[] = [];

    // CCPA focuses on opt-out rights rather than opt-in consent
    if (settings && settings.optOutRequests.length === 0) {
      // This is not necessarily an issue, just noting no opt-out requests
    }

    if (consent && consent.dataSharing && !consent.advertising) {
      issues.push({
        id: this.generateId(),
        type: ComplianceIssueType.UNAUTHORIZED_SHARING,
        severity: IssueSeverity.MEDIUM,
        description: 'Data sharing enabled without advertising consent',
        detectedAt: new Date(),
        resolved: false
      });
    }

    return {
      regulation: PrivacyRegulation.CCPA,
      status: issues.length === 0 ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT,
      lastChecked: new Date(),
      issues
    };
  }

  private async logPrivacyAction(
    userId: string, 
    action: PrivacyAction, 
    details: Record<string, any>, 
    result: AuditResult
  ): Promise<void> {
    const log: PrivacyAuditLog = {
      id: this.generateId(),
      userId,
      action,
      timestamp: new Date(),
      details,
      result
    };

    this.auditLogs.push(log);

    // Keep only recent logs to prevent memory issues
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private generateEncryptionKey(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  // Placeholder methods for data operations (would integrate with actual data layer)
  private async getUserProfile(userId: string): Promise<any> {
    return { userId, note: 'Profile data would be retrieved from data layer' };
  }

  private async getUserConversations(userId: string): Promise<any[]> {
    return [{ userId, note: 'Conversation data would be retrieved from data layer' }];
  }

  private async getUserAdInteractions(userId: string): Promise<any[]> {
    return [{ userId, note: 'Ad interaction data would be retrieved from data layer' }];
  }

  private async deleteUserProfile(userId: string): Promise<void> {
    // Would delete from actual data layer
    console.log(`Deleting profile for user ${userId}`);
  }

  private async deleteUserConversations(userId: string): Promise<void> {
    // Would delete from actual data layer
    console.log(`Deleting conversations for user ${userId}`);
  }

  private async deleteUserAdInteractions(userId: string): Promise<void> {
    // Would delete from actual data layer
    console.log(`Deleting ad interactions for user ${userId}`);
  }

  private async stopDataProcessing(userId: string): Promise<void> {
    const settings = this.getOrCreatePrivacySettings(userId);
    settings.consentStatus.advertising = false;
    settings.consentStatus.analytics = false;
    settings.consentStatus.personalization = false;
    this.privacySettings.set(userId, settings);
    
    // Also update the main consent storage
    const consent = this.consentStorage.get(userId);
    if (consent) {
      consent.advertising = false;
      consent.analytics = false;
      consent.personalization = false;
      this.consentStorage.set(userId, consent);
    }
  }

  private async stopMarketing(userId: string): Promise<void> {
    const settings = this.getOrCreatePrivacySettings(userId);
    settings.consentStatus.advertising = false;
    this.privacySettings.set(userId, settings);
    
    // Also update the main consent storage
    const consent = this.consentStorage.get(userId);
    if (consent) {
      consent.advertising = false;
      this.consentStorage.set(userId, consent);
    }
  }

  private async stopAnalytics(userId: string): Promise<void> {
    const settings = this.getOrCreatePrivacySettings(userId);
    settings.consentStatus.analytics = false;
    this.privacySettings.set(userId, settings);
    
    // Also update the main consent storage
    const consent = this.consentStorage.get(userId);
    if (consent) {
      consent.analytics = false;
      this.consentStorage.set(userId, consent);
    }
  }

  private async stopDataSharing(userId: string): Promise<void> {
    const settings = this.getOrCreatePrivacySettings(userId);
    settings.consentStatus.dataSharing = false;
    this.privacySettings.set(userId, settings);
    
    // Also update the main consent storage
    const consent = this.consentStorage.get(userId);
    if (consent) {
      consent.dataSharing = false;
      this.consentStorage.set(userId, consent);
    }
  }

  private async pseudonymizeUserData(userId: string): Promise<void> {
    // Would implement pseudonymization logic
    console.log(`Pseudonymizing data for user ${userId}`);
  }

  private async anonymizeUserData(userId: string): Promise<void> {
    // Would implement anonymization logic
    console.log(`Anonymizing data for user ${userId}`);
  }
}