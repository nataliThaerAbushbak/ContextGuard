import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveInitialUserOnboardingState,
  getStoredProfile,
  saveStoredProfile,
  PROFILE_STORAGE_KEY,
} from './storage.ts';

// Mock localStorage if needed or test functions
test('resolveInitialUserOnboardingState behavior with mocked storage', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  };

  const original = globalThis.localStorage;
  // @ts-expect-error mock
  globalThis.localStorage = mockStorage;

  try {
    // 1. Brand new user: no audits, no profile
    const brandNew = resolveInitialUserOnboardingState();
    assert.equal(brandNew.showOnboarding, true);
    assert.equal(brandNew.profile.onboardingCompleted, false);

    // 2. Existing user with saved audits but missing onboardingCompleted:
    const mockAudits = [
      { id: 'a1', title: 'Test Audit', requirements_text: 'req' },
    ];
    store.set('contextguard_audits_v2', JSON.stringify(mockAudits));
    store.delete(PROFILE_STORAGE_KEY);

    const migrated = resolveInitialUserOnboardingState();
    // Must NOT show onboarding
    assert.equal(migrated.showOnboarding, false);
    // Must migrate onboardingCompleted to true
    assert.equal(migrated.profile.onboardingCompleted, true);
    // Persisted profile must now have onboardingCompleted: true
    const savedProfile = JSON.parse(store.get(PROFILE_STORAGE_KEY)!);
    assert.equal(savedProfile.onboardingCompleted, true);

    // 3. Returning user with profile already completed
    store.set(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ displayName: 'Sarah', onboardingCompleted: true })
    );
    const returning = resolveInitialUserOnboardingState();
    assert.equal(returning.showOnboarding, false);
    assert.equal(returning.profile.displayName, 'Sarah');
  } finally {
    globalThis.localStorage = original;
  }
});
