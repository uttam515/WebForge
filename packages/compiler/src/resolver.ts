import { type ModuleRegistry, getModuleDependencies } from '@webforge/modules';
import {
  DuplicateModuleError,
  ModuleNotFoundError,
  MissingDependencyError,
  CircularDependencyError,
  InvalidModuleParamsError,
} from './errors.js';
import type { ModuleSelection, ResolvedModuleExecution } from './types.js';

/**
 * Resolves all explicit module selections and their transitive dependencies, validates
 * parameters, detects cycles, calculates dependency closures, and sorts modules into
 * deterministic execution order.
 */
export function resolveCompilerDependencies(
  selections: ModuleSelection<unknown>[],
  registry: ModuleRegistry,
): ResolvedModuleExecution[] {
  const resolvedMap = new Map<string, ResolvedModuleExecution>();
  const expansionQueue: string[] = [];

  // 1. Process explicit module selections
  for (const selection of selections) {
    if (resolvedMap.has(selection.moduleId)) {
      throw new DuplicateModuleError(selection.moduleId);
    }

    const mod = registry.get(selection.moduleId);
    if (!mod) {
      throw new ModuleNotFoundError(selection.moduleId);
    }

    const parseResult = mod.params.safeParse(selection.params);
    if (!parseResult.success) {
      throw new InvalidModuleParamsError(mod.id, parseResult.error.issues);
    }

    resolvedMap.set(selection.moduleId, {
      module: mod,
      params: parseResult.data,
      isExplicit: true,
    });
    expansionQueue.push(selection.moduleId);
  }

  // 2. Transitive dependency auto-resolution
  while (expansionQueue.length > 0) {
    const currentId = expansionQueue.shift()!;
    const currentExecution = resolvedMap.get(currentId)!;
    const requiredDepIds = getModuleDependencies(currentExecution.module, currentExecution.params);

    for (const depId of requiredDepIds) {
      if (resolvedMap.has(depId)) {
        continue;
      }

      const depModule = registry.get(depId);
      if (!depModule) {
        throw new MissingDependencyError(currentExecution.module.id, depId);
      }

      // Auto-resolved transitive dependencies use default/empty params
      const parseResult = depModule.params.safeParse({});
      if (!parseResult.success) {
        throw new InvalidModuleParamsError(depModule.id, parseResult.error.issues);
      }

      resolvedMap.set(depId, {
        module: depModule,
        params: parseResult.data,
        isExplicit: false,
      });
      expansionQueue.push(depId);
    }
  }

  // 3. Detect circular dependencies via DFS
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function checkCycle(nodeId: string) {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const execution = resolvedMap.get(nodeId)!;
    const deps = getModuleDependencies(execution.module, execution.params);

    for (const depId of deps) {
      if (!visited.has(depId)) {
        checkCycle(depId);
      } else if (recStack.has(depId)) {
        const cycleStartIndex = path.indexOf(depId);
        const cycle = [...path.slice(cycleStartIndex), depId];
        throw new CircularDependencyError(cycle);
      }
    }

    path.pop();
    recStack.delete(nodeId);
  }

  // Traverse in sorted key order for determinism
  const allIds = Array.from(resolvedMap.keys()).sort();
  for (const id of allIds) {
    if (!visited.has(id)) {
      checkCycle(id);
    }
  }

  // 4. Calculate transitive dependency closure for each module (for reference permission enforcement)
  for (const id of allIds) {
    const execution = resolvedMap.get(id)!;
    const closure = new Set<string>([id]);
    const queue = [...getModuleDependencies(execution.module, execution.params)];

    while (queue.length > 0) {
      const depId = queue.shift()!;
      if (!closure.has(depId)) {
        closure.add(depId);
        const depExec = resolvedMap.get(depId);
        if (depExec) {
          queue.push(...getModuleDependencies(depExec.module, depExec.params));
        }
      }
    }

    execution.allowedModuleIds = closure;
  }

  // 5. Deterministic Topological Sorting (Kahn's Algorithm)
  const dependentsMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of allIds) {
    dependentsMap.set(id, []);
    inDegree.set(id, 0);
  }

  for (const id of allIds) {
    const execution = resolvedMap.get(id)!;
    const requires = getModuleDependencies(execution.module, execution.params);
    inDegree.set(id, requires.length);

    for (const depId of requires) {
      dependentsMap.get(depId)!.push(id);
    }
  }

  // Seed ready queue with nodes that have inDegree === 0 (all dependencies satisfied)
  const readyQueue: string[] = allIds.filter((id) => inDegree.get(id) === 0).sort();
  const sortedResult: ResolvedModuleExecution[] = [];

  while (readyQueue.length > 0) {
    readyQueue.sort();
    const currentId = readyQueue.shift()!;
    sortedResult.push(resolvedMap.get(currentId)!);

    const dependents = dependentsMap.get(currentId) ?? [];
    for (const depId of dependents) {
      const remaining = inDegree.get(depId)! - 1;
      inDegree.set(depId, remaining);
      if (remaining === 0) {
        readyQueue.push(depId);
      }
    }
  }

  return sortedResult;
}
