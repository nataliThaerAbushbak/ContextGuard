/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export { DAILY_AI_RUN_LIMIT } from '../constants/limits.ts';
import { DAILY_AI_RUN_LIMIT } from '../constants/limits.ts';

export interface DailyUsageRecord {
  date: string;
  count: number;
}

// In-memory server-side usage store keyed by client identifier (e.g. IP)
const serverUsageMap = new Map<string, DailyUsageRecord>();

export function getTodayServerDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resetServerUsageForTesting(): void {
  serverUsageMap.clear();
}

export function getServerUsageForClient(clientId: string): {
  date: string;
  count: number;
  limit: number;
  remaining: number;
  limitReached: boolean;
} {
  const today = getTodayServerDate();
  const entry = serverUsageMap.get(clientId);

  if (!entry || entry.date !== today) {
    return {
      date: today,
      count: 0,
      limit: DAILY_AI_RUN_LIMIT,
      remaining: DAILY_AI_RUN_LIMIT,
      limitReached: false,
    };
  }

  return {
    date: today,
    count: entry.count,
    limit: DAILY_AI_RUN_LIMIT,
    remaining: Math.max(0, DAILY_AI_RUN_LIMIT - entry.count),
    limitReached: entry.count >= DAILY_AI_RUN_LIMIT,
  };
}

export function incrementServerUsageForClient(clientId: string): {
  allowed: boolean;
  count: number;
  limit: number;
} {
  const today = getTodayServerDate();
  const entry = serverUsageMap.get(clientId);

  if (!entry || entry.date !== today) {
    serverUsageMap.set(clientId, { date: today, count: 1 });
    return { allowed: true, count: 1, limit: DAILY_AI_RUN_LIMIT };
  }

  if (entry.count >= DAILY_AI_RUN_LIMIT) {
    return { allowed: false, count: entry.count, limit: DAILY_AI_RUN_LIMIT };
  }

  entry.count += 1;
  serverUsageMap.set(clientId, entry);
  return { allowed: true, count: entry.count, limit: DAILY_AI_RUN_LIMIT };
}
