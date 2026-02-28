export type VendorCategory =
  | 'Infrastructure'
  | 'Payment'
  | 'Identity'
  | 'Communication'
  | 'Analytics'
  | 'Project Management'
  | 'Security'
  | 'HR'
  | 'Business Ops';

export type VendorRiskTier = 'critical' | 'high' | 'medium' | 'low';
export type AssessmentStatus = 'assessed' | 'needs-review' | 'not-started';

export interface AssessmentRecord {
  date: string;           // ISO date
  status: AssessmentStatus;
  reviewer: string;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  website: string;
  category: VendorCategory;
  riskTier: VendorRiskTier;
  dataAccess: string[];           // e.g. ['PII', 'source code', 'financial data']
  hasProductionAccess: boolean;
  assessmentStatus: AssessmentStatus;
  lastReviewed: string | null;    // ISO date
  nextReviewDue: string | null;   // ISO date
  hasSoc2Report: boolean | null;
  soc2ReportUrl: string | null;   // link to trust center
  hasDPA: boolean | null;
  hasBAA: boolean | null;         // Business Associate Agreement (for PHI)
  notes: string;
  isAutoDetected: boolean;        // pre-populated from intake answers
  confirmedByUser: boolean;       // user explicitly reviewed this vendor
  assessmentHistory: AssessmentRecord[];
}
