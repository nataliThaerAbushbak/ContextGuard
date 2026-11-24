import React from 'react';
import { Check } from 'lucide-react';

interface WizardStepperProps {
  currentStep: number;
  lastCompletedStep: number;
  hasValidResults?: boolean;
  onStepClick?: (step: number) => void;
  onSaveDraft: () => void;
  isSavingDraft?: boolean;
  isViewingCompleted?: boolean;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  lastCompletedStep,
  hasValidResults = false,
  onStepClick,
  onSaveDraft,
  isSavingDraft = false,
  isViewingCompleted = false,
}) => {
  const steps = [
    { num: 1, title: 'Requirements', subtitle: 'Add source' },
    { num: 2, title: 'Review Checks', subtitle: 'Confirm checks' },
    { num: 3, title: 'Upload Flow', subtitle: 'Order screens' },
    { num: 4, title: 'Audit', subtitle: 'Analyze evidence' },
    { num: 5, title: 'Results', subtitle: 'Review report' },
  ];

  return (
    <div className="bg-[#F9F8F6] border-b border-[#EAE6DF] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 no-print">
      {/* Horizontal Steps */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
        {steps.map((s, idx) => {
          // Real completed step rule: only show check if step was actually completed and is not active
          const isDone = s.num <= lastCompletedStep && s.num !== currentStep;
          const isActive = s.num === currentStep;
          // Can navigate to completed steps or current step
          const canClick = (s.num <= lastCompletedStep + 1 || (s.num === 5 && hasValidResults)) && onStepClick;

          return (
            <React.Fragment key={s.num}>
              <div
                onClick={() => canClick && onStepClick(s.num)}
                className={`flex items-center gap-2.5 sm:gap-3 shrink-0 ${
                  canClick ? 'cursor-pointer group' : 'cursor-default'
                }`}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0 ${
                    isDone
                      ? 'bg-[#EBDDCF] text-[#B45309]'
                      : isActive
                      ? 'bg-[#B45309] text-white shadow-xs'
                      : 'border border-[#D6D0C7] text-[#78716C] bg-white'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                </div>

                {/* Step Title & Subtitle */}
                <div className="hidden lg:block">
                  <div
                    className={`text-xs font-semibold leading-tight ${
                      isActive
                        ? 'text-[#1C1917]'
                        : isDone
                        ? 'text-[#44403C] group-hover:text-[#B45309]'
                        : 'text-[#A8A29E]'
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[11px] text-[#78716C] leading-tight">
                    {s.subtitle}
                  </div>
                </div>
              </div>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div className="w-4 sm:w-6 lg:w-8 h-px bg-[#EAE6DF] shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Save Draft / Viewing Status Indicator */}
      <div className="shrink-0 ml-4 flex items-center gap-2">
        {isViewingCompleted && currentStep === 5 && (
          <span className="hidden sm:inline-block px-3 py-1 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-semibold">
            Audit verified
          </span>
        )}

        <button
          onClick={onSaveDraft}
          disabled={isSavingDraft}
          className="px-3.5 sm:px-4 py-2 border border-[#D6D0C7] hover:border-[#A8A29E] bg-white text-[#2D2A26] rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs active:scale-95 disabled:opacity-50"
        >
          {isSavingDraft ? 'Saving...' : 'Save draft'}
        </button>
      </div>
    </div>
  );
};
