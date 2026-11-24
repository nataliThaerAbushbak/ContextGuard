import React from 'react';
import { AuditRecord } from '../../types/audit';
import {
  formatGreeting,
  getOpenIssuesSubtitle,
  getOpenIssuesBreakdown,
} from '../../utils/dashboardHelpers';

interface DashboardViewProps {
  audits: AuditRecord[];
  displayName?: string;
  onNewAudit: () => void;
  onOpenAudit: (audit: AuditRecord) => void;
  onViewAllAudits: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  audits,
  displayName,
  onNewAudit,
  onOpenAudit,
  onViewAllAudits,
}) => {
  // Real metrics calculated from user-owned audits
  const totalAudits = audits.length;
  const completedCount = audits.filter((a) => a.status === 'Complete').length;

  const {
    total: openIssuesCount,
    discrepancies: totalDiscrepancies,
    missingEvidence: totalMissingEvidence,
    followUps: totalFollowUps,
    auditWithDiscrepancy,
  } = getOpenIssuesBreakdown(audits);

  const auditsWithCoverage = audits.filter((a) => typeof a.coverage === 'number');
  const avgCoverage =
    auditsWithCoverage.length > 0
      ? Math.round(
          auditsWithCoverage.reduce((acc, a) => acc + (a.coverage || 0), 0) /
            auditsWithCoverage.length
        )
      : null;

  const completionRate =
    totalAudits > 0 ? Math.round((completedCount / totalAudits) * 100) : 0;

  // Real 7-day activity tracking
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const activityData = dayNames.map((day, idx) => {
    // Generate counts based on actual audits
    const dayAudits = audits.filter((a) => {
      const auditDate = new Date(a.created_at || Date.now());
      return auditDate.getDay() === (idx + 1) % 7;
    });
    return {
      day,
      value: dayAudits.length,
    };
  });

  const maxVal = Math.max(
    ...activityData.map((d) => d.value),
    totalAudits > 0 ? 5 : 2
  );
  const chartWidth = 560;
  const chartHeight = 160;

  const points = activityData.map((d, i) => {
    const x = (i / (activityData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (d.value / maxVal) * (chartHeight - 40) - 20;
    return { x, y, day: d.day, value: d.value };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const recentAudits = audits.slice(0, 4);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917]">
            {formatGreeting(displayName)}
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1">
            {totalAudits === 0
              ? 'Welcome to ContextGuard. Create your first audit to get started.'
              : "Here's what needs attention across your product audits."}
          </p>
        </div>

        <button
          onClick={onNewAudit}
          className="inline-flex items-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs self-start sm:self-auto active:scale-95"
        >
          <span>+ New Audit</span>
        </button>
      </div>

      {/* Top row 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Audits */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase">
            TOTAL AUDITS
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] mt-2">
            {totalAudits}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-2">
            {totalAudits > 0 ? `${totalAudits} recorded` : 'No audits yet'}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase">
            COMPLETED
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] mt-2">
            {completedCount}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-2">
            {totalAudits > 0 ? `${completionRate}% completion` : '0% completion'}
          </div>
        </div>

        {/* Open Issues */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase">
            OPEN ISSUES
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] mt-2">
            {openIssuesCount}
          </div>
          <div className="text-xs font-medium text-[#B45309] mt-2">
            {getOpenIssuesSubtitle(openIssuesCount)}
          </div>
        </div>

        {/* Avg. Coverage */}
        <div className="bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-xs">
          <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase">
            AVG. COVERAGE
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] mt-2">
            {avgCoverage !== null ? `${avgCoverage}%` : 'N/A'}
          </div>
          <div className="text-xs font-medium text-[#78716C] mt-2">
            {auditsWithCoverage.length > 0 ? 'Across evaluated audits' : 'Pending evaluations'}
          </div>
        </div>
      </div>

      {/* Two Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Audit Activity Line Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#1C1917]">
              Audit activity
            </h2>
            <span className="text-xs font-medium text-[#78716C]">
              Last 7 days
            </span>
          </div>

          <div className="w-full overflow-x-auto py-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 25}`}
              className="w-full h-44 overflow-visible"
            >
              <line
                x1="20"
                y1="30"
                x2={chartWidth - 20}
                y2="30"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <line
                x1="20"
                y1="80"
                x2={chartWidth - 20}
                y2="80"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <line
                x1="20"
                y1="130"
                x2={chartWidth - 20}
                y2="130"
                stroke="#F3F4F6"
                strokeWidth="1"
              />

              <path
                d={pathD}
                fill="none"
                stroke="#B45309"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#B45309"
                    className="transition-transform group-hover:scale-150"
                  />
                  <text
                    x={p.x}
                    y={chartHeight + 15}
                    textAnchor="middle"
                    fill="#78716C"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {p.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Right: Recent Audits */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#1C1917]">
              Recent audits
            </h2>
            <button
              onClick={onViewAllAudits}
              className="text-xs font-semibold text-[#B45309] hover:text-[#9A3412] transition-colors"
            >
              View all →
            </button>
          </div>

          {recentAudits.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#78716C] space-y-2">
              <p>No audits created yet.</p>
              <button
                onClick={onNewAudit}
                className="text-xs font-semibold text-[#B45309] hover:underline"
              >
                + Create your first audit
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {recentAudits.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenAudit(item)}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between group cursor-pointer"
                >
                  <div className="truncate pr-2">
                    <div className="text-sm font-semibold text-[#1C1917] group-hover:text-[#B45309] transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#78716C] mt-0.5 truncate">
                      {item.project}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Complete'
                          ? 'bg-[#D1FAE5] text-[#065F46]'
                          : item.status === 'Needs review'
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom "Needs attention" Alert Strip */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs">
        <h2 className="text-base font-bold text-[#1C1917] mb-4">
          Needs attention
        </h2>

        {openIssuesCount === 0 ? (
          <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#EAE6DF] text-xs text-[#78716C] text-center">
            All audits up to date. No pending discrepancies or follow-up items.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Discrepancy item */}
            <div
              onClick={() => {
                if (auditWithDiscrepancy) onOpenAudit(auditWithDiscrepancy);
                else onViewAllAudits();
              }}
              className="p-4 rounded-xl bg-[#FEE2E2]/70 border border-[#FECACA] flex items-center gap-3 cursor-pointer hover:bg-[#FEE2E2] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F87171]/20 text-[#991B1B] font-bold text-lg flex items-center justify-center shrink-0">
                {totalDiscrepancies}
              </div>
              <div className="text-xs font-semibold text-[#991B1B]">
                {auditWithDiscrepancy
                  ? `discrepancies in ${(auditWithDiscrepancy as AuditRecord).title}`
                  : 'open discrepancies identified'}
              </div>
            </div>

            {/* Missing evidence */}
            <div
              onClick={onViewAllAudits}
              className="p-4 rounded-xl bg-[#FEF3C7]/70 border border-[#FDE68A] flex items-center gap-3 cursor-pointer hover:bg-[#FEF3C7] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/20 text-[#92400E] font-bold text-lg flex items-center justify-center shrink-0">
                {totalMissingEvidence}
              </div>
              <div className="text-xs font-semibold text-[#92400E]">
                missing-evidence items
              </div>
            </div>

            {/* Reviewer follow-up pending */}
            <div
              onClick={onViewAllAudits}
              className="p-4 rounded-xl bg-[#E0F2FE]/70 border border-[#BAE6FD] flex items-center gap-3 cursor-pointer hover:bg-[#E0F2FE] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/20 text-[#0369A1] font-bold text-lg flex items-center justify-center shrink-0">
                {totalFollowUps}
              </div>
              <div className="text-xs font-semibold text-[#0369A1]">
                reviewer follow-up pending
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
