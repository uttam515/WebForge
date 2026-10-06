import { describe, it, expect } from 'vitest';
import type { QueryFilter } from './index.js';

describe('@webforge/engine-data', () => {
  it('should define structured query filters', () => {
    const filter: QueryFilter = {
      field: 'status',
      operator: 'eq',
      value: 'active',
    };
    expect(filter.operator).toBe('eq');
    expect(filter.value).toBe('active');
  });
});
