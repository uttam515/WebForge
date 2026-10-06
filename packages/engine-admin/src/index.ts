/**
 * @file packages/engine-admin/src/index.ts
 * Auto-generated admin dashboard engine for WebForge.
 *
 * This package will eventually generate and configure:
 * - Data tables with customizable columns and formatting
 * - Entity creation, editing, and viewing forms
 * - Global and scoped search interfaces
 * - Faceted filtering and sorting controls
 * - Cursor and offset pagination controls
 * - Bulk operations (batch status updates, exports, deletions)
 * - Admin navigation hierarchy and role-based sidebar menus
 *
 * Status: Do NOT implement the engine yet.
 */

export interface AdminTableConfig {
  entityName: string;
  columns: string[];
  searchableFields: string[];
  enableBulkActions: boolean;
}

export interface AdminNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiredRole?: string;
}
