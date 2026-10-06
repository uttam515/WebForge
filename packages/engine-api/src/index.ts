/**
 * @file packages/engine-api/src/index.ts
 * Generic API request pipeline engine for WebForge.
 *
 * Execution flow:
 *   Incoming Request
 *          ↓
 *   Load AppSpec
 *          ↓
 *   Find Entity / Resource
 *          ↓
 *   Authorize (RBAC/ABAC)
 *          ↓
 *   Validate Request Payload
 *          ↓
 *   Execute Rules / Lifecycle Hooks
 *          ↓
 *   Database Operation (via engine-data)
 *          ↓
 *   Format Response
 *
 * Status: Do NOT implement the engine yet.
 */

export interface ApiRequestContext {
  projectId: string;
  userId?: string;
  userRoles?: string[];
  entityName: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'list';
  payload?: unknown;
  params?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
