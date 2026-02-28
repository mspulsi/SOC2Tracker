'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IntakeForm from '@/components/intake/IntakeForm';
import AuthForm from '@/components/auth/AuthForm';
import { IntakeFormData } from '@/types/intake';
import { api, convertIntakeToApiFormat } from '@/lib/api';

interface IntakeResult {
  formData: IntakeFormData;
  recommendedIntegrations: string[];
  estimatedSprints: number;
  estimatedControls: number;
}

type Step = 'auth' | 'intake' | 'complete';

export default function IntakePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('auth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = api.getAccessToken();
    if (token) {
      // Verify token is still valid by checking intake status
      api.getIntake().then((response) => {
        if (response.error?.code === 'authentication_error') {
          // Token expired, need to re-auth
          api.setAccessToken(null);
          setCurrentStep('auth');
        } else if (response.data) {
          // Already has intake data, redirect to integrations or dashboard
          router.push('/setup/integrations');
        } else {
          // Authenticated but no intake yet
          setCurrentStep('intake');
        }
        setCheckingAuth(false);
      });
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleAuthSuccess = () => {
    setCurrentStep('intake');
  };

  const handleIntakeComplete = async (data: IntakeFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiData = convertIntakeToApiFormat(data);
      const response = await api.submitIntake(apiData);

      if (response.error) {
        if (response.error.code === 'authentication_error') {
          // Token expired during intake
          setError('Your session has expired. Please sign in again.');
          setCurrentStep('auth');
        } else {
          setError(response.error.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (response.data) {
        setResult({
          formData: data,
          recommendedIntegrations: response.data.recommended_integrations,
          estimatedSprints: response.data.estimated_sprints,
          estimatedControls: response.data.estimated_controls,
        });
        setCurrentStep('complete');
        
        // Also store locally for quick access
        localStorage.setItem('soc2-intake-data', JSON.stringify(data));
        localStorage.setItem('soc2-intake-result', JSON.stringify(response.data));
      }
    } catch (err) {
      setError('Failed to submit intake form. Please try again.');
      console.error('Intake submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Step 1: Authentication
  if (currentStep === 'auth') {
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

  // Step 3: Complete
  if (currentStep === 'complete' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Compliance Roadmap is Ready!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Based on your responses, we&apos;ve created a personalized SOC 2 compliance
              roadmap for <strong>{result.formData.companyInfo.companyName}</strong>.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">Report Type:</dt>
                <dd className="font-medium text-gray-900">
                  SOC 2 {result.formData.soc2Type === 'type1' ? 'Type 1' : 'Type 2'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Trust Criteria:</dt>
                <dd className="font-medium text-gray-900">
                  {result.formData.trustServiceCriteria.length} selected
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Industry:</dt>
                <dd className="font-medium text-gray-900">
                  {result.formData.companyInfo.industry}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Team Size:</dt>
                <dd className="font-medium text-gray-900">
                  {result.formData.companyInfo.employeeCount} employees
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 mt-3">
                <dt className="text-gray-600">Estimated Controls:</dt>
                <dd className="font-medium text-blue-600">
                  {result.estimatedControls} controls
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Estimated Timeline:</dt>
                <dd className="font-medium text-blue-600">
                  {result.estimatedSprints} sprints (~{result.estimatedSprints * 2} weeks)
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Recommended Integrations:</dt>
                <dd className="font-medium text-blue-600">
                  {result.recommendedIntegrations.length} services
                </dd>
              </div>
              {result.formData.targetCompletionDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Target Date:</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(result.formData.targetCompletionDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <button
            onClick={() => router.push('/setup/integrations')}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md text-lg"
          >
            Connect Your Services
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Next: Connect your cloud providers, identity systems, and other services
            to enable automated compliance scanning.
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Intake Form
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
