/**
 * @file packages/modules/src/index.ts
 * Functional capability modules for WebForge.
 *
 * This package will eventually contain modular capabilities such as:
 * - Authentication & User Management (local, OAuth, magic links)
 * - E-Commerce (catalog, cart, checkout, orders)
 * - Events & Ticketing (schedules, RSVPs, tickets)
 * - Blog & CMS (articles, categories, tags, comments)
 * - Media Gallery (uploads, asset management)
 * - Registration & Onboarding flows
 *
 * Status: Do NOT implement these modules yet.
 */

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies?: string[];
}

export const REGISTERED_MODULE_NAMES = [
  'auth',
  'ecommerce',
  'events',
  'blog',
  'gallery',
  'registration',
] as const;

export type RegisteredModuleName = (typeof REGISTERED_MODULE_NAMES)[number];
