/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { WizardStepper } from './components/audit-wizard/WizardStepper';
import { Step1Requirements } from './components/audit-wizard/Step1Requirements';
import { Step2ReviewChecks } from './components/audit-wizard/Step2ReviewChecks';
import { Step3UploadFlow } from './components/audit-wizard/Step3UploadFlow';
import { Step4AuditProgress } from './components/audit-wizard/Step4AuditProgress';
import { Step5Results } from './components/audit-wizard/Step5Results';
import { MyAuditsView } from './components/my-audits/MyAuditsView';
import { SampleProjectsView } from './components/sample-projects/SampleProjectsView';
import { SettingsView } from './components/settings/SettingsView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import {
  AuditRecord,
  CheckCategory,
  CheckItem,
  Finding,
  ScreenItem,
  AdvisoryItem,
  WorkspaceSettings,
} from './types/audit';
import {
  getStoredAudits,
  saveOrUpdateAudit,
  deleteAuditById,
  getStoredSettings,
  saveStoredSettings,
  getStoredProfile,
  saveStoredProfile,
  resolveInitialUserOnboardingState,
  UserProfile,
} from './utils/storage';
import {
  DEFAULT_ECOMMERCE_REQUIREMENTS,
  SampleProjectCard,
} from './data/sampleData';
import { calculateCompliance, deriveAuditStatus } from './utils/compliance';
import {
  createNewAudit,
  getResumeStep,
  pruneDeletedScreen,
} from './utils/auditIsolation';

