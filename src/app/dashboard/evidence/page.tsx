'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRoadmap } from '@/lib/use-roadmap';
import { EvidenceItem } from '@/types/roadmap';

type Category = EvidenceItem['category'] | 'all';

const CATEGORY_LABELS: Record<EvidenceItem['category'], string> = {
  access: 'Access',
  change: 'Change',
  monitoring: 'Monitoring',
  training: 'Training',
  vendor: 'Vendor',
  backup: 'Backup',
  policy: 'Policy',
};

export default function EvidencePage() {
  const { roadmap, loading } = useRoadmap();
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }
  if (!roadmap) {
    return <div className="p-8 text-center text-gray-500">No assessment found. <Link href="/intake" className="text-blue-600 underline">Start assessment</Link></div>;
  }

  // Build available categories from actual evidence items
  const availableCategories = Array.from(new Set(roadmap.evidence.map(e => e.category)));

  const filtered = activeCategory === 'all'
    ? roadmap.evidence
    : roadmap.evidence.filter(e => e.category === activeCategory);

  const haveCount = filtered.filter(e => e.alreadyHave).length;
  const needCount = filtered.filter(e => !e.alreadyHave).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Evidence</h1>
        <p className="text-gray-500 text-sm mt-1">
          {roadmap.evidence.filter(e => e.alreadyHave).length} of {roadmap.evidence.length} items already being collected
          {roadmap.scope.type === 'type2' && (
            <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Type 2: 90-day windows must start now
            </span>
          )}
        </p>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          All ({roadmap.evidence.length})
        </button>
        {availableCategories.map(cat => {
          const count = roadmap.evidence.filter(e => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-5">
        <div className="text-xs text-gray-500">
          <span className="font-semibold text-green-600">{haveCount}</span> already collecting
        </div>
        <div className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{needCount}</span> still needed
        </div>
      </div>

      {/* Evidence list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No evidence items in this category</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(item => (
              <li key={item.id} className="px-6 py-5">
                <div className="flex items-start gap-4">
                  {/* Status dot */}
                  <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.alreadyHave ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {item.alreadyHave ? (
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      {item.daysRequired > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                          {item.daysRequired}-day window
                        </span>
                      )}
                      {item.alreadyHave ? (
                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                          Already collecting
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          Not yet
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full capitalize ml-auto">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 mb-3">{item.description}</p>

                    {/* How to collect */}
                    <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">How to collect: </span>
                      {item.collectionMethod}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
