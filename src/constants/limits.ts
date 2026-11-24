/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DAILY_AI_RUN_LIMIT = 3;
// Maintain backward-compatible alias
export const DAILY_AUDIT_LIMIT = DAILY_AI_RUN_LIMIT;

export const MAX_SCREENSHOTS_PER_AUDIT = 5;

export const AUDIT_USAGE_STORAGE_KEY = 'contextguard_audit_usage_v1';

export interface AuditUsageRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayAuditUsage(): number {
  try {
    const raw = localStorage.getItem(AUDIT_USAGE_STORAGE_KEY);
    if (!raw) return 0;
    const parsed: AuditUsageRecord = JSON.parse(raw);
    if (parsed.date === getTodayKey()) {
      return parsed.count || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function setTodayAuditUsage(count: number): void {
  try {
    const today = getTodayKey();
    localStorage.setItem(
      AUDIT_USAGE_STORAGE_KEY,
      JSON.stringify({ date: today, count })
    );
  } catch {
    // ignore
  }
}

export function recordAuditRun(): number {
  try {
    const today = getTodayKey();
    const current = getTodayAuditUsage();
    const updated = current + 1;
    localStorage.setItem(
      AUDIT_USAGE_STORAGE_KEY,
      JSON.stringify({ date: today, count: updated })
    );
    return updated;
  } catch {
    return 1;
  }
}

export function hasReachedDailyAuditLimit(): boolean {
  return getTodayAuditUsage() >= DAILY_AI_RUN_LIMIT;
}

export function resetTodayAuditUsageForTesting(): void {
  try {
    localStorage.removeItem(AUDIT_USAGE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Synchronizes client usage count with server-side authoritative usage endpoint.
 */
export async function syncUsageFromServer(): Promise<number> {
  try {
    const response = await fetch('/api/usage');
    if (response.ok) {
      const data = await response.json();
      if (typeof data.count === 'number') {
        setTodayAuditUsage(data.count);
        return data.count;
      }
    }
  } catch (err) {
    console.warn('Could not sync usage from server, relying on local state:', err);
  }
  return getTodayAuditUsage();
}
