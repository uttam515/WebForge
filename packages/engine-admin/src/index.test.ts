import { describe, it, expect } from 'vitest';
import type { AdminTableConfig } from './index.js';

describe('@webforge/engine-admin', () => {
  it('should define AdminTableConfig structure', () => {
    const config: AdminTableConfig = {
      entityName: 'User',
      columns: ['id', 'email', 'role', 'createdAt'],
      searchableFields: ['email'],
      enableBulkActions: true,
    };
    expect(config.entityName).toBe('User');
    expect(config.columns.length).toBe(4);
  });
});
