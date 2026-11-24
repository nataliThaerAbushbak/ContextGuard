import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isExistingUser,
  shouldShowOnboarding,
  evaluateOnboardingMigration,
} from './onboardingHelpers.ts';

test('isExistingUser: returns true if user has 1 or more saved audits', () => {
  assert.equal(
    isExistingUser({ auditsCount: 3, profileExists: false, onboardingCompleted: false }),
    true
  );
  assert.equal(
    isExistingUser({ auditsCount: 1, profileExists: false, onboardingCompleted: false }),
    true
  );
});

test('isExistingUser: returns true if existing user profile already exists', () => {
  assert.equal(
    isExistingUser({ auditsCount: 0, profileExists: true, onboardingCompleted: false }),
    true
  );
});

test('isExistingUser: returns true if onboardingCompleted is true', () => {
  assert.equal(
    isExistingUser({ auditsCount: 0, profileExists: false, onboardingCompleted: true }),
    true
  );
});

test('isExistingUser: returns false when zero audits, no profile, and not completed', () => {
  assert.equal(
    isExistingUser({ auditsCount: 0, profileExists: false, onboardingCompleted: false }),
    false
  );
});

test('shouldShowOnboarding: returns true ONLY for brand-new user with 0 audits, no profile, and not completed', () => {
  // Brand new user -> shows welcome modal
  assert.equal(
    shouldShowOnboarding({ auditsCount: 0, profileExists: false, onboardingCompleted: false }),
    true
  );

  // Existing user with 3 audits -> does NOT show modal
  assert.equal(
    shouldShowOnboarding({ auditsCount: 3, profileExists: false, onboardingCompleted: false }),
    false
  );

  // Existing user with profile record -> does NOT show modal
  assert.equal(
    shouldShowOnboarding({ auditsCount: 0, profileExists: true, onboardingCompleted: false }),
    false
  );

  // User with onboardingCompleted -> does NOT show modal
  assert.equal(
    shouldShowOnboarding({ auditsCount: 0, profileExists: false, onboardingCompleted: true }),
    false
  );
});

test('evaluateOnboardingMigration: automatically migrates existing user with saved audits', () => {
  const result = evaluateOnboardingMigration({
    auditsCount: 3,
    profile: { displayName: '', onboardingCompleted: false },
    profileExists: false,
  });

  assert.equal(result.needsMigration, true);
  assert.equal(result.migratedProfile.onboardingCompleted, true);
  assert.equal(result.migratedProfile.displayName, '');
  assert.equal(result.shouldShowWelcome, false);
});

test('evaluateOnboardingMigration: does not migrate brand-new user with 0 audits, shows welcome', () => {
  const result = evaluateOnboardingMigration({
    auditsCount: 0,
    profile: { displayName: '', onboardingCompleted: false },
    profileExists: false,
  });

  assert.equal(result.needsMigration, false);
  assert.equal(result.migratedProfile.onboardingCompleted, false);
  assert.equal(result.shouldShowWelcome, true);
});

test('evaluateOnboardingMigration: returning user with onboardingCompleted=true never shows welcome', () => {
  const result = evaluateOnboardingMigration({
    auditsCount: 5,
    profile: { displayName: 'Sarah', onboardingCompleted: true },
    profileExists: true,
  });

  assert.equal(result.needsMigration, false);
  assert.equal(result.migratedProfile.displayName, 'Sarah');
  assert.equal(result.shouldShowWelcome, false);
});
