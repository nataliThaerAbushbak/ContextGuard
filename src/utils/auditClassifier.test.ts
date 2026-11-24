import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractTextFromScreen,
  extractQuotedRequirements,
  isExactTextRequirement,
  validateAndEnforceFinding,
  classifyCheck,
} from './auditClassifier.ts';
import { DEFAULT_SAMPLE_SCREENS } from '../data/sampleData.ts';
import { calculateCompliance } from './compliance.ts';
import type { CheckItem, Finding } from '../types/audit.ts';

const nineCheckoutChecks: CheckItem[] = [
  {
    id: 'chk-1',
    text: 'As a shopper, I can select a size option (M, L, XL) and add the Heavyweight Organic Tee ($49.00) to my cart.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-2',
    text: 'The cart drawer opens automatically upon adding the item and clearly displays the item details, price, and item quantity.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-3',
    text: 'The user can proceed seamlessly from the cart drawer directly into checkout with a primary action button.',
    category: 'Navigation',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-4',
    text: 'The cart drawer must display a final total that already includes tax and delivery charges.',
    category: 'States',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-5',
    text: 'On the shipping screen, the user can fill in contact email and shipping address fields.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-6',
    text: 'On the payment screen, the user can enter credit card details.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-7',
    text: "The payment screen primary CTA must be labeled exactly 'Pay Now ($49.00)'.",
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-8',
    text: 'A visible loading indicator must appear while payment is being processed before the confirmation screen.',
    category: 'States',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-9',
    text: 'The user receives an order confirmation receipt with an order ID (e.g. #CG-84920) and delivery estimate, with return navigation back to the catalog.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
];

test('extractTextFromScreen: extracts visible strings from SVG data URLs', () => {
  const cartScreen = DEFAULT_SAMPLE_SCREENS[1];
  const data = extractTextFromScreen(cartScreen, 2);
  assert.equal(data.index, 2);
  assert.equal(data.label, 'Cart drawer');
  assert.ok(data.lowerText.includes('subtotal'));
  assert.ok(data.lowerText.includes('taxes & shipping calculated'));
});

test('extractQuotedRequirements: extracts single and double quoted text strings', () => {
  const req1 = "The button must be labeled exactly 'Pay Now ($49.00)'.";
  assert.deepEqual(extractQuotedRequirements(req1), ['Pay Now ($49.00)']);

  const req2 = 'The screen displays "Submit Order" and "Cancel" buttons.';
  assert.deepEqual(extractQuotedRequirements(req2), ['Submit Order', 'Cancel']);
});

test('Requirement 4 (Cart Tax & Delivery): classifies as DISCREPANCY because screenshot defers tax calculation', () => {
  const check = nineCheckoutChecks[3]; // Requirement 4
  const finding = classifyCheck(check, DEFAULT_SAMPLE_SCREENS, 3);

  assert.equal(finding.verdict, 'DISCREPANCY');
  assert.ok(finding.diff, 'Must provide structured diff');
  assert.match(finding.diff?.expected || '', /already includes tax and delivery/i);
  assert.match(finding.diff?.observed || '', /calculated/i);
  assert.equal(finding.step_index, 2); // Cart drawer is step 2
});

test('Requirement 7 (Payment CTA Exact Text): classifies as DISCREPANCY because CTA is "Submit Order"', () => {
  const check = nineCheckoutChecks[6]; // Requirement 7
  const finding = classifyCheck(check, DEFAULT_SAMPLE_SCREENS, 6);

  assert.equal(finding.verdict, 'DISCREPANCY');
  assert.ok(finding.diff, 'Must provide structured diff');
  assert.match(finding.diff?.expected || '', /Pay Now \(\$49\.00\)/);
  assert.match(finding.diff?.observed || '', /Submit Order/);
  assert.equal(finding.step_index, 4); // Payment is step 4
});

test('Requirement 8 (Loading Indicator): classifies as MISSING_EVIDENCE when no loading state exists', () => {
  const check = nineCheckoutChecks[7]; // Requirement 8
  const finding = classifyCheck(check, DEFAULT_SAMPLE_SCREENS, 7);

  assert.equal(finding.verdict, 'MISSING_EVIDENCE');
  assert.equal(finding.diff, null);
});

test('Deterministic Validation Layer: rejects false EXPLICIT_PASS for Requirement 4 and reclassifies as DISCREPANCY', () => {
  const check = nineCheckoutChecks[3];
  const falsePassFinding: Finding = {
    id: 'find-4',
    check_id: check.id,
    check_text: check.text,
    verdict: 'EXPLICIT_PASS',
    step_index: 2,
    step_name: 'Cart drawer',
    target_element: 'Cart summary',
    diff: null,
    explanation: 'Cart drawer shows total price.',
    reviewer_decision: 'UNREVIEWED',
    reviewer_note: '',
  };

  const validated = validateAndEnforceFinding(falsePassFinding, check, DEFAULT_SAMPLE_SCREENS);
  assert.equal(validated.verdict, 'DISCREPANCY');
  assert.ok(validated.diff);
  assert.match(validated.diff?.observed || '', /calculated/i);
});

test('Deterministic Validation Layer: rejects false EXPLICIT_PASS for Requirement 7 and reclassifies as DISCREPANCY', () => {
  const check = nineCheckoutChecks[6];
  const falsePassFinding: Finding = {
    id: 'find-7',
    check_id: check.id,
    check_text: check.text,
    verdict: 'EXPLICIT_PASS',
    step_index: 4,
    step_name: 'Payment',
    target_element: 'Primary button',
    diff: null,
    explanation: 'Payment button exists.',
    reviewer_decision: 'UNREVIEWED',
    reviewer_note: '',
  };

  const validated = validateAndEnforceFinding(falsePassFinding, check, DEFAULT_SAMPLE_SCREENS);
  assert.equal(validated.verdict, 'DISCREPANCY');
  assert.ok(validated.diff);
  assert.match(validated.diff?.observed || '', /Submit Order/);
});

test('Deterministic Validation Layer: rejects false EXPLICIT_PASS for Requirement 8 and reclassifies as MISSING_EVIDENCE', () => {
  const check = nineCheckoutChecks[7];
  const falsePassFinding: Finding = {
    id: 'find-8',
    check_id: check.id,
    check_text: check.text,
    verdict: 'EXPLICIT_PASS',
    step_index: 4,
    step_name: 'Payment',
    target_element: 'Workflow transition',
    diff: null,
    explanation: 'Workflow proceeds smoothly.',
    reviewer_decision: 'UNREVIEWED',
    reviewer_note: '',
  };

  const validated = validateAndEnforceFinding(falsePassFinding, check, DEFAULT_SAMPLE_SCREENS);
  assert.equal(validated.verdict, 'MISSING_EVIDENCE');
  assert.equal(validated.diff, null);
});

test('REGRESSION TEST: 9-check Checkout Verification Audit produces exact expected counts and 67% compliance', () => {
  const findings = nineCheckoutChecks.map((chk, i) =>
    classifyCheck(chk, DEFAULT_SAMPLE_SCREENS, i)
  );

  assert.equal(findings.length, 9, 'Must have exactly 9 checks');

  // Requirement 4 -> DISCREPANCY
  assert.equal(findings[3].verdict, 'DISCREPANCY', 'Requirement 4 must be DISCREPANCY');
  assert.equal(findings[3].step_index, 2, 'Requirement 4 must cite Step 2 (Cart drawer)');

  // Requirement 7 -> DISCREPANCY
  assert.equal(findings[6].verdict, 'DISCREPANCY', 'Requirement 7 must be DISCREPANCY');
  assert.equal(findings[6].step_index, 4, 'Requirement 7 must cite Step 4 (Payment)');

  // Requirement 8 -> MISSING_EVIDENCE
  assert.equal(findings[7].verdict, 'MISSING_EVIDENCE', 'Requirement 8 must be MISSING_EVIDENCE');

  // Counts
  const passes = findings.filter((f) => f.verdict === 'EXPLICIT_PASS').length;
  const discrepancies = findings.filter((f) => f.verdict === 'DISCREPANCY').length;
  const missing = findings.filter((f) => f.verdict === 'MISSING_EVIDENCE').length;

  assert.equal(passes, 6, 'Explicit Pass count must be 6');
  assert.equal(discrepancies, 2, 'Discrepancy count must be 2');
  assert.equal(missing, 1, 'Missing Evidence count must be 1');

  const compliance = calculateCompliance(findings);
  assert.equal(compliance.totalChecks, 9);
  assert.equal(compliance.explicitPassCount, 6);
  assert.equal(compliance.discrepancyCount, 2);
  assert.equal(compliance.missingEvidenceCount, 1);
  assert.equal(compliance.overallScore, 67, 'Compliance score must be approximately 67%');
});

const tenGoldStandardChecks: CheckItem[] = [
  {
    id: 'chk-1',
    text: 'As a shopper, I can select a size option (M, L, XL) and add the Heavyweight Organic Tee ($49.00) to my cart.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-2',
    text: 'The cart drawer opens automatically upon adding the item and clearly displays the item details, price, and item quantity.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-3',
    text: 'The user can proceed seamlessly from the cart drawer directly into checkout with a primary action button.',
    category: 'Navigation',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-4',
    text: 'On the shipping screen, the user can fill in contact email and shipping address fields.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-5',
    text: 'The cart drawer must display a final total that already includes tax and delivery charges.',
    category: 'States',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-6',
    text: 'On the payment screen, the user can enter credit card details.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-7',
    text: 'The confirmation screen provides return navigation back to the catalog.',
    category: 'Navigation',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-8',
    text: "The payment screen primary CTA must be labeled exactly 'Pay Now ($49.00)'.",
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-9',
    text: 'A visible loading indicator must appear while payment is being processed before the confirmation screen.',
    category: 'States',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'chk-10',
    text: "The confirmation screen displays 'Order confirmed', an order ID, and a delivery estimate.",
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
];

test('GOLD STANDARD REGRESSION TEST: 10 checks produce 7 Passes, 2 Discrepancies, 1 Missing Evidence, 70% compliance', () => {
  const customFiveScreens = [
    ...DEFAULT_SAMPLE_SCREENS.slice(0, 4),
    {
      id: 'screen-5',
      step_number: 5,
      label: '05 confirmation',
      imageUrl: DEFAULT_SAMPLE_SCREENS[4].imageUrl,
      file_name: '05 confirmation.png',
      ocrText: 'Order confirmed Order ID: NS-10482 Delivery estimate: Oct 23-25 Continue Shopping',
    },
  ];

  const rawFindings = tenGoldStandardChecks.map((chk, i) =>
    classifyCheck(chk, customFiveScreens, i)
  );

  const findings = rawFindings.map((finding, i) =>
    validateAndEnforceFinding(finding, tenGoldStandardChecks[i], customFiveScreens)
  );

  assert.equal(findings.length, 10, 'Must have exactly 10 checks');

  // Check 05: DISCREPANCY (cart total does not include tax/delivery)
  assert.equal(findings[4].verdict, 'DISCREPANCY');
  assert.equal(findings[4].step_index, 2);

  // Check 08: DISCREPANCY ("Submit Order" instead of "Pay Now ($49.00)")
  assert.equal(findings[7].verdict, 'DISCREPANCY');
  assert.equal(findings[7].step_index, 4);
  assert.match(findings[7].diff?.expected || '', /Pay Now/);
  assert.match(findings[7].diff?.observed || '', /Submit Order/);

  // Check 09: MISSING_EVIDENCE (no loading-state screenshot)
  assert.equal(findings[8].verdict, 'MISSING_EVIDENCE');
  assert.equal(findings[8].diff, null);

  // Check 10: EXPLICIT_PASS ("Order confirmed", order ID, and delivery estimate are all visible)
  assert.equal(findings[9].verdict, 'EXPLICIT_PASS', 'Check 10 must be EXPLICIT_PASS');
  assert.equal(findings[9].step_index, 5, 'Check 10 must map to Screenshot 5 (05 confirmation)');
  assert.equal(findings[9].step_name, '05 confirmation');
  assert.equal(findings[9].diff, null, 'Check 10 must have diff: null');
  assert.notEqual(findings[9].verdict, 'DISCREPANCY', 'Check 10 must not be a false discrepancy');

  const passes = findings.filter((f) => f.verdict === 'EXPLICIT_PASS').length;
  const discrepancies = findings.filter((f) => f.verdict === 'DISCREPANCY').length;
  const missing = findings.filter((f) => f.verdict === 'MISSING_EVIDENCE').length;

  assert.equal(passes, 7, 'Explicit Pass count must be 7');
  assert.equal(discrepancies, 2, 'Discrepancy count must be 2');
  assert.equal(missing, 1, 'Missing Evidence count must be 1');

  const compliance = calculateCompliance(findings);
  assert.equal(compliance.totalChecks, 10);
  assert.equal(compliance.explicitPassCount, 7);
  assert.equal(compliance.discrepancyCount, 2);
  assert.equal(compliance.missingEvidenceCount, 1);
  assert.equal(compliance.overallScore, 70, 'Compliance score must be exactly 70%');
});

test('Check 10: Confirmation screen with raster image and "05 confirmation" label does not false-discrepancy', () => {
  const rasterScreens = [
    {
      id: 'screen-1',
      step_number: 1,
      label: '01 product',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    {
      id: 'screen-2',
      step_number: 2,
      label: '02 cart',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ocrText: 'Taxes & shipping calculated in next checkout step',
    },
    {
      id: 'screen-3',
      step_number: 3,
      label: '03 checkout',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    {
      id: 'screen-4',
      step_number: 4,
      label: '04 payment',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ocrText: 'Submit Order',
    },
    {
      id: 'screen-5',
      step_number: 5,
      label: '05 confirmation',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ocrText: 'Order confirmed Order ID: NS-10482 Delivery estimate: Oct 23-25',
    },
  ];

  const check10 = tenGoldStandardChecks[9];
  const classified = classifyCheck(check10, rasterScreens, 9);
  assert.equal(classified.verdict, 'EXPLICIT_PASS');
  assert.equal(classified.step_index, 5);

  const validated = validateAndEnforceFinding(classified, check10, rasterScreens);
  assert.equal(validated.verdict, 'EXPLICIT_PASS');
  assert.equal(validated.diff, null);
  assert.equal(validated.step_index, 5);
  assert.equal(validated.step_name, '05 confirmation');
});
