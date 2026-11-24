import React, { useState } from 'react';
import {
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  ClipboardList,
  Bug,
  ExternalLink,
} from 'lucide-react';
import { AdvisoryItem, Finding, ReviewerDecision, ScreenItem } from '../../types/audit';
import { calculateCompliance } from '../../utils/compliance';
import { exportAuditPdf } from '../../utils/pdfExport';
import { hasReachedDailyAuditLimit } from '../../constants/limits';

interface Step5ResultsProps {
  findings: Finding[];
  advisory: AdvisoryItem[];
  screens: ScreenItem[];
  projectTitle?: string;
  auditId?: string;
  auditDate?: string;
  onUpdateFinding: (updatedFinding: Finding) => void;
  isStale?: boolean;
  onRerunAudit?: () => void;
}

export const Step5Results: React.FC<Step5ResultsProps> = ({
  findings,
  advisory,
  screens,
  projectTitle = 'Checkout flow v2',
  auditId,
  auditDate,
  onUpdateFinding,
  isStale = false,
  onRerunAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'test-cases' | 'issue-drafts'>('report');
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(findings[0]?.id || null);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  const compliance = calculateCompliance(findings);

  const filteredFindings = findings.filter((f) => {
    if (filterVerdict === 'ALL') return true;
    if (filterVerdict === 'DISCREPANCY') return f.verdict === 'DISCREPANCY';
    if (filterVerdict === 'MISSING_EVIDENCE') return f.verdict === 'MISSING_EVIDENCE';
    if (filterVerdict === 'EXPLICIT_PASS') return f.verdict === 'EXPLICIT_PASS';
    return true;
  });

  const handleReviewerDecisionChange = (finding: Finding, decision: ReviewerDecision) => {
    onUpdateFinding({
      ...finding,
      reviewer_decision: decision,
    });
  };

  const handleReviewerNoteChange = (finding: Finding, note: string) => {
    onUpdateFinding({
      ...finding,
      reviewer_note: note,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  const handleDownloadPdf = () => {
    setPdfError(null);
    setPdfSuccess(null);
    setIsGeneratingPdf(true);

    try {
      const result = exportAuditPdf({
        auditId,
        auditTitle: projectTitle || 'Visual Audit Flow',
        date: auditDate,
        totalChecks: compliance.totalChecks,
        explicitPassCount: compliance.explicitPassCount,
        discrepancyCount: compliance.discrepancyCount,
        missingEvidenceCount: compliance.missingEvidenceCount,
        complianceScore: compliance.overallScore,
        findings,
        advisory,
        screens,
        isStale,
      });

      if (!result.success) {
        setPdfError(result.error || 'Failed to generate PDF report.');
      } else {
        setPdfSuccess(`PDF report downloaded: ${result.filename}`);
        setTimeout(() => setPdfSuccess(null), 5000);
      }
    } catch (err: any) {
      setPdfError(err?.message || 'An unexpected error occurred while generating PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0">
      {/* Heading */}
      <div className="no-print">
        <div className="text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
          STEP 5 OF 5
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">
          Audit results
        </h1>
        <p className="text-sm text-[#78716C] mt-1">
          A concise decision layer first, with evidence and QA artifacts available underneath.
        </p>
      </div>

      {/* Stale Results Warning Banner */}
      {isStale && (
        <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#92400E] no-print">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0" />
            <div>
              <span className="font-bold">Audit evidence modified:</span> Requirements, checks, or screenshots have changed since this audit was performed. These results may be outdated.
            </div>
          </div>
          {onRerunAudit && (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
              {hasReachedDailyAuditLimit() && (
                <span className="text-xs font-semibold text-[#DC2626]">
                  Daily AI usage limit reached. Please try again later.
                </span>
              )}
              <button
                onClick={onRerunAudit}
                disabled={hasReachedDailyAuditLimit()}
                className="px-4 py-2 bg-[#B45309] hover:bg-[#9A3412] text-white rounded-xl font-semibold transition-colors shrink-0 whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Re-run visual audit →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visible PDF Generation Error Message Banner */}
      {pdfError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start justify-between gap-3 text-xs text-[#991B1B] no-print shadow-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-[#991B1B]">Unable to download PDF</div>
              <div className="mt-0.5 text-xs text-[#7F1D1D] leading-relaxed">{pdfError}</div>
            </div>
          </div>
          <button
            onClick={() => setPdfError(null)}
            className="text-xs font-semibold text-[#991B1B] hover:text-[#7F1D1D] px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PDF Generation Success Notification */}
      {pdfSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between gap-3 text-xs text-[#065F46] no-print shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            <span className="font-medium">{pdfSuccess}</span>
          </div>
          <button
            onClick={() => setPdfSuccess(null)}
            className="text-xs font-semibold text-[#065F46] hover:text-[#047857] px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 5 Metrics Row matching Figma */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total checks */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-3xl font-bold text-[#1C1917]">
            {compliance.totalChecks}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-1">
            Total checks
          </div>
        </div>

        {/* Explicit pass */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-3xl font-bold text-[#065F46]">
            {compliance.explicitPassCount}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-1">
            Explicit pass
          </div>
        </div>

        {/* Discrepancies */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-3xl font-bold text-[#991B1B]">
            {compliance.discrepancyCount}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-1">
            Discrepancies
          </div>
        </div>

        {/* Missing evidence */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-3xl font-bold text-[#92400E]">
            {compliance.missingEvidenceCount}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-1">
            Missing evidence
          </div>
        </div>

        {/* Follow-up */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs col-span-2 sm:col-span-1">
          <div className="text-3xl font-bold text-[#0369A1]">
            {compliance.followUpCount}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-1">
            Follow-up
          </div>
        </div>
      </div>

      {/* Middle Section: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Key Findings */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1C1917]">
                Key findings
              </h2>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 no-print">
                {['ALL', 'DISCREPANCY', 'MISSING_EVIDENCE', 'EXPLICIT_PASS'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterVerdict(f)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterVerdict === f
                        ? 'bg-[#B45309] text-white'
                        : 'bg-[#F9F8F6] text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    {f === 'ALL'
                      ? 'All'
                      : f === 'DISCREPANCY'
                      ? 'Discrepancies'
                      : f === 'MISSING_EVIDENCE'
                      ? 'Missing'
                      : 'Pass'}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              {filteredFindings.map((finding, idx) => {
                const isExpanded = expandedFindingId === finding.id;
                const findingNumber = String(idx + 1).padStart(2, '0');

                return (
                  <div
                    key={finding.id}
                    className="border border-[#EAE6DF] rounded-xl overflow-hidden transition-all bg-white"
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F9F8F6]/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-[#FDF4EE] text-[#B45309] text-xs font-bold flex items-center justify-center shrink-0">
                          {findingNumber}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-[#1C1917]">
                            {finding.check_text || `Requirement ${idx + 1}`}
                          </div>
                          <div className="text-xs text-[#78716C] mt-0.5">
                            Screenshot {finding.step_index}: {finding.step_name} · {finding.category || 'Core flow'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Original AI Verdict Pill */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            finding.verdict === 'DISCREPANCY'
                              ? 'bg-[#FEE2E2] text-[#991B1B]'
                              : finding.verdict === 'MISSING_EVIDENCE'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#D1FAE5] text-[#065F46]'
                          }`}
                        >
                          {finding.verdict === 'DISCREPANCY'
                            ? 'Discrepancy'
                            : finding.verdict === 'MISSING_EVIDENCE'
                            ? 'Missing evidence'
                            : 'Explicit pass'}
                        </span>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#78716C]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#78716C]" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Evidence & Dual-Track Reviewer Area */}
                    {isExpanded && (
                      <div className="p-4 bg-[#F9F8F6] border-t border-[#EAE6DF] space-y-4 text-xs">
                        {/* Structured Diff (if Discrepancy) */}
                        {finding.diff ? (
                          <div className="bg-white p-3.5 rounded-xl border border-[#EAE6DF] space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#B45309] w-16 shrink-0 uppercase tracking-wider text-[10px]">
                                Expected:
                              </span>
                              <span className="text-[#1C1917] font-medium">
                                "{finding.diff.expected}"
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#991B1B] w-16 shrink-0 uppercase tracking-wider text-[10px]">
                                Observed:
                              </span>
                              <span className="text-[#991B1B] font-semibold">
                                "{finding.diff.observed}"
                              </span>
                            </div>
                            <div className="flex items-start gap-2 pt-1 border-t border-[#F3F4F6]">
                              <span className="font-bold text-[#78716C] w-16 shrink-0 uppercase tracking-wider text-[10px]">
                                Evidence:
                              </span>
                              <span className="text-[#78716C]">
                                {finding.target_element} on Screenshot {finding.step_index} ({finding.step_name}).
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-3.5 rounded-xl border border-[#EAE6DF] space-y-1">
                            <div className="font-bold text-[#78716C] uppercase tracking-wider text-[10px]">
                              Evidence Analysis
                            </div>
                            <p className="text-[#1C1917] leading-relaxed">
                              {finding.explanation}
                            </p>
                            <div className="text-[11px] text-[#78716C] pt-1">
                              Target element: <span className="font-medium">{finding.target_element}</span>
                            </div>
                          </div>
                        )}

                        {/* Dual-Track Reviewer Override Card */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#EAE6DF] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#B45309]" />
                              Dual-Track Human Reviewer Override
                            </span>
                            <span className="text-[11px] text-[#78716C]">
                              AI Verdict: <span className="font-bold">{finding.verdict}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                            <div>
                              <label className="block text-[10px] font-semibold text-[#78716C] uppercase mb-1">
                                Decision
                              </label>
                              <select
                                value={finding.reviewer_decision}
                                onChange={(e) =>
                                  handleReviewerDecisionChange(
                                    finding,
                                    e.target.value as ReviewerDecision
                                  )
                                }
                                className="w-full text-xs p-2 rounded-lg border border-[#D6D0C7] bg-white outline-none font-medium text-[#1C1917] focus:border-[#B45309]"
                              >
                                <option value="UNREVIEWED">Unreviewed (Use AI Verdict)</option>
                                <option value="MANUALLY_VERIFIED">Manually Verified (Override to Pass)</option>
                                <option value="WAIVED_KNOWN_ISSUE">Waived / Known Issue (Exclude)</option>
                                <option value="NEEDS_FOLLOW_UP">Needs Follow-up (Action Pending)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-[#78716C] uppercase mb-1">
                                Reviewer Note
                              </label>
                              <input
                                type="text"
                                value={finding.reviewer_note || ''}
                                onChange={(e) => handleReviewerNoteChange(finding, e.target.value)}
                                placeholder="Add override reason or ticket link..."
                                className="w-full text-xs p-2 rounded-lg border border-[#D6D0C7] bg-white outline-none text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#B45309]"
                              />
                            </div>
                          </div>

                          {finding.reviewer_decision !== 'UNREVIEWED' && (
                            <div className="text-[11px] text-[#B45309] font-medium bg-[#FDF4EE] px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                              <span>
                                {finding.reviewer_decision === 'MANUALLY_VERIFIED' && 'Manual verification overrides score to Passed.'}
                                {finding.reviewer_decision === 'WAIVED_KNOWN_ISSUE' && 'Item waived and excluded from compliance score denominator.'}
                                {finding.reviewer_decision === 'NEEDS_FOLLOW_UP' && 'Requires team follow-up; not counted as passed.'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advisory / UX & Logic Insights Section */}
          <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                Advisory / UX & Logic Insights
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Heuristic observations and edge cases isolated strictly from the compliance score.
              </p>
            </div>

            <div className="space-y-3">
              {advisory.map((adv, idx) => (
                <div
                  key={adv.id || idx}
                  className="p-3.5 rounded-xl border border-[#EAE6DF] bg-[#F9F8F6] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917]">
                      {adv.risk}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adv.severity === 'HIGH'
                          ? 'bg-[#FEE2E2] text-[#991B1B]'
                          : adv.severity === 'MEDIUM'
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#F3F4F6] text-[#374151]'
                      }`}
                    >
                      {adv.severity} Severity
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] leading-relaxed">
                    {adv.recommendation}
                  </p>
                  <div className="text-[10px] font-medium text-[#A8A29E]">
                    Observed on Step {adv.step_index} · {adv.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Overall Compliance Card matching Figma */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-8 border border-[#EAE6DF] shadow-xs space-y-6 sticky top-20">
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              Overall compliance
            </h2>
            <div className="text-5xl font-bold tracking-tight text-[#1C1917] mt-3">
              {compliance.overallScore !== null ? `${compliance.overallScore}%` : 'N/A'}
            </div>
            <div className="text-xs text-[#78716C] mt-1">
              Reviewer-adjusted score
            </div>
          </div>

          {/* Sub-Category Progress Bars matching Figma */}
          <div className="space-y-4 pt-2">
            {(['Core flow', 'States', 'Errors', 'Navigation'] as const).map((cat) => {
              const catData = compliance.categories[cat];
              const score = catData?.score;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1C1917]">{cat}</span>
                    <span className="font-bold text-[#78716C]">
                      {score !== null ? `${score}%` : 'N/A'}
                    </span>
                  </div>

                  {/* Progress bar with terracotta fill */}
                  <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#B45309] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${score ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compliance Formula Legend */}
          <div className="p-3.5 bg-[#F9F8F6] rounded-xl border border-[#EAE6DF] text-[11px] text-[#78716C] space-y-1">
            <div className="font-bold text-[#1C1917]">Deterministic Audit Formula</div>
            <div>• Pass: EXPLICIT_PASS or Manually Verified</div>
            <div>• Denominator excludes Waived / Known Issues</div>
            <div>• Discrepancies and Follow-ups count as Unpassed</div>
          </div>
        </div>
      </div>

      {/* Bottom Action Strip & Tabbed Deliverables */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE6DF] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F3F4F6]">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-[#F4ECE3] text-[#B45309]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F9F8F6]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Executive report</span>
            </button>

            <button
              onClick={() => setActiveTab('test-cases')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'test-cases'
                  ? 'bg-[#F4ECE3] text-[#B45309]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F9F8F6]'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>QA test cases</span>
            </button>

            <button
              onClick={() => setActiveTab('issue-drafts')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'issue-drafts'
                  ? 'bg-[#F4ECE3] text-[#B45309]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F9F8F6]'
              }`}
            >
              <Bug className="w-4 h-4" />
              <span>Issue drafts</span>
            </button>
          </div>

          {/* Primary CTA: Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs no-print shrink-0 disabled:opacity-60 cursor-pointer active:scale-95"
            aria-label="Download PDF report for current audit"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>

        {/* In-context Visible PDF Error Alert */}
        {pdfError && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start justify-between gap-3 text-xs text-[#991B1B] no-print shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-[#991B1B]">Unable to download PDF</div>
                <div className="mt-0.5 text-xs text-[#7F1D1D] leading-relaxed">{pdfError}</div>
              </div>
            </div>
            <button
              onClick={() => setPdfError(null)}
              className="text-xs font-semibold text-[#991B1B] hover:text-[#7F1D1D] px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* In-context PDF Success Banner */}
        {pdfSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between gap-3 text-xs text-[#065F46] no-print shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
              <span className="font-medium">{pdfSuccess}</span>
            </div>
            <button
              onClick={() => setPdfSuccess(null)}
              className="text-xs font-semibold text-[#065F46] hover:text-[#047857] px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Executive Report Content */}
        {activeTab === 'report' && (
          <div className="space-y-4 text-xs text-[#1C1917]">
            <div className="p-4 bg-[#F9F8F6] rounded-xl border border-[#EAE6DF] space-y-2">
              <h3 className="text-sm font-bold text-[#1C1917]">
                Executive Audit Summary — {projectTitle}
              </h3>
              <p className="text-xs text-[#78716C]">
                Audit executed on {new Date().toLocaleDateString()} against {screens.length} ordered screenshots and {findings.length} atomic requirement checks.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <span className="text-[#78716C]">Adjusted Score:</span>{' '}
                  <span className="font-bold text-[#1C1917]">{compliance.overallScore}%</span>
                </div>
                <div>
                  <span className="text-[#78716C]">Explicit Passes:</span>{' '}
                  <span className="font-bold text-[#065F46]">{compliance.explicitPassCount}</span>
                </div>
                <div>
                  <span className="text-[#78716C]">Discrepancies:</span>{' '}
                  <span className="font-bold text-[#991B1B]">{compliance.discrepancyCount}</span>
                </div>
                <div>
                  <span className="text-[#78716C]">Missing Evidence:</span>{' '}
                  <span className="font-bold text-[#92400E]">{compliance.missingEvidenceCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-[#1C1917] text-xs uppercase tracking-wider">
                Key Discrepancies Requiring Product Sign-Off:
              </div>
              {findings.filter((f) => f.verdict === 'DISCREPANCY').map((d, i) => (
                <div key={d.id} className="p-3 bg-white rounded-lg border border-[#FECACA] flex items-start gap-2">
                  <span className="font-bold text-[#991B1B]">{i + 1}.</span>
                  <div>
                    <div className="font-semibold text-[#1C1917]">{d.check_text}</div>
                    <div className="text-xs text-[#78716C] mt-0.5">
                      Expected "{d.diff?.expected}" but observed "{d.diff?.observed}".
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: QA Test Cases Content */}
        {activeTab === 'test-cases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#78716C]">
                Ready-to-execute test cases generated from verified flow steps.
              </span>
              <button
                onClick={() => {
                  const markdown = findings
                    .map(
                      (f, i) =>
                        `### TC-${i + 1}: ${f.check_text}\n- Preconditions: Navigate to Step ${f.step_index} (${f.step_name})\n- Target Element: ${f.target_element}\n- Expected: ${f.diff?.expected || 'Visually confirmed specification'}\n- Observed: ${f.diff?.observed || 'Pass'}`
                    )
                    .join('\n\n');
                  copyToClipboard(markdown, 'test-suite');
                }}
                className="text-xs font-semibold text-[#B45309] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedDraftId === 'test-suite' ? 'Copied suite!' : 'Copy Test Suite (Markdown)'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE6DF] text-[#78716C] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Precondition / Screen</th>
                    <th className="py-2.5 px-3">Expected Result</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {findings.map((f, i) => (
                    <tr key={f.id} className="hover:bg-[#F9F8F6]">
                      <td className="py-3 px-3 font-mono font-bold text-[#78716C]">
                        TC-{i + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1C1917]">
                        {f.check_text}
                      </td>
                      <td className="py-3 px-3 text-[#78716C]">
                        Step {f.step_index} ({f.step_name})
                      </td>
                      <td className="py-3 px-3 text-[#4B5563]">
                        {f.diff?.expected || 'Verify element state renders as specified'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded font-medium text-[10px]">
                          {f.category || 'Functional'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-[10px] ${
                            f.verdict === 'DISCREPANCY'
                              ? 'text-[#991B1B]'
                              : f.verdict === 'MISSING_EVIDENCE'
                              ? 'text-[#92400E]'
                              : 'text-[#065F46]'
                          }`}
                        >
                          {f.verdict === 'DISCREPANCY' ? 'P1 / High' : 'P2 / Medium'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Issue Drafts Content */}
        {activeTab === 'issue-drafts' && (
          <div className="space-y-4">
            <div className="text-xs text-[#78716C]">
              One-click markdown cards formatted for Jira, Linear, or GitHub issue trackers.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {findings
                .filter((f) => f.verdict === 'DISCREPANCY' || f.verdict === 'MISSING_EVIDENCE')
                .map((f, i) => {
                  const markdownText = `**Bug Title:** [ContextGuard] ${f.check_text}\n\n**Severity:** ${
                    f.verdict === 'DISCREPANCY' ? 'High' : 'Medium'
                  }\n**Target Screen:** Step ${f.step_index} (${f.step_name})\n**Element:** ${
                    f.target_element
                  }\n\n**Expected:** ${f.diff?.expected || 'Requirement satisfaction'}\n**Observed:** ${
                    f.diff?.observed || f.explanation
                  }\n\n**Reviewer Note:** ${f.reviewer_note || 'None'}`;

                  return (
                    <div
                      key={f.id}
                      className="p-4 bg-[#F9F8F6] rounded-xl border border-[#EAE6DF] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              f.verdict === 'DISCREPANCY'
                                ? 'bg-[#FEE2E2] text-[#991B1B]'
                                : 'bg-[#FEF3C7] text-[#92400E]'
                            }`}
                          >
                            {f.verdict === 'DISCREPANCY' ? 'DISCREPANCY BUG' : 'MISSING EVIDENCE'}
                          </span>
                          <span className="text-[11px] text-[#78716C]">Step {f.step_index}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1C1917]">
                          {f.check_text}
                        </h4>
                        <div className="mt-2 text-[11px] text-[#4B5563] space-y-1 font-mono bg-white p-2.5 rounded border border-[#EAE6DF]">
                          <div><span className="text-[#991B1B] font-bold">- Observed:</span> {f.diff?.observed || f.explanation}</div>
                          <div><span className="text-[#065F46] font-bold">+ Expected:</span> {f.diff?.expected || 'Required state'}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(markdownText, f.id)}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-white border border-[#D6D0C7] hover:border-[#B45309] text-[#1C1917] hover:text-[#B45309] rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {copiedDraftId === f.id ? 'Copied to Clipboard!' : 'Copy Linear / Jira Markdown'}
                        </span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
