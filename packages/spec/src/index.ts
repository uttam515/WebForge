/**
 * @file packages/spec/src/index.ts
 * Canonical AppSpec definition for WebForge.
 *
 * This package will eventually contain:
 * - AppSpec types and Zod runtime validation schemas
 * - Entities and data model specifications
 * - Fields and validation rules
 * - Relationships (1:1, 1:N, N:M)
 * - Pages, layouts, and block tree structures
 * - Users, roles, and granular permission definitions
 * - Business logic and workflow rules
 * - Themes and visual styling tokens
 * - Third-party integration declarations
 * - Schema versioning metadata
 *
 * Rule: This package must remain independent of runtime implementations.
 */

import { z } from 'zod';

export const CURRENT_APPSPEC_VERSION = '1.0.0';

export const AppSpecVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);

export interface AppSpecMetadata {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export const AppSpecMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: AppSpecVersionSchema,
  createdAt: z.string().datetime({ offset: true }).or(z.string()),
  updatedAt: z.string().datetime({ offset: true }).or(z.string()),
});

export type AppSpecMetadataType = z.infer<typeof AppSpecMetadataSchema>;
