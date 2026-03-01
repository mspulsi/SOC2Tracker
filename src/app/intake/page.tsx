'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IntakeForm from '@/components/intake/IntakeForm';
import AuthForm from '@/components/auth/AuthForm';
import { IntakeFormData } from '@/types/intake';
import { ComplianceRoadmap, RiskLevel } from '@/types/roadmap';
import { api, convertIntakeToApiFormat, convertApiRoadmapToFrontend } from '@/lib/api';

function riskBadge(level: RiskLevel) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };
  return styles[level];
}

type Step = 'loading' | 'auth' | 'intake' | 'complete';

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [roadmap, setRoadmap] = useState<ComplianceRoadmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has already completed intake (local storage)
    const existingRoadmap = localStorage.getItem('soc2-roadmap');
    if (existingRoadmap) {
      router.replace('/dashboard');
      return;
    }

    const token = api.getAccessToken();
    if (token) {
      api.getIntake().then((response) => {
        if (response.error?.code === 'authentication_error') {
          api.setAccessToken(null);
          setStep('auth');
        } else if (response.data?.roadmap) {
          // Already completed intake on backend — save roadmap and go to dashboard
          const frontendRoadmap = convertApiRoadmapToFrontend(response.data.roadmap);
          localStorage.setItem('soc2-roadmap', JSON.stringify(frontendRoadmap));
          router.replace('/dashboard');
        } else {
          // Authenticated but no intake yet
          setStep('intake');
        }
      }).catch(() => {
        // API error but user is authenticated, let them proceed with intake
        setStep('intake');
      });
    } else {
      setStep('auth');
    }
  }, [router]);

  const handleAuthSuccess = () => {
    setStep('intake');
  };

  const handleIntakeComplete = async (data: IntakeFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiData = convertIntakeToApiFormat(data);
      const response = await api.submitIntake(apiData);

      if (response.error) {
        setError(response.error.message);
        setIsSubmitting(false);
        return;
      }

      if (response.data?.roadmap) {
        const frontendRoadmap = convertApiRoadmapToFrontend(response.data.roadmap);
        localStorage.setItem('soc2-roadmap', JSON.stringify(frontendRoadmap));
        setRoadmap(frontendRoadmap);
        setIsSubmitting(false);
        setStep('complete');
      } else {
        setError('No roadmap returned from server');
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error('Intake submission failed:', e);
      setError('Failed to submit intake. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Let&apos;s Build Your SOC 2 Roadmap
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create an account to save your progress and get a personalized compliance plan.
          </p>
        </div>
        <div className="flex justify-center">
          <AuthForm onSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  if (step === 'complete' && roadmap) {
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
              Here&apos;s your SOC 2 roadmap
            </h1>
            <p className="text-gray-500 text-sm">
              Based on your answers, we made every structural decision a compliance consultant would charge $5,000 to figure out.
            </p>
          </div>

          {/* Decisions grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scope</p>
              <p className="font-semibold text-gray-900">SOC 2 {roadmap.scope.type === 'type1' ? 'Type 1' : 'Type 2'}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {roadmap.scope.criteria.map(c => c.replace('_', ' ')).join(', ')}
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
                    {roadmap.scope.type === 'type2' ? ', including 90-day rolling logs that start now' : ' at audit time'}
                  </p>
                </div>
              )}
              {roadmap.risks.length > 0 && (
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
            onClick={() => router.push('/setup/integrations')}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-base"
          >
            Connect Your Integrations →
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Connect your cloud providers and tools to enable automated compliance scanning
          </p>
        </div>
      </div>
    );
  }

  // Intake form step
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

      {error && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {isSubmitting ? (
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your responses and generating your roadmap...</p>
        </div>
      ) : (
        <IntakeForm onComplete={handleIntakeComplete} />
      )}
    </div>
  );
}
