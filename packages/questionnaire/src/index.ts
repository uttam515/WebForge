/**
 * @file packages/questionnaire/src/index.ts
 * Structured questionnaire engine for WebForge.
 *
 * This package will eventually contain:
 * - Question definitions (types, labels, help text, validations)
 * - Conditional branching logic and skip logic
 * - Prerequisite dependencies between questions
 * - Sensible default values and recommendation logic
 * - Answer resolution, normalization, and export for the compiler
 *
 * Status: Do NOT implement the questionnaire logic yet.
 */

export interface QuestionDefinition {
  id: string;
  label: string;
  type: 'text' | 'choice' | 'boolean' | 'number';
  required?: boolean;
  defaultValue?: unknown;
}

export type QuestionnaireAnswers = Record<string, unknown>;
