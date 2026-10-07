/**
 * @file packages/spec/src/index.ts
 * Public API for @webforge/spec
 *
 * Canonical schema-driven AppSpec definition, structural validation,
 * semantic validation, and deterministic serialization for WebForge.
 */

// Identity & Branded ID types
export * from './identity.js';

// Schemas & Types
export * from './metadata.js';
export * from './settings.js';
export * from './fields.js';
export * from './constraints.js';
export * from './entities.js';
export * from './auth.js';
export * from './access.js';
export * from './admin.js';
export * from './navigation.js';
export * from './layouts.js';
export * from './bindings.js';
export * from './actions.js';
export * from './blocks.js';
export * from './pages.js';
export * from './rules.js';
export * from './theme.js';
export * from './assets.js';
export * from './integrations.js';
export * from './provenance.js';
export * from './app-spec.js';

// Validation
export * from './validation/index.js';

// Serialization
export * from './serialization.js';

// Golden application fixtures
export * from './fixtures/index.js';
