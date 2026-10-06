import { describe, it, expect } from 'vitest';
import { getCompilerVersion } from './index.js';

describe('@webforge/compiler', () => {
  it('should return compiler target version matching spec version', () => {
    expect(getCompilerVersion()).toBe('1.0.0');
  });
});
