import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (displayName: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to continue.');
      return;
    }
    setError(null);
    onComplete(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#EAE6DF] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header Icon & Title */}
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF4EE] text-[#B45309] flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wider text-[#B45309] uppercase">
              GETTING STARTED
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917] mt-0.5">
              Welcome to ContextGuard
            </h1>
          </div>
        </div>

        {/* Product Explanation */}
        <div className="space-y-3 text-sm text-[#57534E] leading-relaxed">
          <p>
            ContextGuard helps you verify whether a product flow matches its requirements.
          </p>
          <p>
            Add your requirements, review the generated checks, upload screenshots of the flow, and run an evidence-based audit.
          </p>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE6DF] space-y-2">
            <div className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
              ContextGuard identifies:
            </div>
            <ul className="text-xs sm:text-sm text-[#44403C] space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="font-semibold text-[#065F46]">Explicit passes:</span>
                <span>Visibly proven by current evidence</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="font-semibold text-[#991B1B]">Discrepancies:</span>
                <span>Contradicted by visible screenshots</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span className="font-semibold text-[#92400E]">Missing evidence:</span>
                <span>Required states or proof not captured</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-[#78716C]">
            You can then review findings, add human decisions, generate QA test cases, and export the audit report.
          </p>

          <div className="p-3 bg-[#F4ECE3]/60 rounded-xl border border-[#EAE6DF] text-xs text-[#78716C] flex items-center justify-between gap-1 overflow-x-auto">
            <span className="font-semibold text-[#B45309]">Workflow:</span>
            <span className="text-[#44403C] whitespace-nowrap">
              Requirements → Review Checks → Upload Flow → Audit → Results
            </span>
          </div>
        </div>

        {/* Name input form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#EAE6DF]">
          <div>
            <label
              htmlFor="onboarding-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-1.5"
            >
              Your name
            </label>
            <input
              id="onboarding-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your name"
              autoFocus
              className="w-full text-sm px-4 py-3 bg-white border border-[#D6D0C7] focus:border-[#B45309] rounded-xl outline-none text-[#1C1917] placeholder:text-[#A8A29E] transition-all shadow-xs"
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-[#991B1B] font-medium mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-xs active:scale-98 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
