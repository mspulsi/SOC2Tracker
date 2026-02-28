'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import IntakeForm from '@/components/intake/IntakeForm';
import { IntakeFormData } from '@/types/intake';
import { generateRoadmap } from '@/lib/compliance-engine';
import { ComplianceRoadmap, RiskLevel } from '@/types/roadmap';

function riskBadge(level: RiskLevel) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };
  return styles[level];
}

export default function IntakePage() {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState<IntakeFormData | null>(null);
  const [roadmap, setRoadmap] = useState<ComplianceRoadmap | null>(null);

  const handleComplete = (data: IntakeFormData) => {
    const generated = generateRoadmap(data);
    setFormData(data);
    setRoadmap(generated);
    setIsComplete(true);
    localStorage.setItem('soc2-intake-data', JSON.stringify(data));
  };

  if (isComplete && formData && roadmap) {
    const criticalGaps = roadmap.gaps.filter(g => g.severity === 'critical').length;
    const missingPolicies = roadmap.policies.filter(p => !p.exists && p.required).length;
    const totalTasks = roadmap.sprints.flatMap(s => s.tasks).length;

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Here&apos;s what we determined for {formData.companyInfo.companyName}
            </h1>
            <p className="text-gray-500 text-sm">
              Based on your answers, we made every structural decision a compliance consultant would charge $5,000 to figure out.
            </p>
          </div>

          {/* Decisions grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scope</p>
              <p className="font-semibold text-gray-900">SOC 2 {formData.soc2Type === 'type1' ? 'Type 1' : 'Type 2'}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formData.trustServiceCriteria.map(c => c.replace('_', ' ')).join(', ')}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Timeline</p>
              <p className="font-semibold text-gray-900">{roadmap.recommendedTimeline} weeks</p>
              <p className="text-xs text-gray-500 mt-0.5">to audit-ready</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Security Maturity</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{roadmap.maturityScore}/100</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskBadge(roadmap.riskLevel)}`}>
                  {roadmap.riskLevel} risk
                </span>
              </div>
              <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${roadmap.maturityScore < 30 ? 'bg-red-500' : roadmap.maturityScore < 50 ? 'bg-orange-500' : roadmap.maturityScore < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${roadmap.maturityScore}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Work Ahead</p>
              <p className="font-semibold text-gray-900">{totalTasks} tasks</p>
              <p className="text-xs text-gray-500 mt-0.5">across {roadmap.sprints.length} sprints</p>
            </div>
          </div>

          {/* Key findings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">What we found</h2>
            <div className="space-y-2.5">
              {criticalGaps > 0 && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs">🚨</span>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-red-700">{criticalGaps} critical gap{criticalGaps !== 1 ? 's' : ''}</span> that must be fixed before your audit window opens
                  </p>
                </div>
              )}
              {missingPolicies > 0 && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-xs">📄</span>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{missingPolicies} policies</span> need to be written and approved by management
                  </p>
                </div>
              )}
              {roadmap.evidence.filter(e => !e.alreadyHave).length > 0 && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs">📋</span>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{roadmap.evidence.filter(e => !e.alreadyHave).length} evidence items</span> to collect
                    {formData.soc2Type === 'type2' ? ', including 90-day rolling logs that start now' : ' at audit time'}
                  </p>
                </div>
              )}
              {roadmap.risks.filter(r => r.severity === 'critical').length > 0 && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs">⚠️</span>
                  <p className="text-sm text-gray-700">
                    Top risk: <span className="font-medium">{roadmap.risks[0].title}</span>
                  </p>
                </div>
              )}
              {criticalGaps === 0 && roadmap.maturityScore >= 70 && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-xs">✓</span>
                  <p className="text-sm text-gray-700">
                    Strong security posture — your focus is <span className="font-medium">documentation and evidence collection</span>, not building controls from scratch
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scope justification */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Why this scope</p>
            <p className="text-sm text-gray-700">{roadmap.scope.justification}</p>
            <p className="text-xs text-gray-500 mt-2">Estimated audit cost: <span className="font-medium text-gray-700">{roadmap.scope.estimatedAuditCost}</span></p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-base"
          >
            Open Your Dashboard →
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Your roadmap is saved locally and available anytime at /dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Let&apos;s Build Your SOC 2 Roadmap
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Answer a few questions about your company and current security practices.
          We&apos;ll create a personalized compliance plan broken into manageable 2-week sprints.
        </p>
      </div>

      <IntakeForm onComplete={handleComplete} />
    </div>
  );
}
