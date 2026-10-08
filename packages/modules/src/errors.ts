export class ModuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModuleError';
  }
}

export class DuplicateModuleError extends ModuleError {
  constructor(public readonly moduleId: string) {
    super(`Module with ID '${moduleId}' is already registered.`);
    this.name = 'DuplicateModuleError';
  }
}

export class ModuleNotFoundError extends ModuleError {
  constructor(public readonly moduleId: string) {
    super(`Module '${moduleId}' not found in registry.`);
    this.name = 'ModuleNotFoundError';
  }
}

export class MissingDependencyError extends ModuleError {
  constructor(
    public readonly moduleId: string,
    public readonly missingDependencyId: string,
  ) {
    super(`Module '${moduleId}' requires missing module dependency '${missingDependencyId}'.`);
    this.name = 'MissingDependencyError';
  }
}

export class UndeclaredDependencyError extends ModuleError {
  constructor(
    public readonly sourceModuleId: string,
    public readonly referencedModuleId: string,
  ) {
    super(
      `Module '${sourceModuleId}' attempted to reference identities from '${referencedModuleId}', which is not in its declared dependency graph.`,
    );
    this.name = 'UndeclaredDependencyError';
  }
}

export class CircularDependencyError extends ModuleError {
  constructor(public readonly cyclePath: string[]) {
    super(`Circular dependency detected in modules: ${cyclePath.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

export class InvalidModuleParamsError extends ModuleError {
  constructor(
    public readonly moduleId: string,
    public readonly issues: unknown[],
  ) {
    super(`Invalid parameters provided for module '${moduleId}': ${JSON.stringify(issues)}`);
    this.name = 'InvalidModuleParamsError';
  }
}

export class MergeConflictError extends ModuleError {
  constructor(
    public readonly objectType: string,
    public readonly identifier: string,
    message?: string,
  ) {
    super(
      message ||
        `Merge conflict: ${objectType} with identifier '${identifier}' is already defined.`,
    );
    this.name = 'MergeConflictError';
  }
}

export class MissingTargetError extends ModuleError {
  constructor(
    public readonly targetType: string,
    public readonly identifier: string,
  ) {
    super(`Cannot extend non-existent ${targetType} with identifier '${identifier}'.`);
    this.name = 'MissingTargetError';
  }
}

export class InvalidExtensionError extends ModuleError {
  constructor(
    public readonly targetType: string,
    public readonly identifier: string,
    public readonly detail: string,
  ) {
    super(`Invalid extension on ${targetType} '${identifier}': ${detail}`);
    this.name = 'InvalidExtensionError';
  }
}

export class ModuleCompilationError extends ModuleError {
  constructor(
    public readonly structuralErrors?: unknown[],
    public readonly semanticErrors?: unknown[],
  ) {
    const errorDetails = [
      structuralErrors?.length ? `Structural: ${JSON.stringify(structuralErrors)}` : '',
      semanticErrors?.length ? `Semantic: ${JSON.stringify(semanticErrors)}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    super(`Module compilation failed. ${errorDetails}`);
    this.name = 'ModuleCompilationError';
  }
}
