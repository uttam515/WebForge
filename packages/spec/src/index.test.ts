import { describe, it, expect } from 'vitest';
import { CURRENT_APPSPEC_VERSION, AppSpecMetadataSchema } from './index.js';

describe('@webforge/spec', () => {
  it('should export the current AppSpec version', () => {
    expect(CURRENT_APPSPEC_VERSION).toBe('1.0.0');
  });

  it('should validate valid metadata using Zod schema', () => {
    const validData = {
      id: 'app_123',
      name: 'Test Application',
      version: '1.0.0',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const result = AppSpecMetadataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
