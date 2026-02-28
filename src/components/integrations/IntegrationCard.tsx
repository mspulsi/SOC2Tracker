'use client';

import { Integration, IntegrationStatus } from '@/types/integrations';
import IntegrationIcon from './IntegrationIcon';

interface IntegrationCardProps {
  integration: Integration;
  isRecommended?: boolean;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}

const statusConfig: Record<IntegrationStatus, { label: string; color: string; bgColor: string }> = {
  not_connected: { label: 'Not Connected', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  connecting: { label: 'Connecting...', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  connected: { label: 'Connected', color: 'text-green-600', bgColor: 'bg-green-50' },
  error: { label: 'Error', color: 'text-red-600', bgColor: 'bg-red-50' },
};

export default function IntegrationCard({
  integration,
  isRecommended,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  const status = statusConfig[integration.status];

  return (
    <div
      className={`relative bg-white rounded-xl border p-5 transition-all hover:shadow-md ${
        integration.status === 'connected'
          ? 'border-green-200'
          : integration.status === 'error'
          ? 'border-red-200'
          : 'border-gray-200'
      }`}
    >
      {isRecommended && integration.status === 'not_connected' && (
        <div className="absolute -top-2 -right-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Recommended
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
          <IntegrationIcon icon={integration.icon} className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
              {integration.status === 'connecting' && (
                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {integration.status === 'connected' && (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {status.label}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{integration.description}</p>

          {integration.status === 'error' && integration.errorMessage && (
            <p className="text-sm text-red-600 mb-3">{integration.errorMessage}</p>
          )}

          {integration.status === 'connected' && integration.lastSync && (
            <p className="text-xs text-gray-500 mb-3">
              Last synced: {new Date(integration.lastSync).toLocaleString()}
            </p>
          )}

          <div className="flex items-center gap-3">
            {integration.status === 'not_connected' || integration.status === 'error' ? (
              <button
                onClick={() => onConnect(integration.id)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect
              </button>
            ) : integration.status === 'connected' ? (
              <>
                <button
                  onClick={() => onConnect(integration.id)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Re-sync
                </button>
                <button
                  onClick={() => onDisconnect(integration.id)}
                  className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : null}

            {integration.docsUrl && (
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Docs →
              </a>
            )}
          </div>
        </div>
      </div>

      {integration.requiredScopes && integration.requiredScopes.length > 0 && integration.status === 'not_connected' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Required permissions:</p>
          <div className="flex flex-wrap gap-1">
            {integration.requiredScopes.map((scope) => (
              <span
                key={scope}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono"
              >
                {scope}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
