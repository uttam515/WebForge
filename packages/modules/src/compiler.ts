import {
  CURRENT_APPSPEC_VERSION,
  parseAppSpec,
  validateAppSpecFull,
  canonicalizeAppSpec,
  type AppSpec,
  type AppSpecMetadata,
  type SettingsSpec,
  type ThemeSpec,
} from '@webforge/spec';

import type { ModuleContext } from './types.js';
import { ModuleRegistry, defaultModuleRegistry } from './registry.js';
import { resolveModuleDependencies, type ModuleInvocation } from './resolver.js';
import { mergeSpecFragments, type MergedAppSpecState } from './merger.js';
import { DefaultModuleContext } from './context.js';
import { ModuleNotFoundError, InvalidModuleParamsError, ModuleCompilationError } from './errors.js';

export interface ModuleRequest<P = unknown> {
  id: string;
  params: P;
}

export type ModuleInput<P = unknown> = ModuleInvocation<P> | ModuleRequest<P>;

export interface ComposeAppSpecOptions {
  metadata: AppSpecMetadata;
  settings?: SettingsSpec;
  theme?: ThemeSpec;
  modules: ModuleInput[];
  registry?: ModuleRegistry;
  baseSpec?: Partial<MergedAppSpecState>;
}

export interface ComposeAppSpecResult {
  spec: AppSpec;
  canonicalJson: string;
}

const defaultTheme: ThemeSpec = {
  colorModes: 'light',
  colors: {
    primary: '#000000',

    primaryForeground: '#ffffff',
    secondary: '#f0f0f0',
    secondaryForeground: '#000000',
    surface: '#ffffff',
    surfaceForeground: '#000000',
    background: '#ffffff',
    text: '#000000',
    muted: '#888888',
    mutedForeground: '#aaaaaa',
    border: '#cccccc',
    accent: '#0066cc',
    accentForeground: '#ffffff',
    destructive: '#ff0000',
    destructiveForeground: '#ffffff',
  },
  typography: {
    fontFamily: {
      heading: 'Inter',
      body: 'Inter',
    },
  },
};

/**
 * Compiles requested modules and parameters into a canonical, structurally and
 * semantically validated WebForge AppSpec.
 */
export function composeAppSpec(options: ComposeAppSpecOptions): ComposeAppSpecResult {
  const registry = options.registry ?? defaultModuleRegistry;

  // 1. Normalize all module inputs into ModuleInvocation objects
  const invocations: ModuleInvocation[] = options.modules.map((input) => {
    if ('module' in input) {
      return input;
    }
    const mod = registry.get(input.id);
    if (!mod) {
      throw new ModuleNotFoundError(input.id);
    }
    return {
      module: mod,
      params: input.params,
    };
  });

  // 2. Validate parameters against each module's Zod schema
  for (const item of invocations) {
    const parseResult = item.module.params.safeParse(item.params);
    if (!parseResult.success) {
      throw new InvalidModuleParamsError(item.module.id, parseResult.error.issues);
    }
    // Assign validated/coerced params
    item.params = parseResult.data;
  }

  // 3. Resolve dependencies deterministically
  const sortedInvocations = resolveModuleDependencies(invocations);

  // 4. Execute module contributions in topological order
  const fragments = sortedInvocations.map(({ module, params, allowedModuleIds }) => {
    const ctx: ModuleContext = new DefaultModuleContext(module.id, allowedModuleIds);
    return module.contribute(params, ctx);
  });

  // 5. Explicitly merge all fragments
  const mergedState = mergeSpecFragments(fragments, options.baseSpec);

  const effectiveTheme: ThemeSpec = {
    ...defaultTheme,
    ...(options.theme ?? {}),
    ...(mergedState.theme ?? {}),
    colors: {
      ...defaultTheme.colors,
      ...(options.theme?.colors ?? {}),
      ...(mergedState.theme?.colors ?? {}),
    },
    typography: {
      fontFamily: {
        ...defaultTheme.typography.fontFamily,
        ...(options.theme?.typography?.fontFamily ?? {}),
        ...(mergedState.theme?.typography?.fontFamily ?? {}),
      },
    },
  };

  // 6. Assemble complete candidate AppSpec
  const candidateSpec: AppSpec = {
    schemaVersion: CURRENT_APPSPEC_VERSION,
    metadata: options.metadata,
    settings: options.settings ?? {
      locale: 'en-US',
      timezone: 'UTC',
      currency: 'USD',
    },
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

  // 7. Validate full AppSpec (Structural + Semantic)
  const validationResult = validateAppSpecFull(candidateSpec);
  if (!validationResult.valid) {
    throw new ModuleCompilationError(
      validationResult.structuralErrors,
      validationResult.semanticErrors,
    );
  }

  const validatedSpec = validationResult.spec ?? parseAppSpec(candidateSpec);

  // 8. Deterministic canonicalization
  const canonicalJson = canonicalizeAppSpec(validatedSpec);

  return {
    spec: validatedSpec,
    canonicalJson,
  };
}
