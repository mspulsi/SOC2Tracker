'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmap } from '@/lib/use-roadmap';
import { RiskLevel, Sprint, Task } from '@/types/roadmap';
import { Vendor } from '@/types/vendor';
import { checkAuth } from '@/lib/auth';

// ─── Relative time helper ─────────────────────────────────────────────────────
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Risk helpers ─────────────────────────────────────────────────────────────
function riskColors(level: RiskLevel) {
  return {
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
    high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
    medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
    low:      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  }[level];
}

// ─── Vendor summary hook ──────────────────────────────────────────────────────
function useVendorSummary() {
  const [summary, setSummary] = useState<{
    total: number; assessed: number; expiringSoon: number; criticalUnreviewed: number;
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('soc2-vendor-data');
    if (!stored) return;
    const vendors: Vendor[] = JSON.parse(stored);
    const today = Date.now();
    setSummary({
      total: vendors.length,
      assessed: vendors.filter(v => v.assessmentStatus === 'assessed').length,
      expiringSoon: vendors.filter(v => {
        if (!v.nextReviewDue) return false;
        const days = Math.ceil((new Date(v.nextReviewDue).getTime() - today) / 86400000);
        return days >= 0 && days <= 90;
      }).length,
      criticalUnreviewed: vendors.filter(v => v.riskTier === 'critical' && v.assessmentStatus === 'not-started').length,
    });
  }, []);

  return summary;
}

