'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Integration,
  IntegrationCategory,
  INTEGRATION_CATEGORIES,
} from '@/types/integrations';
import { api, IntegrationResponse } from '@/lib/api';
import { checkAuth } from '@/lib/auth';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import ConnectModal from '@/components/integrations/ConnectModal';

export default function IntegrationsSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory | 'all' | 'recommended'>('recommended');
  const [companyName, setCompanyName] = useState<string>('');
  const [summary, setSummary] = useState({
    total: 0,
    connected: 0,
    recommended: 0,
    recommended_connected: 0,
  });

  // Check authentication on mount
  useEffect(() => {
    checkAuth().then(({ isAuthenticated, hasIntake }) => {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!hasIntake) {
        router.push('/intake');
      }
    });
  }, [router]);

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
        const mappedIntegrations: Integration[] = response.data.integrations.map((int: IntegrationResponse) => ({
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

        setIntegrations(mappedIntegrations);
        setSummary(response.data.summary);
        
        const recommended = response.data.integrations
          .filter((int: IntegrationResponse) => int.is_recommended)
          .map((int: IntegrationResponse) => int.id);
        setRecommendedIds(recommended);
      }
    } catch (err) {
      setError('Failed to load integrations. Please try again.');
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
    
    // Get company name from stored intake data
    const storedIntake = localStorage.getItem('soc2-intake-data');
    if (storedIntake) {
      try {
        const data = JSON.parse(storedIntake);
        setCompanyName(data.companyInfo?.companyName || '');
      } catch {
        // Ignore parse errors
      }
    }
  }, [fetchIntegrations]);

  const filteredIntegrations = useMemo(() => {
    if (activeCategory === 'recommended') {
      return integrations.filter((int) => recommendedIds.includes(int.id));
    }
    if (activeCategory === 'all') {
      return integrations;
    }
    return integrations.filter((int) => int.category === activeCategory);
  }, [integrations, activeCategory, recommendedIds]);

  const groupedIntegrations = useMemo(() => {
    const groups: Record<IntegrationCategory, Integration[]> = {
      cloud_provider: [],
      identity_provider: [],
      source_control: [],
      ci_cd: [],
      monitoring: [],
      database: [],
      communication: [],
      hr_system: [],
    };

    filteredIntegrations.forEach((int) => {
      if (groups[int.category]) {
        groups[int.category].push(int);
      }
    });

    return groups;
  }, [filteredIntegrations]);

  const handleConnect = (id: string) => {
    const integration = integrations.find((int) => int.id === id);
    if (integration) {
      setSelectedIntegration(integration);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      const response = await api.disconnectIntegration(id);
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      // Refresh integrations list
      await fetchIntegrations();
    } catch (err) {
      setError('Failed to disconnect integration.');
      console.error('Disconnect error:', err);
    }
  };

  const handleConnectionComplete = async (credentials: Record<string, string>) => {
    if (!selectedIntegration) return;

    try {
      const response = await api.connectIntegration(selectedIntegration.id, credentials);
      
      if (response.error) {
        // Update the integration with error status
        setIntegrations((prev) =>
          prev.map((int) =>
            int.id === selectedIntegration.id
              ? { ...int, status: 'error' as const, errorMessage: response.error?.message }
              : int
          )
        );
        return;
      }

      // Refresh integrations list to get updated status
      await fetchIntegrations();
      setSelectedIntegration(null);
    } catch (err) {
      setError('Failed to connect integration.');
      console.error('Connection error:', err);
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error && integrations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Integrations</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={fetchIntegrations}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/intake"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Back to Intake
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Connect Your Services</h1>
                {companyName && <p className="text-sm text-gray-500">{companyName}</p>}
              </div>
            </div>
            <button
              onClick={handleContinue}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Continue to Dashboard →
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Progress Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Integration Progress</h2>
                <p className="text-sm text-gray-500">
                  Connect your services to enable automated compliance checks
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {summary.recommended_connected} / {summary.recommended}
                </p>
                <p className="text-sm text-gray-500">recommended connected</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${summary.recommended > 0 ? (summary.recommended_connected / summary.recommended) * 100 : 0}%`,
                }}
              />
            </div>
            {summary.recommended_connected === 0 && (
              <p className="mt-4 text-sm text-amber-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Connect at least one integration to enable compliance scanning
              </p>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory('recommended')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'recommended'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Recommended ({recommendedIds.length})
            </button>
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Integrations
            </button>
            {(Object.keys(INTEGRATION_CATEGORIES) as IntegrationCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {INTEGRATION_CATEGORIES[category].name}
              </button>
            ))}
          </div>

          {/* Integrations List */}
          {activeCategory === 'recommended' || activeCategory === 'all' ? (
            <div className="space-y-8">
              {(Object.keys(groupedIntegrations) as IntegrationCategory[]).map((category) => {
                const categoryIntegrations = groupedIntegrations[category];
                if (categoryIntegrations.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {INTEGRATION_CATEGORIES[category].name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {INTEGRATION_CATEGORIES[category].description}
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {categoryIntegrations.map((integration) => (
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
              })}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {INTEGRATION_CATEGORIES[activeCategory].name}
                </h3>
                <p className="text-sm text-gray-500">
                  {INTEGRATION_CATEGORIES[activeCategory].description}
                </p>
              </div>
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
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Why connect integrations?</h4>
                <p className="text-sm text-blue-800">
                  By connecting your services, we can automatically scan your infrastructure
                  for compliance gaps, verify security configurations, and provide specific
                  remediation steps. This turns manual evidence collection into automated
                  continuous monitoring.
                </p>
                <ul className="mt-3 space-y-1 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Automated compliance checks run continuously
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Evidence is collected automatically for auditors
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Get alerted when configurations drift out of compliance
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Skip Option */}
          <div className="mt-6 text-center">
            <button
              onClick={handleContinue}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip for now and connect later →
            </button>
          </div>
        </div>
      </main>

      {/* Connection Modal */}
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