export default function App() {
  const [currentNavView, setCurrentNavView] = useState<NavView>('dashboard');
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>(getStoredSettings());
  const [initialUserState] = useState(() => resolveInitialUserOnboardingState());
  const [profile, setProfile] = useState<UserProfile>(initialUserState.profile);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(initialUserState.showOnboarding);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Active Wizard state — starts cleanly isolated with zero pre-populated sample contamination
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [lastCompletedStep, setLastCompletedStep] = useState<number>(0);
  const [activeAuditId, setActiveAuditId] = useState<string>(() => `audit-${Date.now()}`);
  const [activeAuditTitle, setActiveAuditTitle] = useState<string>('');
  const [activeAuditProject, setActiveAuditProject] = useState<string>('Custom');
  const [activeAuditCreatedAt, setActiveAuditCreatedAt] = useState<string>(() => new Date().toISOString());
  const [requirementsText, setRequirementsText] = useState<string>('');
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [screens, setScreens] = useState<ScreenItem[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [advisory, setAdvisory] = useState<AdvisoryItem[]>([]);
  const [hasValidResults, setHasValidResults] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isExtractingChecks, setIsExtractingChecks] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load stored audits from localStorage on mount — do NOT pollute active wizard state
  useEffect(() => {
    const stored = getStoredAudits();
    setAudits(stored);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Initializes a pristine new custom audit.
   * Explicitly sets all fields empty: requirements='', checks=[], screens=[], findings=[], currentStep=1.
   */
  const handleStartNewAudit = () => {
    const fresh = createNewAudit();
    setActiveAuditId(fresh.id);
    setActiveAuditTitle('');
    setActiveAuditProject('Custom');
    setActiveAuditCreatedAt(fresh.created_at);
    setRequirementsText('');
    setChecks([]);
    setScreens([]);
    setFindings([]);
    setAdvisory([]);
    setCurrentStep(1);
    setLastCompletedStep(0);
    setHasValidResults(false);
    setIsStale(false);
    setCurrentNavView('new-audit');
  };

  /**
   * Resumes an existing audit at its exact persisted position:
   * Stopped at Step 1 -> opens Step 1
   * Stopped at Step 2 -> opens Step 2
   * Stopped at Step 3 -> opens Step 3
   * Stopped at Step 4 (analysis interrupted) -> opens Step 4 / retry state
   * Valid completed analysis -> opens Step 5
   */
  const handleOpenAudit = (audit: AuditRecord) => {
    setActiveAuditId(audit.id);
    setActiveAuditTitle(audit.title || '');
    setActiveAuditProject(audit.project || 'Custom');
    setActiveAuditCreatedAt(audit.created_at || new Date().toISOString());
    setRequirementsText(audit.requirements_text || '');
    setChecks(audit.checks || []);
    setScreens(audit.screens || []);
    setFindings(audit.findings || []);
    setAdvisory(audit.advisory || []);
    setHasValidResults(Boolean(audit.has_valid_results));
    setIsStale(Boolean(audit.is_stale));
    setLastCompletedStep(audit.last_completed_step || 0);

    const targetStep = getResumeStep(audit);
    setCurrentStep(targetStep);
    setCurrentNavView('new-audit');
  };

  /**
   * Loads sample project only upon explicit user action from Sample Projects library.
   */
  const handleLoadSampleProject = (sample: SampleProjectCard) => {
    const sampleAuditId = `audit-${sample.id}-${Date.now()}`;
    setActiveAuditId(sampleAuditId);
    setActiveAuditTitle(sample.title);
    setActiveAuditProject(sample.category);
    setActiveAuditCreatedAt(new Date().toISOString());
    setRequirementsText(sample.requirements);
    setChecks(sample.checks.map((c) => ({ ...c })));
    setScreens(sample.screens.map((s) => ({ ...s })));
    setFindings([]);
    setAdvisory([]);
    setCurrentStep(1);
    setLastCompletedStep(3); // source requirements, checks, and flow sequence are loaded
    setHasValidResults(false);
    setIsStale(false);
    setCurrentNavView('new-audit');
    showToast(`Loaded "${sample.title}" template.`);
  };

  /**
   * Marks results as stale when requirements, checks, or screens change after an audit has run.
   */
  const handleMarkStale = () => {
    if (hasValidResults || findings.length > 0) {
      setIsStale(true);
      setHasValidResults(false);
    }
  };

  /**
   * Handles user-driven screenshot modification (add, remove, reorder).
   * Prunes deleted screens and ensures persisted audit state stays in sync.
   */
  const handleChangeScreens = (newScreens: ScreenItem[]) => {
    setScreens(newScreens);

    // If screenshots changed after an audit was completed, mark stale
    if (hasValidResults || findings.length > 0) {
      setIsStale(true);
      setHasValidResults(false);
    }

    // Immediately persist updated screens to storage if active draft exists
    const currentAudits = getStoredAudits();
    const existingIndex = currentAudits.findIndex((a) => a.id === activeAuditId);
    if (existingIndex >= 0) {
      currentAudits[existingIndex] = {
        ...currentAudits[existingIndex],
        screens: newScreens,
        is_stale: hasValidResults ? true : currentAudits[existingIndex].is_stale,
        has_valid_results: hasValidResults ? false : currentAudits[existingIndex].has_valid_results,
        updated_at: 'Just now',
      };
      saveOrUpdateAudit(currentAudits[existingIndex]);
      setAudits(getStoredAudits());
    }
  };

  /**
   * Handles check modification in Step 2.
   */
  const handleChangeChecks = (newChecks: CheckItem[]) => {
    setChecks(newChecks);
    if (hasValidResults || findings.length > 0) {
      setIsStale(true);
      setHasValidResults(false);
    }
  };

  /**
   * Handles requirements modification in Step 1.
   */
  const handleChangeRequirements = (newText: string) => {
    setRequirementsText(newText);
    if (hasValidResults || findings.length > 0) {
      setIsStale(true);
      setHasValidResults(false);
    }
  };

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const compliance = calculateCompliance(findings);
    const status = deriveAuditStatus(findings, hasValidResults && !isStale);

    const draftRecord: AuditRecord = {
      id: activeAuditId,
      title: activeAuditTitle || 'Untitled Audit',
      project: activeAuditProject || 'Custom',
      status,
      coverage: compliance.overallScore,
      created_at: activeAuditCreatedAt || new Date().toISOString(),
      updated_at: 'Just now',
      requirements_text: requirementsText,
      checks,
      screens,
      findings,
      advisory,
      current_step: currentStep,
      last_completed_step: lastCompletedStep,
      has_valid_results: hasValidResults && !isStale,
      is_stale: isStale,
      analysis_status: hasValidResults ? 'completed' : 'idle',
    };

    saveOrUpdateAudit(draftRecord);
    setAudits(getStoredAudits());
    setIsSavingDraft(false);
    showToast('Draft successfully saved to workspace.');
  };

  const handleExtractChecks = async () => {
    setIsExtractingChecks(true);
    try {
      const response = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: requirementsText }),
      });

      if (!response.ok) {
        throw new Error('Decomposition request failed');
      }

      const data = await response.json();
      if (Array.isArray(data.checks) && data.checks.length > 0) {
        setChecks(data.checks);
      } else {
        // Fallback: rule-based atomic checks derived purely from user's actual text
        const lines = requirementsText
          .split(/\n+/)
          .map((l) => l.trim())
          .filter((l) => l.length > 5 && !l.toUpperCase().startsWith('FEATURE:'));
        const fallbackChecks: CheckItem[] = lines.map((l, i) => ({
          id: `check-${i + 1}`,
          text: l.replace(/^(\d+[\.\)]|[-*•])\s*/, ''),
          category: 'Core flow',
          is_ambiguous: false,
          included: true,
        }));
        setChecks(fallbackChecks);
      }
      setLastCompletedStep((prev) => Math.max(prev, 1));
      setCurrentStep(2);
      handleMarkStale();
    } catch (err: any) {
      console.warn('Decomposition service error, using local text parser:', err);
      const lines = requirementsText
        .split(/\n+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 5 && !l.toUpperCase().startsWith('FEATURE:'));
      const fallbackChecks: CheckItem[] = lines.map((l, i) => ({
        id: `check-${i + 1}`,
        text: l.replace(/^(\d+[\.\)]|[-*•])\s*/, ''),
        category: 'Core flow',
        is_ambiguous: false,
        included: true,
      }));
      setChecks(fallbackChecks);
      setLastCompletedStep((prev) => Math.max(prev, 1));
      setCurrentStep(2);
      handleMarkStale();
    } finally {
      setIsExtractingChecks(false);
    }
  };

  const handleApproveChecks = () => {
    // Step 2 approved: advance to Step 3 WITHOUT auto-injecting sample screenshots!
    setLastCompletedStep((prev) => Math.max(prev, 2));
    setCurrentStep(3);
  };

  const handleRunAudit = () => {
    setLastCompletedStep((prev) => Math.max(prev, 3));
    setCurrentStep(4);
  };

  const handleAuditFinished = (newFindings: Finding[], newAdvisory: AdvisoryItem[]) => {
    setFindings(newFindings);
    setAdvisory(newAdvisory);
    setHasValidResults(true);
    setIsStale(false);
    setLastCompletedStep(5);
    setCurrentStep(5);

    // Persist completed audit
    const compliance = calculateCompliance(newFindings);
    const status = deriveAuditStatus(newFindings, true);
    const completedRecord: AuditRecord = {
      id: activeAuditId,
      title: activeAuditTitle || 'Visual Audit Flow',
      project: activeAuditProject || 'Custom',
      status,
      coverage: compliance.overallScore,
      created_at: activeAuditCreatedAt || new Date().toISOString(),
      updated_at: 'Just now',
      requirements_text: requirementsText,
      checks,
      screens,
      findings: newFindings,
      advisory: newAdvisory,
      current_step: 5,
      last_completed_step: 5,
      has_valid_results: true,
      is_stale: false,
      analysis_status: 'completed',
    };

    saveOrUpdateAudit(completedRecord);
    setAudits(getStoredAudits());
    showToast('Visual audit completed and report generated.');
  };

  const handleUpdateFinding = (updated: Finding) => {
    const updatedFindings = findings.map((f) => (f.id === updated.id ? updated : f));
    setFindings(updatedFindings);

    const compliance = calculateCompliance(updatedFindings);
    const status = deriveAuditStatus(updatedFindings, true);
    const updatedRecord: AuditRecord = {
      id: activeAuditId,
      title: activeAuditTitle || 'Visual Audit Flow',
      project: activeAuditProject || 'Custom',
      status,
      coverage: compliance.overallScore,
      created_at: activeAuditCreatedAt || new Date().toISOString(),
      updated_at: 'Just now',
      requirements_text: requirementsText,
      checks,
      screens,
      findings: updatedFindings,
      advisory,
      current_step: 5,
      last_completed_step: 5,
      has_valid_results: true,
      is_stale: false,
      analysis_status: 'completed',
    };

    saveOrUpdateAudit(updatedRecord);
    setAudits(getStoredAudits());
  };

  const handleDeleteAudit = (id: string) => {
    const updated = deleteAuditById(id);
    setAudits(updated);
    showToast('Audit deleted.');
  };

  const handleDuplicateAudit = (audit: AuditRecord) => {
    const dup: AuditRecord = {
      ...audit,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${audit.title} (Copy)`,
      updated_at: 'Just now',
    };
    saveOrUpdateAudit(dup);
    setAudits(getStoredAudits());
    showToast(`Duplicated "${audit.title}".`);
  };

  const handleCompleteOnboarding = (name: string) => {
    const updated = saveStoredProfile({ displayName: name, onboardingCompleted: true });
    setProfile(updated);
    setShowOnboarding(false);
    showToast(`Welcome to ContextGuard, ${name}!`);
  };

  const handleSaveSettings = (newSettings: WorkspaceSettings, newDisplayName?: string) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    if (typeof newDisplayName === 'string') {
      const updated = saveStoredProfile({ displayName: newDisplayName });
      setProfile(updated);
    }
    showToast('Settings saved.');
  };

  const handleStepClick = (step: number) => {
    // Only allow navigating to steps that have been reached or completed
    if (step <= lastCompletedStep + 1 || (step === 5 && hasValidResults && !isStale)) {
      setCurrentStep(step);
    }
  };

  // Breadcrumb text based on active view
  let breadcrumb = 'Overview';
  if (currentNavView === 'new-audit') breadcrumb = 'New Audit';
  else if (currentNavView === 'my-audits') breadcrumb = 'My Audits';
  else if (currentNavView === 'sample-projects') breadcrumb = 'Sample Projects';
  else if (currentNavView === 'settings') breadcrumb = 'Settings';

  return (
    <div className="flex h-screen bg-[#F9F8F6] text-[#1C1917] overflow-hidden">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentView={currentNavView}
        onNavigate={(view) => {
          setCurrentNavView(view);
          setIsMobileMenuOpen(false);
        }}
        onNewAuditClick={() => {
          handleStartNewAudit();
          setIsMobileMenuOpen(false);
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader
          breadcrumb={breadcrumb}
          auditTitle={currentNavView === 'new-audit' ? activeAuditTitle || 'New Flow' : undefined}
          displayName={profile.displayName}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* View Routing */}
        <main className="flex-1 pb-16">
          {currentNavView === 'dashboard' && (
            <DashboardView
              audits={audits}
              displayName={profile.displayName}
              onNewAudit={handleStartNewAudit}
              onOpenAudit={handleOpenAudit}
              onViewAllAudits={() => setCurrentNavView('my-audits')}
            />
          )}

          {currentNavView === 'new-audit' && (
            <div>
              {/* Top horizontal stepper bar */}
              <WizardStepper
                currentStep={currentStep}
                lastCompletedStep={lastCompletedStep}
                hasValidResults={hasValidResults && !isStale}
                onStepClick={handleStepClick}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={isSavingDraft}
                isViewingCompleted={hasValidResults && currentStep === 5 && !isStale}
              />

              {/* Wizard Steps */}
              {currentStep === 1 && (
                <Step1Requirements
                  auditTitle={activeAuditTitle}
                  onChangeTitle={(title) => setActiveAuditTitle(title)}
                  requirementsText={requirementsText}
                  onChangeRequirements={handleChangeRequirements}
                  onExtractChecks={handleExtractChecks}
                  isExtracting={isExtractingChecks}
                />
              )}

              {currentStep === 2 && (
                <Step2ReviewChecks
                  checks={checks}
                  onChangeChecks={handleChangeChecks}
                  onBack={() => setCurrentStep(1)}
                  onApprove={handleApproveChecks}
                  onMarkStale={handleMarkStale}
                />
              )}

              {currentStep === 3 && (
                <Step3UploadFlow
                  screens={screens}
                  onChangeScreens={handleChangeScreens}
                  onBack={() => setCurrentStep(2)}
                  onRunAudit={handleRunAudit}
                  onMarkStale={handleMarkStale}
                />
              )}

              {currentStep === 4 && (
                <Step4AuditProgress
                  checks={checks}
                  screens={screens}
                  settings={settings}
                  onAuditFinished={handleAuditFinished}
                />
              )}

              {currentStep === 5 && (
                <Step5Results
                  findings={findings}
                  advisory={advisory}
                  screens={screens}
                  projectTitle={activeAuditTitle || 'Visual Audit Flow'}
                  auditId={activeAuditId}
                  auditDate={activeAuditCreatedAt ? new Date(activeAuditCreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined}
                  onUpdateFinding={handleUpdateFinding}
                  isStale={isStale}
                  onRerunAudit={() => setCurrentStep(4)}
                />
              )}
            </div>
          )}

          {currentNavView === 'my-audits' && (
            <MyAuditsView
              audits={audits}
              onOpenAudit={handleOpenAudit}
              onNewAudit={handleStartNewAudit}
              onDeleteAudit={handleDeleteAudit}
              onDuplicateAudit={handleDuplicateAudit}
              onGoToSamples={() => setCurrentNavView('sample-projects')}
            />
          )}

          {currentNavView === 'sample-projects' && (
            <SampleProjectsView onLoadSample={handleLoadSampleProject} />
          )}

          {currentNavView === 'settings' && (
            <SettingsView
              settings={settings}
              displayName={profile.displayName}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* First-time User Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleCompleteOnboarding} />
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1917] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-[#44403C] animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
