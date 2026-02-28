export type IntegrationStatus = 'not_connected' | 'connecting' | 'connected' | 'error';

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: string;
  status: IntegrationStatus;
  lastSync?: string;
  errorMessage?: string;
  requiredScopes?: string[];
  docsUrl?: string;
}

export type IntegrationCategory = 
  | 'cloud_provider'
  | 'identity_provider'
  | 'source_control'
  | 'ci_cd'
  | 'monitoring'
  | 'database'
  | 'communication'
  | 'hr_system';

export const INTEGRATION_CATEGORIES: Record<IntegrationCategory, { name: string; description: string }> = {
  cloud_provider: {
    name: 'Cloud Providers',
    description: 'Connect your cloud infrastructure to assess security configurations',
  },
  identity_provider: {
    name: 'Identity & Access',
    description: 'Verify SSO, MFA, and access control configurations',
  },
  source_control: {
    name: 'Source Control',
    description: 'Check repository security settings and access controls',
  },
  ci_cd: {
    name: 'CI/CD Pipelines',
    description: 'Verify deployment security and change management',
  },
  monitoring: {
    name: 'Monitoring & Logging',
    description: 'Confirm logging, alerting, and audit trail capabilities',
  },
  database: {
    name: 'Databases',
    description: 'Assess database security and encryption settings',
  },
  communication: {
    name: 'Communication',
    description: 'Verify secure communication and data retention policies',
  },
  hr_system: {
    name: 'HR & People',
    description: 'Connect HR systems for employee lifecycle management',
  },
};

export const ALL_INTEGRATIONS: Omit<Integration, 'status'>[] = [
  // Cloud Providers
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Connect via IAM role to assess EC2, S3, RDS, IAM policies, CloudTrail, and more',
    category: 'cloud_provider',
    icon: 'aws',
    requiredScopes: ['SecurityAudit', 'ViewOnlyAccess'],
    docsUrl: 'https://docs.aws.amazon.com',
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    description: 'Connect via service account to assess Compute, Storage, IAM, and audit logs',
    category: 'cloud_provider',
    icon: 'gcp',
    requiredScopes: ['Viewer', 'Security Reviewer'],
    docsUrl: 'https://cloud.google.com/docs',
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    description: 'Connect via service principal to assess VMs, Storage, AD, and security center',
    category: 'cloud_provider',
    icon: 'azure',
    requiredScopes: ['Reader', 'Security Reader'],
    docsUrl: 'https://docs.microsoft.com/azure',
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    description: 'Connect via API token to assess Droplets, Spaces, and firewall rules',
    category: 'cloud_provider',
    icon: 'digitalocean',
    requiredScopes: ['read'],
    docsUrl: 'https://docs.digitalocean.com',
  },
  {
    id: 'heroku',
    name: 'Heroku',
    description: 'Connect via OAuth to assess app configurations and add-ons',
    category: 'cloud_provider',
    icon: 'heroku',
    requiredScopes: ['read'],
    docsUrl: 'https://devcenter.heroku.com',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Connect via access token to assess project settings and environment variables',
    category: 'cloud_provider',
    icon: 'vercel',
    requiredScopes: ['read'],
    docsUrl: 'https://vercel.com/docs',
  },

  // Identity Providers
  {
    id: 'okta',
    name: 'Okta',
    description: 'Verify MFA enforcement, password policies, and user provisioning',
    category: 'identity_provider',
    icon: 'okta',
    requiredScopes: ['okta.users.read', 'okta.policies.read'],
    docsUrl: 'https://developer.okta.com',
  },
  {
    id: 'azure_ad',
    name: 'Azure Active Directory',
    description: 'Check conditional access policies, MFA status, and group memberships',
    category: 'identity_provider',
    icon: 'microsoft',
    requiredScopes: ['Directory.Read.All', 'Policy.Read.All'],
    docsUrl: 'https://docs.microsoft.com/azure/active-directory',
  },
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    description: 'Verify 2FA enforcement, admin roles, and security settings',
    category: 'identity_provider',
    icon: 'google',
    requiredScopes: ['admin.directory.user.readonly'],
    docsUrl: 'https://developers.google.com/admin-sdk',
  },
  {
    id: 'onelogin',
    name: 'OneLogin',
    description: 'Check MFA policies, user status, and application access',
    category: 'identity_provider',
    icon: 'onelogin',
    requiredScopes: ['Read users', 'Read policies'],
    docsUrl: 'https://developers.onelogin.com',
  },

  // Source Control
  {
    id: 'github',
    name: 'GitHub',
    description: 'Assess branch protection, code review requirements, and access controls',
    category: 'source_control',
    icon: 'github',
    requiredScopes: ['repo', 'read:org', 'admin:org_hook'],
    docsUrl: 'https://docs.github.com',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Check merge request approvals, protected branches, and audit events',
    category: 'source_control',
    icon: 'gitlab',
    requiredScopes: ['read_api', 'read_repository'],
    docsUrl: 'https://docs.gitlab.com',
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    description: 'Verify branch permissions, PR requirements, and workspace settings',
    category: 'source_control',
    icon: 'bitbucket',
    requiredScopes: ['repository', 'account'],
    docsUrl: 'https://developer.atlassian.com/bitbucket',
  },

  // CI/CD
  {
    id: 'github_actions',
    name: 'GitHub Actions',
    description: 'Review workflow security, secrets management, and deployment controls',
    category: 'ci_cd',
    icon: 'github',
    requiredScopes: ['actions:read', 'secrets:read'],
    docsUrl: 'https://docs.github.com/actions',
  },
  {
    id: 'circleci',
    name: 'CircleCI',
    description: 'Check pipeline configurations, environment variables, and contexts',
    category: 'ci_cd',
    icon: 'circleci',
    requiredScopes: ['read'],
    docsUrl: 'https://circleci.com/docs',
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    description: 'Assess job configurations, credentials management, and access controls',
    category: 'ci_cd',
    icon: 'jenkins',
    requiredScopes: ['Overall/Read'],
    docsUrl: 'https://www.jenkins.io/doc',
  },

  // Monitoring
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Verify logging coverage, alert configurations, and retention policies',
    category: 'monitoring',
    icon: 'datadog',
    requiredScopes: ['logs_read', 'monitors_read'],
    docsUrl: 'https://docs.datadoghq.com',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    description: 'Check log ingestion, search capabilities, and data retention',
    category: 'monitoring',
    icon: 'splunk',
    requiredScopes: ['search', 'list_inputs'],
    docsUrl: 'https://docs.splunk.com',
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    description: 'Verify incident response workflows and escalation policies',
    category: 'monitoring',
    icon: 'pagerduty',
    requiredScopes: ['read'],
    docsUrl: 'https://developer.pagerduty.com',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Check error tracking coverage and alert configurations',
    category: 'monitoring',
    icon: 'sentry',
    requiredScopes: ['project:read', 'org:read'],
    docsUrl: 'https://docs.sentry.io',
  },

  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Verify workspace settings, retention policies, and app permissions',
    category: 'communication',
    icon: 'slack',
    requiredScopes: ['admin.teams:read', 'users:read'],
    docsUrl: 'https://api.slack.com',
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Check team settings, guest access policies, and data retention',
    category: 'communication',
    icon: 'microsoft',
    requiredScopes: ['Team.ReadBasic.All'],
    docsUrl: 'https://docs.microsoft.com/graph/teams-concept-overview',
  },

  // HR Systems
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'Sync employee data for access reviews and offboarding verification',
    category: 'hr_system',
    icon: 'bamboohr',
    requiredScopes: ['employees:read'],
    docsUrl: 'https://documentation.bamboohr.com',
  },
  {
    id: 'rippling',
    name: 'Rippling',
    description: 'Connect for employee lifecycle management and device tracking',
    category: 'hr_system',
    icon: 'rippling',
    requiredScopes: ['employees:read', 'devices:read'],
    docsUrl: 'https://developer.rippling.com',
  },
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Sync employee directory for access management verification',
    category: 'hr_system',
    icon: 'gusto',
    requiredScopes: ['employees:read'],
    docsUrl: 'https://docs.gusto.com',
  },
];

