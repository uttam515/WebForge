import { z } from 'zod';
import { IntegrationIdSchema, KeySchema, type IntegrationId } from './identity.js';

export const IntegrationCapabilitySchema = z.enum([
  'payments',
  'email',
  'storage',
  'maps',
  'analytics',
]);
export type IntegrationCapability = z.infer<typeof IntegrationCapabilitySchema>;

export const IntegrationSpecSchema = z.object({
  id: IntegrationIdSchema,
  key: KeySchema,
  capability: IntegrationCapabilitySchema,
  provider: z.string().min(1),
  config: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type IntegrationSpec = {
  id: IntegrationId;
  key: string;
  capability: IntegrationCapability;
  provider: string;
  config?: Record<string, string | number | boolean>;
};
