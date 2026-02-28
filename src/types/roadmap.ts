export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TaskCategory = 'policy' | 'technical' | 'process' | 'evidence';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskEffort = 'hours' | 'days' | 'weeks';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  effort: TaskEffort;
  controlReference: string; // e.g. "CC6.1"
  completed: boolean;
  why: string; // plain English — why this matters for THEIR specific company
}

export interface Sprint {
  number: number;
  name: string;
  weeks: string; // e.g. "Weeks 1–2"
  focus: string;
  tasks: Task[];
}

export interface GapItem {
  control: string; // e.g. "CC6.1 – Logical Access Controls"
  currentState: string;
  requiredState: string;
  severity: RiskLevel;
}

export interface PolicyItem {
  id: string;
  name: string;
  exists: boolean;
  required: boolean;
  conditional?: string; // reason it's conditionally required (e.g. "Required because you handle PHI")
}

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  collectionMethod: string; // specific how-to for their stack
  daysRequired: number; // 0 = point-in-time, 90 = rolling 90 days
  alreadyHave: boolean;
  category: 'access' | 'change' | 'monitoring' | 'training' | 'vendor' | 'backup' | 'policy';
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: RiskLevel;
  remediation: string;
  sprintReference?: number; // which sprint addresses this
}

export interface ScopeDecision {
  type: 'type1' | 'type2';
  criteria: string[];
  justification: string;
  systemsInScope: string[];
  estimatedAuditCost: string; // rough range to set expectations
}

export interface ComplianceRoadmap {
  maturityScore: number; // 0–100
  riskLevel: RiskLevel;
  recommendedTimeline: number; // weeks to audit-ready
  sprints: Sprint[];
  gaps: GapItem[];
  policies: PolicyItem[];
  evidence: EvidenceItem[];
  risks: RiskItem[];
  scope: ScopeDecision;
  generatedAt: string; // ISO timestamp
}
