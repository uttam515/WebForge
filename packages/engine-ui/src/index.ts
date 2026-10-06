/**
 * @file packages/engine-ui/src/index.ts
 * Generic UI rendering engine and component system for WebForge.
 *
 * This package will eventually provide:
 * - Dynamic page renderer driven by AppSpec page and block trees
 * - Block registry (layout containers, text, media, buttons, grids)
 * - Field registry (input controls, selects, date pickers, rich editors)
 * - Entity views (data tables, lists, cards, detail views)
 * - Form generation with client-side validation against AppSpec schemas
 * - Theme provider and token styling resolution
 *
 * Status: Do NOT implement the engine yet.
 */

export interface BlockDefinition {
  type: string;
  props?: Record<string, unknown>;
  children?: BlockDefinition[];
}

export interface RenderContext {
  theme?: string;
  locale?: string;
}
