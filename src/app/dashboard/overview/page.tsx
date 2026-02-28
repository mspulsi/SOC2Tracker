'use client';

import Link from 'next/link';
import { useRoadmap } from '@/lib/use-roadmap';
import { RiskLevel } from '@/types/roadmap';

function riskBadge(level: RiskLevel) {
  const styles: Record<RiskLevel, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };
  return styles[level];
}

export default function OverviewPage() {
  const { intakeData, roadmap, loading, completedTasks } = useRoadmap();

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }
  if (!intakeData || !roadmap) {
    return <div className="p-8 text-center text-gray-500">No assessment found. <Link href="/intake" className="text-blue-600 underline">Start assessment</Link></div>;
  }

  const allTasks = roadmap.sprints.flatMap(s => s.tasks.map(t => ({ ...t, sprint: s.number })));
  const urgentTasks = allTasks.filter(t => (t.priority === 'critical' || t.priority === 'high') && !completedTasks.has(t.id));
  const missingPolicies = roadmap.policies.filter(p => !p.exists && p.required);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Your compliance scope, sprint plan, and immediate action items</p>
      </div>

      {/* Scope */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-4">Scope</h2>
        <p className="text-sm text-gray-600 mb-4">{roadmap.scope.justification}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {roadmap.scope.criteria.map(c => (
            <span key={c} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium capitalize">
              {c.replace('_', ' ')}
            </span>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
          <span><span className="font-medium text-gray-700">Type:</span> SOC 2 {intakeData.soc2Type === 'type1' ? 'Type 1' : 'Type 2'}</span>
          <span><span className="font-medium text-gray-700">Est. audit cost:</span> {roadmap.scope.estimatedAuditCost}</span>
          <span><span className="font-medium text-gray-700">Systems in scope:</span> {roadmap.scope.systemsInScope.join(', ')}</span>
        </div>
      </section>

      {/* Sprint timeline */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-5">Sprint Breakdown</h2>
        <div className="space-y-3">
          {roadmap.sprints.map(sprint => {
            const done = sprint.tasks.filter(t => completedTasks.has(t.id)).length;
            const pct = sprint.tasks.length ? Math.round((done / sprint.tasks.length) * 100) : 0;
            const critCount = sprint.tasks.filter(t => t.priority === 'critical').length;

            return (
              <div key={sprint.number} className="flex items-center gap-4">
                {/* Sprint label */}
                <div className="w-20 shrink-0">
                  <p className="text-xs font-semibold text-gray-700">Sprint {sprint.number}</p>
                  <p className="text-xs text-gray-400">{sprint.weeks}</p>
                </div>

                {/* Bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-600 truncate pr-2">{sprint.name}</p>
                    <span className="text-xs text-gray-400 shrink-0">{done}/{sprint.tasks.length}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="shrink-0 flex gap-1.5">
                  {critCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                      {critCount} critical
                    </span>
                  )}
                  {pct === 100 && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Done</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Action items grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Policies needed */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Policies Needed</h2>
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
              {missingPolicies.length} missing
            </span>
          </div>
          {missingPolicies.length === 0 ? (
            <div className="p-5 text-center text-sm text-green-600">All required policies are in place</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {missingPolicies.map(p => (
                <li key={p.id} className="px-5 py-3 flex items-start gap-2.5">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-orange-500" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{p.name}</p>
                    {p.conditional && <p className="text-xs text-blue-600 mt-0.5">{p.conditional}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/dashboard/policies" className="text-xs text-blue-600 font-medium hover:underline">
              View all policies →
            </Link>
          </div>
        </section>

        {/* Critical controls */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Controls to Address</h2>
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
              {urgentTasks.length} open
            </span>
          </div>
          {urgentTasks.length === 0 ? (
            <div className="p-5 text-center text-sm text-green-600">All critical controls addressed</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {urgentTasks.slice(0, 6).map(task => (
                <li key={task.id} className="px-5 py-3 flex items-start gap-2.5">
                  <span className={`mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${riskBadge(task.priority as RiskLevel)}`}>
                    {task.priority === 'critical' ? 'CRIT' : 'HIGH'}
                  </span>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sprint {task.sprint} · {task.controlReference}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/dashboard/controls" className="text-xs text-blue-600 font-medium hover:underline">
              View all controls →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
