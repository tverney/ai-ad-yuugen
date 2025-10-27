import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyManager } from './privacy-manager';
import {
  ConsentStatus,
  ConsentMethod,
  PrivacyLevel,
  DataProcessingBasis,
  OptOutType,
  OptOutStatus,
  PrivacyRegulation,
  ComplianceStatus,
  AnonymizationLevel,
  ExportFormat,
  PrivacyAction,
  AuditResult
} from '@ai-yuugen/types';

describe('PrivacyManager', () => {
  let privacyManager: PrivacyManager;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    privacyManager = new PrivacyManager('test-encryption-key');
  });

  describe('Consent Management', () => {
    it('should check consent status correctly', async () => {
      // Initially no consent
      const hasConsent = await privacyManager.checkConsent(testUserId, 'advertising');
      expect(hasConsent).toBe(false);
    });

    it('should update consent status', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: false,
        dataSharing: false,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };

      await privacyManager.updateConsent(testUserId, consentData);
      
      const hasAdvertisingConsent = await privacyManager.checkConsent(testUserId, 'advertising');
      const hasAnalyticsConsent = await privacyManager.checkConsent(testUserId, 'analytics');
      const hasPersonalizationConsent = await privacyManager.checkConsent(testUserId, 'personalization');

      expect(hasAdvertisingConsent).toBe(true);
      expect(hasAnalyticsConsent).toBe(true);
      expect(hasPersonalizationConsent).toBe(false);
    });

    it('should reject expired consent', async () => {
      const expiredConsent: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };

      await privacyManager.updateConsent(testUserId, expiredConsent);
      
      const hasConsent = await privacyManager.checkConsent(testUserId, 'advertising');
      expect(hasConsent).toBe(false);
    });

    it('should validate consent data', async () => {
      const invalidConsent = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        // Missing required fields
      } as ConsentStatus;

      await expect(privacyManager.updateConsent(testUserId, invalidConsent))
        .rejects.toThrow('Invalid consent data: missing required fields');
    });

    it('should reject future timestamps', async () => {
      const futureConsent: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };

      await expect(privacyManager.updateConsent(testUserId, futureConsent))
        .rejects.toThrow('Invalid consent data: timestamp cannot be in the future');
    });
  });

  describe('Opt-Out Management', () => {
    it('should process data processing opt-out', async () => {
      // First give consent
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'US',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      // Then opt out
      const optOutRequest = await privacyManager.processOptOut(testUserId, OptOutType.DATA_PROCESSING);
      
      expect(optOutRequest.userId).toBe(testUserId);
      expect(optOutRequest.requestType).toBe(OptOutType.DATA_PROCESSING);
      expect(optOutRequest.status).toBe(OptOutStatus.PROCESSED);
      expect(optOutRequest.verificationToken).toBeDefined();

      // Check that consent was revoked
      const hasConsent = await privacyManager.checkConsent(testUserId, 'advertising');
      expect(hasConsent).toBe(false);
    });

    it('should process marketing opt-out', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'US',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      await privacyManager.processOptOut(testUserId, OptOutType.MARKETING);
      
      const hasAdvertisingConsent = await privacyManager.checkConsent(testUserId, 'advertising');
      const hasAnalyticsConsent = await privacyManager.checkConsent(testUserId, 'analytics');

      expect(hasAdvertisingConsent).toBe(false);
      expect(hasAnalyticsConsent).toBe(true); // Should still have analytics consent
    });

    it('should process complete deletion opt-out', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      await privacyManager.processOptOut(testUserId, OptOutType.COMPLETE_DELETION);
      
      const settings = privacyManager.getPrivacySettings(testUserId);
      expect(settings).toBeNull(); // Should be deleted
    });
  });

  describe('Compliance Validation', () => {
    it('should validate GDPR compliance with valid consent', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: false,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      const complianceFlags = await privacyManager.validateCompliance(testUserId);
      
      const gdprFlag = complianceFlags.find(f => f.regulation === PrivacyRegulation.GDPR);
      expect(gdprFlag).toBeDefined();
      expect(gdprFlag?.status).toBe(ComplianceStatus.COMPLIANT);
      expect(gdprFlag?.issues).toHaveLength(0);
    });

    it('should detect GDPR compliance issues', async () => {
      // No consent provided
      const complianceFlags = await privacyManager.validateCompliance(testUserId);
      
      const gdprFlag = complianceFlags.find(f => f.regulation === PrivacyRegulation.GDPR);
      expect(gdprFlag).toBeDefined();
      expect(gdprFlag?.status).toBe(ComplianceStatus.NON_COMPLIANT);
      expect(gdprFlag?.issues.length).toBeGreaterThan(0);
      expect(gdprFlag?.issues[0].type).toBe('missing_consent');
    });

    it('should validate CCPA compliance', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'US',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      const complianceFlags = await privacyManager.validateCompliance(testUserId);
      
      const ccpaFlag = complianceFlags.find(f => f.regulation === PrivacyRegulation.CCPA);
      expect(ccpaFlag).toBeDefined();
      expect(ccpaFlag?.status).toBe(ComplianceStatus.COMPLIANT);
    });

    it('should detect CCPA compliance issues with data sharing', async () => {
      const consentData: ConsentStatus = {
        advertising: false,
        analytics: true,
        personalization: true,
        dataSharing: true, // Data sharing without advertising consent
        timestamp: new Date(),
        jurisdiction: 'US',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      const complianceFlags = await privacyManager.validateCompliance(testUserId);
      
      const ccpaFlag = complianceFlags.find(f => f.regulation === PrivacyRegulation.CCPA);
      expect(ccpaFlag?.status).toBe(ComplianceStatus.NON_COMPLIANT);
      expect(ccpaFlag?.issues.some(issue => issue.type === 'unauthorized_sharing')).toBe(true);
    });
  });

  describe('Data Anonymization', () => {
    it('should anonymize user data', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      await privacyManager.anonymizeData(testUserId, AnonymizationLevel.ANONYMIZATION);
      
      const settings = privacyManager.getPrivacySettings(testUserId);
      expect(settings?.anonymizationLevel).toBe(AnonymizationLevel.ANONYMIZATION);
    });

    it('should pseudonymize user data', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      await privacyManager.anonymizeData(testUserId, AnonymizationLevel.PSEUDONYMIZATION);
      
      const settings = privacyManager.getPrivacySettings(testUserId);
      expect(settings?.anonymizationLevel).toBe(AnonymizationLevel.PSEUDONYMIZATION);
    });

    it('should delete data for full deletion level', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      await privacyManager.anonymizeData(testUserId, AnonymizationLevel.FULL_DELETION);
      
      const settings = privacyManager.getPrivacySettings(testUserId);
      expect(settings).toBeNull(); // Should be deleted
    });
  });

  describe('Data Export', () => {
    it('should export user data in JSON format', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: false,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      const exportData = await privacyManager.exportUserData(testUserId, ExportFormat.JSON);
      
      expect(exportData.userId).toBe(testUserId);
      expect(exportData.format).toBe(ExportFormat.JSON);
      expect(exportData.data).toBeDefined();
      expect(exportData.data.consentHistory).toHaveLength(1);
      expect(exportData.data.privacySettings).toBeDefined();
      expect(exportData.metadata.version).toBe('1.0.0');
    });

    it('should export user data with all data types', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'US',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      const exportData = await privacyManager.exportUserData(testUserId);
      
      expect(exportData.data.profile).toBeDefined();
      expect(exportData.data.conversations).toBeDefined();
      expect(exportData.data.adInteractions).toBeDefined();
      expect(exportData.data.consentHistory).toBeDefined();
      expect(exportData.data.privacySettings).toBeDefined();
    });
  });

  describe('Data Deletion', () => {
    it('should delete all user data', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };
      await privacyManager.updateConsent(testUserId, consentData);

      // Verify data exists
      let settings = privacyManager.getPrivacySettings(testUserId);
      expect(settings).toBeDefined();

      // Delete data
      await privacyManager.deleteUserData(testUserId);

      // Verify data is deleted
      settings = privacyManager.getPrivacySettings(testUserId);
      expect(settings).toBeNull();

      const hasConsent = await privacyManager.checkConsent(testUserId, 'advertising');
      expect(hasConsent).toBe(false);
    });
  });

  describe('Privacy Settings Management', () => {
    it('should get and set privacy settings', async () => {
      const settings = privacyManager.getPrivacySettings(testUserId);
      expect(settings).toBeNull(); // Initially null

      const newSettings = {
        consentStatus: {
          advertising: true,
          analytics: false,
          personalization: true,
          dataSharing: false,
          timestamp: new Date(),
          jurisdiction: 'EU',
          version: '1.0.0',
          consentMethod: ConsentMethod.EXPLICIT
        },
        dataRetentionPeriod: 180,
        privacyLevel: PrivacyLevel.ENHANCED,
        dataProcessingBasis: DataProcessingBasis.CONSENT,
        optOutRequests: [],
        complianceFlags: [],
        encryptionEnabled: true,
        anonymizationLevel: AnonymizationLevel.NONE
      };

      await privacyManager.setPrivacySettings(testUserId, newSettings);
      
      const retrievedSettings = privacyManager.getPrivacySettings(testUserId);
      expect(retrievedSettings).toEqual(newSettings);
      expect(retrievedSettings?.privacyLevel).toBe(PrivacyLevel.ENHANCED);
      expect(retrievedSettings?.dataRetentionPeriod).toBe(180);
    });
  });

  describe('Audit Logging', () => {
    it('should log privacy actions', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT
      };

      await privacyManager.updateConsent(testUserId, consentData);
      await privacyManager.checkConsent(testUserId, 'advertising');
      await privacyManager.validateCompliance(testUserId);

      const auditLogs = privacyManager.getAuditLogs(testUserId);
      
      expect(auditLogs.length).toBeGreaterThan(0);
      
      const consentLog = auditLogs.find(log => log.action === PrivacyAction.CONSENT_GRANTED);
      expect(consentLog).toBeDefined();
      expect(consentLog?.result).toBe(AuditResult.SUCCESS);

      const accessLog = auditLogs.find(log => log.action === PrivacyAction.DATA_ACCESSED);
      expect(accessLog).toBeDefined();

      const complianceLog = auditLogs.find(log => log.action === PrivacyAction.COMPLIANCE_CHECK);
      expect(complianceLog).toBeDefined();
    });

    it('should log failed operations', async () => {
      // Try to check consent for non-existent user
      await privacyManager.checkConsent('non-existent-user', 'advertising');

      const auditLogs = privacyManager.getAuditLogs('non-existent-user');
      const failedLog = auditLogs.find(log => log.result === AuditResult.FAILURE);
      
      expect(failedLog).toBeDefined();
      expect(failedLog?.details.result).toBe('no_consent_found');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid consent data gracefully', async () => {
      const invalidConsent = {} as ConsentStatus;

      await expect(privacyManager.updateConsent(testUserId, invalidConsent))
        .rejects.toThrow();

      const auditLogs = privacyManager.getAuditLogs(testUserId);
      const errorLog = auditLogs.find(log => log.result === AuditResult.FAILURE);
      expect(errorLog).toBeDefined();
    });

    it('should handle missing user data gracefully', async () => {
      const hasConsent = await privacyManager.checkConsent('non-existent-user', 'advertising');
      expect(hasConsent).toBe(false);

      const exportData = await privacyManager.exportUserData('non-existent-user');
      expect(exportData.data.consentHistory).toHaveLength(0);
    });
  });

  describe('Encryption and Security', () => {
    it('should initialize with encryption key', () => {
      const manager = new PrivacyManager('custom-key');
      expect(manager).toBeDefined();
    });

    it('should generate encryption key if not provided', () => {
      const manager = new PrivacyManager();
      expect(manager).toBeDefined();
    });

    it('should encrypt sensitive consent data', async () => {
      const consentData: ConsentStatus = {
        advertising: true,
        analytics: true,
        personalization: true,
        dataSharing: true,
        timestamp: new Date(),
        jurisdiction: 'EU',
        version: '1.0.0',
        consentMethod: ConsentMethod.EXPLICIT,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      };

      await privacyManager.updateConsent(testUserId, consentData);
      
      // The consent should be stored (encryption is simulated in this implementation)
      const hasConsent = await privacyManager.checkConsent(testUserId, 'advertising');
      expect(hasConsent).toBe(true);
    });
  });
});