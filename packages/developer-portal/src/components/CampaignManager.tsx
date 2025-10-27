import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { apiClient } from '../services/api';
import { Campaign } from '../types';

interface CampaignManagerProps {
  className?: string;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ className = '' }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCampaigns();
      if (response.success && response.data) {
        setCampaigns(response.data);
      }
    } catch (err) {
      setError('Failed to load campaigns');
      console.error('Campaign error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    setSelectedCampaign({
      id: '',
      name: '',
      status: 'draft',
      budget: {
        total: 0,
        spent: 0,
        dailyLimit: 0,
      },
      targeting: {
        demographics: {},
        interests: [],
        keywords: [],
        aiContexts: [],
      },
      schedule: {
        startDate: new Date(),
        timezone: 'UTC',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSaveCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      setError(null);
      let response;
      
      if (isCreating) {
        response = await apiClient.createCampaign(selectedCampaign);
      } else {
        response = await apiClient.updateCampaign(selectedCampaign.id, selectedCampaign);
      }

      if (response.success && response.data) {
        await loadCampaigns();
        setIsEditing(false);
        setSelectedCampaign(null);
      }
    } catch (err) {
      setError('Failed to save campaign');
      console.error('Save campaign error:', err);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      setError(null);
      const response = await apiClient.deleteCampaign(id);
      if (response.success) {
        await loadCampaigns();
        if (selectedCampaign?.id === id) {
          setSelectedCampaign(null);
          setIsEditing(false);
        }
      }
    } catch (err) {
      setError('Failed to delete campaign');
      console.error('Delete campaign error:', err);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      setError(null);
      const response = await apiClient.pauseCampaign(id);
      if (response.success) {
        await loadCampaigns();
      }
    } catch (err) {
      setError('Failed to pause campaign');
      console.error('Pause campaign error:', err);
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      setError(null);
      const response = await apiClient.resumeCampaign(id);
      if (response.success) {
        await loadCampaigns();
      }
    } catch (err) {
      setError('Failed to resume campaign');
      console.error('Resume campaign error:', err);
    }
  };

  const updateSelectedCampaign = (updates: Partial<Campaign>) => {
    if (selectedCampaign) {
      setSelectedCampaign({ ...selectedCampaign, ...updates });
    }
  };

  const updateBudget = (budgetUpdates: Partial<Campaign['budget']>) => {
    if (selectedCampaign) {
      setSelectedCampaign({
        ...selectedCampaign,
        budget: { ...selectedCampaign.budget, ...budgetUpdates },
      });
    }
  };

  const updateTargeting = (targetingUpdates: Partial<Campaign['targeting']>) => {
    if (selectedCampaign) {
      setSelectedCampaign({
        ...selectedCampaign,
        targeting: { ...selectedCampaign.targeting, ...targetingUpdates },
      });
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
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
        <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
        <button
          onClick={handleCreateCampaign}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Campaign
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedCampaign?.id === campaign.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''
                  }`}
                  onClick={() => handleEditCampaign(campaign)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Budget: {formatCurrency(campaign.budget.total)}</div>
                    <div>Spent: {formatCurrency(campaign.budget.spent)}</div>
                    <div className="text-xs text-gray-400">
                      Created: {format(new Date(campaign.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    {campaign.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePauseCampaign(campaign.id);
                        }}
                        className="text-xs text-yellow-600 hover:text-yellow-800"
                      >
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResumeCampaign(campaign.id);
                        }}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCampaign(campaign.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No campaigns found. Create your first one!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="lg:col-span-2">
          {selectedCampaign ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'Create Campaign' : 'Edit Campaign'}
                </h2>
                <div className="space-x-2">
                  {isEditing && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedCampaign(null);
                        }}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCampaign}
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
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={selectedCampaign.name}
                        onChange={(e) => updateSelectedCampaign({ name: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={selectedCampaign.status}
                        onChange={(e) => updateSelectedCampaign({ status: e.target.value as any })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Budget</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Budget ($)
                      </label>
                      <input
                        type="number"
                        value={selectedCampaign.budget.total}
                        onChange={(e) => updateBudget({ total: parseFloat(e.target.value) || 0 })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Limit ($)
                      </label>
                      <input
                        type="number"
                        value={selectedCampaign.budget.dailyLimit}
                        onChange={(e) => updateBudget({ dailyLimit: parseFloat(e.target.value) || 0 })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spent ($)
                      </label>
                      <input
                        type="number"
                        value={selectedCampaign.budget.spent}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={format(new Date(selectedCampaign.schedule.startDate), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => updateSelectedCampaign({
                          schedule: {
                            ...selectedCampaign.schedule,
                            startDate: new Date(e.target.value),
                          },
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={selectedCampaign.schedule.endDate ? 
                          format(new Date(selectedCampaign.schedule.endDate), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => updateSelectedCampaign({
                          schedule: {
                            ...selectedCampaign.schedule,
                            endDate: e.target.value ? new Date(e.target.value) : undefined,
                          },
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                      </label>
                      <select
                        value={selectedCampaign.schedule.timezone}
                        onChange={(e) => updateSelectedCampaign({
                          schedule: {
                            ...selectedCampaign.schedule,
                            timezone: e.target.value,
                          },
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Targeting */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Targeting</h3>
                  
                  {/* Keywords */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (comma-separated)
                    </label>
                    <textarea
                      value={selectedCampaign.targeting.keywords.join(', ')}
                      onChange={(e) => updateTargeting({
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k),
                      })}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="ai, machine learning, chatbot, automation"
                    />
                  </div>

                  {/* Interests */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interests (comma-separated)
                    </label>
                    <textarea
                      value={selectedCampaign.targeting.interests.join(', ')}
                      onChange={(e) => updateTargeting({
                        interests: e.target.value.split(',').map(i => i.trim()).filter(i => i),
                      })}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="technology, software development, artificial intelligence"
                    />
                  </div>

                  {/* AI Contexts */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI Contexts (comma-separated)
                    </label>
                    <textarea
                      value={selectedCampaign.targeting.aiContexts.join(', ')}
                      onChange={(e) => updateTargeting({
                        aiContexts: e.target.value.split(',').map(c => c.trim()).filter(c => c),
                      })}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="coding assistance, creative writing, data analysis"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">
                <p className="text-lg mb-2">No campaign selected</p>
                <p className="text-sm">Select a campaign from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignManager;