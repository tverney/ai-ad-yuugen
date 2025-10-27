import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { apiClient } from '../services/api';
import { AdInventory } from '../types';

interface InventoryManagerProps {
  className?: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ className = '' }) => {
  const [inventory, setInventory] = useState<AdInventory[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdInventory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'banner' | 'interstitial' | 'native'>('all');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAdInventory();
      if (response.success && response.data) {
        setInventory(response.data);
      }
    } catch (err) {
      setError('Failed to load ad inventory');
      console.error('Inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = () => {
    setSelectedAd({
      id: '',
      name: '',
      type: 'banner',
      status: 'pending_review',
      content: {
        title: '',
        description: '',
        ctaText: '',
        landingUrl: '',
      },
      targeting: {
        keywords: [],
        categories: [],
        aiContexts: [],
      },
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpm: 0,
        revenue: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditAd = (ad: AdInventory) => {
    setSelectedAd(ad);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSaveAd = async () => {
    if (!selectedAd) return;

    try {
      setError(null);
      let response;
      
      if (isCreating) {
        response = await apiClient.createAdInventoryItem(selectedAd);
      } else {
        response = await apiClient.updateAdInventoryItem(selectedAd.id, selectedAd);
      }

      if (response.success && response.data) {
        await loadInventory();
        setIsEditing(false);
        setSelectedAd(null);
      }
    } catch (err) {
      setError('Failed to save ad');
      console.error('Save ad error:', err);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      setError(null);
      const response = await apiClient.deleteAdInventoryItem(id);
      if (response.success) {
        await loadInventory();
        if (selectedAd?.id === id) {
          setSelectedAd(null);
          setIsEditing(false);
        }
      }
    } catch (err) {
      setError('Failed to delete ad');
      console.error('Delete ad error:', err);
    }
  };

  const updateSelectedAd = (updates: Partial<AdInventory>) => {
    if (selectedAd) {
      setSelectedAd({ ...selectedAd, ...updates });
    }
  };

  const updateContent = (contentUpdates: Partial<AdInventory['content']>) => {
    if (selectedAd) {
      setSelectedAd({
        ...selectedAd,
        content: { ...selectedAd.content, ...contentUpdates },
      });
    }
  };

  const updateTargeting = (targetingUpdates: Partial<AdInventory['targeting']>) => {
    if (selectedAd) {
      setSelectedAd({
        ...selectedAd,
        targeting: { ...selectedAd.targeting, ...targetingUpdates },
      });
    }
  };

  const getStatusColor = (status: AdInventory['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: AdInventory['type']) => {
    switch (type) {
      case 'banner':
        return 'bg-blue-100 text-blue-800';
      case 'interstitial':
        return 'bg-purple-100 text-purple-800';
      case 'native':
        return 'bg-green-100 text-green-800';
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const filteredInventory = filter === 'all' 
    ? inventory 
    : inventory.filter(ad => ad.type === filter);

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
        <h1 className="text-2xl font-bold text-gray-900">Ad Inventory Management</h1>
        <button
          onClick={handleCreateAd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Ad
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['all', 'banner', 'interstitial', 'native'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === type
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {type === 'all' ? 'All Ads' : `${type.charAt(0).toUpperCase() + type.slice(1)} Ads`}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {type === 'all' ? inventory.length : inventory.filter(ad => ad.type === type).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ad List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {filter === 'all' ? 'All Ads' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Ads`}
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredInventory.map((ad) => (
                <div
                  key={ad.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedAd?.id === ad.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''
                  }`}
                  onClick={() => handleEditAd(ad)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{ad.name}</h3>
                    <div className="flex space-x-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(ad.type)}`}>
                        {ad.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ad.status)}`}>
                        {ad.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="truncate">{ad.content.title}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>CTR: {(ad.performance.ctr * 100).toFixed(2)}%</div>
                      <div>Revenue: {formatCurrency(ad.performance.revenue)}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Created: {format(new Date(ad.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAd(ad.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredInventory.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No ads found. Create your first one!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ad Details */}
        <div className="lg:col-span-2">
          {selectedAd ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'Create Ad' : 'Edit Ad'}
                </h2>
                <div className="space-x-2">
                  {isEditing && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedAd(null);
                        }}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAd}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad Name
                      </label>
                      <input
                        type="text"
                        value={selectedAd.name}
                        onChange={(e) => updateSelectedAd({ name: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad Type
                      </label>
                      <select
                        value={selectedAd.type}
                        onChange={(e) => updateSelectedAd({ type: e.target.value as any })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="banner">Banner</option>
                        <option value="interstitial">Interstitial</option>
                        <option value="native">Native</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={selectedAd.status}
                        onChange={(e) => updateSelectedAd({ status: e.target.value as any })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="pending_review">Pending Review</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ad Content */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ad Content</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={selectedAd.content.title}
                        onChange={(e) => updateContent({ title: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="Enter ad title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={selectedAd.content.description}
                        onChange={(e) => updateContent({ description: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="Enter ad description"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Call-to-Action Text
                        </label>
                        <input
                          type="text"
                          value={selectedAd.content.ctaText}
                          onChange={(e) => updateContent({ ctaText: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="Learn More"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Landing URL
                        </label>
                        <input
                          type="url"
                          value={selectedAd.content.landingUrl}
                          onChange={(e) => updateContent({ landingUrl: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={selectedAd.content.imageUrl || ''}
                          onChange={(e) => updateContent({ imageUrl: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Video URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={selectedAd.content.videoUrl || ''}
                          onChange={(e) => updateContent({ videoUrl: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="https://example.com/video.mp4"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Targeting */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Targeting</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords (comma-separated)
                      </label>
                      <textarea
                        value={selectedAd.targeting.keywords.join(', ')}
                        onChange={(e) => updateTargeting({
                          keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k),
                        })}
                        disabled={!isEditing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="ai, machine learning, automation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categories (comma-separated)
                      </label>
                      <textarea
                        value={selectedAd.targeting.categories.join(', ')}
                        onChange={(e) => updateTargeting({
                          categories: e.target.value.split(',').map(c => c.trim()).filter(c => c),
                        })}
                        disabled={!isEditing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="technology, software, business"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI Contexts (comma-separated)
                      </label>
                      <textarea
                        value={selectedAd.targeting.aiContexts.join(', ')}
                        onChange={(e) => updateTargeting({
                          aiContexts: e.target.value.split(',').map(c => c.trim()).filter(c => c),
                        })}
                        disabled={!isEditing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="coding assistance, creative writing, data analysis"
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Metrics (Read-only) */}
                {!isCreating && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600">Impressions</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatNumber(selectedAd.performance.impressions)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600">Clicks</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatNumber(selectedAd.performance.clicks)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600">CTR</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {(selectedAd.performance.ctr * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600">CPM</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(selectedAd.performance.cpm)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600">Revenue</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(selectedAd.performance.revenue)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600">Conversions</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatNumber(selectedAd.performance.conversions)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">
                <p className="text-lg mb-2">No ad selected</p>
                <p className="text-sm">Select an ad from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;