export type CheckCategory = 'Core flow' | 'States' | 'Errors' | 'Navigation';

export type ReviewerDecision = 
  | 'UNREVIEWED' 
  | 'MANUALLY_VERIFIED' 
  | 'WAIVED_KNOWN_ISSUE' 
  | 'NEEDS_FOLLOW_UP';

export interface CheckItem {
  id: string;
  text: string;
  category: CheckCategory;
  is_ambiguous: boolean;
  clarification_question?: string;
  clarification_answer?: string;
  included: boolean;
}

export interface ScreenItem {
  id: string;
  step_number: number;
  label: string;
  imageUrl: string;
  file_name?: string;
}

export interface FindingDiff {
  expected: string;
  observed: string;
}

export interface Finding {
  id: string;
  check_id: string;
  check_text?: string;
  category?: CheckCategory;
  verdict: 'EXPLICIT_PASS' | 'DISCREPANCY' | 'MISSING_EVIDENCE';
  step_index: number;
  step_name: string;
  target_element: string;
  diff: FindingDiff | null;
  explanation: string;
  reviewer_decision: ReviewerDecision;
  reviewer_note: string;
}

export interface AdvisoryItem {
  id: string;
  category: string;
  step_index: number;
  step_name?: string;
  risk: string;
  recommendation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type AuditStatus = 'Needs review' | 'Complete' | 'Draft';

export interface TestCaseItem {
  id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expected: string;
  type: string;
  priority: 'P1 / High' | 'P2 / Medium' | 'P3 / Low';
  is_inferred_assumption?: boolean;
}

export interface AuditRecord {
  id: string;
  title: string;
  project: string;
  status: AuditStatus;
  coverage: number | null;
  created_at: string;
  updated_at: string;
  requirements_text: string;
  checks: CheckItem[];
  screens: ScreenItem[];
  findings: Finding[];
  advisory: AdvisoryItem[];
  current_step: number; // 1 to 5
  last_completed_step: number; // 0 to 5
  has_valid_results: boolean;
  is_stale?: boolean;
  analysis_status?: 'idle' | 'running' | 'completed' | 'failed';
  source_sample_id?: string;
}

export interface WorkspaceSettings {
  evidenceFirstVerification: boolean;
  separateAdvisoryInsights: boolean;
  reviewerDecisionsPreserved: boolean;
  defaultReportDetail: 'Balanced' | 'Compact' | 'Detailed';
}
