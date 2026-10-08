import type { ModuleRegistry } from '../registry.js';
import { authModule } from './auth/index.js';
import { profilesModule } from './profiles/index.js';
import { catalogModule } from './catalog/index.js';
import { reviewsModule } from './reviews/index.js';
import { registrationModule } from './registration/index.js';
import { bookingModule } from './booking/index.js';

import type { Module } from '../types.js';

export * from './auth/index.js';
export * from './profiles/index.js';
export * from './catalog/index.js';
export * from './reviews/index.js';
export * from './registration/index.js';
export * from './booking/index.js';

/**
 * Array of all core capability modules.
 */
export const coreCapabilities: readonly Module<unknown>[] = [
  authModule as unknown as Module<unknown>,
  profilesModule as unknown as Module<unknown>,
  catalogModule as unknown as Module<unknown>,
  reviewsModule as unknown as Module<unknown>,
  registrationModule as unknown as Module<unknown>,
  bookingModule as unknown as Module<unknown>,
];

/**
 * Registers all core capability modules into the given ModuleRegistry.
 */
export function registerCoreCapabilities(registry: ModuleRegistry): ModuleRegistry {
  for (const mod of coreCapabilities) {
    if (!registry.has(mod.id)) {
      registry.register(mod);
    }
  }
  return registry;
}
