export interface CompanyInfo {
  industry: string;
  employeeCount: string;
  website: string;
}

export interface TechnicalInfrastructure {
  cloudProviders: string[];
  hasProductionDatabase: boolean;
  databaseTypes: string[];
  usesContainers: boolean;
  hasCI_CD: boolean;
  sourceCodeManagement: string;
}

export interface DataHandling {
  handlesCustomerPII: boolean;
  handlesPHI: boolean;
  handlesPaymentData: boolean;
  dataResidencyRequirements: string[];
}

export interface SecurityAndOrg {
  securityResponsible: string;
  usesContractors: boolean;
  contractorDescription: string;
  currentCompliances: string[];
}

export interface VendorManagement {
  thirdPartyServices: string;
}

export interface IntakeFormData {
  companyInfo: CompanyInfo;
  technicalInfrastructure: TechnicalInfrastructure;
  dataHandling: DataHandling;
  securityAndOrg: SecurityAndOrg;
  vendorManagement: VendorManagement;
  targetCompletionDate: string;
  soc2Type: 'type1' | 'type2';
  trustServiceCriteria: string[];
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
  '11-25',
  '26-50',
  '50+',
] as const;

export const CLOUD_PROVIDERS = [
  'AWS',
  'Google Cloud (GCP)',
  'Microsoft Azure',
  'DigitalOcean',
  'Heroku',
  'Vercel',
  'Other',
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


export const SECURITY_RESPONSIBLE_OPTIONS = [
  'CEO/Founder',
  'CTO',
  'Dedicated Security Lead/CISO',
  'Engineering Manager',
  'IT Manager',
  'External Consultant',
  'No one assigned yet',
] as const;
