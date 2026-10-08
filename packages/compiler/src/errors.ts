import { ModuleError } from '@webforge/modules';

export {
  ModuleError,
  DuplicateModuleError,
  ModuleNotFoundError,
  MissingDependencyError,
  CircularDependencyError,
  InvalidModuleParamsError,
  MergeConflictError,
  MissingTargetError,
  InvalidExtensionError,
  ModuleCompilationError,
} from '@webforge/modules';

/**
 * Base error class for compiler-specific failures.
 */
export class CompilerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompilerError';
  }
}

/**
 * Thrown when a capability module's contribute() function fails unexpectedly.
 */
export class ModuleContributionError extends ModuleError {
  constructor(
    public readonly moduleId: string,
    public readonly detail: string,
    public readonly cause?: unknown,
  ) {
    super(`Module '${moduleId}' contribution failed: ${detail}`);
    this.name = 'ModuleContributionError';
  }
}
