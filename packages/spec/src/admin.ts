import { z } from 'zod';
import {
  EntityIdSchema,
  FieldIdSchema,
  RoleIdSchema,
  type EntityId,
  type FieldId,
  type RoleId,
} from './identity.js';

export const AdminOperationSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'export',
  'bulkDelete',
]);
export type AdminOperation = z.infer<typeof AdminOperationSchema>;

export const AdminResourceSchema = z.object({
  entityId: EntityIdSchema,
  columns: z.array(FieldIdSchema).min(1),
  searchFields: z.array(FieldIdSchema).optional(),
  filterFields: z.array(FieldIdSchema).optional(),
  operations: z.array(AdminOperationSchema).optional(),
});

export type AdminResource = {
  entityId: EntityId;
  columns: FieldId[];
  searchFields?: FieldId[];
  filterFields?: FieldId[];
  operations?: AdminOperation[];
};

export const AdminSpecSchema = z.object({
  roles: z.array(RoleIdSchema).optional(),
  resources: z.array(AdminResourceSchema).min(1),
});

export type AdminSpec = {
  roles?: RoleId[];
  resources: AdminResource[];
};
