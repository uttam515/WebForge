import { describe, it, expect } from 'vitest';
import type { ApiRequestContext } from './index.js';

describe('@webforge/engine-api', () => {
  it('should define ApiRequestContext structure', () => {
    const ctx: ApiRequestContext = {
      projectId: 'proj_123',
      entityName: 'Product',
      action: 'create',
      payload: { name: 'Item 1' },
    };
    expect(ctx.entityName).toBe('Product');
    expect(ctx.action).toBe('create');
  });
});
