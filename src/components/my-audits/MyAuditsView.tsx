import React, { useState } from 'react';
import { Search, MoreHorizontal, Trash2, Eye, Copy, FolderPlus, ArrowRight } from 'lucide-react';
import { AuditRecord } from '../../types/audit';

interface MyAuditsViewProps {
  audits: AuditRecord[];
  onOpenAudit: (audit: AuditRecord) => void;
  onNewAudit: () => void;
  onDeleteAudit: (id: string) => void;
  onDuplicateAudit: (audit: AuditRecord) => void;
  onGoToSamples?: () => void;
}

export const MyAuditsView: React.FC<MyAuditsViewProps> = ({
  audits,
  onOpenAudit,
  onNewAudit,
  onDeleteAudit,
  onDuplicateAudit,
  onGoToSamples,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const projects = ['All', ...Array.from(new Set(audits.map((a) => a.project || 'Default')))];

  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      audit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audit.project || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === 'All' || audit.status === selectedStatus;
    const matchesProject =
      selectedProject === 'All' || (audit.project || 'Default') === selectedProject;
    return matchesSearch && matchesStatus && matchesProject;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header section matching Figma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
            WORKSPACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917]">
            My audits
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1">
            Review active work, completed audits, and items that still need a human decision.
          </p>
        </div>

        <button
          onClick={onNewAudit}
          className="inline-flex items-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs self-start sm:self-auto active:scale-95"
        >
          <span>+ New audit</span>
        </button>
      </div>

      {audits.length === 0 ? (
        /* Empty State matching prompt requirement */
        <div className="bg-white rounded-2xl p-12 sm:p-16 border border-[#EAE6DF] shadow-xs text-center max-w-2xl mx-auto space-y-6 mt-6">
          <div className="w-14 h-14 rounded-full bg-[#FDF4EE] text-[#B45309] flex items-center justify-center mx-auto">
            <FolderPlus className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#1C1917]">
              No audits yet
            </h2>
            <p className="text-sm text-[#78716C] max-w-md mx-auto">
              Create your first audit or open a sample project to get started.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNewAudit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs"
            >
              <span>+ New Audit</span>
            </button>
            {onGoToSamples && (
              <button
                onClick={onGoToSamples}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border border-[#D6D0C7] hover:border-[#A8A29E] bg-white text-[#2D2A26] px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
              >
                <span>Browse sample projects</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filter bar matching Figma */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
              {/* Status filter dropdown */}
              <div className="relative shrink-0">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 bg-white border border-[#D6D0C7] hover:border-[#A8A29E] text-xs font-semibold text-[#2D2A26] rounded-xl outline-none cursor-pointer appearance-none pr-8"
                >
                  <option value="All">All statuses</option>
                  <option value="Needs review">Needs review</option>
                  <option value="Complete">Complete</option>
                  <option value="Draft">Draft</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[#78716C]">
                  ▼
                </div>
              </div>

              {/* Project filter dropdown */}
              <div className="relative shrink-0">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-4 py-2 bg-white border border-[#D6D0C7] hover:border-[#A8A29E] text-xs font-semibold text-[#2D2A26] rounded-xl outline-none cursor-pointer appearance-none pr-8"
                >
                  <option value="All">All projects</option>
                  {projects
                    .filter((p) => p !== 'All')
                    .map((proj) => (
                      <option key={proj} value={proj}>
                        {proj}
                      </option>
                    ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[#78716C]">
                  ▼
                </div>
              </div>

              <div className="px-4 py-2 bg-white border border-[#D6D0C7] text-xs font-semibold text-[#2D2A26] rounded-xl cursor-default select-none shrink-0">
                Updated recently
              </div>
            </div>

            {/* Search Input matching Figma */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audits..."
                className="w-full text-xs pl-3.5 pr-8 py-2.5 bg-white border border-[#D6D0C7] focus:border-[#B45309] rounded-xl outline-none text-[#1C1917] placeholder:text-[#A8A29E]"
              />
              <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Main Table Card matching Figma */}
          <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#EAE6DF] text-[#78716C] uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-4 px-6">AUDIT</th>
                    <th className="py-4 px-6">PROJECT</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6">COVERAGE</th>
                    <th className="py-4 px-6">UPDATED</th>
                    <th className="py-4 px-6 text-right">•••</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-[#78716C]">
                        No audits match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAudits.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => onOpenAudit(item)}
                        className="hover:bg-[#F9F8F6] cursor-pointer group transition-colors"
                      >
                        <td className="py-4 px-6 font-semibold text-[#1C1917] group-hover:text-[#B45309] transition-colors">
                          {item.title}
                        </td>
                        <td className="py-4 px-6 text-[#78716C]">
                          {item.project || 'Default'}
                        </td>
                        <td className="py-4 px-6">
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
                        </td>
                        <td className="py-4 px-6 font-bold text-[#1C1917]">
                          {item.coverage !== null ? `${item.coverage}%` : '—'}
                        </td>
                        <td className="py-4 px-6 text-[#78716C]">
                          {item.updated_at}
                        </td>
                        <td
                          className="py-4 px-6 text-right relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === item.id ? null : item.id)
                            }
                            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE6DF]"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === item.id && (
                            <div className="absolute right-6 top-10 z-20 w-36 bg-white rounded-xl shadow-lg border border-[#EAE6DF] py-1 text-left">
                              <button
                                onClick={() => {
                                  onOpenAudit(item);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs text-[#1C1917] hover:bg-[#F9F8F6] flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#78716C]" />
                                <span>Open Audit</span>
                              </button>
                              <button
                                onClick={() => {
                                  onDuplicateAudit(item);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs text-[#1C1917] hover:bg-[#F9F8F6] flex items-center gap-2"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#78716C]" />
                                <span>Duplicate</span>
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteAudit(item.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs text-[#991B1B] hover:bg-[#FEE2E2] flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#991B1B]" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
