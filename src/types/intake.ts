export interface CompanyInfo {
  companyName: string;
  industry: string;
  employeeCount: string;
  yearFounded: string;
  website: string;
}

export interface TechnicalInfrastructure {
  cloudProviders: string[];
  hostingType: string;
  hasProductionDatabase: boolean;
  databaseTypes: string[];
  usesContainers: boolean;
  hasCI_CD: boolean;
  sourceCodeManagement: string;
  hasMonitoring: boolean;
}

export interface DataHandling {
  handlesCustomerPII: boolean;
  handlesPHI: boolean;
  handlesPaymentData: boolean;
  dataResidencyRequirements: string[];
  hasDataClassification: boolean;
  hasEncryptionAtRest: boolean;
  hasEncryptionInTransit: boolean;
}

export interface SecurityPosture {
  hasSecurityTeam: boolean;
  securityTeamSize: string;
  hasSecurityPolicies: boolean;
  hasIncidentResponsePlan: boolean;
  hasVulnerabilityManagement: boolean;
  hasPenetrationTesting: boolean;
  hasSecurityAwareness: boolean;
  currentCompliances: string[];
}

export interface AccessControl {
  hasSSO: boolean;
  ssoProvider: string;
  hasMFA: boolean;
  mfaCoverage: string;
  hasRBAC: boolean;
  hasPrivilegedAccessManagement: boolean;
  hasAccessReviews: boolean;
  accessReviewFrequency: string;
}

export interface VendorManagement {
  criticalVendorCount: string;
  hasVendorAssessment: boolean;
  hasVendorInventory: boolean;
  hasDataProcessingAgreements: boolean;
}

export interface BusinessContinuity {
  hasBackupStrategy: boolean;
  backupFrequency: string;
  hasDisasterRecoveryPlan: boolean;
  hasBCPTesting: boolean;
  rtoRequirement: string;
  rpoRequirement: string;
}

export interface IntakeFormData {
  companyInfo: CompanyInfo;
  technicalInfrastructure: TechnicalInfrastructure;
  dataHandling: DataHandling;
  securityPosture: SecurityPosture;
  accessControl: AccessControl;
  vendorManagement: VendorManagement;
  businessContinuity: BusinessContinuity;
  targetCompletionDate: string;
  soc2Type: 'type1' | 'type2';
  trustServiceCriteria: string[];
  wantsSprintPlan?: boolean;
}

export const INDUSTRIES = [
  'Software/SaaS',
  'Financial Services',
  'Healthcare',
  'E-commerce',
  'Education',
  'Manufacturing',
  'Professional Services',
  'Media/Entertainment',
  'Other',
] as const;

export const EMPLOYEE_COUNTS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
] as const;

export const CLOUD_PROVIDERS = [
  'AWS',
  'Google Cloud (GCP)',
  'Microsoft Azure',
  'DigitalOcean',
  'Heroku',
  'Vercel',
  'Other',
  'None/On-premise only',
] as const;

export const DATABASE_TYPES = [
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'DynamoDB',
  'SQL Server',
  'Other',
] as const;

export const SOURCE_CODE_MANAGEMENT = [
  'GitHub',
  'GitLab',
  'Bitbucket',
  'Azure DevOps',
  'Other',
] as const;

export const SSO_PROVIDERS = [
  'Okta',
  'Azure AD',
  'Google Workspace',
  'OneLogin',
  'Auth0',
  'Other',
  'None',
] as const;

export const TRUST_SERVICE_CRITERIA = [
  { id: 'security', name: 'Security', description: 'Required for all SOC 2 reports', required: true },
  { id: 'availability', name: 'Availability', description: 'System availability commitments' },
  { id: 'processing_integrity', name: 'Processing Integrity', description: 'Accurate and complete processing' },
  { id: 'confidentiality', name: 'Confidentiality', description: 'Protection of confidential information' },
  { id: 'privacy', name: 'Privacy', description: 'Personal information handling' },
] as const;

export const DATA_RESIDENCY_OPTIONS = [
  'United States',
  'European Union (GDPR)',
  'Canada',
  'Australia',
  'United Kingdom',
  'No specific requirements',
] as const;

export const CURRENT_COMPLIANCES = [
  'ISO 27001',
  'HIPAA',
  'PCI DSS',
  'GDPR',
  'CCPA',
  'FedRAMP',
  'None',
] as const;

export const BACKUP_FREQUENCIES = [
  'Real-time/Continuous',
  'Hourly',
  'Daily',
  'Weekly',
  'Monthly',
  'No regular backups',
] as const;

export const ACCESS_REVIEW_FREQUENCIES = [
  'Monthly',
  'Quarterly',
  'Semi-annually',
  'Annually',
  'Never/Ad-hoc',
] as const;

export const RTO_RPO_OPTIONS = [
  'Less than 1 hour',
  '1-4 hours',
  '4-24 hours',
  '1-3 days',
  '3+ days',
  'Not defined',
] as const;

export const VENDOR_COUNTS = [
  '0-5',
  '6-15',
  '16-30',
  '31-50',
  '50+',
] as const;

export const MFA_COVERAGE_OPTIONS = [
  'All users',
  'Admin/privileged users only',
  'Some users',
  'Not implemented',
] as const;

export const SECURITY_TEAM_SIZES = [
  'No dedicated security personnel',
  '1 person (part-time)',
  '1 person (full-time)',
  '2-5 people',
  '5+ people',
] as const;

export const HOSTING_TYPES = [
  'Fully cloud-hosted',
  'Hybrid (cloud + on-premise)',
  'Fully on-premise',
  'Managed hosting provider',
] as const;
