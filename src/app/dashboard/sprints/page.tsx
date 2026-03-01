'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRoadmap } from '@/lib/use-roadmap';
import { Sprint, Task } from '@/types/roadmap';

type SprintOverrides = Record<string, number>; // taskId → sprintNumber

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

const CATEGORY_ICON: Record<Task['category'], string> = {
  policy: '📄',
  technical: '⚙️',
  process: '🔄',
  evidence: '📋',
};

// ─── Date helpers (shared with home calendar) ─────────────────────────────────
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function parseSprintWeeks(weeks: string): { start: number; end: number } | null {
  const m = weeks.match(/(\d+)\s*[–\-]\s*(\d+)/);
  if (m) return { start: +m[1], end: +m[2] };
  const s = weeks.match(/(\d+)/);
  if (s) { const n = +s[1]; return { start: n, end: n }; }
  return null;
}

function getSprintRange(sprint: Sprint, planStart: Date) {
  const w = parseSprintWeeks(sprint.weeks);
  if (!w) return null;
  return { start: addDays(planStart, (w.start - 1) * 7), end: addDays(planStart, w.end * 7 - 1) };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
function enableSprintPlan() {
  const stored = localStorage.getItem('soc2-intake-data');
  if (!stored) return;
  const data = JSON.parse(stored);
  data.wantsSprintPlan = true;
  localStorage.setItem('soc2-intake-data', JSON.stringify(data));
  window.location.reload();
}

export default function SprintsPage() {
  const { roadmap, loading, completedTasks, toggleTask } = useRoadmap();
  const [overrides, setOverrides] = useState<SprintOverrides>({});
  const [planStartDate, setPlanStartDate] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('soc2-sprint-overrides');
    if (stored) setOverrides(JSON.parse(stored));
    const planStart = localStorage.getItem('soc2-sprint-plan-start');
    if (planStart) setPlanStartDate(planStart);
  }, []);

  function handleSetPlanStart(date: string) {
    setPlanStartDate(date);
    if (date) {
      localStorage.setItem('soc2-sprint-plan-start', date);
    } else {
      localStorage.removeItem('soc2-sprint-plan-start');
    }
  }

  function moveTask(taskId: string, toSprint: number) {
    const next = { ...overrides, [taskId]: toSprint };
    setOverrides(next);
    localStorage.setItem('soc2-sprint-overrides', JSON.stringify(next));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!roadmap) {
    return (
      <div className="p-8 text-center text-gray-500">
        No assessment found. <Link href="/intake" className="text-blue-600 underline">Start assessment</Link>
      </div>
    );
  }

  if (roadmap.sprints.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sprints</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Sprint Plan</h2>
          <p className="text-gray-500 text-sm mb-6">
            No sprints were generated for your roadmap.
          </p>
          <Link
            href="/intake"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-block"
          >
            Retake Assessment
          </Link>
        </div>
      </div>
    );
  }

  // Apply overrides: redistribute tasks across sprints
  type TaskWithSprint = Task & { originalSprint: number };
  const allTasks: TaskWithSprint[] = roadmap.sprints.flatMap(s =>
    s.tasks.map(t => ({ ...t, originalSprint: s.number }))
  );

  const sprintMap: Map<number, TaskWithSprint[]> = new Map(
    roadmap.sprints.map(s => [s.number, []])
  );
  for (const task of allTasks) {
    const effectiveSprint = overrides[task.id] ?? task.originalSprint;
    if (!sprintMap.has(effectiveSprint)) sprintMap.set(effectiveSprint, []);
    sprintMap.get(effectiveSprint)!.push(task);
  }

  const sprintNumbers = Array.from(sprintMap.keys()).sort((a, b) => a - b);
  const sprintMeta: Record<number, Sprint> = {};
  for (const s of roadmap.sprints) sprintMeta[s.number] = s;

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => completedTasks.has(t.id)).length;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sprints</h1>
          <p className="text-gray-500 text-sm mt-1">
            Week-by-week breakdown — {doneTasks}/{totalTasks} tasks complete.
            Move tasks between sprints using the dropdown on each row.
          </p>
        </div>
        {Object.keys(overrides).length > 0 && (
          <button
            onClick={() => {
              setOverrides({});
              localStorage.removeItem('soc2-sprint-overrides');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Reset to original schedule
          </button>
        )}
      </div>

      {/* ── Sprint plan start date ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-6 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700">Sprint Plan Start Date</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Anchors all sprints to real calendar dates — shown on the Home calendar.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <input
            type="date"
            value={planStartDate}
            onChange={e => handleSetPlanStart(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {planStartDate && (
            <button
              onClick={() => handleSetPlanStart('')}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Sprint cards ───────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {sprintNumbers.map(num => {
          const tasks = sprintMap.get(num) ?? [];
          const meta = sprintMeta[num];
          const done = tasks.filter(t => completedTasks.has(t.id)).length;
          const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

          // Calculate date range if plan start is set
          const dateRange = planStartDate && meta
            ? getSprintRange(meta, parseLocalDate(planStartDate))
            : null;

          return (
            <div key={num} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Sprint header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sprint {num}</span>
                    {meta && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{meta.weeks}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-sm font-semibold text-gray-700">{meta.name}</span>
                      </>
                    )}
                    {dateRange && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {fmtDate(dateRange.start)} – {fmtDate(dateRange.end)}
                        </span>
                      </>
                    )}
                  </div>
                  {meta && <p className="text-xs text-gray-400 mt-0.5">{meta.focus}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{done}/{tasks.length}</span>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              {tasks.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  No tasks scheduled for this sprint
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {tasks.map(task => {
                    const isDone = completedTasks.has(task.id);
                    const movedFrom = overrides[task.id] !== undefined && overrides[task.id] !== task.originalSprint;

                    return (
                      <li key={task.id} className={`px-5 py-3.5 flex items-center gap-3 ${isDone ? 'bg-gray-50' : ''}`}>
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isDone ? 'bg-green-600 border-green-600' : 'border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {isDone && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Category icon */}
                        <span className="text-sm shrink-0">{CATEGORY_ICON[task.category]}</span>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{task.controlReference}</span>
                            <span className="text-xs text-gray-400">~{task.effort}</span>
                            {movedFrom && (
                              <span className="text-xs text-blue-500 italic">moved</span>
                            )}
                          </div>
                        </div>

                        {/* Priority */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
                          {task.priority}
                        </span>

                        {/* Move dropdown */}
                        <select
                          value={overrides[task.id] ?? task.originalSprint}
                          onChange={e => moveTask(task.id, Number(e.target.value))}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                          title="Move to sprint"
                        >
                          {sprintNumbers.map(n => (
                            <option key={n} value={n}>Sprint {n}</option>
                          ))}
                        </select>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
