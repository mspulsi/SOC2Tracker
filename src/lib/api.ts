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
        let errorMessage = data.message || data.detail || 'An error occurred';
        
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
      localStorage.removeItem('soc2-roadmap');
      localStorage.removeItem('soc2-integrations');
      localStorage.removeItem('soc2-completed-tasks');
    }
  }

  // Intake endpoints
  async submitIntake(intakeData: IntakeSubmission) {
    return this.request<IntakeWithRoadmapResponse>('/api/v1/intake/', {
      method: 'POST',
      body: JSON.stringify(intakeData),
    });
  }

  async getIntake() {
    return this.request<IntakeWithRoadmapResponse>('/api/v1/intake/', {
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
    industry: string;
    employee_count: string;
    website: string;
  };
  technical_infrastructure: {
    cloud_providers: string[];
    has_production_database: boolean;
    database_types: string[];
    uses_containers: boolean;
    has_ci_cd: boolean;
    source_code_management: string;
  };
  data_handling: {
    handles_customer_pii: boolean;
    handles_phi: boolean;
    handles_payment_data: boolean;
    data_residency_requirements: string[];
  };
  security_and_org: {
    security_responsible: string;
    uses_contractors: boolean;
    contractor_description: string;
    current_compliances: string[];
  };
  vendor_management: {
    third_party_services: string;
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

// API Roadmap types (snake_case from backend)
export interface ApiRoadmap {
  maturity_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommended_timeline: number;
  trust_service_criteria: string[];
  sprints: Array<{
    number: number;
    name: string;
    weeks: string;
    focus: string;
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      priority: string;
      effort: string;
      control_reference: string;
      completed: boolean;
      why: string;
    }>;
  }>;
  gaps: Array<{
    control: string;
    current_state: string;
    required_state: string;
    severity: string;
  }>;
  policies: Array<{
    id: string;
    name: string;
    exists: boolean;
    required: boolean;
    conditional?: string;
  }>;
  evidence: Array<{
    id: string;
    name: string;
    description: string;
    collection_method: string;
    days_required: number;
    already_have: boolean;
    category: string;
  }>;
  risks: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    remediation: string;
    sprint_reference?: number;
  }>;
  scope: {
    type: string;
    criteria: string[];
    justification: string;
    systems_in_scope: string[];
    estimated_audit_cost: string;
  };
  score_breakdown: Array<{
    category: string;
    earned: number;
    maximum: number;
    controls: Array<{
      name: string;
      earned: number;
      maximum: number;
    }>;
  }>;
  generated_at: string;
}

export interface IntakeWithRoadmapResponse {
  id: string;
  company_id: string;
  roadmap: ApiRoadmap;
  created_at: string;
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
    industry: string;
    employeeCount: string;
    website: string;
  };
  technicalInfrastructure: {
    cloudProviders: string[];
    hasProductionDatabase: boolean;
    databaseTypes: string[];
    usesContainers: boolean;
    hasCI_CD: boolean;
    sourceCodeManagement: string;
  };
  dataHandling: {
    handlesCustomerPII: boolean;
    handlesPHI: boolean;
    handlesPaymentData: boolean;
    dataResidencyRequirements: string[];
  };
  securityAndOrg: {
    securityResponsible: string;
    usesContractors: boolean;
    contractorDescription: string;
    currentCompliances: string[];
  };
  vendorManagement: {
    thirdPartyServices: string;
  };
  targetCompletionDate: string;
  soc2Type: string;
  trustServiceCriteria: string[];
}): IntakeSubmission {
  return {
    company_info: {
      industry: frontendData.companyInfo.industry,
      employee_count: frontendData.companyInfo.employeeCount,
      website: frontendData.companyInfo.website,
    },
    technical_infrastructure: {
      cloud_providers: frontendData.technicalInfrastructure.cloudProviders,
      has_production_database: frontendData.technicalInfrastructure.hasProductionDatabase,
      database_types: frontendData.technicalInfrastructure.databaseTypes,
      uses_containers: frontendData.technicalInfrastructure.usesContainers,
      has_ci_cd: frontendData.technicalInfrastructure.hasCI_CD,
      source_code_management: frontendData.technicalInfrastructure.sourceCodeManagement,
    },
    data_handling: {
      handles_customer_pii: frontendData.dataHandling.handlesCustomerPII,
      handles_phi: frontendData.dataHandling.handlesPHI,
      handles_payment_data: frontendData.dataHandling.handlesPaymentData,
      data_residency_requirements: frontendData.dataHandling.dataResidencyRequirements,
    },
    security_and_org: {
      security_responsible: frontendData.securityAndOrg.securityResponsible,
      uses_contractors: frontendData.securityAndOrg.usesContractors,
      contractor_description: frontendData.securityAndOrg.contractorDescription,
      current_compliances: frontendData.securityAndOrg.currentCompliances,
    },
    vendor_management: {
      third_party_services: frontendData.vendorManagement.thirdPartyServices,
    },
    target_completion_date: frontendData.targetCompletionDate || null,
    soc2_type: frontendData.soc2Type,
    trust_service_criteria: frontendData.trustServiceCriteria,
  };
}

// Helper to convert API roadmap (snake_case) to frontend format (camelCase)
import type { ComplianceRoadmap } from '@/types/roadmap';

export function convertApiRoadmapToFrontend(apiRoadmap: ApiRoadmap): ComplianceRoadmap {
  return {
    maturityScore: apiRoadmap.maturity_score,
    riskLevel: apiRoadmap.risk_level,
    recommendedTimeline: apiRoadmap.recommended_timeline,
    sprints: apiRoadmap.sprints.map(sprint => ({
      number: sprint.number,
      name: sprint.name,
      weeks: sprint.weeks,
      focus: sprint.focus,
      tasks: sprint.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category as 'policy' | 'technical' | 'process' | 'evidence',
        priority: task.priority as 'critical' | 'high' | 'medium' | 'low',
        effort: task.effort as 'hours' | 'days' | 'weeks',
        controlReference: task.control_reference,
        completed: task.completed,
        why: task.why,
      })),
    })),
    gaps: apiRoadmap.gaps.map(gap => ({
      control: gap.control,
      currentState: gap.current_state,
      requiredState: gap.required_state,
      severity: gap.severity as 'low' | 'medium' | 'high' | 'critical',
    })),
    policies: apiRoadmap.policies,
    evidence: apiRoadmap.evidence.map(ev => ({
      id: ev.id,
      name: ev.name,
      description: ev.description,
      collectionMethod: ev.collection_method,
      daysRequired: ev.days_required,
      alreadyHave: ev.already_have,
      category: ev.category as 'access' | 'change' | 'monitoring' | 'training' | 'vendor' | 'backup' | 'policy',
    })),
    risks: apiRoadmap.risks.map(risk => ({
      id: risk.id,
      title: risk.title,
      description: risk.description,
      severity: risk.severity as 'low' | 'medium' | 'high' | 'critical',
      remediation: risk.remediation,
      sprintReference: risk.sprint_reference,
    })),
    scope: {
      type: apiRoadmap.scope.type as 'type1' | 'type2',
      criteria: apiRoadmap.scope.criteria,
      justification: apiRoadmap.scope.justification,
      systemsInScope: apiRoadmap.scope.systems_in_scope,
      estimatedAuditCost: apiRoadmap.scope.estimated_audit_cost,
    },
    scoreBreakdown: apiRoadmap.score_breakdown,
    generatedAt: apiRoadmap.generated_at,
  };
}
