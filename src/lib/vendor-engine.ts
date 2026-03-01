import type { IntakeFormData } from '@/types/intake';
import type { Vendor, VendorCategory, VendorRiskTier } from '@/types/vendor';

// ─── Known Vendor Database ────────────────────────────────────────────────────

interface KnownVendor {
  name: string;
  website: string;
  category: VendorCategory;
  riskTier: VendorRiskTier;
  dataAccess: string[];
  hasProductionAccess: boolean;
  hasSoc2Report: boolean;
  soc2ReportUrl: string | null;
}

const KNOWN_VENDORS: Record<string, KnownVendor> = {
  'AWS': {
    name: 'AWS',
    website: 'https://aws.amazon.com',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['production data', 'customer data', 'source code'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://aws.amazon.com/compliance/soc/',
  },
  'Google Cloud (GCP)': {
    name: 'Google Cloud (GCP)',
    website: 'https://cloud.google.com',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['production data', 'customer data'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://cloud.google.com/security/compliance/soc-2',
  },
  'Microsoft Azure': {
    name: 'Microsoft Azure',
    website: 'https://azure.microsoft.com',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['production data', 'customer data'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://servicetrust.microsoft.com',
  },
  'DigitalOcean': {
    name: 'DigitalOcean',
    website: 'https://www.digitalocean.com',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['production data', 'customer data'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.digitalocean.com/trust/certification-reports',
  },
  'Vercel': {
    name: 'Vercel',
    website: 'https://vercel.com',
    category: 'Infrastructure',
    riskTier: 'high',
    dataAccess: ['source code', 'environment variables'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://vercel.com/security',
  },
  'Heroku': {
    name: 'Heroku',
    website: 'https://www.heroku.com',
    category: 'Infrastructure',
    riskTier: 'high',
    dataAccess: ['production data', 'source code'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.heroku.com/policy/security',
  },
  'GitHub': {
    name: 'GitHub',
    website: 'https://github.com',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['source code', 'secrets (if not managed separately)'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://github.com/security',
  },
  'GitLab': {
    name: 'GitLab',
    website: 'https://gitlab.com',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['source code', 'CI/CD secrets'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://about.gitlab.com/security/',
  },
  'Bitbucket': {
    name: 'Bitbucket',
    website: 'https://bitbucket.org',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['source code'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.atlassian.com/trust/compliance/resources',
  },
  'Azure DevOps': {
    name: 'Azure DevOps',
    website: 'https://dev.azure.com',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['source code', 'CI/CD pipelines'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://servicetrust.microsoft.com',
  },
  'Okta': {
    name: 'Okta',
    website: 'https://www.okta.com',
    category: 'Identity',
    riskTier: 'critical',
    dataAccess: ['user identities', 'authentication logs', 'all system access'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://trust.okta.com',
  },
  'Google Workspace': {
    name: 'Google Workspace',
    website: 'https://workspace.google.com',
    category: 'Identity',
    riskTier: 'critical',
    dataAccess: ['email', 'documents', 'user identities', 'internal communications'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://workspace.google.com/security',
  },
  'Azure AD': {
    name: 'Azure AD (Entra ID)',
    website: 'https://azure.microsoft.com/en-us/products/active-directory',
    category: 'Identity',
    riskTier: 'critical',
    dataAccess: ['user identities', 'authentication logs', 'all system access'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://servicetrust.microsoft.com',
  },
  'Auth0': {
    name: 'Auth0',
    website: 'https://auth0.com',
    category: 'Identity',
    riskTier: 'critical',
    dataAccess: ['user identities', 'authentication data'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://auth0.com/security',
  },
  'OneLogin': {
    name: 'OneLogin',
    website: 'https://www.onelogin.com',
    category: 'Identity',
    riskTier: 'critical',
    dataAccess: ['user identities', 'authentication logs'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.onelogin.com/security',
  },
  'Stripe': {
    name: 'Stripe',
    website: 'https://stripe.com',
    category: 'Payment',
    riskTier: 'high',
    dataAccess: ['financial data', 'payment card data', 'PII'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://stripe.com/docs/security',
  },
  'MongoDB': {
    name: 'MongoDB Atlas',
    website: 'https://www.mongodb.com/atlas',
    category: 'Infrastructure',
    riskTier: 'critical',
    dataAccess: ['customer data', 'production data'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.mongodb.com/cloud/trust',
  },
  'Slack': {
    name: 'Slack',
    website: 'https://slack.com',
    category: 'Communication',
    riskTier: 'medium',
    dataAccess: ['internal communications', 'potentially sensitive business data'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://slack.com/trust',
  },
  'Intercom': {
    name: 'Intercom',
    website: 'https://www.intercom.com',
    category: 'Communication',
    riskTier: 'high',
    dataAccess: ['customer PII', 'support conversations'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.intercom.com/security',
  },
  'Zendesk': {
    name: 'Zendesk',
    website: 'https://www.zendesk.com',
    category: 'Communication',
    riskTier: 'high',
    dataAccess: ['customer PII', 'support tickets'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.zendesk.com/trust-center',
  },
  'HubSpot': {
    name: 'HubSpot',
    website: 'https://www.hubspot.com',
    category: 'Business Ops',
    riskTier: 'high',
    dataAccess: ['customer PII', 'contact data', 'marketing data'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://legal.hubspot.com/security',
  },
  'Salesforce': {
    name: 'Salesforce',
    website: 'https://www.salesforce.com',
    category: 'Business Ops',
    riskTier: 'high',
    dataAccess: ['customer PII', 'sales data', 'contact data'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://trust.salesforce.com',
  },
  'Datadog': {
    name: 'Datadog',
    website: 'https://www.datadoghq.com',
    category: 'Security',
    riskTier: 'high',
    dataAccess: ['system logs', 'metrics', 'potentially sensitive log data'],
    hasProductionAccess: true,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.datadoghq.com/security/',
  },
  'PagerDuty': {
    name: 'PagerDuty',
    website: 'https://www.pagerduty.com',
    category: 'Security',
    riskTier: 'medium',
    dataAccess: ['incident data', 'on-call schedules'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.pagerduty.com/security',
  },
  'Notion': {
    name: 'Notion',
    website: 'https://www.notion.so',
    category: 'Project Management',
    riskTier: 'medium',
    dataAccess: ['internal documentation', 'potentially sensitive business data'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://www.notion.so/security',
  },
  'Zoom': {
    name: 'Zoom',
    website: 'https://zoom.us',
    category: 'Communication',
    riskTier: 'low',
    dataAccess: ['meeting recordings (if enabled)', 'contact info'],
    hasProductionAccess: false,
    hasSoc2Report: true,
    soc2ReportUrl: 'https://explore.zoom.us/en/trust',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getNextReviewDate(tier: VendorRiskTier): string {
  return addDays(tier === 'critical' || tier === 'high' ? 365 : tier === 'medium' ? 730 : 1095);
}

function makeVendor(known: KnownVendor): Vendor {
  return {
    id: known.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: known.name,
    website: known.website,
    category: known.category,
    riskTier: known.riskTier,
    dataAccess: known.dataAccess,
    hasProductionAccess: known.hasProductionAccess,
    assessmentStatus: 'not-started',
    lastReviewed: null,
    nextReviewDue: getNextReviewDate(known.riskTier),
    hasSoc2Report: known.hasSoc2Report,
    soc2ReportUrl: known.soc2ReportUrl,
    hasDPA: null,
    hasBAA: null,
    notes: '',
    isAutoDetected: true,
    confirmedByUser: false,
    assessmentHistory: [],
  };
}

// ─── Auto-populate from Intake ────────────────────────────────────────────────

export function autoPopulateVendors(data: IntakeFormData): Vendor[] {
  const vendors: Map<string, Vendor> = new Map();

  function add(key: string) {
    if (KNOWN_VENDORS[key] && !vendors.has(key)) {
      vendors.set(key, makeVendor(KNOWN_VENDORS[key]));
    }
  }

  // Cloud providers
  for (const provider of data.technicalInfrastructure.cloudProviders) {
    add(provider);
  }

  // Source code management
  const scm = data.technicalInfrastructure.sourceCodeManagement;
  if (scm) add(scm);

  // Payment data → Stripe
  if (data.dataHandling.handlesPaymentData) {
    add('Stripe');
  }

  // MongoDB as cloud database
  if (data.technicalInfrastructure.databaseTypes.includes('MongoDB')) {
    add('MongoDB');
  }

  // Always add Slack as a common communication tool (medium risk, safe default)
  add('Slack');

  return Array.from(vendors.values());
}

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

export function getKnownVendorInfo(name: string): KnownVendor | null {
  return KNOWN_VENDORS[name] ?? null;
}

export function isKnownVendor(name: string): boolean {
  return name in KNOWN_VENDORS;
}
