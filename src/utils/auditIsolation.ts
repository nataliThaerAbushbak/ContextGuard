import type { AuditRecord, CheckItem, ScreenItem } from '../types/audit.ts';

/**
 * Creates a clean, isolated new audit record with a unique ID and zero sample contamination.
 */
export function createNewAudit(title?: string, project?: string): AuditRecord {
  const timestamp = new Date().toISOString();
  const uniqueId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: uniqueId,
    title: title?.trim() || '',
    project: project?.trim() || 'Custom',
    status: 'Draft',
    coverage: null,
    created_at: timestamp,
    updated_at: 'Just now',
    requirements_text: '',
    checks: [],
    screens: [],
    findings: [],
    advisory: [],
    current_step: 1,
    last_completed_step: 0,
    has_valid_results: false,
    is_stale: false,
    analysis_status: 'idle',
  };
}

/**
 * Determines the exact resume step for an existing audit based on persisted state:
 * - Valid, non-stale analysis with findings -> Step 5 (Results)
 * - Otherwise: return current_step (or 1 if missing)
 *   Stopped at Step 1 -> 1
 *   Stopped at Step 2 -> 2
 *   Stopped at Step 3 -> 3
 *   Analysis pending/interrupted -> 4
 */
export function getResumeStep(audit: Partial<AuditRecord>): number {
  if (
    audit.has_valid_results &&
    !audit.is_stale &&
    Array.isArray(audit.findings) &&
    audit.findings.length > 0
  ) {
    return 5;
  }

  const step = audit.current_step ?? 1;
  return Math.min(Math.max(step, 1), 4);
}

/**
 * Prunes a deleted screenshot from the audit and re-indexes remaining steps.
 * If previous results exist, they are marked stale because the screenshot set has changed.
 */
export function pruneDeletedScreen(
  currentScreens: ScreenItem[],
  deletedId: string,
  hadValidResults: boolean
): { updatedScreens: ScreenItem[]; isStale: boolean; hasValidResults: boolean } {
  const filtered = currentScreens.filter((s) => s.id !== deletedId);
  const reindexed = filtered.map((s, idx) => ({
    ...s,
    step_number: idx + 1,
  }));

  return {
    updatedScreens: reindexed,
    isStale: hadValidResults,
    hasValidResults: !hadValidResults ? false : false,
  };
}

/**
 * Marks audit results as stale when requirements, checks, or screenshots are modified
 * after an analysis has completed.
 */
export function invalidateResultsIfModified<T extends { has_valid_results: boolean; is_stale?: boolean }>(
  record: T
): T {
  if (record.has_valid_results) {
    return {
      ...record,
      has_valid_results: false,
      is_stale: true,
    };
  }
  return record;
}
