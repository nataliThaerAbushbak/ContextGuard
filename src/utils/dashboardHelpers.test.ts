import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOpenIssuesSubtitle,
  formatGreeting,
  isOpenIssue,
  calculateOpenIssues,
  getOpenIssuesBreakdown,
} from './dashboardHelpers.ts';
import type { Finding, AuditRecord } from '../types/audit.ts';

test('getOpenIssuesSubtitle: returns "None pending" when open issues is 0', () => {
  assert.equal(getOpenIssuesSubtitle(0), 'None pending');
});

test('getOpenIssuesSubtitle: returns "1 needs review" when open issues is 1', () => {
  assert.equal(getOpenIssuesSubtitle(1), '1 needs review');
});

test('getOpenIssuesSubtitle: returns "{count} need review" when open issues > 1', () => {
  assert.equal(getOpenIssuesSubtitle(2), '2 need review');
  assert.equal(getOpenIssuesSubtitle(7), '7 need review');
  assert.equal(getOpenIssuesSubtitle(14), '14 need review');
});

test('isOpenIssue: correctly classifies open issues vs excluded findings', () => {
  const baseFinding: Finding = {
    id: 'f1',
    check_id: 'c1',
    check_text: 'Test check',
    category: 'Core flow',
    verdict: 'DISCREPANCY',
    step_index: 1,
    step_name: 'Step 1',
    target_element: 'Button',
    diff: null,
    explanation: 'Mismatch',
    reviewer_decision: 'UNREVIEWED',
    reviewer_note: '',
  };

  // Unresolved DISCREPANCY -> true
  assert.equal(isOpenIssue({ ...baseFinding, verdict: 'DISCREPANCY' }), true);

  // Unresolved MISSING_EVIDENCE -> true
  assert.equal(isOpenIssue({ ...baseFinding, verdict: 'MISSING_EVIDENCE' }), true);

  // Unresolved EXPLICIT_PASS -> false
  assert.equal(isOpenIssue({ ...baseFinding, verdict: 'EXPLICIT_PASS' }), false);

  // Manually verified DISCREPANCY -> false (excluded)
  assert.equal(
    isOpenIssue({ ...baseFinding, verdict: 'DISCREPANCY', reviewer_decision: 'MANUALLY_VERIFIED' }),
    false
  );

  // Waived / Known Issue DISCREPANCY -> false (excluded)
  assert.equal(
    isOpenIssue({ ...baseFinding, verdict: 'DISCREPANCY', reviewer_decision: 'WAIVED_KNOWN_ISSUE' }),
    false
  );

  // Manually verified MISSING_EVIDENCE -> false (excluded)
  assert.equal(
    isOpenIssue({ ...baseFinding, verdict: 'MISSING_EVIDENCE', reviewer_decision: 'MANUALLY_VERIFIED' }),
    false
  );

  // Waived / Known Issue MISSING_EVIDENCE -> false (excluded)
  assert.equal(
    isOpenIssue({ ...baseFinding, verdict: 'MISSING_EVIDENCE', reviewer_decision: 'WAIVED_KNOWN_ISSUE' }),
    false
  );

  // Reviewer marked NEEDS_FOLLOW_UP on EXPLICIT_PASS -> true (included)
  assert.equal(
    isOpenIssue({ ...baseFinding, verdict: 'EXPLICIT_PASS', reviewer_decision: 'NEEDS_FOLLOW_UP' }),
    true
  );

  // Reviewer marked NEEDS_FOLLOW_UP on DISCREPANCY -> true (included)
  assert.equal(
    isOpenIssue({ ...baseFinding, verdict: 'DISCREPANCY', reviewer_decision: 'NEEDS_FOLLOW_UP' }),
    true
  );
});

