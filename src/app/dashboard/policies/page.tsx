'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRoadmap } from '@/lib/use-roadmap';
import { PolicyItem } from '@/types/roadmap';

// ─── Generate Policy Modal ────────────────────────────────────────────────────
function GeneratePolicyModal({
  policies,
  onClose,
}: {
  policies: PolicyItem[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return policies.filter(p => p.name.toLowerCase().includes(q));
  }, [policies, search]);

  const selectedPolicy = policies.find(p => p.id === selected);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Generate Policy Draft</h2>
            <p className="text-sm text-gray-400 mt-0.5">Select a policy to generate a starter template</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search policies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Policy list */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No policies match your search</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map(policy => {
                const isSelected = selected === policy.id;
                return (
                  <li key={policy.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(policy.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      {/* Radio circle */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-blue-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>

                      {/* Policy name */}
                      <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                        {policy.name}
                      </span>

                      {/* Status badge */}
                      {policy.exists ? (
                        <span className="shrink-0 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          In Place
                        </span>
                      ) : (
                        <span className="shrink-0 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          Missing
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          {selectedPolicy && (
            <p className="text-xs text-gray-400 mb-3 truncate">
              Selected: <span className="font-medium text-gray-600">{selectedPolicy.name}</span>
            </p>
          )}
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!selected}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                selected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Generate Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, count, colorClass, children, defaultOpen = true }: {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${colorClass}`}>{title}</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${colorClass === 'text-red-700' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {count}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PoliciesPage() {
  const { roadmap, loading } = useRoadmap();
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }
  if (!roadmap) {
    return <div className="p-8 text-center text-gray-500">No assessment found. <Link href="/intake" className="text-blue-600 underline">Start assessment</Link></div>;
  }

  const needed = roadmap.policies.filter(p => !p.exists && p.required);
  const inPlace = roadmap.policies.filter(p => p.exists);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
          <p className="text-gray-500 text-sm mt-1">
            {inPlace.length} of {roadmap.policies.length} required policies in place —{' '}
            <span className="text-red-600 font-medium">{needed.length} still needed</span>
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Generate Policy
        </button>
      </div>

      <div className="space-y-5">
        {/* Needed accordion */}
        <Accordion title="Policies Needed" count={needed.length} colorClass="text-red-700" defaultOpen={true}>
          {needed.length === 0 ? (
            <div className="px-6 py-8 text-center text-green-600 text-sm font-medium">
              All required policies are in place
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {needed.map(policy => (
                <li key={policy.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* X icon */}
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{policy.name}</p>
                      {policy.conditional && (
                        <p className="text-xs text-blue-600 mt-0.5 font-medium">{policy.conditional}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Write this policy and have it approved by management before your audit begins.
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                      Missing
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Accordion>

        {/* In Place accordion */}
        <Accordion title="Policies In Place" count={inPlace.length} colorClass="text-green-700" defaultOpen={true}>
          {inPlace.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No policies confirmed as in-place yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {inPlace.map(policy => (
                <li key={policy.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* Check icon */}
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{policy.name}</p>
                      {policy.conditional && (
                        <p className="text-xs text-blue-600 mt-0.5">{policy.conditional}</p>
                      )}
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                      In Place
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Accordion>
      </div>

      {showGenerateModal && (
        <GeneratePolicyModal
          policies={roadmap.policies}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}
