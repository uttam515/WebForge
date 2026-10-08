import { CURRENT_APPSPEC_VERSION } from '@webforge/spec';

export * from './types.js';
export * from './errors.js';
export * from './defaults.js';
export * from './resolver.js';
export * from './compiler.js';

/**
 * Returns the target AppSpec version supported by this compiler.
 */
export function getCompilerVersion(): string {
  return CURRENT_APPSPEC_VERSION;
}