test('calculateOpenIssues: computes exact total across audits and matches subtitle', () => {
  const mockAudits = [
    {
      id: 'a1',
      title: 'Checkout Audit',
      findings: [
        { id: 'f1', check_id: 'c1', check_text: 'Pass 1', category: 'Core flow', verdict: 'EXPLICIT_PASS', step_index: 1, step_name: 'S1', target_element: '', diff: null, explanation: '', reviewer_decision: 'UNREVIEWED', reviewer_note: '' },
        { id: 'f2', check_id: 'c2', check_text: 'Pass 2', category: 'Core flow', verdict: 'EXPLICIT_PASS', step_index: 1, step_name: 'S1', target_element: '', diff: null, explanation: '', reviewer_decision: 'UNREVIEWED', reviewer_note: '' },
        { id: 'f3', check_id: 'c3', check_text: 'Disc 1', category: 'Core flow', verdict: 'DISCREPANCY', step_index: 2, step_name: 'S2', target_element: '', diff: null, explanation: '', reviewer_decision: 'UNREVIEWED', reviewer_note: '' },
        { id: 'f4', check_id: 'c4', check_text: 'Disc 2', category: 'Core flow', verdict: 'DISCREPANCY', step_index: 2, step_name: 'S2', target_element: '', diff: null, explanation: '', reviewer_decision: 'UNREVIEWED', reviewer_note: '' },
        { id: 'f5', check_id: 'c5', check_text: 'Miss 1', category: 'States', verdict: 'MISSING_EVIDENCE', step_index: 3, step_name: 'S3', target_element: '', diff: null, explanation: '', reviewer_decision: 'UNREVIEWED', reviewer_note: '' },
        { id: 'f6', check_id: 'c6', check_text: 'Disc 3', category: 'States', verdict: 'DISCREPANCY', step_index: 3, step_name: 'S3', target_element: '', diff: null, explanation: '', reviewer_decision: 'MANUALLY_VERIFIED', reviewer_note: '' }, // excluded
        { id: 'f7', check_id: 'c7', check_text: 'Miss 2', category: 'States', verdict: 'MISSING_EVIDENCE', step_index: 3, step_name: 'S3', target_element: '', diff: null, explanation: '', reviewer_decision: 'WAIVED_KNOWN_ISSUE', reviewer_note: '' }, // excluded
      ] as Finding[],
    },
    {
      id: 'a2',
      title: 'Auth Audit',
      findings: [
        { id: 'f8', check_id: 'c8', check_text: 'Follow up', category: 'Errors', verdict: 'EXPLICIT_PASS', step_index: 1, step_name: 'S1', target_element: '', diff: null, explanation: '', reviewer_decision: 'NEEDS_FOLLOW_UP', reviewer_note: '' }, // included
      ] as Finding[],
    },
  ] as unknown as AuditRecord[];

  // From a1: f3 (DISCREPANCY), f4 (DISCREPANCY), f5 (MISSING_EVIDENCE) = 3
  // From a2: f8 (NEEDS_FOLLOW_UP) = 1
  // Total = 4
  const count = calculateOpenIssues(mockAudits);
  assert.equal(count, 4);
  assert.equal(getOpenIssuesSubtitle(count), '4 need review');

  // Breakdown verification
  const breakdown = getOpenIssuesBreakdown(mockAudits);
  assert.equal(breakdown.total, 4);
  assert.equal(breakdown.discrepancies, 2);
  assert.equal(breakdown.missingEvidence, 1);
  assert.equal(breakdown.followUps, 1);
  assert.equal(breakdown.total, breakdown.discrepancies + breakdown.missingEvidence + breakdown.followUps);
});

test('calculateOpenIssues: exactly 7 open issues produces "7 need review"', () => {
  const findings: Finding[] = Array.from({ length: 7 }, (_, i) => ({
    id: `f-${i}`,
    check_id: `c-${i}`,
    check_text: `Check ${i}`,
    category: 'Core flow',
    verdict: 'DISCREPANCY',
    step_index: 1,
    step_name: 'Step 1',
    target_element: 'El',
    diff: null,
    explanation: 'Issue',
    reviewer_decision: 'UNREVIEWED',
    reviewer_note: '',
  }));

  const audits = [{ id: 'audit-7', title: 'Audit 7', findings }] as unknown as AuditRecord[];
  const count = calculateOpenIssues(audits);
  assert.equal(count, 7);
  assert.equal(getOpenIssuesSubtitle(count), '7 need review');
});

test('calculateOpenIssues: 0 open issues produces "None pending"', () => {
  const findings: Finding[] = [
    { id: 'f1', check_id: 'c1', check_text: 'Pass', category: 'Core flow', verdict: 'EXPLICIT_PASS', step_index: 1, step_name: 'S1', target_element: '', diff: null, explanation: '', reviewer_decision: 'UNREVIEWED', reviewer_note: '' },
    { id: 'f2', check_id: 'c2', check_text: 'Verified', category: 'Core flow', verdict: 'DISCREPANCY', step_index: 1, step_name: 'S1', target_element: '', diff: null, explanation: '', reviewer_decision: 'MANUALLY_VERIFIED', reviewer_note: '' },
    { id: 'f3', check_id: 'c3', check_text: 'Waived', category: 'Core flow', verdict: 'MISSING_EVIDENCE', step_index: 1, step_name: 'S1', target_element: '', diff: null, explanation: '', reviewer_decision: 'WAIVED_KNOWN_ISSUE', reviewer_note: '' },
  ];

  const audits = [{ id: 'audit-0', title: 'Audit 0', findings }] as unknown as AuditRecord[];
  const count = calculateOpenIssues(audits);
  assert.equal(count, 0);
  assert.equal(getOpenIssuesSubtitle(count), 'None pending');
});

test('formatGreeting: returns neutral greeting when displayName is not provided or empty', () => {
  assert.equal(formatGreeting('', 9), 'Good morning');
  assert.equal(formatGreeting('   ', 14), 'Good afternoon');
  assert.equal(formatGreeting(undefined, 20), 'Good evening');
  assert.equal(formatGreeting(undefined, 2), 'Good evening');
});

test('formatGreeting: personalizes with display name according to time of day', () => {
  assert.equal(formatGreeting('Sarah', 9), 'Good morning, Sarah');
  assert.equal(formatGreeting('Alex', 14), 'Good afternoon, Alex');
  assert.equal(formatGreeting('Jordan', 20), 'Good evening, Jordan');
});

test('formatGreeting: trims surrounding whitespace from name', () => {
  assert.equal(formatGreeting('  Maria  ', 10), 'Good morning, Maria');
});
