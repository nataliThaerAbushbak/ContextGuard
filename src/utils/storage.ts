import type { AuditRecord, WorkspaceSettings } from '../types/audit.ts';

const AUDITS_STORAGE_KEY = 'contextguard_audits_v2';
const SETTINGS_STORAGE_KEY = 'contextguard_settings_v1';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  evidenceFirstVerification: true,
  separateAdvisoryInsights: true,
  reviewerDecisionsPreserved: true,
  defaultReportDetail: 'Balanced',
};

export function getStoredAudits(): AuditRecord[] {
  try {
    const raw = localStorage.getItem(AUDITS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any empty/corrupted records
    return parsed.filter(
      (a) =>
        a &&
        typeof a.id === 'string' &&
        (a.title || a.requirements_text || (a.checks && a.checks.length > 0))
    );
  } catch (err) {
    console.error('Failed to read audits from storage:', err);
    return [];
  }
}

export function saveStoredAudits(audits: AuditRecord[]): void {
  try {
    localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(audits));
  } catch (err) {
    console.error('Failed to save audits to storage:', err);
  }
}

export function saveOrUpdateAudit(audit: AuditRecord): void {
  // Prevent persisting completely empty audits
  const hasContent =
    (audit.title && audit.title.trim().length > 0) ||
    (audit.requirements_text && audit.requirements_text.trim().length > 0) ||
    (audit.checks && audit.checks.length > 0) ||
    (audit.screens && audit.screens.length > 0);

  if (!hasContent) {
    return;
  }

  const current = getStoredAudits();
  const index = current.findIndex((a) => a.id === audit.id);
  if (index >= 0) {
    current[index] = { ...audit, updated_at: 'Just now' };
  } else {
    current.unshift({ ...audit, updated_at: 'Just now' });
  }
  saveStoredAudits(current);
}

export function deleteAuditById(id: string): AuditRecord[] {
  const current = getStoredAudits();
  const updated = current.filter((a) => a.id !== id);
  saveStoredAudits(updated);
  return updated;
}

export function getStoredSettings(): WorkspaceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: WorkspaceSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export interface UserProfile {
  displayName: string;
  onboardingCompleted: boolean;
}

export const PROFILE_STORAGE_KEY = 'contextguard_profile_v1';

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return { displayName: '', onboardingCompleted: false };
    }
    const parsed = JSON.parse(raw);
    return {
      displayName: typeof parsed?.displayName === 'string' ? parsed.displayName.trim() : '',
      onboardingCompleted: Boolean(parsed?.onboardingCompleted),
    };
  } catch {
    return { displayName: '', onboardingCompleted: false };
  }
}

export function hasStoredProfile(): boolean {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function saveStoredProfile(profile: Partial<UserProfile>): UserProfile {
  try {
    const current = getStoredProfile();
    const updated: UserProfile = {
      ...current,
      ...profile,
      displayName:
        profile.displayName !== undefined
          ? profile.displayName.trim()
          : current.displayName,
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save profile:', err);
    return getStoredProfile();
  }
}

/**
 * Initializes user onboarding state and performs migration for existing users:
 *
 * Rules:
 * A user is an EXISTING USER if ANY of these are true:
 * - they already have one or more saved audits
 * - an existing user profile already exists
 * - onboardingCompleted === true
 *
 * For an existing user:
 * - DO NOT show the Welcome modal
 * - DO NOT force them to enter their name
 * - preserve all existing audits and settings
 *
 * MIGRATION BEHAVIOR:
 * On app startup, if:
 * savedAudits.length > 0
 * AND onboardingCompleted is missing/false
 * then automatically treat the user as an existing user and migrate state by setting:
 * onboardingCompleted = true
 * Do not display onboarding during this migration.
 * Do NOT delete or recreate any audits.
 * Do NOT use a hardcoded name such as Natali/Nataly as a fallback.
 *
 * A user is a FIRST-TIME USER only when:
 * - there are zero saved audits
 * - no existing profile exists
 * - onboardingCompleted is not true
 * Only then show: "Welcome to ContextGuard" and ask for their name.
 */
export function resolveInitialUserOnboardingState(): {
  profile: UserProfile;
  showOnboarding: boolean;
} {
  try {
    const rawAudits = getStoredAudits();
    const profileExists = hasStoredProfile();
    let currentProfile = getStoredProfile();

    // Migration for existing users with saved audits
    if (rawAudits.length > 0 && !currentProfile.onboardingCompleted) {
      currentProfile = saveStoredProfile({ onboardingCompleted: true });
      return {
        profile: currentProfile,
        showOnboarding: false,
      };
    }

    const isExisting =
      rawAudits.length > 0 || profileExists || currentProfile.onboardingCompleted;

    return {
      profile: currentProfile,
      showOnboarding: !isExisting,
    };
  } catch (err) {
    console.error('Failed to resolve initial user state:', err);
    return {
      profile: { displayName: '', onboardingCompleted: true },
      showOnboarding: false,
    };
  }
}

