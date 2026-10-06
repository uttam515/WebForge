/**
 * @file packages/engine-data/src/index.ts
 * Generic data engine for WebForge.
 *
 * This package will eventually provide:
 * - Entity persistence and schema migration handling
 * - Runtime data validation against AppSpec entity constraints
 * - Generic CRUD operations across supported storage backends
 * - Relationship traversal and cascade operations (1:1, 1:N, N:M)
 * - Filtering, sorting, and cursor/offset pagination
 * - Transaction support and atomic operations
 *
 * Rule: Avoid app-specific hacks (e.g. `if (isEcommerce) ...`).
 * Engine behavior is strictly driven by the AppSpec schema.
 *
 * Status: Do NOT implement the engine yet.
 */

export interface DataEngineOptions {
  projectId: string;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
}
