'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmap } from '@/lib/use-roadmap';
import { RiskLevel } from '@/types/roadmap';
import { Vendor } from '@/types/vendor';
import { checkAuth } from '@/lib/auth';

function riskColors(level: RiskLevel) {
  return {
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
    high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
    medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
    low:      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  }[level];
}

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

export default function HomePage() {
  const router = useRouter();
  const { roadmap, loading } = useRoadmap();
  const vendorSummary = useVendorSummary();
  const [showMaturityModal, setShowMaturityModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    checkAuth().then(({ isAuthenticated }) => {
      if (!isAuthenticated) {
        router.replace('/login');
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!roadmap) {
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

  return (
    <div className="p-8">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Home</h1>
        <p className="text-gray-500 text-sm mt-1">Your SOC 2 compliance snapshot</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-5 mb-8">

        {/* Security Maturity */}
        <button
          type="button"
          onClick={() => setShowMaturityModal(true)}
          className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-blue-300 transition-colors group w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Security Maturity</p>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">View breakdown →</span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className={`text-5xl font-bold ${scoreTextColor}`}>{roadmap.maturityScore}</span>
            <span className="text-gray-300 text-2xl mb-1">/100</span>
            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${rc.badge}`}>
              {roadmap.riskLevel.charAt(0).toUpperCase() + roadmap.riskLevel.slice(1)} Risk
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${scoreBarColor} rounded-full`} style={{ width: `${roadmap.maturityScore}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </button>

        {/* SOC 2 Type & Scope */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-4">Scope</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            SOC 2 {roadmap.scope.type === 'type1' ? 'Type 1' : 'Type 2'}
          </p>
          <p className="text-sm text-gray-500 mb-4">{roadmap.scope.estimatedAuditCost} estimated audit cost</p>
          <div className="flex flex-wrap gap-1.5">
            {roadmap.scope.criteria.map(c => (
              <span key={c} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium capitalize">
                {c.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-4">Estimated Timeline</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-gray-900">{roadmap.recommendedTimeline}</span>
            <span className="text-gray-400 text-lg">weeks</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">to audit-ready</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Now</span>
              <span>Audit-ready</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '4%' }} />
            </div>
          </div>
        </div>

        {/* Sprints */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-4">Sprints</p>
          <p className="text-5xl font-bold text-gray-900 mb-1">{roadmap.sprints.length}</p>
          <p className="text-sm text-gray-500 mb-4">2-week sprints planned</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {roadmap.sprints.flatMap(s => s.tasks).length} total tasks
            </p>
          </div>
        </div>
      </div>

      {/* Vendor summary widget */}
      <Link href="/dashboard/vendors" className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors group">
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

      {/* Top risks */}
      {roadmap.risks.length > 0 && (
        <div className="mt-8">
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
                      <p className={`text-xs font-medium mt-2 ${r.text}`}>
                        Fix: {risk.remediation}
                      </p>
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

      {/* Maturity drill-down modal */}
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
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                        >
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
