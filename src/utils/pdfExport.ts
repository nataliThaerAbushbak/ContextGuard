import { jsPDF } from 'jspdf';
import type { AdvisoryItem, Finding, ReviewerDecision, ScreenItem } from '../types/audit.ts';
import { calculateCompliance } from './compliance.ts';

export interface AuditPdfInput {
  auditId?: string;
  auditTitle: string;
  date?: string;
  totalChecks?: number;
  explicitPassCount?: number;
  discrepancyCount?: number;
  missingEvidenceCount?: number;
  complianceScore?: number | null;
  findings: Finding[];
  advisory: AdvisoryItem[];
  screens?: ScreenItem[];
  isStale?: boolean;
}

export interface ExportValidationResult {
  valid: boolean;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  doc?: jsPDF;
}

/**
 * Validates that the audit data is strictly from the current active audit,
 * is not stale, has not been deleted, and contains valid findings to report.
 */
export function validateAuditForExport(data: AuditPdfInput): ExportValidationResult {
  if (!data) {
    return {
      valid: false,
      error: 'Cannot export report: No current audit data was provided.',
    };
  }

  if (data.isStale) {
    return {
      valid: false,
      error:
        'Cannot export report: Audit evidence or requirements have been modified since this audit was run. Current results are stale. Please re-run the visual audit to export an up-to-date report.',
    };
  }

  if (!data.findings || data.findings.length === 0) {
    return {
      valid: false,
      error:
        'Cannot export report: No findings recorded for the current audit. Please run the visual audit before downloading a report.',
    };
  }

  if (!data.auditTitle || data.auditTitle.trim().length === 0) {
    return {
      valid: false,
      error: 'Cannot export report: The current audit does not have a valid name or title.',
    };
  }

  return { valid: true };
}

/**
 * Formats reviewer decision enum into clean human-readable text.
 */
export function formatReviewerDecision(decision?: ReviewerDecision): string {
  switch (decision) {
    case 'MANUALLY_VERIFIED':
      return 'Manually Verified (Override to Pass)';
    case 'WAIVED_KNOWN_ISSUE':
      return 'Waived / Known Issue (Excluded from Score)';
    case 'NEEDS_FOLLOW_UP':
      return 'Needs Follow-up (Pending Action)';
    case 'UNREVIEWED':
    default:
      return 'Unreviewed (AI Verdict Kept)';
  }
}

/**
 * Formats verdict enum into display text.
 */
export function formatVerdict(verdict: Finding['verdict']): string {
  switch (verdict) {
    case 'EXPLICIT_PASS':
      return 'Explicit Pass';
    case 'DISCREPANCY':
      return 'Discrepancy';
    case 'MISSING_EVIDENCE':
      return 'Missing Evidence';
    default:
      return verdict;
  }
}

/**
 * Generates a complete, multi-page vector PDF report for the current audit.
 */
