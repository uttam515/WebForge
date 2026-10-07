import type { AppSpec } from './app-spec.js';

/**
 * Deterministically sorts object keys deeply so equivalent objects produce identical JSON strings.
 */
function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  const sortedObj: Record<string, unknown> = {};
  const keys = Object.keys(value as Record<string, unknown>).sort();

  for (const key of keys) {
    sortedObj[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
  }

  return sortedObj;
}

/**
 * Canonicalizes an AppSpec into a deterministic JSON string.
 */
export function canonicalizeAppSpec(spec: AppSpec): string {
  const sorted = sortKeysDeep(spec);
  return JSON.stringify(sorted, null, 2);
}
