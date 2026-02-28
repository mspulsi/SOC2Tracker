const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error response formats
        let errorMessage = data.message || data.detail || 'An error occurred';
        
        // If there are field-specific errors in details, format them
        if (data.details && typeof data.details === 'object') {
          const fieldErrors = Object.entries(data.details)
            .map(([key, value]) => {
              const messages = Array.isArray(value) ? value.join(', ') : value;
              return `${key}: ${messages}`;
            })
            .join('; ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }

        console.error('API Error:', { status: response.status, data });
        
        return {
          error: {
            code: data.error || data.code || 'unknown_error',
            message: errorMessage,
            details: data.details || data,
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      };
    }
  }

  // Auth endpoints
  async register(email: string, password: string, companyName: string) {
    const payload = { email, password, company_name: companyName };
    console.log('Registration request:', { url: `${this.baseUrl}/api/v1/auth/register/`, payload });
    
    return this.request<{
      id: string;
      email: string;
      company_id: string;
      access_token: string;
      refresh_token: string;
    }>('/api/v1/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      user: {
        id: string;
        email: string;
        company_id: string;
      };
    }>('/api/v1/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.setAccessToken(response.data.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;
    
    if (!refreshToken) {
      return { error: { code: 'no_refresh_token', message: 'No refresh token available' } };
    }

    const response = await this.request<{ access_token: string }>('/api/v1/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.data) {
      this.setAccessToken(response.data.access_token);
    }

    return response;
  }

  logout() {
    this.setAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('soc2-intake-data');
      localStorage.removeItem('soc2-integrations');
    }
  }

  // Intake endpoints
  async submitIntake(intakeData: IntakeSubmission) {
    return this.request<{
      id: string;
      company_id: string;
      recommended_integrations: string[];
      estimated_sprints: number;
      estimated_controls: number;
      created_at: string;
    }>('/api/v1/intake/', {
      method: 'POST',
      body: JSON.stringify(intakeData),
    });
  }

  async getIntake() {
    return this.request<IntakeResponse>('/api/v1/intake/', {
      method: 'GET',
    });
  }

  // Integration endpoints
  async getIntegrations() {
    return this.request<{
      integrations: IntegrationResponse[];
      summary: {
        total: number;
        connected: number;
        recommended: number;
        recommended_connected: number;
      };
    }>('/api/v1/integrations/', {
      method: 'GET',
    });
  }

  async getIntegration(integrationId: string) {
    return this.request<IntegrationDetailResponse>(`/api/v1/integrations/${integrationId}/`, {
      method: 'GET',
    });
  }

  async connectIntegration(integrationId: string, credentials: Record<string, string>) {
    return this.request<{
      id: string;
      status: string;
      last_sync: string;
      message: string;
    }>(`/api/v1/integrations/${integrationId}/connect/`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async disconnectIntegration(integrationId: string) {
    return this.request<{
      id: string;
      status: string;
      message: string;
    }>(`/api/v1/integrations/${integrationId}/disconnect/`, {
      method: 'DELETE',
    });
  }

  async syncIntegration(integrationId: string) {
    return this.request<{
      id: string;
      sync_job_id: string;
      status: string;
      message: string;
    }>(`/api/v1/integrations/${integrationId}/sync/`, {
      method: 'POST',
    });
  }

  async getSyncStatus(integrationId: string) {
    return this.request<{
      sync_job_id: string;
      integration_id: string;
      status: string;
      started_at: string;
      completed_at: string | null;
      checks_run: number;
      passed: number;
      failed: number;
      warnings: number;
    }>(`/api/v1/integrations/${integrationId}/sync-status/`, {
      method: 'GET',
    });
  }

  async getIntegrationChecks(integrationId: string, filters?: { status?: string; control_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.control_id) params.append('control_id', filters.control_id);
    
    const queryString = params.toString();
    const url = `/api/v1/integrations/${integrationId}/checks/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<IntegrationChecksResponse>(url, {
      method: 'GET',
    });
  }

  // Compliance check endpoints
  async getAllChecks(filters?: { status?: string; integration_id?: string; control_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.integration_id) params.append('integration_id', filters.integration_id);
    if (filters?.control_id) params.append('control_id', filters.control_id);
    
    const queryString = params.toString();
    const url = `/api/v1/checks/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<AllChecksResponse>(url, {
      method: 'GET',
    });
  }

  async runCheck(checkId: string) {
    return this.request<{
      check_id: string;
      status: string;
      message: string;
    }>(`/api/v1/checks/${checkId}/run/`, {
      method: 'POST',
    });
  }

  async acknowledgeCheck(checkId: string, reason: string, acknowledgedUntil?: string) {
    return this.request<{
      check_id: string;
      status: string;
      acknowledged_by: string;
      acknowledged_at: string;
      acknowledged_until: string | null;
      reason: string;
    }>(`/api/v1/checks/${checkId}/acknowledge/`, {
      method: 'POST',
      body: JSON.stringify({
        reason,
        acknowledged_until: acknowledgedUntil,
      }),
    });
  }
}

// Type definitions for API responses
export interface IntakeSubmission {
  company_info: {
    company_name: string;
    industry: string;
    employee_count: string;
    year_founded: string;
    website: string;
  };
  technical_infrastructure: {
    cloud_providers: string[];
    hosting_type: string;
    has_production_database: boolean;
    database_types: string[];
    uses_containers: boolean;
    has_ci_cd: boolean;
    source_code_management: string;
    has_monitoring: boolean;
  };
  data_handling: {
    handles_customer_pii: boolean;
    handles_phi: boolean;
    handles_payment_data: boolean;
    data_residency_requirements: string[];
    has_data_classification: boolean;
    has_encryption_at_rest: boolean;
    has_encryption_in_transit: boolean;
  };
  security_posture: {
    has_security_team: boolean;
    security_team_size: string;
    has_security_policies: boolean;
    has_incident_response_plan: boolean;
    has_vulnerability_management: boolean;
    has_penetration_testing: boolean;
    has_security_awareness: boolean;
    current_compliances: string[];
  };
  access_control: {
    has_sso: boolean;
    sso_provider: string;
    has_mfa: boolean;
    mfa_coverage: string;
    has_rbac: boolean;
    has_privileged_access_management: boolean;
    has_access_reviews: boolean;
    access_review_frequency: string;
  };
  vendor_management: {
    critical_vendor_count: string;
    has_vendor_assessment: boolean;
    has_vendor_inventory: boolean;
    has_data_processing_agreements: boolean;
  };
  business_continuity: {
    has_backup_strategy: boolean;
    backup_frequency: string;
    has_disaster_recovery_plan: boolean;
    has_bcp_testing: boolean;
    rto_requirement: string;
    rpo_requirement: string;
  };
  target_completion_date: string | null;
  soc2_type: string;
  trust_service_criteria: string[];
}

export interface IntakeResponse extends IntakeSubmission {
  id: string;
  recommended_integrations: string[];
  created_at: string;
  updated_at: string;
}

export interface IntegrationResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'not_connected' | 'connecting' | 'connected' | 'error';
  last_sync: string | null;
  error_message: string | null;
  required_scopes: string[];
  is_recommended: boolean;
}