// ─── Calendar utilities ───────────────────────────────────────────────────────
const SPRINT_COLORS = [
  { light: 'bg-blue-50',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'    },
  { light: 'bg-violet-50',  text: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500'  },
  { light: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { light: 'bg-amber-50',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500'   },
  { light: 'bg-rose-50',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500'    },
  { light: 'bg-cyan-50',    text: 'text-cyan-700',    badge: 'bg-cyan-100 text-cyan-700',    dot: 'bg-cyan-500'    },
];

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-300',
};

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

function distributeTasksToDays(tasks: Task[], start: Date, end: Date): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  const workdays: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) workdays.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  if (!workdays.length) return map;
  tasks.forEach((t, i) => {
    const idx = Math.min(Math.floor((i * workdays.length) / tasks.length), workdays.length - 1);
    const key = workdays[idx].toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });
  return map;
}

// ─── Calendar types ───────────────────────────────────────────────────────────
interface SprintRange {
  sprint: Sprint;
  range: { start: Date; end: Date };
  color: typeof SPRINT_COLORS[number];
  taskDayMap: Map<string, Task[]>;
}

// ─── Month grid component ─────────────────────────────────────────────────────
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MonthCalendar({
  year, month, sprintRanges, completedTasks,
}: {
  year: number; month: number; sprintRanges: SprintRange[]; completedTasks: Set<string>;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function getDayInfo(date: Date): SprintRange | null {
    return sprintRanges.find(sr => date >= sr.range.start && date <= sr.range.end) ?? null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <p className="text-sm font-semibold text-gray-700">{monthLabel}</p>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 mb-0.5">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="min-h-[56px] rounded" />;
            const info = getDayInfo(date);
            const isToday = date.toDateString() === today.toDateString();
            const isFirstOfSprint = info && date.toDateString() === info.range.start.toDateString();
            const tasks = info?.taskDayMap.get(date.toDateString()) ?? [];
            const pending = tasks.filter(t => !completedTasks.has(t.id));
            const done = tasks.filter(t => completedTasks.has(t.id));

            return (
              <div
                key={i}
                className={`min-h-[56px] rounded-md p-1.5 transition-colors ${info ? info.color.light : 'hover:bg-gray-50'} ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Day number row */}
                <div className="flex items-center justify-between gap-0.5">
                  <span className={`text-[11px] font-semibold leading-none ${
                    isToday ? 'text-blue-600' : info ? info.color.text : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </span>
                  {isFirstOfSprint && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${info.color.badge}`}>
                      S{info.sprint.number}
                    </span>
                  )}
                </div>
                {/* Task bars */}
                {tasks.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {pending.slice(0, 2).map(t => (
                      <div
                        key={t.id}
                        title={t.title}
                        className={`h-1 rounded-full ${PRIORITY_DOT[t.priority]}`}
                      />
                    ))}
                    {done.slice(0, 1).map(t => (
                      <div
                        key={t.id}
                        title={`✓ ${t.title}`}
                        className="h-1 rounded-full bg-gray-300 opacity-40"
                      />
                    ))}
                    {tasks.length > 3 && (
                      <span className="text-[9px] text-gray-400 leading-none">+{tasks.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sprint calendar orchestrator ─────────────────────────────────────────────
function SprintCalendar({
  sprints, planStart, completedTasks,
}: {
  sprints: Sprint[]; planStart: Date; completedTasks: Set<string>;
}) {
  const sprintRanges: SprintRange[] = sprints
    .map((sprint, i) => {
      const range = getSprintRange(sprint, planStart);
      if (!range) return null;
      return {
        sprint,
        range,
        color: SPRINT_COLORS[i % SPRINT_COLORS.length],
        taskDayMap: distributeTasksToDays(sprint.tasks, range.start, range.end),
      };
    })
    .filter((sr): sr is SprintRange => sr !== null);

  if (!sprintRanges.length) return null;

  // Build month range to display
  const firstDate = sprintRanges[0].range.start;
  const lastDate = sprintRanges[sprintRanges.length - 1].range.end;
  const months: { year: number; month: number }[] = [];
  const cur = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  const endMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);
  while (cur < endMonth) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur.setMonth(cur.getMonth() + 1);
  }

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      {/* Sprint legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {sprintRanges.map(sr => (
          <div
            key={sr.sprint.number}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 ${sr.color.light}`}
          >
            <div className={`w-2 h-2 rounded-full ${sr.color.dot}`} />
            <span className={`text-xs font-semibold ${sr.color.text}`}>Sprint {sr.sprint.number}</span>
            <span className="text-xs text-gray-400">{fmt(sr.range.start)}–{fmt(sr.range.end)}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-500">{sr.sprint.tasks.length} tasks</span>
          </div>
        ))}
      </div>

      {/* Priority key */}
      <div className="flex items-center gap-4 mb-4 px-0.5">
        <span className="text-[11px] text-gray-400 font-medium">Priority:</span>
        {([['critical', 'bg-red-500'], ['high', 'bg-orange-400'], ['medium', 'bg-yellow-400'], ['low', 'bg-gray-300']] as const).map(([p, c]) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-1 rounded-full ${c}`} />
            <span className="text-[11px] text-gray-500 capitalize">{p}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-1 rounded-full bg-gray-300 opacity-40" />
          <span className="text-[11px] text-gray-500">done</span>
        </div>
      </div>

      {/* Month grid — 2 columns on wider screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {months.map(({ year, month }) => (
          <MonthCalendar
            key={`${year}-${month}`}
            year={year}
            month={month}
            sprintRanges={sprintRanges}
            completedTasks={completedTasks}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { intakeData, roadmap, loading, completedTasks } = useRoadmap();
  const vendorSummary = useVendorSummary();
  const [showMaturityModal, setShowMaturityModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [planStartDate, setPlanStartDate] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    checkAuth().then(({ isAuthenticated }) => {
      if (!isAuthenticated) router.replace('/login');
    });
    const stored = localStorage.getItem('soc2-sprint-plan-start');
    if (stored) setPlanStartDate(stored);
    const scan = localStorage.getItem('soc2-last-scan-time');
    if (scan) setLastScanTime(Number(scan));
  }, [router]);

  function runScan() {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      const now = Date.now();
      setLastScanTime(now);
      localStorage.setItem('soc2-last-scan-time', String(now));
      setIsScanning(false);
    }, 1800);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!intakeData || !roadmap) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-2">No assessment found</p>
          <p className="text-gray-500 text-sm mb-5">Complete the intake to generate your roadmap.</p>
          <Link href="/intake" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  const rc = riskColors(roadmap.riskLevel);
  const scoreBarColor = roadmap.maturityScore < 30 ? 'bg-red-500' : roadmap.maturityScore < 50 ? 'bg-orange-500' : roadmap.maturityScore < 70 ? 'bg-yellow-500' : 'bg-green-500';
  const scoreTextColor = roadmap.maturityScore < 30 ? 'text-red-600' : roadmap.maturityScore < 50 ? 'text-orange-600' : roadmap.maturityScore < 70 ? 'text-yellow-600' : 'text-green-600';

  const targetDate = intakeData.targetCompletionDate ? new Date(intakeData.targetCompletionDate) : null;
  const today = new Date();
  const daysRemaining = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="p-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Home</h1>
        <p className="text-gray-500 text-sm mt-1">SOC 2 compliance snapshot for {intakeData.companyInfo.companyName}</p>
      </div>

      {/* ── Compact metrics strip ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8 flex divide-x divide-gray-100 overflow-hidden">

        {/* Security Maturity */}
        <button
          type="button"
          onClick={() => setShowMaturityModal(true)}
          className="flex-1 min-w-0 px-5 py-4 text-left hover:bg-gray-50 transition-colors group"
        >
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Security Maturity</p>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-2xl font-bold ${scoreTextColor}`}>{roadmap.maturityScore}</span>
            <span className="text-gray-300 text-sm">/100</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ml-1 ${rc.badge}`}>
              {roadmap.riskLevel.charAt(0).toUpperCase() + roadmap.riskLevel.slice(1)} Risk
            </span>
            <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${scoreBarColor} rounded-full`} style={{ width: `${roadmap.maturityScore}%` }} />
          </div>
        </button>

        {/* Scope */}
        <div className="flex-1 min-w-0 px-5 py-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Scope</p>
          <p className="text-xl font-bold text-gray-900 mb-1.5">
            SOC 2 {intakeData.soc2Type === 'type1' ? 'Type 1' : 'Type 2'}
          </p>
          <div className="flex flex-wrap gap-1">
            {roadmap.scope.criteria.map(c => (
              <span key={c} className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium capitalize">
                {c.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Estimated Timeline */}
        <div className="flex-1 min-w-0 px-5 py-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Est. Timeline</p>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-2xl font-bold text-gray-900">{roadmap.recommendedTimeline}</span>
            <span className="text-gray-400 text-sm">weeks</span>
          </div>
          <p className="text-[11px] text-gray-400">{roadmap.sprints.length} sprints · to audit-ready</p>
        </div>

        {/* Target Date */}
        <div className="flex-1 min-w-0 px-5 py-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Target Date</p>
          {targetDate ? (
            <>
              <p className="text-xl font-bold text-gray-900 mb-1">
                {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className={`text-[11px] font-medium ${daysRemaining !== null && daysRemaining < 60 ? 'text-orange-600' : 'text-gray-400'}`}>
                {daysRemaining !== null && daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : daysRemaining !== null && daysRemaining <= 0
                  ? 'Past target date'
                  : ''}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-400 mb-1">Not set</p>
              <p className="text-[11px] text-gray-400">Set in your assessment</p>
            </>
          )}
        </div>

        {/* Integration Scan */}
        <div className="flex-1 min-w-0 px-5 py-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Integration Scan</p>
          <p className="text-xl font-bold text-gray-900 mb-1">
            {lastScanTime ? relativeTime(lastScanTime) : 'Never'}
          </p>
          <p className="text-[11px] text-gray-400 mb-3">
            {lastScanTime
              ? new Date(lastScanTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
              : 'No scan has been run'}
          </p>
          <button
            type="button"
            onClick={runScan}
            disabled={isScanning}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
              isScanning
                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <svg
              className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isScanning ? 'Scanning…' : 'Run Scan'}
          </button>
        </div>
      </div>

      {/* ── Sprint calendar ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">Sprint Calendar</h2>
          <Link href="/dashboard/sprints" className="text-xs text-blue-500 hover:text-blue-700 transition-colors">
            Manage sprints →
          </Link>
        </div>

        {planStartDate ? (
          <SprintCalendar
            sprints={roadmap.sprints}
            planStart={parseLocalDate(planStartDate)}
            completedTasks={completedTasks}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No sprint schedule set</p>
            <p className="text-xs text-gray-400 mb-5">
              Set a start date in the Sprints tab to see your tasks mapped onto the calendar.
            </p>
            <Link
              href="/dashboard/sprints"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Sprints
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* ── Vendor summary ─────────────────────────────────────────────────── */}
      <Link href="/dashboard/vendors" className="block bg-white rounded-xl border border-gray-200 p-5 mb-8 hover:border-blue-300 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">Vendors</p>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        {vendorSummary ? (
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-gray-900">{vendorSummary.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">total vendors</p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div>
              <p className="text-2xl font-bold text-green-600">{vendorSummary.assessed}</p>
              <p className="text-xs text-gray-400 mt-0.5">assessed</p>
            </div>
            {vendorSummary.expiringSoon > 0 && (
              <>
                <div className="h-8 w-px bg-gray-100" />
                <div>
                  <p className="text-2xl font-bold text-orange-500">{vendorSummary.expiringSoon}</p>
                  <p className="text-xs text-gray-400 mt-0.5">expiring soon</p>
                </div>
              </>
            )}
            {vendorSummary.criticalUnreviewed > 0 && (
              <>
                <div className="h-8 w-px bg-gray-100" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{vendorSummary.criticalUnreviewed}</p>
                  <p className="text-xs text-gray-400 mt-0.5">critical unreviewed</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-400">Set up vendor tracking → complete your assessment first</p>
        )}
      </Link>

      {/* ── Top risks ──────────────────────────────────────────────────────── */}
      {roadmap.risks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-4">Top Risks</h2>
          <div className="space-y-3">
            {roadmap.risks.map(risk => {
              const r = riskColors(risk.severity);
              return (
                <div key={risk.id} className={`rounded-xl border ${r.border} ${r.bg} p-5`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded ${r.badge} shrink-0`}>
                      {risk.severity.toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{risk.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                      <p className={`text-xs font-medium mt-2 ${r.text}`}>Fix: {risk.remediation}</p>
                    </div>
                    {risk.sprintReference && (
                      <span className="ml-auto text-xs text-gray-400 shrink-0">Sprint {risk.sprintReference}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Maturity drill-down modal ───────────────────────────────────────── */}
      {showMaturityModal && roadmap.scoreBreakdown && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowMaturityModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Security Maturity Breakdown</h2>
                <p className="text-sm text-gray-500 mt-0.5">Score: {roadmap.maturityScore}/100 · {roadmap.riskLevel} risk</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMaturityModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {roadmap.scoreBreakdown.map((cat) => {
                const pct = cat.maximum > 0 ? Math.round((cat.earned / cat.maximum) * 100) : 0;
                const isExpanded = expandedCategory === cat.category;
                const catColor = pct < 30 ? 'bg-red-500' : pct < 60 ? 'bg-orange-500' : pct < 80 ? 'bg-yellow-500' : 'bg-green-500';

                return (
                  <div key={cat.category} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">{cat.category}</span>
                        <span className="text-sm text-gray-500 font-medium">{cat.earned}/{cat.maximum}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${catColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-gray-400">{pct}% earned</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {cat.controls.map((ctrl) => (
                          <div key={ctrl.name} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ctrl.earned > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {ctrl.earned > 0
                                  ? <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  : <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                }
                              </span>
                              <span className="text-xs text-gray-700">{ctrl.name}</span>
                            </div>
                            <span className="text-xs text-gray-400">{ctrl.earned}/{ctrl.maximum}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-100">
              <Link
                href="/dashboard/overview"
                onClick={() => setShowMaturityModal(false)}
                className="block w-full text-center py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                See your gaps →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
