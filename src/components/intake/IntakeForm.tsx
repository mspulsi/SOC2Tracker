'use client';

import { useState } from 'react';
import { IntakeFormData } from '@/types/intake';
import ProgressBar from './ProgressBar';
import CompanyInfoSection from './sections/CompanyInfoSection';
import TechnicalInfrastructureSection from './sections/TechnicalInfrastructureSection';
import DataHandlingSection from './sections/DataHandlingSection';
import SecurityAndOrgSection from './sections/SecurityPostureSection';
import VendorManagementSection from './sections/VendorManagementSection';
import ComplianceGoalsSection from './sections/ComplianceGoalsSection';

const STEPS = [
  'Company',
  'Infrastructure',
  'Data',
  'Security',
  'Vendors',
  'Goals',
];

const initialFormData: IntakeFormData = {
  companyInfo: {
    industry: '',
    employeeCount: '',
    website: '',
  },
  technicalInfrastructure: {
    cloudProviders: [],
    hasProductionDatabase: false,
    databaseTypes: [],
    usesContainers: false,
    hasCI_CD: false,
    sourceCodeManagement: '',
  },
  dataHandling: {
    handlesCustomerPII: false,
    handlesPHI: false,
    handlesPaymentData: false,
    dataResidencyRequirements: [],
  },
  securityAndOrg: {
    securityResponsible: '',
    usesContractors: false,
    contractorDescription: '',
    currentCompliances: [],
  },
  vendorManagement: {
    thirdPartyServices: '',
  },
  targetCompletionDate: '',
  soc2Type: 'type1',
  trustServiceCriteria: ['security'],
};

interface IntakeFormProps {
  onComplete: (data: IntakeFormData) => void;
}

export default function IntakeForm({ onComplete }: IntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onComplete(formData);
    setIsSubmitting(false);
  };

  const renderCurrentSection = () => {
    switch (currentStep) {
      case 0:
        return (
          <CompanyInfoSection
            data={formData.companyInfo}
            onChange={(companyInfo) => setFormData({ ...formData, companyInfo })}
          />
        );
      case 1:
        return (
          <TechnicalInfrastructureSection
            data={formData.technicalInfrastructure}
            onChange={(technicalInfrastructure) =>
              setFormData({ ...formData, technicalInfrastructure })
            }
          />
        );
      case 2:
        return (
          <DataHandlingSection
            data={formData.dataHandling}
            onChange={(dataHandling) => setFormData({ ...formData, dataHandling })}
          />
        );
      case 3:
        return (
          <SecurityAndOrgSection
            data={formData.securityAndOrg}
            onChange={(securityAndOrg) => setFormData({ ...formData, securityAndOrg })}
          />
        );
      case 4:
        return (
          <VendorManagementSection
            data={formData.vendorManagement}
            onChange={(vendorManagement) => setFormData({ ...formData, vendorManagement })}
          />
        );
      case 5:
        return (
          <ComplianceGoalsSection
            data={{
              targetCompletionDate: formData.targetCompletionDate,
              soc2Type: formData.soc2Type,
            }}
            onChange={(goals) => setFormData({ ...formData, ...goals })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

      <div className="mb-8">{renderCurrentSection()}</div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            currentStep === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </span>
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            <span className="flex items-center gap-2">
              Continue
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Your Roadmap...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Generate Compliance Roadmap
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
