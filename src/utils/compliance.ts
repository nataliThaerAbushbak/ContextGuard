import type { AuditStatus, CheckCategory, Finding } from '../types/audit.ts';

export interface CategoryCompliance {
  category: CheckCategory;
  score: number | null; // percentage 0-100 or null if N/A
  passedCount: number;
  activeCount: number;
  waivedCount: number;
}

export interface ComplianceSummary {
  overallScore: number | null; // percentage or null if N/A
  totalChecks: number;
  explicitPassCount: number;
  discrepancyCount: number;
  missingEvidenceCount: number;
  followUpCount: number;
  waivedCount: number;
  manuallyVerifiedCount: number;
  categories: Record<CheckCategory, CategoryCompliance>;
}

/**
 * Deterministic compliance calculation based on strict evidence and reviewer override rules:
 * - EXPLICIT_PASS counts as passed unless reviewer set NEEDS_FOLLOW_UP.
 * - Manually Verified counts as passed regardless of the original AI verdict.
 * - Waived / Known Issue is excluded from the denominator.
 * - DISCREPANCY, MISSING_EVIDENCE, and Needs Follow-up do not count as passed.
 * - Compliance Score = passed active non-waived checks / total active non-waived checks * 100.
 * - If zero active non-waived checks, returns null (displayed as N/A).
 */
export function calculateCompliance(findings: Finding[]): ComplianceSummary {
  let explicitPassCount = 0;
  let discrepancyCount = 0;
  let missingEvidenceCount = 0;
  let followUpCount = 0;
  let waivedCount = 0;
  let manuallyVerifiedCount = 0;

  findings.forEach((f) => {
    if (f.verdict === 'EXPLICIT_PASS') explicitPassCount++;
    if (f.verdict === 'DISCREPANCY') discrepancyCount++;
    if (f.verdict === 'MISSING_EVIDENCE') missingEvidenceCount++;

    if (f.reviewer_decision === 'NEEDS_FOLLOW_UP') followUpCount++;
    if (f.reviewer_decision === 'WAIVED_KNOWN_ISSUE') waivedCount++;
    if (f.reviewer_decision === 'MANUALLY_VERIFIED') manuallyVerifiedCount++;
  });

  const isCheckPassed = (f: Finding): boolean => {
    if (f.reviewer_decision === 'WAIVED_KNOWN_ISSUE') return false; // excluded from calculation
    if (f.reviewer_decision === 'MANUALLY_VERIFIED') return true;
    if (f.reviewer_decision === 'NEEDS_FOLLOW_UP') return false;
    return f.verdict === 'EXPLICIT_PASS';
  };

  const activeFindings = findings.filter((f) => f.reviewer_decision !== 'WAIVED_KNOWN_ISSUE');
  const passedActiveFindings = activeFindings.filter(isCheckPassed);

  const overallScore =
    activeFindings.length > 0
      ? Math.round((passedActiveFindings.length / activeFindings.length) * 100)
      : null;

  const categoriesList: CheckCategory[] = ['Core flow', 'States', 'Errors', 'Navigation'];
  const categories: Record<CheckCategory, CategoryCompliance> = {} as any;

  categoriesList.forEach((cat) => {
    const catFindings = findings.filter((f) => (f.category || 'Core flow') === cat);
    const catActive = catFindings.filter((f) => f.reviewer_decision !== 'WAIVED_KNOWN_ISSUE');
    const catPassed = catActive.filter(isCheckPassed);
    const catWaived = catFindings.filter((f) => f.reviewer_decision === 'WAIVED_KNOWN_ISSUE').length;

    categories[cat] = {
      category: cat,
      score: catActive.length > 0 ? Math.round((catPassed.length / catActive.length) * 100) : null,
      passedCount: catPassed.length,
      activeCount: catActive.length,
      waivedCount: catWaived,
    };
  });

  return {
    overallScore,
    totalChecks: findings.length,
    explicitPassCount,
    discrepancyCount,
    missingEvidenceCount,
    followUpCount,
    waivedCount,
    manuallyVerifiedCount,
    categories,
  };
}

/**
 * Strict audit status derivation from real persisted state:
 * - DRAFT: analysis has not successfully completed or no findings exist.
 * - COMPLETE: valid analysis exists with at least one active check, and every active non-waived check is passed
 *   (either EXPLICIT_PASS or MANUALLY_VERIFIED) with zero open follow-ups.
 * - NEEDS_REVIEW: valid analysis exists but contains unresolved discrepancies, missing evidence, or follow-up items.
 */
export function deriveAuditStatus(findings: Finding[], hasValidResults: boolean): AuditStatus {
  if (!hasValidResults || !findings || findings.length === 0) {
    return 'Draft';
  }

  const activeNonWaived = findings.filter((f) => f.reviewer_decision !== 'WAIVED_KNOWN_ISSUE');
  if (activeNonWaived.length === 0) {
    // If all checks are waived, consider complete if reviewed
    return 'Complete';
  }

  const hasUnresolvedIssues = activeNonWaived.some((f) => {
    if (f.reviewer_decision === 'NEEDS_FOLLOW_UP') return true;
    if (f.reviewer_decision === 'MANUALLY_VERIFIED') return false;
    return f.verdict === 'DISCREPANCY' || f.verdict === 'MISSING_EVIDENCE';
  });

  return hasUnresolvedIssues ? 'Needs review' : 'Complete';
}
