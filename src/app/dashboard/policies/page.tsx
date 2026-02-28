'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRoadmap } from '@/lib/use-roadmap';

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
        <p className="text-gray-500 text-sm mt-1">
          {inPlace.length} of {roadmap.policies.length} required policies in place —{' '}
          <span className="text-red-600 font-medium">{needed.length} still needed</span>
        </p>
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
    </div>
  );
}
