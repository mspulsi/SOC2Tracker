'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import {
  Integration,
  IntegrationCategory,
  INTEGRATION_CATEGORIES,
} from '@/types/integrations';
import { api, IntegrationResponse } from '@/lib/api';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import ConnectModal from '@/components/integrations/ConnectModal';

type SettingsTab = 'account' | 'integrations';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Integrations state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory | 'all' | 'connected'>('connected');
  const [summary, setSummary] = useState({ total: 0, connected: 0, recommended: 0, recommended_connected: 0 });

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getIntegrations();
      if (response.error) {
        if (response.error.code === 'authentication_error') {
          router.push('/login');
          return;
        }
        setError(response.error.message);
        return;
      }
      if (response.data) {
        const mapped: Integration[] = response.data.integrations.map((int: IntegrationResponse) => ({
          id: int.id,
          name: int.name,
          description: int.description,
          category: int.category as IntegrationCategory,
          icon: int.id,
          status: int.status,
          lastSync: int.last_sync || undefined,
          errorMessage: int.error_message || undefined,
          requiredScopes: int.required_scopes,
        }));
        setIntegrations(mapped);
        setSummary(response.data.summary);
        setRecommendedIds(
          response.data.integrations
            .filter((int: IntegrationResponse) => int.is_recommended)
            .map((int: IntegrationResponse) => int.id)
        );
      }
    } catch {
      setError('Failed to load integrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchIntegrations();
    }
  }, [activeTab, fetchIntegrations]);

  const filteredIntegrations = useMemo(() => {
    if (activeCategory === 'connected') return integrations.filter((i) => i.status === 'connected' || i.status === 'error');
    if (activeCategory === 'all') return integrations;
    return integrations.filter((i) => i.category === activeCategory);
  }, [integrations, activeCategory]);

  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<IntegrationCategory, Integration[]>> = {};
    filteredIntegrations.forEach((int) => {
      if (!groups[int.category]) groups[int.category] = [];
      groups[int.category]!.push(int);
    });
    return groups;
  }, [filteredIntegrations]);

  const handleConnect = (id: string) => {
    const integration = integrations.find((i) => i.id === id);
    if (integration) setSelectedIntegration(integration);
  };

  const handleDisconnect = async (id: string) => {
    try {
      const response = await api.disconnectIntegration(id);
      if (response.error) { setError(response.error.message); return; }
      await fetchIntegrations();
    } catch {
      setError('Failed to disconnect integration.');
    }
  };

  const handleConnectionComplete = async (credentials: Record<string, string>) => {
    if (!selectedIntegration) return;
    try {
      const response = await api.connectIntegration(selectedIntegration.id, credentials);
      if (response.error) {
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === selectedIntegration.id
              ? { ...i, status: 'error' as const, errorMessage: response.error?.message }
              : i
          )
        );
        return;
      }
      await fetchIntegrations();
      setSelectedIntegration(null);
    } catch {
      setError('Failed to connect integration.');
    }
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'integrations', label: 'Integrations' },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id === 'integrations' && summary.connected > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                {summary.connected}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Account</h2>
          <p className="text-sm text-gray-500 mb-4">Sign out of your SOC2 Tracker account</p>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div>
          {/* Summary bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {summary.connected} of {summary.total} integrations connected
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summary.recommended_connected} of {summary.recommended} recommended connected
              </p>
            </div>
            <button
              onClick={() => { setActiveCategory('all'); }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Integration
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 flex-1 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Category filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('connected')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'connected'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Connected ({summary.connected})
            </button>
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All ({summary.total})
            </button>
            {(Object.keys(INTEGRATION_CATEGORIES) as IntegrationCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {INTEGRATION_CATEGORIES[cat].name}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {/* Integration list */}
          {!loading && (
            <>
              {filteredIntegrations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  {activeCategory === 'connected' ? (
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">No integrations connected</p>
                      <p className="text-gray-400 text-sm mt-1">Click &quot;Add Integration&quot; to connect your first service</p>
                    </>
                  ) : (
                    <p className="text-gray-500">No integrations found in this category</p>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {(activeCategory === 'connected' || activeCategory === 'all') ? (
                    (Object.keys(groupedByCategory) as IntegrationCategory[]).map((cat) => {
                      const items = groupedByCategory[cat];
                      if (!items || items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <div className="mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">{INTEGRATION_CATEGORIES[cat].name}</h3>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {items.map((integration) => (
                              <IntegrationCard
                                key={integration.id}
                                integration={integration}
                                isRecommended={recommendedIds.includes(integration.id)}
                                onConnect={handleConnect}
                                onDisconnect={handleDisconnect}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredIntegrations.map((integration) => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          isRecommended={recommendedIds.includes(integration.id)}
                          onConnect={handleConnect}
                          onDisconnect={handleDisconnect}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Connect / Edit modal */}
      {selectedIntegration && (
        <ConnectModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
          onConnect={handleConnectionComplete}
        />
      )}
    </div>
  );
}
