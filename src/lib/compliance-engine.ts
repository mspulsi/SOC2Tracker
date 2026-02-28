import type { IntakeFormData } from '@/types/intake';
import type {
  ComplianceRoadmap,
  GapItem,
  PolicyItem,
  EvidenceItem,
  RiskItem,
  Sprint,
  Task,
  RiskLevel,
} from '@/types/roadmap';

// ─── Maturity Score ───────────────────────────────────────────────────────────

function calcMaturityScore(data: IntakeFormData): number {
  let score = 0;

  const { accessControl, securityPosture, technicalInfrastructure, dataHandling, businessContinuity, vendorManagement } = data;

  // Access controls (34 pts)
  if (accessControl.hasSSO) score += 8;
  if (accessControl.hasMFA) {
    score += accessControl.mfaCoverage === 'All users' ? 10 : 5;
  }
  if (accessControl.hasRBAC) score += 6;
  if (accessControl.hasAccessReviews) score += 5;
  if (accessControl.hasPrivilegedAccessManagement) score += 5;

  // Security posture (30 pts)
  if (securityPosture.hasSecurityPolicies) score += 8;
  if (securityPosture.hasIncidentResponsePlan) score += 7;
  if (securityPosture.hasVulnerabilityManagement) score += 6;
  if (securityPosture.hasPenetrationTesting) score += 5;
  if (securityPosture.hasSecurityAwareness) score += 4;

  // Technical infrastructure (10 pts)
  if (technicalInfrastructure.hasMonitoring) score += 6;
  if (technicalInfrastructure.hasCI_CD) score += 4;

  // Data handling (12 pts)
  if (dataHandling.hasDataClassification) score += 4;
  if (dataHandling.hasEncryptionAtRest) score += 4;
  if (dataHandling.hasEncryptionInTransit) score += 4;

  // Business continuity (13 pts)
  if (businessContinuity.hasBackupStrategy) score += 5;
  if (businessContinuity.hasDisasterRecoveryPlan) score += 5;
  if (businessContinuity.hasBCPTesting) score += 3;

  // Vendor management (9 pts)
  if (vendorManagement.hasVendorAssessment) score += 4;
  if (vendorManagement.hasDataProcessingAgreements) score += 3;
  if (vendorManagement.hasVendorInventory) score += 2;

  return Math.min(score, 100);
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score < 30) return 'critical';
  if (score < 50) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function calcTimeline(data: IntakeFormData, maturityScore: number): number {
  let weeks = data.soc2Type === 'type1' ? 8 : 20;

  // Maturity modifier
  if (maturityScore < 30) weeks += 8;
  else if (maturityScore < 50) weeks += 4;
  else if (maturityScore >= 70) weeks -= 4;

  // Sensitive data adds audit scope
  if (data.dataHandling.handlesPHI || data.dataHandling.handlesPaymentData) weeks += 4;

  // Extra trust criteria beyond Security
  const extraCriteria = data.trustServiceCriteria.filter(c => c !== 'security').length;
  weeks += extraCriteria * 2;

  // Org factors
  if (!data.securityPosture.hasSecurityTeam) weeks += 4;
  const bigTeam = ['51-200', '201-500', '500+'].includes(data.companyInfo.employeeCount);
  if (bigTeam) weeks += 2;

  return Math.max(weeks, data.soc2Type === 'type1' ? 6 : 12);
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

function buildGaps(data: IntakeFormData): GapItem[] {
  const gaps: GapItem[] = [];
  const { accessControl, securityPosture, technicalInfrastructure, dataHandling, businessContinuity, vendorManagement } = data;
  const hasAvailability = data.trustServiceCriteria.includes('availability');
  const hasPrivacy = data.trustServiceCriteria.includes('privacy');

  // CC6.1 – Logical and Physical Access
  if (!accessControl.hasSSO && !accessControl.hasMFA) {
    gaps.push({
      control: 'CC6.1 – Logical Access Controls',
      currentState: 'No SSO or MFA implemented',
      requiredState: 'All production systems require MFA; access managed through centralized IdP',
      severity: 'critical',
    });
  } else if (!accessControl.hasMFA) {
    gaps.push({
      control: 'CC6.1 – Logical Access Controls',
      currentState: 'SSO in place but MFA not enforced',
      requiredState: 'MFA required for all users accessing production systems',
      severity: 'high',
    });
  } else if (accessControl.mfaCoverage !== 'All users') {
    gaps.push({
      control: 'CC6.1 – Logical Access Controls',
      currentState: `MFA only applied to ${accessControl.mfaCoverage.toLowerCase()}`,
      requiredState: 'MFA enforced for all users',
      severity: 'high',
    });
  }

  // CC6.2 – Authentication
  if (!accessControl.hasRBAC) {
    gaps.push({
      control: 'CC6.2 – Access Authorization',
      currentState: 'No formal role-based access control documented',
      requiredState: 'User access assigned by role; least-privilege enforced',
      severity: 'high',
    });
  }

  // CC6.3 – Access Reviews
  if (!accessControl.hasAccessReviews) {
    gaps.push({
      control: 'CC6.3 – Access Reviews',
      currentState: 'No periodic access review process',
      requiredState: 'Quarterly access reviews with documented approval',
      severity: 'medium',
    });
  }

  // CC7.1 – Vulnerability Management
  if (!securityPosture.hasVulnerabilityManagement) {
    gaps.push({
      control: 'CC7.1 – Vulnerability Management',
      currentState: 'No vulnerability scanning or management program',
      requiredState: 'Regular vulnerability scans; critical findings remediated within SLA',
      severity: 'high',
    });
  }

  // CC7.2 – Monitoring
  if (!technicalInfrastructure.hasMonitoring) {
    gaps.push({
      control: 'CC7.2 – System Monitoring',
      currentState: 'No centralized monitoring or alerting',
      requiredState: 'Security events monitored and alerted; logs retained 90+ days',
      severity: data.soc2Type === 'type2' ? 'critical' : 'high',
    });
  }

  // CC8.1 – Change Management
  if (!technicalInfrastructure.hasCI_CD) {
    gaps.push({
      control: 'CC8.1 – Change Management',
      currentState: 'No formal CI/CD or change management process',
      requiredState: 'All production changes go through documented, approved pipeline',
      severity: 'medium',
    });
  }

  // CC9.1 – Risk Management
  if (!securityPosture.hasIncidentResponsePlan) {
    gaps.push({
      control: 'CC9.1 – Incident Response',
      currentState: 'No documented incident response plan',
      requiredState: 'Documented IRP tested at least annually',
      severity: 'high',
    });
  }

  if (!securityPosture.hasSecurityPolicies) {
    gaps.push({
      control: 'CC1.x – Control Environment',
      currentState: 'No formal information security policies documented',
      requiredState: 'Information security policy and supporting policies approved by management',
      severity: 'critical',
    });
  }

  // Data encryption
  if (!dataHandling.hasEncryptionAtRest) {
    gaps.push({
      control: 'CC6.7 – Encryption at Rest',
      currentState: 'Data not encrypted at rest',
      requiredState: 'All sensitive data encrypted at rest using AES-256 or equivalent',
      severity: data.dataHandling.handlesCustomerPII || data.dataHandling.handlesPHI ? 'critical' : 'high',
    });
  }
  if (!dataHandling.hasEncryptionInTransit) {
    gaps.push({
      control: 'CC6.7 – Encryption in Transit',
      currentState: 'Data not encrypted in transit',
      requiredState: 'All data transmitted over TLS 1.2+',
      severity: 'high',
    });
  }

  // Availability criteria gaps
  if (hasAvailability) {
    if (!businessContinuity.hasBackupStrategy) {
      gaps.push({
        control: 'A1.2 – System Recovery',
        currentState: 'No backup strategy defined',
        requiredState: 'Automated backups with documented RTO/RPO and tested restore procedures',
        severity: 'critical',
      });
    }
    if (!businessContinuity.hasDisasterRecoveryPlan) {
      gaps.push({
        control: 'A1.3 – Disaster Recovery',
        currentState: 'No disaster recovery plan',
        requiredState: 'Documented DR plan tested at least annually',
        severity: 'high',
      });
    }
  }

  // Privacy criteria gaps
  if (hasPrivacy && !dataHandling.hasDataClassification) {
    gaps.push({
      control: 'P1.x – Privacy',
      currentState: 'No data classification or privacy notice',
      requiredState: 'Data classified by sensitivity; privacy notice published; consent mechanisms in place',
      severity: 'high',
    });
  }

  // Vendor management
  if (!vendorManagement.hasVendorAssessment && vendorManagement.criticalVendorCount !== '0-5') {
    gaps.push({
      control: 'CC9.2 – Vendor Risk',
      currentState: 'No vendor security assessments performed',
      requiredState: 'Critical vendors assessed annually; risk ratings documented',
      severity: 'medium',
    });
  }

  return gaps;
}

// ─── Policies ─────────────────────────────────────────────────────────────────

function buildPolicies(data: IntakeFormData): PolicyItem[] {
  const hasPolicies = data.securityPosture.hasSecurityPolicies;
  const hasIRP = data.securityPosture.hasIncidentResponsePlan;

  const policies: PolicyItem[] = [
    { id: 'isp', name: 'Information Security Policy', exists: hasPolicies, required: true },
    { id: 'acp', name: 'Access Control Policy', exists: hasPolicies, required: true },
    { id: 'irp', name: 'Incident Response Policy', exists: hasIRP, required: true },
    { id: 'cmp', name: 'Change Management Policy', exists: data.technicalInfrastructure.hasCI_CD && hasPolicies, required: true },
    { id: 'vmp', name: 'Vendor Management Policy', exists: data.vendorManagement.hasVendorAssessment, required: true },
    { id: 'rap', name: 'Risk Assessment Policy', exists: hasPolicies, required: true },
    { id: 'bcp', name: 'Business Continuity & Disaster Recovery Policy', exists: data.businessContinuity.hasDisasterRecoveryPlan, required: true },
    { id: 'dcp', name: 'Data Classification Policy', exists: data.dataHandling.hasDataClassification, required: true },
    { id: 'aup', name: 'Acceptable Use Policy', exists: hasPolicies, required: true },
    { id: 'pap', name: 'Password & Authentication Policy', exists: hasPolicies && data.accessControl.hasMFA, required: true },
  ];

  // Conditional policies based on data types
  if (data.dataHandling.handlesPHI) {
    policies.push({
      id: 'hipaa',
      name: 'HIPAA-Aligned Data Handling Policy',
      exists: false,
      required: true,
      conditional: 'Required because you handle Protected Health Information (PHI)',
    });
  }

  if (data.dataHandling.handlesPaymentData) {
    policies.push({
      id: 'pci',
      name: 'Cardholder Data Security Policy',
      exists: false,
      required: true,
      conditional: 'Required because you handle payment card data',
    });
  }

  const hasEU = data.dataHandling.dataResidencyRequirements.includes('European Union (GDPR)');
  if (hasEU || data.dataHandling.handlesCustomerPII) {
    policies.push({
      id: 'gdpr',
      name: 'Data Subject Rights & Privacy Policy',
      exists: false,
      required: true,
      conditional: hasEU
        ? 'Required because you operate in the EU (GDPR)'
        : 'Required because you handle customer PII',
    });
  }

  return policies;
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

function buildEvidence(data: IntakeFormData): EvidenceItem[] {
  const isType2 = data.soc2Type === 'type2';
  const clouds = data.technicalInfrastructure.cloudProviders;
  const scm = data.technicalInfrastructure.sourceCodeManagement;

  // Determine cloud-specific collection method for logs
  let logSource = 'your cloud provider\'s logging console';
  if (clouds.includes('AWS')) logSource = 'AWS CloudTrail and CloudWatch';
  else if (clouds.includes('Google Cloud (GCP)')) logSource = 'GCP Cloud Audit Logs and Cloud Logging';
  else if (clouds.includes('Microsoft Azure')) logSource = 'Azure Monitor and Activity Log';

  // SCM-specific change management
  let changeSource = 'your version control system';
  if (scm === 'GitHub') changeSource = 'GitHub pull request history and branch protection settings';
  else if (scm === 'GitLab') changeSource = 'GitLab merge request history and protected branches';
  else if (scm === 'Bitbucket') changeSource = 'Bitbucket pull request history';

  const evidence: EvidenceItem[] = [
    {
      id: 'access-list',
      name: 'User Access List with Roles',
      description: 'Complete list of all users with their roles and access levels to production systems',
      collectionMethod: data.accessControl.hasSSO
        ? `Export user roster from your ${data.accessControl.ssoProvider || 'SSO provider'} admin console`
        : 'Export user list from each system manually; document roles in a spreadsheet',
      daysRequired: 0,
      alreadyHave: data.accessControl.hasRBAC,
      category: 'access',
    },
    {
      id: 'mfa-config',
      name: 'MFA Configuration Screenshots',
      description: 'Documentation that MFA is enforced across all required accounts',
      collectionMethod: data.accessControl.hasSSO
        ? `Screenshot MFA policy settings in your ${data.accessControl.ssoProvider || 'SSO'} admin console`
        : 'Screenshot MFA settings in each tool individually (GitHub, AWS, etc.)',
      daysRequired: 0,
      alreadyHave: data.accessControl.hasMFA && data.accessControl.mfaCoverage === 'All users',
      category: 'access',
    },
    {
      id: 'encryption-config',
      name: 'Encryption Configuration Documentation',
      description: 'Evidence that data is encrypted at rest and in transit',
      collectionMethod: clouds.includes('AWS')
        ? 'Screenshot S3 bucket encryption settings, RDS encryption, and ACM/TLS configuration'
        : 'Document encryption settings for each storage service and TLS certificates in use',
      daysRequired: 0,
      alreadyHave: data.dataHandling.hasEncryptionAtRest && data.dataHandling.hasEncryptionInTransit,
      category: 'policy',
    },
    {
      id: 'vuln-scan',
      name: 'Vulnerability Scan Results',
      description: 'Recent scan showing identified vulnerabilities and remediation status',
      collectionMethod: 'Export report from your vulnerability scanner (e.g., Qualys, Tenable, AWS Inspector, GitHub Dependabot)',
      daysRequired: 0,
      alreadyHave: data.securityPosture.hasVulnerabilityManagement,
      category: 'monitoring',
    },
    {
      id: 'policies-signed',
      name: 'Signed Security Policies',
      description: 'All required security policies signed/approved by management',
      collectionMethod: 'Export signed policy documents from your document management system or HR platform',
      daysRequired: 0,
      alreadyHave: data.securityPosture.hasSecurityPolicies,
      category: 'policy',
    },
    {
      id: 'vendor-inventory',
      name: 'Vendor Inventory & Risk Ratings',
      description: 'List of all critical vendors with their security posture and risk rating',
      collectionMethod: 'Export vendor list from your GRC tool, or compile from contract records; include SOC 2 reports for critical vendors',
      daysRequired: 0,
      alreadyHave: data.vendorManagement.hasVendorInventory && data.vendorManagement.hasVendorAssessment,
      category: 'vendor',
    },
    {
      id: 'irp-doc',
      name: 'Incident Response Plan',
      description: 'Documented IRP with roles, escalation procedures, and communication templates',
      collectionMethod: 'Retrieve current IRP document; ensure it has been reviewed/tested within the past 12 months',
      daysRequired: 0,
      alreadyHave: data.securityPosture.hasIncidentResponsePlan,
      category: 'policy',
    },
  ];

  // Type 2 requires rolling evidence over the audit period
  if (isType2) {
    evidence.push(
      {
        id: 'access-logs',
        name: '90-Day Access & Authentication Logs',
        description: 'Logs showing who accessed what systems and when over the audit period',
        collectionMethod: `Export authentication logs from ${logSource}; filter for production system access`,
        daysRequired: 90,
        alreadyHave: data.technicalInfrastructure.hasMonitoring,
        category: 'access',
      },
      {
        id: 'change-records',
        name: '90-Day Change Management Records',
        description: 'All production changes with approvals over the audit period',
        collectionMethod: `Export from ${changeSource}; auditors look for approved PRs/MRs before merges`,
        daysRequired: 90,
        alreadyHave: data.technicalInfrastructure.hasCI_CD,
        category: 'change',
      },
      {
        id: 'access-reviews',
        name: 'Quarterly Access Review Evidence',
        description: 'Documentation that user access was reviewed and certified',
        collectionMethod: 'Export access review completion records; screenshot approvals or certification emails',
        daysRequired: 90,
        alreadyHave: data.accessControl.hasAccessReviews,
        category: 'access',
      },
      {
        id: 'monitoring-alerts',
        name: '90-Day Monitoring Alerts & Responses',
        description: 'Security alert log showing alerts generated and how they were handled',
        collectionMethod: `Export alert history from ${logSource} or your SIEM; include ticket/resolution records`,
        daysRequired: 90,
        alreadyHave: data.technicalInfrastructure.hasMonitoring,
        category: 'monitoring',
      },
      {
        id: 'backup-logs',
        name: 'Backup Completion Logs',
        description: 'Evidence that backups ran successfully over the audit period',
        collectionMethod: clouds.includes('AWS')
          ? 'Export AWS Backup job history; include restore test documentation'
          : 'Export backup job logs from your backup solution; include at least one documented restore test',
        daysRequired: 90,
        alreadyHave: data.businessContinuity.hasBackupStrategy,
        category: 'backup',
      },
      {
        id: 'training-records',
        name: 'Security Awareness Training Records',
        description: 'Completion records showing all employees completed security training',
        collectionMethod: 'Export completion report from your training platform (KnowBe4, Proofpoint, etc.) or HR system',
        daysRequired: 0,
        alreadyHave: data.securityPosture.hasSecurityAwareness,
        category: 'training',
      }
    );
  }

  return evidence;
}

// ─── Risks ────────────────────────────────────────────────────────────────────

function buildRisks(data: IntakeFormData): RiskItem[] {
  const risks: RiskItem[] = [];
  const { accessControl, securityPosture, technicalInfrastructure, dataHandling, businessContinuity, vendorManagement } = data;
  const handlesHighSensitivity = dataHandling.handlesCustomerPII || dataHandling.handlesPHI || dataHandling.handlesPaymentData;

  if (!accessControl.hasMFA && handlesHighSensitivity) {
    risks.push({
      id: 'risk-mfa',
      title: 'No MFA on Accounts Accessing Sensitive Data',
      description: `Your systems handle ${dataHandling.handlesPHI ? 'PHI' : dataHandling.handlesPaymentData ? 'payment data' : 'customer PII'} but accounts are not protected by multi-factor authentication. A single compromised password exposes regulated data.`,
      severity: 'critical',
      remediation: 'Enable MFA across all accounts immediately. If you have SSO, this is a single policy change. Prioritize this above all other compliance work.',
      sprintReference: 1,
    });
  } else if (!accessControl.hasMFA) {
    risks.push({
      id: 'risk-mfa',
      title: 'No Multi-Factor Authentication',
      description: 'Accounts are protected only by passwords. Credential theft is the #1 cause of breaches and the #1 thing auditors look for.',
      severity: 'high',
      remediation: 'Enable MFA for all users before beginning evidence collection. This is a blocker for SOC 2.',
      sprintReference: 1,
    });
  }

  if (!technicalInfrastructure.hasMonitoring && data.soc2Type === 'type2') {
    risks.push({
      id: 'risk-monitoring',
      title: 'No Monitoring — Cannot Produce Type 2 Evidence',
      description: 'Type 2 audits require 90 days of continuous monitoring evidence. Without logging and alerting in place now, you cannot start your audit window.',
      severity: 'critical',
      remediation: 'Set up centralized logging immediately — this starts your audit clock. Use your cloud provider\'s native logging (CloudTrail, GCP Audit Logs) as a fast first step.',
      sprintReference: 1,
    });
  } else if (!technicalInfrastructure.hasMonitoring) {
    risks.push({
      id: 'risk-monitoring',
      title: 'No System Monitoring or Alerting',
      description: 'Without monitoring you cannot detect or demonstrate response to security events — a core SOC 2 requirement.',
      severity: 'high',
      remediation: 'Implement centralized logging and alerting. Your cloud provider\'s native tools are a fast, cost-effective starting point.',
      sprintReference: 2,
    });
  }

  if (!securityPosture.hasIncidentResponsePlan) {
    risks.push({
      id: 'risk-irp',
      title: 'No Incident Response Plan',
      description: 'If a security incident occurs without a documented response plan, it is both an operational crisis and an automatic audit finding.',
      severity: 'high',
      remediation: 'Draft an IRP this sprint. It does not need to be perfect — a documented, approved plan beats an unwritten "we know what to do."',
      sprintReference: 2,
    });
  }

  if (!securityPosture.hasSecurityPolicies) {
    risks.push({
      id: 'risk-policies',
      title: 'No Formal Security Policies',
      description: 'Security policies are the foundation auditors check first. Without them, every other control you have is unanchored — there\'s nothing to audit against.',
      severity: 'critical',
      remediation: 'Write and approve your Information Security Policy first. It takes 2-4 hours with a template and unlocks all other compliance work.',
      sprintReference: 1,
    });
  }

  const vendorCount = vendorManagement.criticalVendorCount;
  const manyVendors = ['16-30', '31-50', '50+'].includes(vendorCount);
  if (!vendorManagement.hasVendorAssessment && manyVendors) {
    risks.push({
      id: 'risk-vendors',
      title: 'Unassessed Third-Party Risk',
      description: `You have ${vendorCount} vendors with no formal security assessments. Auditors treat your vendors as extensions of your security boundary.`,
      severity: 'medium',
      remediation: 'Prioritize your top 10 critical vendors. Request their SOC 2 reports. For others, use a vendor security questionnaire.',
      sprintReference: 3,
    });
  }

  const hasAvailability = data.trustServiceCriteria.includes('availability');
  const weakBackup = ['Weekly', 'Monthly', 'No regular backups'].includes(businessContinuity.backupFrequency);
  if (hasAvailability && (!businessContinuity.hasBackupStrategy || weakBackup)) {
    risks.push({
      id: 'risk-availability',
      title: 'Backup Strategy Does Not Support Availability Commitments',
      description: `You selected the Availability trust criteria, but your backup frequency (${businessContinuity.backupFrequency || 'none'}) may not support your RTO/RPO targets.`,
      severity: 'high',
      remediation: 'Define explicit RTO and RPO targets, then verify your backup strategy meets them. Test a restore before your audit window opens.',
      sprintReference: 2,
    });
  }

  // Return top 5 risks sorted by severity
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}

// ─── Sprints ──────────────────────────────────────────────────────────────────

function buildSprints(
  data: IntakeFormData,
  gaps: ReturnType<typeof buildGaps>,
  totalWeeks: number
): Sprint[] {
  const sprints: Sprint[] = [];
  const company = data.companyInfo.companyName;
  const clouds = data.technicalInfrastructure.cloudProviders;
  const scm = data.technicalInfrastructure.sourceCodeManagement;
  const ssoProvider = data.accessControl.ssoProvider;

  const cloudHint = clouds.length > 0 && !clouds.includes('None/On-premise only')
    ? clouds.filter(c => c !== 'None/On-premise only').join(' / ')
    : 'your infrastructure';

  const scmHint = scm || 'your source control system';

  // Sprint 1: Foundation & Critical Fixes
  const sprint1Tasks: Task[] = [];

  if (!data.securityPosture.hasSecurityPolicies) {
    sprint1Tasks.push({
      id: 's1-policy',
      title: 'Write Information Security Policy',
      description: 'Draft your foundational security policy covering scope, roles, responsibilities, and control objectives.',
      category: 'policy',
      priority: 'critical',
      effort: 'days',
      controlReference: 'CC1.1',
      completed: false,
      why: `This is the first document auditors request from ${company}. Everything else is built on it.`,
    });
  }

  if (!data.accessControl.hasMFA || data.accessControl.mfaCoverage !== 'All users') {
    sprint1Tasks.push({
      id: 's1-mfa',
      title: 'Enforce MFA for All Users',
      description: ssoProvider && ssoProvider !== 'None'
        ? `Enable MFA enforcement policy in your ${ssoProvider} admin console. Set a 72-hour grace period for adoption.`
        : 'Enable MFA in each system independently: start with admin accounts, then all users. Use an authenticator app (not SMS).',
      category: 'technical',
      priority: 'critical',
      effort: 'hours',
      controlReference: 'CC6.1',
      completed: false,
      why: `MFA is the single highest-impact security control for ${company}. It blocks over 99% of credential-based attacks.`,
    });
  }

  if (!data.technicalInfrastructure.hasMonitoring) {
    sprint1Tasks.push({
      id: 's1-logging',
      title: 'Enable Centralized Logging & Alerting',
      description: clouds.includes('AWS')
        ? 'Enable AWS CloudTrail in all regions, configure CloudWatch log groups, set retention to 365 days, and create alerts for root account usage and failed logins.'
        : clouds.includes('Google Cloud (GCP)')
        ? 'Enable Cloud Audit Logs for all services, configure log sinks to Cloud Storage, set up Cloud Monitoring alerts for admin activity.'
        : 'Enable audit logging in all production systems; aggregate into a central location with 365-day retention.',
      category: 'technical',
      priority: data.soc2Type === 'type2' ? 'critical' : 'high',
      effort: 'days',
      controlReference: 'CC7.2',
      completed: false,
      why: data.soc2Type === 'type2'
        ? `For ${company}'s Type 2 audit, every day without logging is a day you can't count toward your 90-day evidence period.`
        : `Auditors need to see that ${company} can detect and respond to security events.`,
    });
  }

  sprints.push({
    number: 1,
    name: 'Foundation & Critical Controls',
    weeks: 'Weeks 1–2',
    focus: 'Address critical gaps that block all other compliance work',
    tasks: sprint1Tasks.length > 0 ? sprint1Tasks : [{
      id: 's1-review',
      title: 'Document Your Existing Controls',
      description: 'Your security posture is strong. Use this sprint to document all existing controls in a formal control matrix — this is what auditors will review.',
      category: 'process',
      priority: 'high',
      effort: 'days',
      controlReference: 'CC1.x',
      completed: false,
      why: `${company} already has most controls in place. The audit risk is documentation gaps, not control gaps.`,
    }],
  });

  // Sprint 2: Access Controls & Policies
  const sprint2Tasks: Task[] = [];

  if (!data.accessControl.hasRBAC) {
    sprint2Tasks.push({
      id: 's2-rbac',
      title: 'Define and Document Role-Based Access',
      description: 'Create a role matrix mapping job functions to required system access. Document who has admin vs. standard access in each production system.',
      category: 'process',
      priority: 'high',
      effort: 'days',
      controlReference: 'CC6.2',
      completed: false,
      why: `Auditors will ask ${company} to show that access is granted by role, not individually. Without a role matrix, every access grant looks ad hoc.`,
    });
  }

  if (!data.securityPosture.hasIncidentResponsePlan) {
    sprint2Tasks.push({
      id: 's2-irp',
      title: 'Write Incident Response Plan',
      description: 'Document detection → containment → eradication → recovery → lessons learned. Assign named owners for each phase. Include contact list and escalation thresholds.',
      category: 'policy',
      priority: 'high',
      effort: 'days',
      controlReference: 'CC9.1',
      completed: false,
      why: `If ${company} has a breach and there is no written IRP, it is both a crisis and an automatic audit finding.`,
    });
  }

  if (!data.accessControl.hasAccessReviews) {
    sprint2Tasks.push({
      id: 's2-access-review',
      title: 'Run First Formal Access Review',
      description: 'Pull the current user list for all production systems. Have each manager certify their team\'s access is appropriate. Remove any stale or excess access. Document the review.',
      category: 'process',
      priority: 'medium',
      effort: 'days',
      controlReference: 'CC6.3',
      completed: false,
      why: `Access reviews are often where ${company} finds accounts from ex-employees or contractors that should have been removed.`,
    });
  }

  if (!data.securityPosture.hasVulnerabilityManagement) {
    sprint2Tasks.push({
      id: 's2-vuln',
      title: 'Set Up Vulnerability Scanning',
      description: clouds.includes('AWS')
        ? 'Enable AWS Inspector for EC2 and ECR. Set up Dependabot on all repos. Configure weekly scan schedule and define SLA for critical findings (e.g., patch within 30 days).'
        : 'Deploy a vulnerability scanner (Qualys, Tenable, or open-source OpenVAS). Scan all production systems. Define a remediation SLA policy.',
      category: 'technical',
      priority: 'high',
      effort: 'days',
      controlReference: 'CC7.1',
      completed: false,
      why: `${company} needs to demonstrate it proactively finds and fixes vulnerabilities — not just reacts to breaches.`,
    });
  }

  if (sprint2Tasks.length > 0) {
    sprints.push({
      number: 2,
      name: 'Access Controls & Incident Readiness',
      weeks: 'Weeks 3–4',
      focus: 'Formalize access management and incident response',
      tasks: sprint2Tasks,
    });
  }

  // Sprint 3: Policies & Vendor Management
  const sprint3Tasks: Task[] = [];

  const missingPolicies = buildPolicies(data).filter(p => !p.exists && p.required);
  if (missingPolicies.length > 0) {
    sprint3Tasks.push({
      id: 's3-policies',
      title: `Write Remaining ${missingPolicies.length} Required Policies`,
      description: `Complete: ${missingPolicies.map(p => p.name).join(', ')}. Each policy should be reviewed and approved by management before the audit window opens.`,
      category: 'policy',
      priority: 'high',
      effort: 'weeks',
      controlReference: 'CC1.x',
      completed: false,
      why: `Auditors will request all policies during fieldwork. Missing policies are automatic findings — they cannot be remediated during the audit.`,
    });
  }

  if (!data.vendorManagement.hasVendorAssessment) {
    sprint3Tasks.push({
      id: 's3-vendors',
      title: 'Assess Critical Vendors',
      description: `Identify your top ${data.vendorManagement.criticalVendorCount} critical vendors. Request SOC 2 Type 2 reports from the top 5. For the rest, send a vendor security questionnaire. Document risk ratings.`,
      category: 'process',
      priority: 'medium',
      effort: 'weeks',
      controlReference: 'CC9.2',
      completed: false,
      why: `If a critical vendor is breached and ${company} cannot show due diligence, it reflects on your audit.`,
    });
  }

  if (!data.dataHandling.hasDataClassification) {
    sprint3Tasks.push({
      id: 's3-classification',
      title: 'Create Data Classification Policy',
      description: 'Define at minimum three tiers: Public, Internal, and Confidential. Map your data types (PII, product data, financial records) to tiers. Document handling requirements per tier.',
      category: 'policy',
      priority: 'medium',
      effort: 'days',
      controlReference: 'CC6.7',
      completed: false,
      why: `Data classification tells auditors that ${company} understands what data it holds and applies appropriate controls based on sensitivity.`,
    });
  }

  if (!data.securityPosture.hasSecurityAwareness) {
    sprint3Tasks.push({
      id: 's3-training',
      title: 'Complete Security Awareness Training for All Staff',
      description: 'Deploy security awareness training to all employees. Track completion. Retain completion records — this is required evidence for the audit.',
      category: 'process',
      priority: 'medium',
      effort: 'days',
      controlReference: 'CC1.4',
      completed: false,
      why: `Auditors ask for training completion records. If any employee hasn't completed training, it's a finding.`,
    });
  }

  if (sprint3Tasks.length > 0) {
    sprints.push({
      number: 3,
      name: 'Policies & Vendor Risk',
      weeks: 'Weeks 5–6',
      focus: 'Complete policy library and third-party risk program',
      tasks: sprint3Tasks,
    });
  }

  // Sprint 4: Change Management & BCP
  const sprint4Tasks: Task[] = [];

  if (!data.technicalInfrastructure.hasCI_CD) {
    sprint4Tasks.push({
      id: 's4-cicd',
      title: `Formalize Change Management in ${scmHint}`,
      description: 'Require pull request approvals before merging to main. Enable branch protection rules. Document your deployment process. This creates an automatic audit trail.',
      category: 'technical',
      priority: 'medium',
      effort: 'hours',
      controlReference: 'CC8.1',
      completed: false,
      why: `Auditors need to see that ${company} reviews every production change. Branch protection rules enforce this automatically.`,
    });
  }

  const hasAvailability = data.trustServiceCriteria.includes('availability');
  if (hasAvailability && !data.businessContinuity.hasDisasterRecoveryPlan) {
    sprint4Tasks.push({
      id: 's4-dr',
      title: 'Write and Test Disaster Recovery Plan',
      description: `Document recovery procedures for your ${cloudHint} environment. Define RTO of ${data.businessContinuity.rtoRequirement || 'your target'} and RPO of ${data.businessContinuity.rpoRequirement || 'your target'}. Run a tabletop exercise to test it.`,
      category: 'policy',
      priority: 'high',
      effort: 'weeks',
      controlReference: 'A1.3',
      completed: false,
      why: `${company} selected Availability as a trust criteria — auditors will specifically test whether your DR plan is real and tested.`,
    });
  }

  if (!data.businessContinuity.hasBCPTesting && data.businessContinuity.hasBackupStrategy) {
    sprint4Tasks.push({
      id: 's4-backup-test',
      title: 'Run and Document a Backup Restore Test',
      description: 'Select a non-production environment and restore from backup. Time the restore. Document the results. This is evidence that your backups actually work.',
      category: 'process',
      priority: 'medium',
      effort: 'days',
      controlReference: 'A1.2',
      completed: false,
      why: `Untested backups are not backups. Auditors expect ${company} to prove backups restore successfully, not just that they run.`,
    });
  }

  if (sprint4Tasks.length > 0) {
    sprints.push({
      number: 4,
      name: 'Change Management & Business Continuity',
      weeks: 'Weeks 7–8',
      focus: 'Formalize change controls and validate recovery capabilities',
      tasks: sprint4Tasks,
    });
  }

  // Final sprint: Evidence Collection & Audit Prep
  const totalSprints = sprints.length + 1;
  const lastWeekStart = totalSprints * 2 - 1;
  const lastWeekEnd = totalWeeks;

  sprints.push({
    number: totalSprints,
    name: 'Evidence Collection & Audit Prep',
    weeks: `Weeks ${lastWeekStart}–${lastWeekEnd}`,
    focus: 'Gather all evidence artifacts and prepare for auditor fieldwork',
    tasks: [
      {
        id: 'se-evidence',
        title: 'Compile Evidence Package',
        description: 'Collect all required evidence artifacts. Organize by control area. For Type 2, ensure log exports cover the full audit period. Name files consistently for auditor handoff.',
        category: 'evidence',
        priority: 'critical',
        effort: 'weeks',
        controlReference: 'All',
        completed: false,
        why: `Auditors will request evidence within 48 hours of starting fieldwork. An organized package demonstrates ${company}'s maturity.`,
      },
      {
        id: 'se-auditor',
        title: 'Select and Engage Auditor',
        description: 'Issue RFP to 2-3 AICPA-licensed CPA firms specializing in SOC 2. Budget $15,000–$40,000 for Type 1 or $30,000–$80,000 for Type 2. Timeline from engagement to report is 6-12 weeks.',
        category: 'process',
        priority: 'high',
        effort: 'weeks',
        controlReference: 'N/A',
        completed: false,
        why: `Starting auditor selection late is the #1 reason companies miss target dates. Book now, even before evidence is fully ready.`,
      },
      {
        id: 'se-preaudit',
        title: 'Run Internal Pre-Audit Review',
        description: 'Walk through each control area and verify evidence exists. Identify any gaps. Create remediation tickets for anything missing. Better to find gaps now than during fieldwork.',
        category: 'process',
        priority: 'high',
        effort: 'days',
        controlReference: 'All',
        completed: false,
        why: `Findings discovered during the pre-audit can be fixed before the real audit. Findings discovered during fieldwork become report findings.`,
      },
    ],
  });

  return sprints;
}

// ─── Scope Decision ───────────────────────────────────────────────────────────

function buildScope(data: IntakeFormData): import('@/types/roadmap').ScopeDecision {
  const criteria = data.trustServiceCriteria.length > 0
    ? data.trustServiceCriteria
    : ['security'];

  const systems: string[] = [];
  const clouds = data.technicalInfrastructure.cloudProviders.filter(c => c !== 'None/On-premise only');
  if (clouds.length > 0) systems.push(...clouds);
  if (data.technicalInfrastructure.sourceCodeManagement) systems.push(data.technicalInfrastructure.sourceCodeManagement);
  if (data.accessControl.ssoProvider && data.accessControl.ssoProvider !== 'None') {
    systems.push(data.accessControl.ssoProvider);
  }

  const justificationParts: string[] = [
    `${data.companyInfo.companyName} is a ${data.companyInfo.employeeCount}-person ${data.companyInfo.industry} company.`,
  ];

  if (data.dataHandling.handlesPHI) {
    justificationParts.push('PHI handling requires Privacy and Confidentiality criteria coverage.');
  }
  if (data.dataHandling.handlesPaymentData) {
    justificationParts.push('Payment data handling adds PCI DSS considerations alongside SOC 2 controls.');
  }
  if (data.dataHandling.handlesCustomerPII && criteria.includes('privacy')) {
    justificationParts.push('Customer PII processing supports the Privacy criteria inclusion.');
  }

  const auditCost = data.soc2Type === 'type1' ? '$15,000–$40,000' : '$30,000–$80,000';

  return {
    type: data.soc2Type,
    criteria,
    justification: justificationParts.join(' '),
    systemsInScope: systems.length > 0 ? systems : ['All production systems'],
    estimatedAuditCost: auditCost,
  };
}

// ─── Main Engine Export ───────────────────────────────────────────────────────

export function generateRoadmap(data: IntakeFormData): ComplianceRoadmap {
  const maturityScore = calcMaturityScore(data);
  const riskLevel = scoreToRiskLevel(maturityScore);
  const recommendedTimeline = calcTimeline(data, maturityScore);
  const gaps = buildGaps(data);
  const policies = buildPolicies(data);
  const evidence = buildEvidence(data);
  const risks = buildRisks(data);
  const sprints = buildSprints(data, gaps, recommendedTimeline);
  const scope = buildScope(data);

  return {
    maturityScore,
    riskLevel,
    recommendedTimeline,
    sprints,
    gaps,
    policies,
    evidence,
    risks,
    scope,
    generatedAt: new Date().toISOString(),
  };
}
