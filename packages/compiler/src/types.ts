import type { AppSpec, AppSpecMetadata, SettingsSpec, ThemeSpec } from '@webforge/spec';
import type { Module, MergedAppSpecState } from '@webforge/modules';

/**
 * Explicit representation of a selected capability module and its parameters.
 *
 * Design rationale:
 * 1. Heterogeneous lists: In an open, extensible module registry, module selections are
 *    heterogeneous (each moduleId corresponds to a distinct parameter type).
 * 2. Static vs Runtime Boundary: Individual selections can be strongly typed as
 *    `ModuleSelection<SpecificParams>`, while the compiler input accepts `ModuleSelection<unknown>[]`.
 * 3. Authoritative Validation: The compiler does not rely on unchecked TypeScript casts;
 *    the module's registered Zod schema (`module.params.safeParse`) is the authoritative runtime
 *    boundary that validates and coerces input parameters into strongly typed values.
 */
export interface ModuleSelection<P = unknown> {
  /** Unique identifier matching a registered capability module */
  moduleId: string;
  /** Parameters conforming to the module's parameter schema */
  params: P;
}

/**
 * Input to the AppSpec compilation pipeline.
 */
export interface CompilerInput {
  /** Target application metadata */
  metadata: AppSpecMetadata;
  /** Global application settings override */
  settings?: SettingsSpec;
  /** Theme configuration override */
  theme?: ThemeSpec;
  /** Selected capability modules and their parameters */
  modules: ModuleSelection<unknown>[];
  /** Optional base specification fragments to seed */
  baseSpec?: Partial<MergedAppSpecState>;
}

/**
 * Resolved and validated module ready for deterministic execution.
 */
export interface ResolvedModuleExecution<P = unknown> {
  /** The capability module instance */
  module: Module<P>;
  /** The validated and coerced parameters */
  params: P;
  /** Whether the module was explicitly selected by the caller */
  isExplicit: boolean;
}

/**
 * Compilation result containing both the validated AppSpec object and its canonical JSON string.
 */
export interface CompileAppSpecResult {
  /** The structurally and semantically validated AppSpec */
  spec: AppSpec;
  /** Canonical, deterministic JSON representation (byte-for-byte stable) */
  canonicalJson: string;
}
