/**
 * @file packages/compiler/src/index.ts
 * Compiler for WebForge.
 *
 * Pipeline:
 *   Answers
 *      ↓
 *   Compiler
 *      ↓
 *   AppSpec
 *
 * This package will eventually contain:
 * - Answer resolution and normalization
 * - Module selection based on answers/capabilities
 * - Module dependency resolution and topological ordering
 * - Fragment merging (entities, pages, endpoints, permissions)
 * - Explicit conflict detection (no silent overwrites)
 * - Deterministic AppSpec validation and generation
 *
 * Status: Do NOT implement the compiler logic yet.
 */

import { CURRENT_APPSPEC_VERSION } from '@webforge/spec';

export interface CompilerConfig {
  targetVersion?: string;
}

export function getCompilerVersion(): string {
  return CURRENT_APPSPEC_VERSION;
}
