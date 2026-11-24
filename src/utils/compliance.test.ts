import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompliance, deriveAuditStatus } from './compliance.ts';
import type { Finding } from '../types/audit.ts';

test('calculateCompliance: returns null overallScore for empty findings', () => {
  const result = calculateCompliance([]);
  assert.equal(result.overallScore, null);
  assert.equal(result.totalChecks, 0);
  assert.equal(result.explicitPassCount, 0);
});

test('calculateCompliance: correctly calculates pass rate from findings', () => {
  const findings: Finding[] = [
    {
      id: 'f1',
      check_id: 'c1',
      verdict: 'EXPLICIT_PASS',
      step_index: 1,
      step_name: 'Step 1',
      target_element: 'Button',
      diff: null,
      explanation: 'OK',
      reviewer_decision: 'UNREVIEWED',
      reviewer_note: '',
    },
    {
      id: 'f2',
      check_id: 'c2',
      verdict: 'DISCREPANCY',
      step_index: 2,
      step_name: 'Step 2',
      target_element: 'Input',
      diff: { expected: 'A', observed: 'B' },
      explanation: 'Diff',
      reviewer_decision: 'UNREVIEWED',
      reviewer_note: '',
    },
    {
      id: 'f3',
      check_id: 'c3',
      verdict: 'MISSING_EVIDENCE',
      step_index: 3,
      step_name: 'Step 3',
      target_element: 'Footer',
      diff: null,
      explanation: 'Missing',
      reviewer_decision: 'UNREVIEWED',
      reviewer_note: '',
    },
    {
      id: 'f4',
      check_id: 'c4',
      verdict: 'EXPLICIT_PASS',
      step_index: 1,
      step_name: 'Step 1',
      target_element: 'Header',
      diff: null,
      explanation: 'OK',
      reviewer_decision: 'UNREVIEWED',
      reviewer_note: '',
    },
  ];

  const result = calculateCompliance(findings);
  assert.equal(result.totalChecks, 4);
  assert.equal(result.explicitPassCount, 2);
  assert.equal(result.discrepancyCount, 1);
  assert.equal(result.missingEvidenceCount, 1);
  // 2 out of 4 = 50%
  assert.equal(result.overallScore, 50);
});

test('calculateCompliance: reviewer MANUALLY_VERIFIED overrides discrepancy to pass', () => {
  const findings: Finding[] = [
    {
      id: 'f1',
      check_id: 'c1',
      verdict: 'DISCREPANCY',
      step_index: 1,
      step_name: 'Step 1',
      target_element: 'Button',
      diff: { expected: 'Save', observed: 'Submit' },
      explanation: 'Diff',
      reviewer_decision: 'MANUALLY_VERIFIED',
      reviewer_note: 'Verified with PM, Submit is approved.',
    },
  ];

  const result = calculateCompliance(findings);
  assert.equal(result.overallScore, 100);
  assert.equal(result.manuallyVerifiedCount, 1);
});

test('calculateCompliance: reviewer WAIVED_KNOWN_ISSUE excludes check from denominator', () => {
  const findings: Finding[] = [
    {
      id: 'f1',
      check_id: 'c1',
      verdict: 'EXPLICIT_PASS',
      step_index: 1,
      step_name: 'Step 1',
      target_element: 'Button',
      diff: null,
      explanation: 'OK',
      reviewer_decision: 'UNREVIEWED',
      reviewer_note: '',
    },
    {
      id: 'f2',
      check_id: 'c2',
      verdict: 'DISCREPANCY',
      step_index: 2,
      step_name: 'Step 2',
      target_element: 'Input',
      diff: { expected: 'A', observed: 'B' },
      explanation: 'Diff',
      reviewer_decision: 'WAIVED_KNOWN_ISSUE',
      reviewer_note: 'Ticket JIRA-123 filed.',
    },
  ];

  const result = calculateCompliance(findings);
  assert.equal(result.waivedCount, 1);
  // Only 1 active check (f1), which is passed -> 1 / 1 = 100%
  assert.equal(result.overallScore, 100);
});

test('deriveAuditStatus: correctly computes Draft, Needs review, and Complete', () => {
  assert.equal(deriveAuditStatus([], false), 'Draft');

  const pendingFindings: Finding[] = [
    {
      id: 'f1',
      check_id: 'c1',
      verdict: 'DISCREPANCY',
      step_index: 1,
      step_name: 'Step 1',
      target_element: 'Button',
      diff: null,
      explanation: 'Diff',
      reviewer_decision: 'UNREVIEWED',
      reviewer_note: '',
    },
  ];
  assert.equal(deriveAuditStatus(pendingFindings, true), 'Needs review');

  const passedFindings: Finding[] = [
    {
      id: 'f1',
      check_id: 'c1',
      verdict: 'EXPLICIT_PASS',
      step_index: 1,
      step_name: 'Step 1',
      target_element: 'Button',
      diff: null,
      explanation: 'OK',
      reviewer_decision: 'UNREVIEWED',
      reviewer_note: '',
    },
  ];
  assert.equal(deriveAuditStatus(passedFindings, true), 'Complete');
});
