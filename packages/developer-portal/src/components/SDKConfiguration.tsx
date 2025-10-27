import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { SDKConfiguration } from '../types';

interface SDKConfigurationProps {
  className?: string;
}

export const SDKConfigurationManager: React.FC<SDKConfigurationProps> = ({ className = '' }) => {
  const [configurations, setConfigurations] = useState<SDKConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SDKConfiguration | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSDKConfigurations();
      if (response.success && response.data) {
        setConfigurations(response.data);
      }
    } catch (err) {
      setError('Failed to load SDK configurations');
      console.error('SDK config error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = () => {
    setSelectedConfig({
      id: '',
      name: '',
      apiKey: '',
      environment: 'development',
      settings: {
        enableAnalytics: true,
        enableTargeting: true,
        privacyCompliance: {
          gdpr: true,
          ccpa: true,
          coppa: false,
        },
        adFormats: {
          banner: true,
          interstitial: true,
          native: true,
        },
        targeting: {
          contextual: true,
          behavioral: true,
          demographic: true,
        },
      },
      domains: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditConfig = (config: SDKConfiguration) => {
    setSelectedConfig(config);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedConfig) return;

    try {
      setError(null);
      let response;
      
      if (isCreating) {
        response = await apiClient.createSDKConfiguration(selectedConfig);
      } else {
        response = await apiClient.updateSDKConfiguration(selectedConfig.id, selectedConfig);
      }

      if (response.success && response.data) {
        await loadConfigurations();
        setIsEditing(false);
        setSelectedConfig(null);
      }
    } catch (err) {
      setError('Failed to save configuration');
      console.error('Save config error:', err);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      setError(null);
      const response = await apiClient.deleteSDKConfiguration(id);
      if (response.success) {
        await loadConfigurations();
        if (selectedConfig?.id === id) {
          setSelectedConfig(null);
          setIsEditing(false);
        }
      }
    } catch (err) {
      setError('Failed to delete configuration');
      console.error('Delete config error:', err);
    }
  };

  const updateSelectedConfig = (updates: Partial<SDKConfiguration>) => {
    if (selectedConfig) {
      setSelectedConfig({ ...selectedConfig, ...updates });
    }
  };

  const updateSettings = (settingsUpdates: Partial<SDKConfiguration['settings']>) => {
    if (selectedConfig) {
      setSelectedConfig({
        ...selectedConfig,
        settings: { ...selectedConfig.settings, ...settingsUpdates },
      });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">SDK Configuration</h1>
        <button
          onClick={handleCreateConfig}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Configuration
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Configurations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {configurations.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedConfig?.id === config.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''
                  }`}
                  onClick={() => handleEditConfig(config)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{config.name}</h3>
                      <p className="text-sm text-gray-500">{config.environment}</p>
                      <p className="text-xs text-gray-400">
                        {config.domains.length} domain{config.domains.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConfig(config.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {configurations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No configurations found. Create your first one!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="lg:col-span-2">
          {selectedConfig ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'Create Configuration' : 'Edit Configuration'}
                </h2>
                <div className="space-x-2">
                  {isEditing && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedConfig(null);
                        }}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveConfig}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Configuration Name
                      </label>
                      <input
                        type="text"
                        value={selectedConfig.name}
                        onChange={(e) => updateSelectedConfig({ name: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Environment
                      </label>
                      <select
                        value={selectedConfig.environment}
                        onChange={(e) => updateSelectedConfig({ environment: e.target.value as any })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={selectedConfig.apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedConfig.apiKey);
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Domains */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allowed Domains
                  </label>
                  <div className="space-y-2">
                    {selectedConfig.domains.map((domain, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => {
                            const newDomains = [...selectedConfig.domains];
                            newDomains[index] = e.target.value;
                            updateSelectedConfig({ domains: newDomains });
                          }}
                          disabled={!isEditing}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                        {isEditing && (
                          <button
                            onClick={() => {
                              const newDomains = selectedConfig.domains.filter((_, i) => i !== index);
                              updateSelectedConfig({ domains: newDomains });
                            }}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        onClick={() => {
                          updateSelectedConfig({ domains: [...selectedConfig.domains, ''] });
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Domain
                      </button>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
                  
                  {/* General Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableAnalytics"
                        checked={selectedConfig.settings.enableAnalytics}
                        onChange={(e) => updateSettings({ enableAnalytics: e.target.checked })}
                        disabled={!isEditing}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableAnalytics" className="ml-2 text-sm text-gray-700">
                        Enable Analytics
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTargeting"
                        checked={selectedConfig.settings.enableTargeting}
                        onChange={(e) => updateSettings({ enableTargeting: e.target.checked })}
                        disabled={!isEditing}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableTargeting" className="ml-2 text-sm text-gray-700">
                        Enable Targeting
                      </label>
                    </div>
                  </div>

                  {/* Privacy Compliance */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Privacy Compliance</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedConfig.settings.privacyCompliance).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={key}
                            checked={value}
                            onChange={(e) => updateSettings({
                              privacyCompliance: {
                                ...selectedConfig.settings.privacyCompliance,
                                [key]: e.target.checked,
                              },
                            })}
                            disabled={!isEditing}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={key} className="ml-2 text-sm text-gray-700 capitalize">
                            {key.toUpperCase()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ad Formats */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Ad Formats</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedConfig.settings.adFormats).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`format-${key}`}
                            checked={value}
                            onChange={(e) => updateSettings({
                              adFormats: {
                                ...selectedConfig.settings.adFormats,
                                [key]: e.target.checked,
                              },
                            })}
                            disabled={!isEditing}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`format-${key}`} className="ml-2 text-sm text-gray-700 capitalize">
                            {key}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">
                <p className="text-lg mb-2">No configuration selected</p>
                <p className="text-sm">Select a configuration from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SDKConfigurationManager;