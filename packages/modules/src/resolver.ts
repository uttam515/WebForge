import type { Module } from './types.js';
import { MissingDependencyError, CircularDependencyError } from './errors.js';

export interface ModuleInvocation<P = unknown> {
  module: Module<P>;
  params: P;
}

/**
 * Resolves module dependencies deterministically using topological sorting
 * with alphabetical tie-breaking for independent modules.
 */
export function resolveModuleDependencies<T extends { module: Module<unknown> }>(
  invocations: T[],
): T[] {
  const moduleMap = new Map<string, T>();

  for (const item of invocations) {
    moduleMap.set(item.module.id, item);
  }

  // 1. Check for missing dependencies
  for (const item of invocations) {
    const requires = item.module.requires ?? [];
    for (const depId of requires) {
      if (!moduleMap.has(depId)) {
        throw new MissingDependencyError(item.module.id, depId);
      }
    }
  }

  // 2. Detect circular dependencies via DFS
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function checkCycle(nodeId: string) {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const item = moduleMap.get(nodeId)!;
    const deps = item.module.requires ?? [];

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

  // Sort keys initially for deterministic traversal
  const allIds = Array.from(moduleMap.keys()).sort();
  for (const id of allIds) {
    if (!visited.has(id)) {
      checkCycle(id);
    }
  }

  // 3. Kahn's Algorithm for deterministic topological sort
  // Dependency direction: If A requires B, B must precede A.
  // dependentsMap: B -> [A] (when B finishes, A is unblocked)
  const dependentsMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of allIds) {
    dependentsMap.set(id, []);
    inDegree.set(id, 0);
  }

  for (const id of allIds) {
    const item = moduleMap.get(id)!;
    const requires = item.module.requires ?? [];
    inDegree.set(id, requires.length);

    for (const depId of requires) {
      dependentsMap.get(depId)!.push(id);
    }
  }

  // Ready queue: modules with inDegree === 0 (all their dependencies are satisfied)
  const readyQueue: string[] = allIds.filter((id) => inDegree.get(id) === 0).sort();

  const sortedResult: T[] = [];

  while (readyQueue.length > 0) {
    // Deterministically take the lexicographically smallest module ready to execute
    readyQueue.sort();
    const currentId = readyQueue.shift()!;
    sortedResult.push(moduleMap.get(currentId)!);

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
