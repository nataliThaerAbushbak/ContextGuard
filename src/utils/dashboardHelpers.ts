/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Finding, AuditRecord } from '../types/audit.ts';

/**
 * Determines whether an individual finding represents an open issue requiring attention:
 *
 * MUST INCLUDE all unresolved findings that still require attention:
 * - DISCREPANCY
 * - MISSING_EVIDENCE
 * - NEEDS_FOLLOW_UP (reviewer explicitly flagged for attention)
 *
 * EXCLUDE findings that are:
 * - EXPLICIT_PASS (unless flagged for follow-up)
 * - Manually Verified (reviewer_decision === 'MANUALLY_VERIFIED')
 * - Waived / Known Issue (reviewer_decision === 'WAIVED_KNOWN_ISSUE')
 */
export function isOpenIssue(finding: Finding): boolean {
  // Exclude findings that are Manually Verified or Waived / Known Issue
  if (
    finding.reviewer_decision === 'MANUALLY_VERIFIED' ||
    finding.reviewer_decision === 'WAIVED_KNOWN_ISSUE'
  ) {
    return false;
  }

  // Include findings with explicit reviewer decision NEEDS_FOLLOW_UP
  if (finding.reviewer_decision === 'NEEDS_FOLLOW_UP') {
    return true;
  }

  // Exclude explicit passes
  if (finding.verdict === 'EXPLICIT_PASS') {
    return false;
  }

  // Include unresolved findings with verdicts DISCREPANCY or MISSING_EVIDENCE
  if (
    finding.verdict === 'DISCREPANCY' ||
    finding.verdict === 'MISSING_EVIDENCE'
  ) {
    return true;
  }

  return false;
}

export interface OpenIssuesBreakdown {
  total: number;
  discrepancies: number;
  missingEvidence: number;
  followUps: number;
  auditWithDiscrepancy: AuditRecord | null;
}

/**
 * Calculates the exact breakdown and total count of open issues across all user audits.
 * Ensures the total and sub-categories are strictly derived from the same source of truth.
 */
export function getOpenIssuesBreakdown(audits: AuditRecord[]): OpenIssuesBreakdown {
  let total = 0;
  let discrepancies = 0;
  let missingEvidence = 0;
  let followUps = 0;
  let auditWithDiscrepancy: AuditRecord | null = null;

  for (const audit of audits) {
    for (const f of audit.findings || []) {
      if (!isOpenIssue(f)) {
        continue;
      }

      total++;

      if (f.reviewer_decision === 'NEEDS_FOLLOW_UP') {
        followUps++;
      } else if (f.verdict === 'DISCREPANCY') {
        discrepancies++;
        if (!auditWithDiscrepancy) {
          auditWithDiscrepancy = audit;
        }
      } else if (f.verdict === 'MISSING_EVIDENCE') {
        missingEvidence++;
      }
    }
  }

  return {
    total,
    discrepancies,
    missingEvidence,
    followUps,
    auditWithDiscrepancy,
  };
}

/**
 * Returns the exact total number of open issues across all audits.
 */
export function calculateOpenIssues(audits: AuditRecord[]): number {
  return getOpenIssuesBreakdown(audits).total;
}

/**
 * Returns the exact subtitle corresponding to the open issues count.
 * - openIssues === 0 -> "None pending"
 * - openIssues === 1 -> "1 needs review"
 * - openIssues > 1 -> "{count} need review"
 */
export function getOpenIssuesSubtitle(openIssuesCount: number): string {
  if (openIssuesCount <= 0) {
    return 'None pending';
  }
  if (openIssuesCount === 1) {
    return '1 needs review';
  }
  return `${openIssuesCount} need review`;
}

/**
 * Formats a dynamic greeting based on the hour of day and optional display name.
 * - 05:00 - 11:59: "Good morning" / "Good morning, {name}"
 * - 12:00 - 17:59: "Good afternoon" / "Good afternoon, {name}"
 * - 18:00 - 04:59: "Good evening" / "Good evening, {name}"
 */
export function formatGreeting(displayName?: string, hour?: number): string {
  const currentHour = typeof hour === 'number' ? hour : new Date().getHours();
  let timeGreeting = 'Good evening';
  if (currentHour >= 5 && currentHour < 12) {
    timeGreeting = 'Good morning';
  } else if (currentHour >= 12 && currentHour < 18) {
    timeGreeting = 'Good afternoon';
  }

  const cleanName = displayName?.trim();
  return cleanName ? `${timeGreeting}, ${cleanName}` : timeGreeting;
}
