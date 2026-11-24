import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_AI_RUN_LIMIT,
  DAILY_AUDIT_LIMIT,
  MAX_SCREENSHOTS_PER_AUDIT,
  hasReachedDailyAuditLimit,
  recordAuditRun,
  getTodayAuditUsage,
  resetTodayAuditUsageForTesting,
} from '../constants/limits.ts';
import {
  getServerUsageForClient,
  incrementServerUsageForClient,
  resetServerUsageForTesting,
} from './serverUsage.ts';

test('constants: DAILY_AI_RUN_LIMIT is 3, MAX_SCREENSHOTS_PER_AUDIT is 5', () => {
  assert.equal(DAILY_AI_RUN_LIMIT, 3);
  assert.equal(DAILY_AUDIT_LIMIT, 3);
  assert.equal(MAX_SCREENSHOTS_PER_AUDIT, 5);
});

test('client-side usage tracking: increments usage and enforces DAILY_AI_RUN_LIMIT = 3', () => {
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
    resetTodayAuditUsageForTesting();
    assert.equal(getTodayAuditUsage(), 0);
    assert.equal(hasReachedDailyAuditLimit(), false);

    // Run 1: first real Gemini execution
    const r1 = recordAuditRun();
    assert.equal(r1, 1);
    assert.equal(getTodayAuditUsage(), 1);
    assert.equal(hasReachedDailyAuditLimit(), false);

    // Run 2: second execution (e.g. another audit or re-run)
    const r2 = recordAuditRun();
    assert.equal(r2, 2);
    assert.equal(getTodayAuditUsage(), 2);
    assert.equal(hasReachedDailyAuditLimit(), false);

    // Run 3: third execution
    const r3 = recordAuditRun();
    assert.equal(r3, 3);
    assert.equal(getTodayAuditUsage(), 3);
    // At limit = 3, limit reached!
    assert.equal(hasReachedDailyAuditLimit(), true);

    // Run 4: attempted execution beyond limit
    const r4 = recordAuditRun();
    assert.equal(r4, 4);
    assert.equal(hasReachedDailyAuditLimit(), true);
  } finally {
    globalThis.localStorage = original;
  }
});

test('server-side usage enforcement: allows up to 3 runs per day, blocks 4th request', () => {
  const testClientId = `client-${Date.now()}`;
  resetServerUsageForTesting();

  // Initial state for new client IP
  const initial = getServerUsageForClient(testClientId);
  assert.equal(initial.count, 0);
  assert.equal(initial.limit, 3);
  assert.equal(initial.limitReached, false);
  assert.equal(initial.remaining, 3);

  // Request 1: first audit execution allowed
  const run1 = incrementServerUsageForClient(testClientId);
  assert.equal(run1.allowed, true);
  assert.equal(run1.count, 1);

  // Request 2: second audit execution allowed
  const run2 = incrementServerUsageForClient(testClientId);
  assert.equal(run2.allowed, true);
  assert.equal(run2.count, 2);

  // Request 3: third audit execution allowed
  const run3 = incrementServerUsageForClient(testClientId);
  assert.equal(run3.allowed, true);
  assert.equal(run3.count, 3);

  // Request 4: Exceeds DAILY_AI_RUN_LIMIT = 3 -> must be BLOCKED
  const run4 = incrementServerUsageForClient(testClientId);
  assert.equal(run4.allowed, false);
  assert.equal(run4.count, 3);

  const statusAfterBlock = getServerUsageForClient(testClientId);
  assert.equal(statusAfterBlock.limitReached, true);
  assert.equal(statusAfterBlock.remaining, 0);
});
