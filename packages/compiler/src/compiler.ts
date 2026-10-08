import {
  CURRENT_APPSPEC_VERSION,
  parseAppSpec,
  validateAppSpecFull,
  canonicalizeAppSpec,
  type AppSpec,
  type ThemeSpec,
} from '@webforge/spec';
import {
  ModuleRegistry,
  defaultModuleRegistry,
  DefaultModuleContext,
  mergeSpecFragments,
  ModuleError,
  type SpecFragment,
} from '@webforge/modules';

import type { CompilerInput, CompileAppSpecResult } from './types.js';
import { resolveCompilerDependencies } from './resolver.js';
import { defaultSettings, defaultTheme } from './defaults.js';
import { ModuleContributionError, ModuleCompilationError } from './errors.js';

/**
 * Deterministically compiles module selections and their parameters into a canonical,
 * structurally and semantically validated AppSpec.
 *
 * Pipeline:
 * 1. Validate module parameters against module Zod schemas.
 * 2. Auto-resolve transitive module dependencies.
 * 3. Detect circular dependencies and topologically sort modules.
 * 4. Execute module contributions with isolated ModuleContexts.
 * 5. Deterministically merge SpecFragments (enforcing explicit define/extend semantics).
 * 6. Assemble candidate AppSpec with minimal deterministic defaults.
 * 7. Validate candidate AppSpec (structural schema + semantic graph validation).
 * 8. Canonicalize AppSpec to a byte-for-byte deterministic JSON string.
 */
export function compileAppSpec(
  input: CompilerInput,
  registry: ModuleRegistry = defaultModuleRegistry,
): CompileAppSpecResult {
  // 1-3. Resolve and sort modules with parameter validation
  const resolvedExecutions = resolveCompilerDependencies(input.modules, registry);

  // 4. Execute module contributions in deterministic topological order
  const fragments: SpecFragment[] = [];

  for (const execution of resolvedExecutions) {
    const ctx = new DefaultModuleContext(execution.module.id, execution.allowedModuleIds);
    try {
      const fragment = execution.module.contribute(execution.params, ctx);
      fragments.push(fragment);
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new ModuleContributionError(execution.module.id, message, error);
    }
  }

  // 5. Explicitly merge all fragments
  const mergedState = mergeSpecFragments(fragments, input.baseSpec);

  // Compose effective theme
  const effectiveTheme: ThemeSpec = {
    ...defaultTheme,
    ...(input.theme ?? {}),
    ...(mergedState.theme ?? {}),
    colors: {
      ...defaultTheme.colors,
      ...(input.theme?.colors ?? {}),
      ...(mergedState.theme?.colors ?? {}),
    },
    typography: {
      fontFamily: {
        ...defaultTheme.typography.fontFamily,
        ...(input.theme?.typography?.fontFamily ?? {}),
        ...(mergedState.theme?.typography?.fontFamily ?? {}),
      },
    },
  };

  // 6. Assemble complete candidate AppSpec
  const candidateSpec: AppSpec = {
    schemaVersion: CURRENT_APPSPEC_VERSION,
    metadata: input.metadata,
    settings: input.settings ?? defaultSettings,
    entities: mergedState.entities,
    pages: mergedState.pages,
    layouts: mergedState.layouts,
    navigation: mergedState.navigation,
    auth: mergedState.auth,
    access: mergedState.access,
    admin: mergedState.admin,
    rules: mergedState.rules,
    theme: effectiveTheme,
    assets: mergedState.assets,
    integrations: mergedState.integrations,
    provenance: mergedState.provenance,
  };

  // 7. Full AppSpec validation (structural schema + semantic graph rules)
  const validationResult = validateAppSpecFull(candidateSpec);
  if (!validationResult.valid) {
    throw new ModuleCompilationError(
      validationResult.structuralErrors,
      validationResult.semanticErrors,
    );
  }

  const validatedSpec = validationResult.spec ?? parseAppSpec(candidateSpec);

  // 8. Canonicalization
  const canonicalJson = canonicalizeAppSpec(validatedSpec);

  return {
    spec: validatedSpec,
    canonicalJson,
  };
}
