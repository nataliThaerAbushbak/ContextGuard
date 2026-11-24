import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewAudit,
  getResumeStep,
  pruneDeletedScreen,
  invalidateResultsIfModified,
} from './auditIsolation.ts';
import type { AuditRecord, ScreenItem } from '../types/audit.ts';

test('createNewAudit: initializes with pristine clean state and unique ID', () => {
  const audit1 = createNewAudit();
  const audit2 = createNewAudit();

  assert.notEqual(audit1.id, audit2.id);
  assert.equal(audit1.requirements_text, '');
  assert.deepEqual(audit1.checks, []);
  assert.deepEqual(audit1.screens, []);
  assert.deepEqual(audit1.findings, []);
  assert.deepEqual(audit1.advisory, []);
  assert.equal(audit1.current_step, 1);
  assert.equal(audit1.last_completed_step, 0);
  assert.equal(audit1.has_valid_results, false);
  assert.equal(audit1.is_stale, false);
  assert.equal(audit1.status, 'Draft');
});

test('getResumeStep: returns correct step based on persisted progress', () => {
  // Stopped at Step 1 -> 1
  assert.equal(getResumeStep({ current_step: 1, has_valid_results: false }), 1);

  // Stopped at Step 2 -> 2
  assert.equal(getResumeStep({ current_step: 2, has_valid_results: false }), 2);

  // Stopped at Step 3 -> 3
  assert.equal(getResumeStep({ current_step: 3, has_valid_results: false }), 3);

  // Stopped at Step 4 / Interrupted -> 4
  assert.equal(getResumeStep({ current_step: 4, has_valid_results: false }), 4);

  // Completed valid analysis with findings -> 5
  assert.equal(
    getResumeStep({
      current_step: 5,
      has_valid_results: true,
      is_stale: false,
      findings: [{ id: 'f1' } as any],
    }),
    5
  );

  // Stale analysis (even if findings exist) does NOT jump to 5
  assert.equal(
    getResumeStep({
      current_step: 3,
      has_valid_results: false,
      is_stale: true,
      findings: [{ id: 'f1' } as any],
    }),
    3
  );
});

test('pruneDeletedScreen: removes target screen, reindexes steps, and marks stale if results existed', () => {
  const screens: ScreenItem[] = [
    { id: 's1', step_number: 1, label: 'Login', imageUrl: 'url1' },
    { id: 's2', step_number: 2, label: 'Dashboard', imageUrl: 'url2' },
    { id: 's3', step_number: 3, label: 'Settings', imageUrl: 'url3' },
  ];

  // Deleting middle screen s2 when valid results existed
  const result = pruneDeletedScreen(screens, 's2', true);

  assert.equal(result.updatedScreens.length, 2);
  assert.equal(result.updatedScreens[0].id, 's1');
  assert.equal(result.updatedScreens[0].step_number, 1);
  assert.equal(result.updatedScreens[1].id, 's3');
  assert.equal(result.updatedScreens[1].step_number, 2); // re-indexed
  assert.equal(result.isStale, true);
  assert.equal(result.hasValidResults, false);
});

test('invalidateResultsIfModified: marks results stale and invalid when modified', () => {
  const initial = { has_valid_results: true, is_stale: false, text: 'old' };
  const modified = invalidateResultsIfModified(initial);

  assert.equal(modified.has_valid_results, false);
  assert.equal(modified.is_stale, true);

  // If already not valid, stays not valid
  const draft = { has_valid_results: false, is_stale: false };
  assert.equal(invalidateResultsIfModified(draft).is_stale, false);
});
