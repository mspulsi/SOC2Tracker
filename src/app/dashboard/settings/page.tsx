'use client';

import { logout } from '@/lib/auth';

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Account</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out of your SOC2 Tracker account</p>
        <button
          onClick={() => logout()}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
