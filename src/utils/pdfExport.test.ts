import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAuditForExport,
  formatReviewerDecision,
  formatVerdict,
  generateAuditPdf,
  exportAuditPdf,
} from './pdfExport.ts';
import type { AuditPdfInput } from './pdfExport.ts';
import type { Finding, AdvisoryItem, ScreenItem } from '../types/audit.ts';

const mockFindings: Finding[] = [
  {
    id: 'f1',
    check_id: 'chk-1',
    check_text: 'Display user avatar and full name',
    category: 'Core flow',
    verdict: 'EXPLICIT_PASS',
    step_index: 1,
    step_name: 'Profile Settings',
    target_element: 'Header avatar component',
    diff: null,
    explanation: 'User avatar and full name "Alex Morgan" are visible and correctly positioned.',
    reviewer_decision: 'UNREVIEWED',
    reviewer_note: '',
  },
  {
    id: 'f2',
    check_id: 'chk-2',
    check_text: 'Provide an edit email input field',
    category: 'States',
    verdict: 'DISCREPANCY',
    step_index: 2,
    step_name: 'Email Editing View',
    target_element: 'Email input field',
    diff: {
      expected: 'input[type=email] with pre-filled user email',
      observed: 'Read-only text badge without edit affordance',
    },
    explanation: 'Field appears as disabled badge rather than editable text input.',
    reviewer_decision: 'MANUALLY_VERIFIED',
    reviewer_note: 'Verified with PM: Edit button opens a modal on click.',
  },
  {
    id: 'f3',
    check_id: 'chk-3',
    check_text: 'Save changes button must be disabled until email is modified',
    category: 'Core flow',
    verdict: 'MISSING_EVIDENCE',
    step_index: 3,
    step_name: 'Save Confirmation',
    target_element: 'Save CTA button',
    diff: null,
    explanation: 'Screen 3 does not show button in disabled state before typing.',
    reviewer_decision: 'NEEDS_FOLLOW_UP',
    reviewer_note: 'Requested new screenshot from engineering.',
  },
];

const mockAdvisory: AdvisoryItem[] = [
  {
    id: 'adv-1',
    category: 'UX / Accessibility',
    step_index: 2,
    step_name: 'Email Editing View',
    risk: 'Low contrast on helper text',
    recommendation: 'Increase contrast ratio of placeholder text to meet WCAG AA standards (4.5:1).',
    severity: 'MEDIUM',
  },
  {
    id: 'adv-2',
    category: 'Error Prevention',
    step_index: 3,
    step_name: 'Save Confirmation',
    risk: 'Missing inline validation feedback',
    recommendation: 'Display real-time regex feedback before the user taps Save.',
    severity: 'LOW',
  },
];

const mockScreens: ScreenItem[] = [
  { id: 's1', step_number: 1, label: 'Profile Settings', imageUrl: 'data:image/png;base64,abc' },
  { id: 's2', step_number: 2, label: 'Email Editing View', imageUrl: 'data:image/png;base64,def' },
  { id: 's3', step_number: 3, label: 'Save Confirmation', imageUrl: 'data:image/png;base64,ghi' },
];

test('validateAuditForExport: rejects when data is stale', () => {
  const input: AuditPdfInput = {
    auditTitle: 'Checkout Flow Audit',
    findings: mockFindings,
    advisory: mockAdvisory,
    screens: mockScreens,
    isStale: true,
  };

  const res = validateAuditForExport(input);
  assert.equal(res.valid, false);
  assert.match(res.error || '', /stale/i);
});

test('validateAuditForExport: rejects when findings are empty', () => {
  const input: AuditPdfInput = {
    auditTitle: 'Checkout Flow Audit',
    findings: [],
    advisory: mockAdvisory,
    screens: mockScreens,
    isStale: false,
  };

  const res = validateAuditForExport(input);
  assert.equal(res.valid, false);
  assert.match(res.error || '', /no findings recorded/i);
});

test('validateAuditForExport: rejects when audit title is empty', () => {
  const input: AuditPdfInput = {
    auditTitle: '   ',
    findings: mockFindings,
    advisory: mockAdvisory,
    screens: mockScreens,
    isStale: false,
  };

  const res = validateAuditForExport(input);
  assert.equal(res.valid, false);
  assert.match(res.error || '', /name or title/i);
});

test('validateAuditForExport: passes valid current audit data', () => {
  const input: AuditPdfInput = {
    auditTitle: 'User Profile Settings Audit',
    findings: mockFindings,
    advisory: mockAdvisory,
    screens: mockScreens,
    isStale: false,
  };

  const res = validateAuditForExport(input);
  assert.equal(res.valid, true);
  assert.equal(res.error, undefined);
});

test('formatReviewerDecision: formats all human override states accurately', () => {
  assert.equal(
    formatReviewerDecision('MANUALLY_VERIFIED'),
    'Manually Verified (Override to Pass)'
  );
  assert.equal(
    formatReviewerDecision('WAIVED_KNOWN_ISSUE'),
    'Waived / Known Issue (Excluded from Score)'
  );
  assert.equal(
    formatReviewerDecision('NEEDS_FOLLOW_UP'),
    'Needs Follow-up (Pending Action)'
  );
  assert.equal(
    formatReviewerDecision('UNREVIEWED'),
    'Unreviewed (AI Verdict Kept)'
  );
});

test('formatVerdict: formats all verdict types correctly', () => {
  assert.equal(formatVerdict('EXPLICIT_PASS'), 'Explicit Pass');
  assert.equal(formatVerdict('DISCREPANCY'), 'Discrepancy');
  assert.equal(formatVerdict('MISSING_EVIDENCE'), 'Missing Evidence');
});

test('generateAuditPdf: creates multi-page PDF document with all required fields', () => {
  const input: AuditPdfInput = {
    auditTitle: 'User Profile Settings Audit',
    date: 'October 18, 2026',
    findings: mockFindings,
    advisory: mockAdvisory,
    screens: mockScreens,
    isStale: false,
  };

  const doc = generateAuditPdf(input);
  assert.ok(doc, 'PDF doc should be returned');
  const pageCount = doc.getNumberOfPages();
  assert.ok(pageCount >= 1, 'Should have at least 1 page');

  const buf = doc.output('arraybuffer');
  assert.ok(buf.byteLength > 1000, 'PDF buffer should contain generated vector bytes');
});

test('exportAuditPdf: succeeds and provides sanitized filename for valid audit', () => {
  const input: AuditPdfInput = {
    auditTitle: 'User Profile Settings Audit',
    date: 'October 18, 2026',
    findings: mockFindings,
    advisory: mockAdvisory,
    screens: mockScreens,
    isStale: false,
  };

  const result = exportAuditPdf(input);
  assert.equal(result.success, true);
  assert.ok(result.filename?.includes('user_profile_settings_audit'));
  assert.ok(result.filename?.endsWith('.pdf'));
  assert.ok(result.doc);
});

test('exportAuditPdf: fails gracefully with error message if stale', () => {
  const input: AuditPdfInput = {
    auditTitle: 'User Profile Settings Audit',
    findings: mockFindings,
    advisory: mockAdvisory,
    isStale: true,
  };

  const result = exportAuditPdf(input);
  assert.equal(result.success, false);
  assert.ok(result.error);
  assert.match(result.error, /stale/i);
});
