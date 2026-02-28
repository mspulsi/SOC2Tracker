'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRoadmap } from '@/lib/use-roadmap';
import { Task } from '@/types/roadmap';

type Filter = 'all' | 'critical' | 'high' | 'completed';
type Sort = 'priority' | 'sprint' | 'completed';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const CATEGORY_ICON: Record<Task['category'], string> = {
  policy: '📄',
  technical: '⚙️',
  process: '🔄',
  evidence: '📋',
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function ControlsPage() {
  const { roadmap, loading, completedTasks, toggleTask } = useRoadmap();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('priority');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }
  if (!roadmap) {
    return <div className="p-8 text-center text-gray-500">No assessment found. <Link href="/intake" className="text-blue-600 underline">Start assessment</Link></div>;
  }

  // Flatten all tasks with sprint number attached
  const allTasks = roadmap.sprints.flatMap(s =>
    s.tasks.map(t => ({ ...t, sprintNum: s.number, completedAt: completedTasks.has(t.id) ? Date.now() : null }))
  );

  // Filter
  const filtered = allTasks.filter(t => {
    if (filter === 'completed') return completedTasks.has(t.id);
    if (filter === 'critical') return t.priority === 'critical' && !completedTasks.has(t.id);
    if (filter === 'high') return t.priority === 'high' && !completedTasks.has(t.id);
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sort === 'sprint') return a.sprintNum - b.sprintNum;
    if (sort === 'completed') {
      const aD = completedTasks.has(a.id) ? 1 : 0;
      const bD = completedTasks.has(b.id) ? 1 : 0;
      return bD - aD;
    }
    return 0;
  });

  const completedCount = allTasks.filter(t => completedTasks.has(t.id)).length;
  const critCount = allTasks.filter(t => t.priority === 'critical' && !completedTasks.has(t.id)).length;
  const highCount = allTasks.filter(t => t.priority === 'high' && !completedTasks.has(t.id)).length;

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allTasks.length },
    { key: 'critical', label: 'Critical', count: critCount },
    { key: 'high', label: 'High', count: highCount },
    { key: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Controls</h1>
        <p className="text-gray-500 text-sm mt-1">
          All {allTasks.length} controls specific to your company — {completedCount} completed
        </p>
      </div>

      {/* Filter bar + sort */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 text-xs ${filter === f.key ? 'text-gray-500' : 'text-gray-400'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Sort by</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as Sort)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Priority</option>
            <option value="sprint">Sprint</option>
            <option value="completed">Recently Completed</option>
          </select>
        </div>
      </div>

      {/* Controls list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No controls match this filter</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map(task => {
              const done = completedTasks.has(task.id);
              const expanded = expandedId === task.id;

              return (
                <li key={task.id} className={`transition-colors ${done ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}>
                  <div className="px-5 py-4 flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        done ? 'bg-green-600 border-green-600' : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {done && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{CATEGORY_ICON[task.category]}</span>
                        <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{task.controlReference}</span>
                        <span>Sprint {task.sprintNum}</span>
                        <span>~{task.effort}</span>
                        <span className="capitalize">{task.category}</span>
                      </div>

                      {/* Expandable why */}
                      {expanded && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-gray-600">{task.description}</p>
                          <div className="text-xs text-blue-700 bg-blue-50 rounded px-3 py-2">
                            💡 {task.why}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : task.id)}
                      className="shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
