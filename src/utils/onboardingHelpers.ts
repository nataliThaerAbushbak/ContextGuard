/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UserProfile } from './storage.ts';

export interface OnboardingDetectionParams {
  auditsCount: number;
  profileExists: boolean;
  onboardingCompleted?: boolean;
}

/**
 * A user is an EXISTING USER if ANY of these are true:
 * - they already have one or more saved audits
 * - an existing user profile already exists
 * - onboardingCompleted === true
 */
export function isExistingUser(params: OnboardingDetectionParams): boolean {
  if (params.auditsCount > 0) return true;
  if (params.profileExists) return true;
  if (params.onboardingCompleted === true) return true;
  return false;
}

/**
 * A user is a FIRST-TIME USER only when:
 * - there are zero saved audits
 * - no existing profile exists
 * - onboardingCompleted is not true
 *
 * Only then show the Welcome onboarding modal.
 */
export function shouldShowOnboarding(params: OnboardingDetectionParams): boolean {
  return !isExistingUser(params);
}

/**
 * Evaluates whether state migration is required on app startup:
 * If savedAudits.length > 0 AND onboardingCompleted is missing/false,
 * automatically treat the user as an existing user and migrate state by setting
 * onboardingCompleted = true.
 */
export function evaluateOnboardingMigration(params: {
  auditsCount: number;
  profile: UserProfile | null;
  profileExists: boolean;
}): {
  needsMigration: boolean;
  migratedProfile: UserProfile;
  shouldShowWelcome: boolean;
} {
  const currentProfile: UserProfile = params.profile || {
    displayName: '',
    onboardingCompleted: false,
  };

  // Migration condition:
  // savedAudits.length > 0 AND onboardingCompleted is missing/false
  if (params.auditsCount > 0 && !currentProfile.onboardingCompleted) {
    return {
      needsMigration: true,
      migratedProfile: {
        ...currentProfile,
        onboardingCompleted: true,
      },
      shouldShowWelcome: false,
    };
  }

  const existing = isExistingUser({
    auditsCount: params.auditsCount,
    profileExists: params.profileExists,
    onboardingCompleted: currentProfile.onboardingCompleted,
  });

  return {
    needsMigration: false,
    migratedProfile: currentProfile,
    shouldShowWelcome: !existing,
  };
}