export interface IntegrationDetailResponse extends IntegrationResponse {
  connection_config: {
    fields: {
      key: string;
      label: string;
      type: string;
      placeholder: string;
      help_text?: string;
      required: boolean;
    }[];
  };
  checks_count: number;
  passed_checks: number;
  failed_checks: number;
  warning_checks: number;
}

export interface ComplianceCheckResult {
  id: string;
  name: string;
  description: string;
  control_ids: string[];
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning' | 'not_applicable' | 'acknowledged';
  last_run: string;
  result: {
    passed: boolean;
    message: string;
    details?: string;
    resources_checked?: number;
    resources_passed?: number;
    remediation?: string;
  } | null;
}

export interface IntegrationChecksResponse {
  integration_id: string;
  checks: ComplianceCheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warning: number;
    pending: number;
    not_applicable: number;
  };
}

export interface AllChecksResponse {
  checks: ComplianceCheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warning: number;
    by_integration: Record<string, {
      total: number;
      passed: number;
      failed: number;
      warning: number;
    }>;
  };
}

// Create and export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Helper to convert frontend intake format to API format
export function convertIntakeToApiFormat(frontendData: {
  companyInfo: {
    companyName: string;
    industry: string;
    employeeCount: string;
    yearFounded: string;
    website?: string;
  };
  technicalInfrastructure: {
    cloudProviders: string[];
    hostingType: string;
    hasProductionDatabase: boolean;
    databaseTypes: string[];
    usesContainers: boolean;
    hasCI_CD: boolean;
    sourceCodeManagement: string;
    hasMonitoring: boolean;
  };
  dataHandling: {
    handlesCustomerPII: boolean;
    handlesPHI: boolean;
    handlesPaymentData: boolean;
    dataResidencyRequirements: string[];
    hasDataClassification: boolean;
    hasEncryptionAtRest: boolean;
    hasEncryptionInTransit: boolean;
  };
  securityPosture: {
    hasSecurityTeam: boolean;
    securityTeamSize: string;
    hasSecurityPolicies: boolean;
    hasIncidentResponsePlan: boolean;
    hasVulnerabilityManagement: boolean;
    hasPenetrationTesting: boolean;
    hasSecurityAwareness: boolean;
    currentCompliances: string[];
  };
  accessControl: {
    hasSSO: boolean;
    ssoProvider: string;
    hasMFA: boolean;
    mfaCoverage: string;
    hasRBAC: boolean;
    hasPrivilegedAccessManagement: boolean;
    hasAccessReviews: boolean;
    accessReviewFrequency: string;
  };
  vendorManagement: {
    criticalVendorCount: string;
    hasVendorAssessment: boolean;
    hasVendorInventory: boolean;
    hasDataProcessingAgreements: boolean;
  };
  businessContinuity: {
    hasBackupStrategy: boolean;
    backupFrequency: string;
    hasDisasterRecoveryPlan: boolean;
    hasBCPTesting: boolean;
    rtoRequirement: string;
    rpoRequirement: string;
  };
  targetCompletionDate: string;
  soc2Type: string;
  trustServiceCriteria: string[];
}): IntakeSubmission {
  return {
    company_info: {
      company_name: frontendData.companyInfo.companyName,
      industry: frontendData.companyInfo.industry,
      employee_count: frontendData.companyInfo.employeeCount,
      year_founded: frontendData.companyInfo.yearFounded,
      website: frontendData.companyInfo.website ?? '',
    },
    technical_infrastructure: {
      cloud_providers: frontendData.technicalInfrastructure.cloudProviders,
      hosting_type: frontendData.technicalInfrastructure.hostingType,
      has_production_database: frontendData.technicalInfrastructure.hasProductionDatabase,
      database_types: frontendData.technicalInfrastructure.databaseTypes,
      uses_containers: frontendData.technicalInfrastructure.usesContainers,
      has_ci_cd: frontendData.technicalInfrastructure.hasCI_CD,
      source_code_management: frontendData.technicalInfrastructure.sourceCodeManagement,
      has_monitoring: frontendData.technicalInfrastructure.hasMonitoring,
    },
    data_handling: {
      handles_customer_pii: frontendData.dataHandling.handlesCustomerPII,
      handles_phi: frontendData.dataHandling.handlesPHI,
      handles_payment_data: frontendData.dataHandling.handlesPaymentData,
      data_residency_requirements: frontendData.dataHandling.dataResidencyRequirements,
      has_data_classification: frontendData.dataHandling.hasDataClassification,
      has_encryption_at_rest: frontendData.dataHandling.hasEncryptionAtRest,
      has_encryption_in_transit: frontendData.dataHandling.hasEncryptionInTransit,
    },
    security_posture: {
      has_security_team: frontendData.securityPosture.hasSecurityTeam,
      security_team_size: frontendData.securityPosture.securityTeamSize,
      has_security_policies: frontendData.securityPosture.hasSecurityPolicies,
      has_incident_response_plan: frontendData.securityPosture.hasIncidentResponsePlan,
      has_vulnerability_management: frontendData.securityPosture.hasVulnerabilityManagement,
      has_penetration_testing: frontendData.securityPosture.hasPenetrationTesting,
      has_security_awareness: frontendData.securityPosture.hasSecurityAwareness,
      current_compliances: frontendData.securityPosture.currentCompliances,
    },
    access_control: {
      has_sso: frontendData.accessControl.hasSSO,
      sso_provider: frontendData.accessControl.ssoProvider,
      has_mfa: frontendData.accessControl.hasMFA,
      mfa_coverage: frontendData.accessControl.mfaCoverage,
      has_rbac: frontendData.accessControl.hasRBAC,
      has_privileged_access_management: frontendData.accessControl.hasPrivilegedAccessManagement,
      has_access_reviews: frontendData.accessControl.hasAccessReviews,
      access_review_frequency: frontendData.accessControl.accessReviewFrequency,
    },
    vendor_management: {
      critical_vendor_count: frontendData.vendorManagement.criticalVendorCount,
      has_vendor_assessment: frontendData.vendorManagement.hasVendorAssessment,
      has_vendor_inventory: frontendData.vendorManagement.hasVendorInventory,
      has_data_processing_agreements: frontendData.vendorManagement.hasDataProcessingAgreements,
    },
    business_continuity: {
      has_backup_strategy: frontendData.businessContinuity.hasBackupStrategy,
      backup_frequency: frontendData.businessContinuity.backupFrequency,
      has_disaster_recovery_plan: frontendData.businessContinuity.hasDisasterRecoveryPlan,
      has_bcp_testing: frontendData.businessContinuity.hasBCPTesting,
      rto_requirement: frontendData.businessContinuity.rtoRequirement,
      rpo_requirement: frontendData.businessContinuity.rpoRequirement,
    },
    target_completion_date: frontendData.targetCompletionDate || null,
    soc2_type: frontendData.soc2Type,
    trust_service_criteria: frontendData.trustServiceCriteria,
  };
}