export interface ComplianceCheck {
  id: string;
  integrationId: string;
  name: string;
  description: string;
  controlIds: string[];
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning' | 'not_applicable';
  result?: {
    passed: boolean;
    message: string;
    details?: string;
    remediation?: string;
  };
}

export function getRelevantIntegrations(intakeData: {
  cloudProviders: string[];
  sourceCodeManagement: string;
  hasSSO: boolean;
  ssoProvider: string;
  hasCI_CD: boolean;
  hasMonitoring: boolean;
}): string[] {
  const relevant: string[] = [];

  // Map cloud providers
  const cloudMapping: Record<string, string> = {
    'AWS': 'aws',
    'Google Cloud (GCP)': 'gcp',
    'Microsoft Azure': 'azure',
    'DigitalOcean': 'digitalocean',
    'Heroku': 'heroku',
    'Vercel': 'vercel',
  };

  intakeData.cloudProviders.forEach(provider => {
    if (cloudMapping[provider]) {
      relevant.push(cloudMapping[provider]);
    }
  });

  // Map source control
  const scmMapping: Record<string, string[]> = {
    'GitHub': ['github', 'github_actions'],
    'GitLab': ['gitlab'],
    'Bitbucket': ['bitbucket'],
    'Azure DevOps': ['azure'],
  };

  if (scmMapping[intakeData.sourceCodeManagement]) {
    relevant.push(...scmMapping[intakeData.sourceCodeManagement]);
  }

  // Map SSO provider
  const ssoMapping: Record<string, string> = {
    'Okta': 'okta',
    'Azure AD': 'azure_ad',
    'Google Workspace': 'google_workspace',
    'OneLogin': 'onelogin',
  };

  if (intakeData.hasSSO && ssoMapping[intakeData.ssoProvider]) {
    relevant.push(ssoMapping[intakeData.ssoProvider]);
  }

  // Always recommend Slack for communication
  relevant.push('slack');

  return [...new Set(relevant)];
}
