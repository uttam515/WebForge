import { z } from 'zod';
import {
  EntityIdSchema,
  KeySchema,
  FieldIdSchema,
  type EntityId,
  type FieldId,
} from './identity.js';
import { FieldSpecSchema, type FieldSpec } from './fields.js';
import { EntityConstraintSchema, type EntityConstraint } from './constraints.js';

export const EntityOwnershipSchema = z.object({
  ownerFieldId: FieldIdSchema,
});

export type EntityOwnership = {
  ownerFieldId: FieldId;
};

export const EntitySpecSchema = z.object({
  id: EntityIdSchema,
  key: KeySchema,
  label: z.string().min(1),
  pluralLabel: z.string().min(1),
  system: z.boolean().default(false),
  persist: z.boolean().default(true),
  ownership: EntityOwnershipSchema.optional(),
  fields: z.array(FieldSpecSchema).default([]),
  constraints: z.array(EntityConstraintSchema).default([]),
});

export type EntitySpec = {
  id: EntityId;
  key: string;
  label: string;
  pluralLabel: string;
  system?: boolean;
  persist?: boolean;
  ownership?: EntityOwnership;
  fields: FieldSpec[];
  constraints?: EntityConstraint[];
};
