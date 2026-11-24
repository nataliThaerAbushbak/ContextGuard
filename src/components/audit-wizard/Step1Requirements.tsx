import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DEFAULT_ECOMMERCE_REQUIREMENTS } from '../../data/sampleData';

interface Step1RequirementsProps {
  auditTitle: string;
  onChangeTitle: (title: string) => void;
  requirementsText: string;
  onChangeRequirements: (text: string) => void;
  onExtractChecks: () => Promise<void>;
  isExtracting: boolean;
}

export const Step1Requirements: React.FC<Step1RequirementsProps> = ({
  auditTitle,
  onChangeTitle,
  requirementsText,
  onChangeRequirements,
  onExtractChecks,
  isExtracting,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadSample = () => {
    onChangeRequirements(DEFAULT_ECOMMERCE_REQUIREMENTS);
    if (!auditTitle || auditTitle.trim() === '' || auditTitle === 'New custom audit') {
      onChangeTitle('E-Commerce Checkout Flow Audit');
    }
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    if (!requirementsText.trim()) {
      setErrorMsg('Please paste or write requirements before extracting checks.');
      return;
    }

    // Auto-generate a title if left blank
    if (!auditTitle || auditTitle.trim() === '') {
      const firstLine = requirementsText.trim().split('\n')[0].replace(/^(FEATURE:|STORY:|EPIC:)/i, '').trim();
      const derived = firstLine.length > 4 ? firstLine.slice(0, 40) : 'Custom Flow Audit';
      onChangeTitle(derived);
    }

    setErrorMsg(null);
    try {
      await onExtractChecks();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to extract checks. Please try again.');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Step Heading */}
      <div>
        <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
          STEP 1 OF 5
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917]">
          Tell us what to audit
        </h1>
        <p className="text-xs sm:text-sm text-[#78716C] mt-1">
          Start with the requirements. ContextGuard will extract checks before it analyzes any screenshots.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Requirements Text Input Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE6DF] shadow-xs space-y-5">
          {/* Editable Audit Title Field matching Section 6 */}
          <div>
            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-1.5">
              Audit Name
            </label>
            <input
              type="text"
              value={auditTitle}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="e.g. Login Form Audit or E-Commerce Checkout Flow"
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] outline-none text-sm text-[#1C1917] placeholder:text-[#A8A29E] bg-white transition-colors font-medium"
            />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              Requirements
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Paste PRD text, user stories, acceptance criteria, or plain-language requirements.
            </p>
          </div>

          <div className="relative">
            <textarea
              rows={11}
              value={requirementsText}
              onChange={(e) => {
                if (e.target.value.length <= 10000) {
                  onChangeRequirements(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }
              }}
              placeholder="Paste your requirements here..."
              className="w-full p-4 rounded-xl border border-[#EAE6DF] focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309] outline-none text-sm text-[#1C1917] placeholder:text-[#A8A29E] bg-white resize-y transition-colors leading-relaxed font-sans"
            />
            <div className="absolute bottom-3 right-3 text-xs text-[#A8A29E] bg-white/90 px-1.5 py-0.5 rounded pointer-events-none">
              {requirementsText.length.toLocaleString()} / 10,000
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs font-medium text-[#991B1B] bg-[#FEE2E2]/60 border border-[#FECACA] px-3 py-2 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-4 py-2.5 border border-[#D6D0C7] hover:border-[#A8A29E] hover:bg-[#F9F8F6] text-[#2D2A26] rounded-xl text-sm font-medium transition-colors text-center"
            >
              Load sample
            </button>

            <button
              type="button"
              disabled={isExtracting || !requirementsText.trim()}
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs disabled:opacity-50 active:scale-95"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting checks...</span>
                </>
              ) : (
                <span>Extract checks →</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: "What happens next" Info Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE6DF] shadow-xs space-y-6">
          <h2 className="text-base font-bold text-[#1C1917]">
            What happens next
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <span className="w-6 h-6 rounded-md bg-[#FDF4EE] text-[#B45309] text-xs font-bold flex items-center justify-center shrink-0">
                01
              </span>
              <div className="text-sm font-medium text-[#1C1917] pt-0.5">
                AI extracts atomic checks
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="w-6 h-6 rounded-md bg-[#FDF4EE] text-[#B45309] text-xs font-bold flex items-center justify-center shrink-0">
                02
              </span>
              <div className="text-sm font-medium text-[#1C1917] pt-0.5">
                Ambiguities are flagged
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="w-6 h-6 rounded-md bg-[#FDF4EE] text-[#B45309] text-xs font-bold flex items-center justify-center shrink-0">
                03
              </span>
              <div className="text-sm font-medium text-[#1C1917] pt-0.5">
                You confirm every check
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="w-6 h-6 rounded-md bg-[#FDF4EE] text-[#B45309] text-xs font-bold flex items-center justify-center shrink-0">
                04
              </span>
              <div className="text-sm font-medium text-[#1C1917] pt-0.5">
                Only then do we audit the flow
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
