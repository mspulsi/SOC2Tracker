'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import IntakeForm from '@/components/intake/IntakeForm';
import { IntakeFormData } from '@/types/intake';

export default function IntakePage() {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState<IntakeFormData | null>(null);

  const handleComplete = (data: IntakeFormData) => {
    setFormData(data);
    setIsComplete(true);
    localStorage.setItem('soc2-intake-data', JSON.stringify(data));
  };

  if (isComplete && formData) {
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
              roadmap for <strong>{formData.companyInfo.companyName}</strong>.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">Report Type:</dt>
                <dd className="font-medium text-gray-900">
                  SOC 2 {formData.soc2Type === 'type1' ? 'Type 1' : 'Type 2'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Trust Criteria:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.trustServiceCriteria.length} selected
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Industry:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.companyInfo.industry}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Team Size:</dt>
                <dd className="font-medium text-gray-900">
                  {formData.companyInfo.employeeCount} employees
                </dd>
              </div>
              {formData.targetCompletionDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Target Date:</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(formData.targetCompletionDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md text-lg"
          >
            Go to Your Dashboard
          </button>
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
