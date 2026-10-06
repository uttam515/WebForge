import { describe, it, expect } from 'vitest';
import { REGISTERED_MODULE_NAMES } from './index.js';

describe('@webforge/modules', () => {
  it('should list planned module capability names', () => {
    expect(REGISTERED_MODULE_NAMES).toContain('auth');
    expect(REGISTERED_MODULE_NAMES).toContain('ecommerce');
    expect(REGISTERED_MODULE_NAMES).toContain('events');
    expect(REGISTERED_MODULE_NAMES).toContain('blog');
    expect(REGISTERED_MODULE_NAMES).toContain('gallery');
    expect(REGISTERED_MODULE_NAMES).toContain('registration');
  });
});
