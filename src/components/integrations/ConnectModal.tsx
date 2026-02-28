'use client';

import { useState, useEffect } from 'react';
import { Integration } from '@/types/integrations';
import { api } from '@/lib/api';
import IntegrationIcon from './IntegrationIcon';

interface ConnectModalProps {
  integration: Integration;
  onClose: () => void;
  onConnect: (credentials: Record<string, string>) => void;
}

interface ConnectionField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
  help_text?: string;
  required: boolean;
}

const fallbackConfigs: Record<string, { fields: ConnectionField[] }> = {
  aws: {
    fields: [
      { key: 'role_arn', label: 'IAM Role ARN', type: 'text', placeholder: 'arn:aws:iam::123456789012:role/SOC2TrackerRole', help_text: 'Create a cross-account IAM role with SecurityAudit policy', required: true },
      { key: 'external_id', label: 'External ID', type: 'text', placeholder: 'soc2-tracker-external-id', required: true },
    ],
  },
  gcp: {
    fields: [
      { key: 'service_account_json', label: 'Service Account JSON', type: 'textarea', placeholder: '{"type": "service_account", ...}', help_text: 'Paste the contents of your service account key file', required: true },
      { key: 'project_id', label: 'Project ID', type: 'text', placeholder: 'my-project-123', required: true },
    ],
  },
  azure: {
    fields: [
      { key: 'tenant_id', label: 'Tenant ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••', required: true },
    ],
  },
  github: {
    fields: [
      { key: 'access_token', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_xxxxxxxxxxxx', help_text: 'Create a token with repo and read:org scopes', required: true },
      { key: 'organization', label: 'Organization', type: 'text', placeholder: 'my-org', required: true },
    ],
  },
  okta: {
    fields: [
      { key: 'domain', label: 'Okta Domain', type: 'text', placeholder: 'your-domain.okta.com', required: true },
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: '00xxxxxxxxxxxxxxxxxx', required: true },
    ],
  },
  slack: {
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-xxxxxxxxxxxx', help_text: 'Create a Slack app and install it to your workspace', required: true },
    ],
  },
  default: {
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your API key', required: true },
    ],
  },
};

export default function ConnectModal({ integration, onClose, onConnect }: ConnectModalProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionFields, setConnectionFields] = useState<ConnectionField[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    async function fetchConnectionConfig() {
      setLoadingConfig(true);
      try {
        const response = await api.getIntegration(integration.id);
        if (response.data?.connection_config?.fields) {
          setConnectionFields(response.data.connection_config.fields);
        } else {
          // Use fallback config
          const fallback = fallbackConfigs[integration.id] || fallbackConfigs.default;
          setConnectionFields(fallback.fields);
        }
      } catch {
        // Use fallback config on error
        const fallback = fallbackConfigs[integration.id] || fallbackConfigs.default;
        setConnectionFields(fallback.fields);
      } finally {
        setLoadingConfig(false);
      }
    }

    fetchConnectionConfig();
  }, [integration.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    try {
      const response = await api.connectIntegration(integration.id, credentials);
      
      if (response.error) {
        setError(response.error.message);
        setIsConnecting(false);
        return;
      }

      onConnect(credentials);
    } catch (err) {
      setError('Failed to connect. Please check your credentials and try again.');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
              <IntegrationIcon icon={integration.icon} className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Connect {integration.name}</h2>
              <p className="text-sm text-gray-500">Enter your credentials to connect</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loadingConfig ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading configuration...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {connectionFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    />
                  )}
                  {field.help_text && (
                    <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
                  )}
                </div>
              ))}

              {integration.requiredScopes && integration.requiredScopes.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">Required Permissions</p>
                  <p className="text-sm text-amber-700">
                    Make sure your credentials have these permissions:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {integration.requiredScopes.map((scope) => (
                      <li key={scope} className="text-sm text-amber-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <code className="bg-amber-100 px-1 rounded">{scope}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </form>
          )}

          {integration.docsUrl && (
            <p className="mt-4 text-center text-sm text-gray-500">
              Need help?{' '}
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View setup documentation →
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
