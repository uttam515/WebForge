import { z } from 'zod';
import { RoleIdSchema, KeySchema, EntityIdSchema, type RoleId, type EntityId } from './identity.js';

export const AuthMethodSchema = z.enum(['password', 'magic-link', 'oauth']);
export type AuthMethod = z.infer<typeof AuthMethodSchema>;

export const RoleSpecSchema = z.object({
  id: RoleIdSchema,
  key: KeySchema,
  label: z.string().min(1),
  description: z.string().optional(),
});

export type RoleSpec = {
  id: RoleId;
  key: string;
  label: string;
  description?: string;
};

export const SignupConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultRoleId: RoleIdSchema,
});

export type SignupConfig = {
  enabled: boolean;
  defaultRoleId: RoleId;
};

export const AuthSpecSchema = z.object({
  methods: z.array(AuthMethodSchema).min(1),
  signup: SignupConfigSchema,
  roles: z.array(RoleSpecSchema).min(1),
  userEntityId: EntityIdSchema.optional(),
});

export type AuthSpec = {
  methods: AuthMethod[];
  signup: SignupConfig;
  roles: RoleSpec[];
  userEntityId?: EntityId;
};
