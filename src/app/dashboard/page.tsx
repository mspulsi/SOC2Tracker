'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IntakeFormData } from '@/types/intake';
import { api } from '@/lib/api';
import { checkAuth, logout } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [intakeData, setIntakeData] = useState<IntakeFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Check authentication
      const { isAuthenticated, hasIntake } = await checkAuth();
      
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      if (!hasIntake) {
        router.push('/intake');
        return;
      }

      // Try to get intake data from API first
      const response = await api.getIntake();
      
      if (response.data) {
        // Convert API response to frontend format
        const data: IntakeFormData = {
          companyInfo: {
            companyName: response.data.company_info.company_name,
            industry: response.data.company_info.industry,
            employeeCount: response.data.company_info.employee_count,
            yearFounded: response.data.company_info.year_founded,
            website: response.data.company_info.website,
          },
          technicalInfrastructure: {
            cloudProviders: response.data.technical_infrastructure.cloud_providers,
            hostingType: response.data.technical_infrastructure.hosting_type,
            hasProductionDatabase: response.data.technical_infrastructure.has_production_database,
            databaseTypes: response.data.technical_infrastructure.database_types,
            usesContainers: response.data.technical_infrastructure.uses_containers,
            hasCI_CD: response.data.technical_infrastructure.has_ci_cd,
            sourceCodeManagement: response.data.technical_infrastructure.source_code_management,
            hasMonitoring: response.data.technical_infrastructure.has_monitoring,
          },
          dataHandling: {
            handlesCustomerPII: response.data.data_handling.handles_customer_pii,
            handlesPHI: response.data.data_handling.handles_phi,
            handlesPaymentData: response.data.data_handling.handles_payment_data,
            dataResidencyRequirements: response.data.data_handling.data_residency_requirements,
            hasDataClassification: response.data.data_handling.has_data_classification,
            hasEncryptionAtRest: response.data.data_handling.has_encryption_at_rest,
            hasEncryptionInTransit: response.data.data_handling.has_encryption_in_transit,
          },
          securityPosture: {
            hasSecurityTeam: response.data.security_posture.has_security_team,
            securityTeamSize: response.data.security_posture.security_team_size,
            hasSecurityPolicies: response.data.security_posture.has_security_policies,
            hasIncidentResponsePlan: response.data.security_posture.has_incident_response_plan,
            hasVulnerabilityManagement: response.data.security_posture.has_vulnerability_management,
            hasPenetrationTesting: response.data.security_posture.has_penetration_testing,
            hasSecurityAwareness: response.data.security_posture.has_security_awareness,
            currentCompliances: response.data.security_posture.current_compliances,
          },
          accessControl: {
            hasSSO: response.data.access_control.has_sso,
            ssoProvider: response.data.access_control.sso_provider,
            hasMFA: response.data.access_control.has_mfa,
            mfaCoverage: response.data.access_control.mfa_coverage,
            hasRBAC: response.data.access_control.has_rbac,
            hasPrivilegedAccessManagement: response.data.access_control.has_privileged_access_management,
            hasAccessReviews: response.data.access_control.has_access_reviews,
            accessReviewFrequency: response.data.access_control.access_review_frequency,
          },
          vendorManagement: {
            criticalVendorCount: response.data.vendor_management.critical_vendor_count,
            hasVendorAssessment: response.data.vendor_management.has_vendor_assessment,
            hasVendorInventory: response.data.vendor_management.has_vendor_inventory,
            hasDataProcessingAgreements: response.data.vendor_management.has_data_processing_agreements,
          },
          businessContinuity: {
            hasBackupStrategy: response.data.business_continuity.has_backup_strategy,
            backupFrequency: response.data.business_continuity.backup_frequency,
            hasDisasterRecoveryPlan: response.data.business_continuity.has_disaster_recovery_plan,
            hasBCPTesting: response.data.business_continuity.has_bcp_testing,
            rtoRequirement: response.data.business_continuity.rto_requirement,
            rpoRequirement: response.data.business_continuity.rpo_requirement,
          },
          targetCompletionDate: response.data.target_completion_date,
          soc2Type: response.data.soc2_type as 'type1' | 'type2',
          trustServiceCriteria: response.data.trust_service_criteria,
        };
        setIntakeData(data);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('soc2-intake-data');
        if (stored) {
          setIntakeData(JSON.parse(stored));
        }
      }
      
      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!intakeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Assessment Found</h1>
          <p className="text-gray-600 mb-6">
            Please complete the intake assessment to generate your compliance roadmap.
          </p>
          <Link
            href="/intake"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">SOC2 Tracker</h1>
                <p className="text-sm text-gray-500">{intakeData.companyInfo.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                SOC 2 {intakeData.soc2Type === 'type1' ? 'Type 1' : 'Type 2'}
              </span>
              <Link
                href="/setup/integrations"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Integrations
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Compliance Dashboard</h2>
          <p className="text-gray-600">
            Track your progress through SOC 2 compliance with organized sprints.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Dashboard Coming Soon
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Your personalized sprint board with tasks, progress tracking, and detailed
            guidance will be available here. Based on your assessment, we&apos;ll generate
            a tailored compliance roadmap.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
              {intakeData.trustServiceCriteria.length} Trust Criteria
            </span>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
              {intakeData.companyInfo.industry}
            </span>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
              {intakeData.companyInfo.employeeCount} employees
            </span>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Current Sprint</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">Sprint 1</p>
            <p className="text-sm text-gray-500">Foundation & Policies</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">0 / 0</p>
            <p className="text-sm text-gray-500">Tasks completed</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Target Date</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {intakeData.targetCompletionDate
                ? new Date(intakeData.targetCompletionDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Not set'}
            </p>
            <p className="text-sm text-gray-500">Audit ready by</p>
          </div>
        </div>
      </main>
    </div>
  );
}
