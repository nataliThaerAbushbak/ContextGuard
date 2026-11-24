import React, { useState } from 'react';
import { WorkspaceSettings } from '../../types/audit';

interface SettingsViewProps {
  settings: WorkspaceSettings;
  displayName?: string;
  onSaveSettings: (settings: WorkspaceSettings, displayName?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings: initialSettings,
  displayName: initialDisplayName = '',
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'behavior' | 'workspace' | 'exports' | 'appearance'>('behavior');
  const [settings, setSettings] = useState<WorkspaceSettings>(initialSettings);
  const [displayName, setDisplayName] = useState<string>(initialDisplayName);
  const [isSaved, setIsSaved] = useState(false);

  const handleToggle = (key: keyof WorkspaceSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSaveSettings(settings, displayName.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header matching Figma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
            PREFERENCES
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">
            Settings
          </h1>
          <p className="text-sm text-[#78716C] mt-1">
            Control review behavior and workspace preferences without exposing implementation complexity.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs self-start sm:self-auto"
        >
          <span>{isSaved ? 'Saved successfully!' : 'Save changes'}</span>
        </button>
      </div>

      {/* Main Settings Grid matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sub-tabs Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-3 border border-[#EAE6DF] shadow-xs space-y-1">
          <button
            onClick={() => setActiveTab('behavior')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'behavior'
                ? 'bg-[#F4ECE3] text-[#B45309]'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F9F8F6]'
            }`}
          >
            Audit behavior
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'workspace'
                ? 'bg-[#F4ECE3] text-[#B45309]'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F9F8F6]'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'exports'
                ? 'bg-[#F4ECE3] text-[#B45309]'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F9F8F6]'
            }`}
          >
            Exports
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'appearance'
                ? 'bg-[#F4ECE3] text-[#B45309]'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F9F8F6]'
            }`}
          >
            Appearance
          </button>
        </div>

        {/* Right Settings Form Card */}
        <div className="lg:col-span-9 space-y-6">
          {/* User Profile / Display Name */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE6DF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1C1917]">
              User profile & identity
            </h2>
            <div className="space-y-1.5 max-w-md">
              <label
                htmlFor="settings-display-name"
                className="block text-xs font-semibold text-[#1C1917]"
              >
                Display name
              </label>
              <input
                id="settings-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-[#D6D0C7] focus:border-[#B45309] rounded-xl outline-none text-[#1C1917] placeholder:text-[#A8A29E] transition-all shadow-xs"
              />
              <p className="text-xs text-[#78716C] mt-1">
                Your name used for personalized greetings across ContextGuard.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE6DF] shadow-xs space-y-6">
            <h2 className="text-base font-bold text-[#1C1917]">
              Audit behavior
            </h2>

            <div className="divide-y divide-[#F3F4F6] space-y-6">
              {/* Evidence-first verification */}
              <div className="pt-6 first:pt-0 flex items-center justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold text-[#1C1917]">
                    Evidence-first verification
                  </div>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    Unseen states stay Missing evidence instead of being inferred as passed.
                  </div>
                </div>

                {/* Switch toggle with terracotta active fill */}
                <button
                  type="button"
                  onClick={() => handleToggle('evidenceFirstVerification')}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.evidenceFirstVerification ? 'bg-[#B45309]' : 'bg-[#D6D0C7]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      settings.evidenceFirstVerification ? 'translate-x-6' : 'translate-x-1'
                    } top-0.5 absolute`}
                  />
                </button>
              </div>

              {/* Separate advisory insights */}
              <div className="pt-6 flex items-center justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold text-[#1C1917]">
                    Separate advisory insights
                  </div>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    UX and logic recommendations never change the compliance score.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('separateAdvisoryInsights')}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.separateAdvisoryInsights ? 'bg-[#B45309]' : 'bg-[#D6D0C7]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      settings.separateAdvisoryInsights ? 'translate-x-6' : 'translate-x-1'
                    } top-0.5 absolute`}
                  />
                </button>
              </div>

              {/* Reviewer decisions */}
              <div className="pt-6 flex items-center justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold text-[#1C1917]">
                    Reviewer decisions
                  </div>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    Preserve the original AI verdict alongside every manual override.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('reviewerDecisionsPreserved')}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.reviewerDecisionsPreserved ? 'bg-[#B45309]' : 'bg-[#D6D0C7]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      settings.reviewerDecisionsPreserved ? 'translate-x-6' : 'translate-x-1'
                    } top-0.5 absolute`}
                  />
                </button>
              </div>

              {/* Default report detail */}
              <div className="pt-6 flex items-center justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold text-[#1C1917]">
                    Default report detail
                  </div>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    Balanced · findings, evidence, reviewer notes and exports.
                  </div>
                </div>

                <select
                  value={settings.defaultReportDetail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultReportDetail: e.target.value as any,
                    })
                  }
                  className="px-4 py-2 bg-white border border-[#D6D0C7] text-xs font-semibold text-[#2D2A26] rounded-xl outline-none cursor-pointer"
                >
                  <option value="Balanced">Balanced</option>
                  <option value="Compact">Compact</option>
                  <option value="Detailed">Detailed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workspace Note Card matching Figma */}
          <div className="bg-white rounded-2xl p-6 border border-[#EAE6DF] shadow-xs">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Workspace note
            </h3>
            <p className="text-xs text-[#78716C] mt-1">
              These settings affect future audits only. Existing audit evidence remains unchanged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
