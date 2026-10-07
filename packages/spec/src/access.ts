import { z } from 'zod';
import {
  PolicyIdSchema,
  EntityIdSchema,
  RoleIdSchema,
  type PolicyId,
  type EntityId,
  type RoleId,
} from './identity.js';

export const OperationSchema = z.enum(['create', 'read', 'update', 'delete']);
export type Operation = z.infer<typeof OperationSchema>;

export const AccessScopeSchema = z.enum(['all', 'own', 'public']);
export type AccessScope = z.infer<typeof AccessScopeSchema>;

export const PolicySubjectSchema = z.union([
  z.literal('anonymous'),
  z.literal('authenticated'),
  RoleIdSchema,
]);
export type PolicySubject = 'anonymous' | 'authenticated' | RoleId;

export const AccessPolicySchema = z.object({
  id: PolicyIdSchema,
  subject: PolicySubjectSchema,
  entityId: EntityIdSchema,
  operations: z.array(OperationSchema).min(1),
  scope: AccessScopeSchema.default('all'),
});

export type AccessPolicy = {
  id: PolicyId;
  subject: PolicySubject;
  entityId: EntityId;
  operations: Operation[];
  scope: AccessScope;
};

export const AccessSpecSchema = z.object({
  policies: z.array(AccessPolicySchema).default([]),
});

export type AccessSpec = {
  policies: AccessPolicy[];
};
