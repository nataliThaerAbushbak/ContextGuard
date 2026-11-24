import React, { useEffect, useState, useRef } from 'react';
import { Check, AlertCircle, RefreshCw } from 'lucide-react';
import { AdvisoryItem, CheckItem, Finding, ScreenItem, WorkspaceSettings } from '../../types/audit';
import { recordAuditRun } from '../../constants/limits';

interface Step4AuditProgressProps {
  checks: CheckItem[];
  screens: ScreenItem[];
  settings: WorkspaceSettings;
  onAuditFinished: (findings: Finding[], advisory: AdvisoryItem[]) => void;
}

interface AnalysisStage {
  id: string;
  label: string;
}

const STAGES: AnalysisStage[] = [
  { id: 'parsing', label: 'Parsing screenshots' },
  { id: 'matching', label: 'Matching checks to screens' },
  { id: 'comparing', label: 'Comparing expected vs observed' },
  { id: 'missing_evidence', label: 'Evaluating missing evidence' },
  { id: 'advisory', label: 'Generating advisory insights' },
  { id: 'report', label: 'Preparing report' },
];

export const Step4AuditProgress: React.FC<Step4AuditProgressProps> = ({
  checks,
  screens,
  settings,
  onAuditFinished,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const isStarted = useRef(false);

  const totalScreens = Math.max(screens.length, 1);
  const totalChecks = Math.max(checks.filter((c) => c.included).length, 1);

  const screensAnalyzed = Math.min(
    totalScreens,
    Math.max(1, Math.round((progressPercent / 100) * totalScreens))
  );
  const checksEvaluated = Math.min(
    totalChecks,
    Math.max(1, Math.round((progressPercent / 100) * totalChecks))
  );

  const runAnalysis = async () => {
    setError(null);
    setProgressPercent(15);
    setCurrentStageIndex(0);

    const stageTimer1 = setTimeout(() => {
      setCurrentStageIndex(1);
      setProgressPercent(35);
    }, 600);

    const stageTimer2 = setTimeout(() => {
      setCurrentStageIndex(2);
      setProgressPercent(60);
    }, 1200);

    const stageTimer3 = setTimeout(() => {
      setCurrentStageIndex(3);
      setProgressPercent(78);
    }, 2000);

    try {
      recordAuditRun();
      const activeChecks = checks.filter((c) => c.included);

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checks: activeChecks,
          screens,
          settings,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 429) {
          if (errJson?.error?.includes('Daily AI usage limit reached')) {
            throw new Error('Daily AI usage limit reached. Please try again later.');
          }
          throw new Error(
            errJson?.error ||
              'AI usage is temporarily unavailable because the usage limit has been reached. Please try again later.'
          );
        }
        throw new Error(errJson?.error || `Audit service returned HTTP ${response.status}`);
      }

      const data = await response.json();

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      setCurrentStageIndex(4);
      setProgressPercent(90);

      setTimeout(() => {
        setCurrentStageIndex(5);
        setProgressPercent(100);

        setTimeout(() => {
          onAuditFinished(data.findings || [], data.advisory || []);
        }, 500);
      }, 400);
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      console.error('Audit failed:', err);
      const msg = err?.message || '';
      if (msg.includes('Daily AI usage limit reached')) {
        setError('Daily AI usage limit reached. Please try again later.');
      } else if (
        msg.includes('429') ||
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('usage limit') ||
        msg.toLowerCase().includes('rate limit')
      ) {
        setError(
          'AI usage is temporarily unavailable because the usage limit has been reached. Please try again later.'
        );
      } else {
        setError(msg || 'Verification could not be completed. Please check connection and retry.');
      }
    }
  };

  useEffect(() => {
    if (!isStarted.current) {
      isStarted.current = true;
      runAnalysis();
    }
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    runAnalysis().finally(() => setIsRetrying(false));
  };

  // Circular progress calculations
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
          STEP 4 OF 5
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">
          Analyzing your product flow
        </h1>
        <p className="text-sm text-[#78716C] mt-1">
          ContextGuard is checking every confirmed requirement against the screenshot sequence.
        </p>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl p-8 border border-[#FECACA] shadow-xs max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#991B1B] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#1C1917]">Analysis Interrupted</h2>
          <p className="text-xs text-[#78716C]">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Retry visual audit</span>
          </button>
        </div>
      ) : (
        /* Two Column Layout matching Figma */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Progress Ring */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-8 border border-[#EAE6DF] shadow-xs flex flex-col items-center justify-center min-h-[380px]">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="#EAE6DF"
                  strokeWidth="16"
                  fill="transparent"
                />
                {/* Active Progress Ring in Terracotta */}
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="#B45309"
                  strokeWidth="16"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>

              {/* Inside Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold tracking-tight text-[#1C1917]">
                  {progressPercent}%
                </span>
                <span className="text-xs font-semibold text-[#78716C] mt-1">
                  Audit in progress
                </span>
              </div>
            </div>

            {/* Counters Underneath */}
            <div className="mt-8 space-y-1.5 text-center">
              <div className="text-xs font-medium text-[#78716C]">
                Screens analyzed: {screensAnalyzed} / {totalScreens}
              </div>
              <div className="text-xs font-medium text-[#78716C]">
                Checks evaluated: {checksEvaluated} / {totalChecks}
              </div>
            </div>
          </div>

          {/* Right Column: Live Analysis Stages Checklist */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1C1917] mb-6">
                Live analysis
              </h2>

              <div className="space-y-6">
                {STAGES.map((stage, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isActive = idx === currentStageIndex;

                  return (
                    <div
                      key={stage.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Status Icon */}
                        {isDone ? (
                          <div className="w-6 h-6 rounded-full bg-[#D1FAE5] text-[#065F46] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : isActive ? (
                          <div className="w-6 h-6 rounded-full bg-[#FDF4EE] flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#B45309] animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]" />
                        )}

                        <span
                          className={`text-sm ${
                            isActive
                              ? 'font-bold text-[#1C1917]'
                              : isDone
                              ? 'font-medium text-[#1C1917]'
                              : 'text-[#A8A29E]'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>

                      {/* Right Tag */}
                      {isActive && (
                        <span className="text-[11px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full">
                          Analyzing
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-[#F3F4F6] mt-6 flex items-center justify-between text-xs text-[#78716C]">
              <span>Powered by Gemini</span>
              <span>Evidence-First Pipeline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
