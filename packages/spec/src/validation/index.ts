import { z } from 'zod';
import { AppSpecSchema, type AppSpec } from '../app-spec.js';
import {
  validateAppSpec,
  type SemanticValidationError,
  type SemanticValidationWarning,
  type SemanticValidationResult,
} from './semantic.js';

export {
  validateAppSpec,
  type SemanticValidationError,
  type SemanticValidationWarning,
  type SemanticValidationResult,
};

/**
 * Structural parser using Zod.
 * Throws ZodError on structural schema mismatch.
 */
export function parseAppSpec(input: unknown): AppSpec {
  return AppSpecSchema.parse(input);
}

/**
 * Safe structural parser returning a Discriminated result.
 */
export function safeParseAppSpec(
  input: unknown,
): { success: true; data: AppSpec } | { success: false; error: z.ZodError } {
  return AppSpecSchema.safeParse(input);
}

export type FullValidationResult = {
  valid: boolean;
  spec?: AppSpec;
  structuralErrors?: z.ZodIssue[];
  semanticErrors?: SemanticValidationError[];
  semanticWarnings?: SemanticValidationWarning[];
};

/**
 * Validates both structural (Zod) and semantic layers.
 */
export function validateAppSpecFull(input: unknown): FullValidationResult {
  const parseResult = AppSpecSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      valid: false,
      structuralErrors: parseResult.error.issues,
    };
  }

  const semanticResult = validateAppSpec(parseResult.data);
  return {
    valid: semanticResult.valid,
    spec: parseResult.data,
    semanticErrors: semanticResult.errors,
    semanticWarnings: semanticResult.warnings,
  };
}
