import type { Module } from './types.js';
import { DuplicateModuleError } from './errors.js';

/**
 * Registry for managing capability modules.
 */
export class ModuleRegistry {
  private readonly modules = new Map<string, Module<unknown>>();

  /**
   * Registers a new capability module.
   * Throws DuplicateModuleError if a module with the same ID already exists.
   */
  register<P>(module: Module<P>): this {
    if (this.modules.has(module.id)) {
      throw new DuplicateModuleError(module.id);
    }
    this.modules.set(module.id, module as unknown as Module<unknown>);
    return this;
  }

  /**
   * Retrieves a module by its identifier.
   */
  get<P = unknown>(id: string): Module<P> | undefined {
    return this.modules.get(id) as Module<P> | undefined;
  }

  /**
   * Checks if a module is registered.
   */
  has(id: string): boolean {
    return this.modules.has(id);
  }

  /**
   * Returns all registered modules.
   */
  getAll(): Module<unknown>[] {
    return Array.from(this.modules.values());
  }

  /**
   * Clears all registered modules.
   */
  clear(): void {
    this.modules.clear();
  }
}

/**
 * Global default module registry instance.
 */
export const defaultModuleRegistry = new ModuleRegistry();