export function generateAuditPdf(data: AuditPdfInput): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const compliance = calculateCompliance(data.findings);
  const totalChecks = data.totalChecks ?? compliance.totalChecks;
  const explicitPass = data.explicitPassCount ?? compliance.explicitPassCount;
  const discrepancy = data.discrepancyCount ?? compliance.discrepancyCount;
  const missingEvidence = data.missingEvidenceCount ?? compliance.missingEvidenceCount;
  const score =
    data.complianceScore !== undefined
      ? data.complianceScore
      : compliance.overallScore;

  const formattedDate =
    data.date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const pageWidth = 210;
  const leftMargin = 15;
  const rightMargin = 15;
  const usableWidth = pageWidth - leftMargin - rightMargin; // 180mm
  const maxY = 275;

  let currentY = 16;

  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > maxY) {
      doc.addPage();
      currentY = 20;
    }
  };

  // --- Top Decorative Accent Line ---
  doc.setFillColor(180, 83, 9); // Terracotta #B45309
  doc.rect(leftMargin, currentY, usableWidth, 2, 'F');
  currentY += 8;

  // --- Document Header ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('VISUAL FLOW AUDITOR — COMPLIANCE & VERIFICATION REPORT', leftMargin, currentY);
  currentY += 6;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 25, 23); // #1C1917
  doc.text(data.auditTitle, leftMargin, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 113, 108); // #78716C
  doc.text(
    `Date of Audit: ${formattedDate}  |  Screens Evaluated: ${data.screens?.length ?? 0}  |  Total Checks: ${totalChecks}`,
    leftMargin,
    currentY
  );
  currentY += 8;

  // --- Executive Metrics Summary Grid (5 boxes) ---
  ensureSpace(28);

  const boxWidth = (usableWidth - 8) / 5; // ~34.4mm each
  const boxHeight = 22;

  const metrics = [
    {
      label: 'Compliance Score',
      val: score !== null ? `${score}%` : 'N/A',
      numColor: [180, 83, 9], // Terracotta
    },
    {
      label: 'Total Checks',
      val: String(totalChecks),
      numColor: [28, 25, 23], // Dark Slate
    },
    {
      label: 'Explicit Pass',
      val: String(explicitPass),
      numColor: [6, 95, 70], // Green
    },
    {
      label: 'Discrepancies',
      val: String(discrepancy),
      numColor: [153, 27, 27], // Red
    },
    {
      label: 'Missing Evidence',
      val: String(missingEvidence),
      numColor: [146, 64, 14], // Amber
    },
  ];

  metrics.forEach((m, i) => {
    const x = leftMargin + i * (boxWidth + 2);
    // Box bg
    doc.setFillColor(249, 248, 246);
    doc.setDrawColor(234, 230, 223);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

    // Value
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.numColor[0], m.numColor[1], m.numColor[2]);
    doc.text(m.val, x + boxWidth / 2, currentY + 9, { align: 'center' });

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 113, 108);
    const splitLabel = doc.splitTextToSize(m.label, boxWidth - 2);
    doc.text(splitLabel, x + boxWidth / 2, currentY + 15, { align: 'center' });
  });

  currentY += boxHeight + 8;

  // --- Section 1: Detailed Findings & Evidence ---
  ensureSpace(12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 25, 23);
  doc.text('1. Detailed Findings & Reviewer Decisions', leftMargin, currentY);
  currentY += 2;

  doc.setDrawColor(234, 230, 223);
  doc.line(leftMargin, currentY, leftMargin + usableWidth, currentY);
  currentY += 6;

  data.findings.forEach((finding, idx) => {
    const findingNum = String(idx + 1).padStart(2, '0');
    const checkText = finding.check_text || `Requirement ${idx + 1}`;
    const category = finding.category || 'Core flow';
    const verdict = finding.verdict;

    // Determine colors
    let verdictColor = [6, 95, 70]; // pass green
    let verdictBg = [209, 250, 229];
    if (verdict === 'DISCREPANCY') {
      verdictColor = [153, 27, 27];
      verdictBg = [254, 226, 226];
    } else if (verdict === 'MISSING_EVIDENCE') {
      verdictColor = [146, 64, 14];
      verdictBg = [254, 243, 199];
    }

    // Estimate finding card height
    const splitExplanation = doc.splitTextToSize(finding.explanation || 'No explanation provided.', usableWidth - 10);
    const expLines = splitExplanation.length;
    let cardHeight = 28 + expLines * 4;
    if (finding.diff) {
      cardHeight += 16;
    }
    if (finding.reviewer_note) {
      cardHeight += 6;
    }

    ensureSpace(Math.min(cardHeight, 60));

    const cardTop = currentY;

    // Card background & border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(234, 230, 223);
    doc.roundedRect(leftMargin, cardTop, usableWidth, cardHeight, 2, 2, 'FD');

    // Finding number badge
    doc.setFillColor(253, 244, 238);
    doc.roundedRect(leftMargin + 3, cardTop + 3, 7, 7, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(findingNum, leftMargin + 6.5, cardTop + 7.5, { align: 'center' });

    // Check title
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 25, 23);
    const titleLines = doc.splitTextToSize(checkText, usableWidth - 55);
    doc.text(titleLines[0], leftMargin + 13, cardTop + 7.5);

    // Verdict Badge
    const verdictLabel = formatVerdict(verdict).toUpperCase();
    doc.setFillColor(verdictBg[0], verdictBg[1], verdictBg[2]);
    const badgeWidth = 28;
    doc.roundedRect(leftMargin + usableWidth - badgeWidth - 3, cardTop + 3.5, badgeWidth, 6, 1, 1, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
    doc.text(verdictLabel, leftMargin + usableWidth - badgeWidth / 2 - 3, cardTop + 7.5, {
      align: 'center',
    });

    let innerY = cardTop + 14;

    // Evidence reference row
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 113, 108);
    doc.text('Evidence Reference:', leftMargin + 4, innerY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 25, 23);
    doc.text(
      `Step ${finding.step_index}: ${finding.step_name}  |  Target Element: ${finding.target_element || 'Screen view'}  |  Category: ${category}`,
      leftMargin + 34,
      innerY
    );
    innerY += 5;

    // Diff section (if Discrepancy)
    if (finding.diff) {
      doc.setFillColor(249, 248, 246);
      doc.roundedRect(leftMargin + 4, innerY, usableWidth - 8, 12, 1, 1, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('EXPECTED:', leftMargin + 6, innerY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(28, 25, 23);
      doc.text(`"${finding.diff.expected}"`, leftMargin + 24, innerY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(153, 27, 27);
      doc.text('OBSERVED:', leftMargin + 6, innerY + 9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(153, 27, 27);
      doc.text(`"${finding.diff.observed}"`, leftMargin + 24, innerY + 9.5);

      innerY += 14;
    }

    // Explanation
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 65, 60);
    doc.text(splitExplanation, leftMargin + 4, innerY);
    innerY += expLines * 4 + 2;

    // Reviewer Decision & Notes Row
    doc.setFillColor(249, 248, 246);
    doc.roundedRect(leftMargin + 4, innerY, usableWidth - 8, 8 + (finding.reviewer_note ? 5 : 0), 1, 1, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 113, 108);
    doc.text('REVIEWER DECISION:', leftMargin + 6, innerY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(formatReviewerDecision(finding.reviewer_decision), leftMargin + 38, innerY + 5);

    if (finding.reviewer_note) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 113, 108);
      doc.text('NOTE:', leftMargin + 6, innerY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(28, 25, 23);
      const noteText = doc.splitTextToSize(finding.reviewer_note, usableWidth - 30);
      doc.text(noteText[0], leftMargin + 18, innerY + 10);
    }

    currentY = cardTop + cardHeight + 4;
  });

  // --- Section 2: Advisory / UX & Logic Insights ---
  ensureSpace(18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 25, 23);
  doc.text('2. Advisory / UX & Heuristic Insights', leftMargin, currentY);
  currentY += 2;

  doc.setDrawColor(234, 230, 223);
  doc.line(leftMargin, currentY, leftMargin + usableWidth, currentY);
  currentY += 5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 113, 108);
  doc.text(
    'Note: Advisory findings represent non-blocking heuristic observations, edge cases, and design suggestions isolated from compliance scoring.',
    leftMargin,
    currentY
  );
  currentY += 6;

  if (!data.advisory || data.advisory.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 113, 108);
    doc.text('No advisory insights identified for this audit.', leftMargin, currentY);
    currentY += 8;
  } else {
    data.advisory.forEach((adv, idx) => {
      const splitRec = doc.splitTextToSize(adv.recommendation, usableWidth - 10);
      const recLines = splitRec.length;
      const advHeight = 16 + recLines * 4;

      ensureSpace(Math.min(advHeight, 40));

      const advTop = currentY;

      // Card
      doc.setFillColor(249, 248, 246);
      doc.setDrawColor(234, 230, 223);
      doc.roundedRect(leftMargin, advTop, usableWidth, advHeight, 2, 2, 'FD');

      // Severity Tag
      let sevBg = [243, 244, 246];
      let sevColor = [55, 65, 81];
      if (adv.severity === 'HIGH') {
        sevBg = [254, 226, 226];
        sevColor = [153, 27, 27];
      } else if (adv.severity === 'MEDIUM') {
        sevBg = [254, 243, 199];
        sevColor = [146, 64, 14];
      }

      doc.setFillColor(sevBg[0], sevBg[1], sevBg[2]);
      doc.roundedRect(leftMargin + 3, advTop + 3, 22, 5, 1, 1, 'F');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.text(`${adv.severity} SEVERITY`, leftMargin + 14, advTop + 6.5, { align: 'center' });

      // Risk title
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(28, 25, 23);
      doc.text(adv.risk, leftMargin + 28, advTop + 6.5);

      // Context
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 113, 108);
      doc.text(
        `Step ${adv.step_index}${adv.step_name ? ` (${adv.step_name})` : ''} · ${adv.category}`,
        leftMargin + usableWidth - 4,
        advTop + 6.5,
        { align: 'right' }
      );

      // Recommendation text
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 65, 60);
      doc.text(splitRec, leftMargin + 4, advTop + 13);

      currentY = advTop + advHeight + 3;
    });
  }

  // --- Add Professional Page Numbering & Footer across all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(234, 230, 223);
    doc.line(leftMargin, 287, leftMargin + usableWidth, 287);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 113, 108);
    doc.text(
      `Visual Flow Auditor  |  Audit: "${data.auditTitle}"`,
      leftMargin,
      291
    );

    doc.text(
      `Page ${p} of ${totalPages}`,
      leftMargin + usableWidth / 2,
      291,
      { align: 'center' }
    );

    doc.text(
      `Generated: ${formattedDate}`,
      leftMargin + usableWidth,
      291,
      { align: 'right' }
    );
  }

  return doc;
}

/**
 * Triggers client-side PDF export and download for the current audit,
 * validating first that the data belongs strictly to the current active audit
 * and is not stale or empty.
 */
export function exportAuditPdf(data: AuditPdfInput): ExportResult {
  const validation = validateAuditForExport(data);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    const doc = generateAuditPdf(data);
    const sanitizedTitle = (data.auditTitle || 'audit_report')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 40);

    const filename = `${sanitizedTitle}_report_${new Date().toISOString().slice(0, 10)}.pdf`;

    // In browser environment, trigger standard download
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      doc.save(filename);
    }

    return {
      success: true,
      filename,
      doc,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `PDF generation failed: ${err?.message || 'Unknown internal error'}`,
    };
  }
}
