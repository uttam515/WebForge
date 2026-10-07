import { z } from 'zod';
import {
  ConstraintIdSchema,
  KeySchema,
  FieldIdSchema,
  type ConstraintId,
  type FieldId,
} from './identity.js';

export const UniqueConstraintSchema = z.object({
  id: ConstraintIdSchema,
  key: KeySchema,
  label: z.string().optional(),
  type: z.literal('unique'),
  fieldId: FieldIdSchema,
});

export type UniqueConstraint = {
  id: ConstraintId;
  key: string;
  label?: string;
  type: 'unique';
  fieldId: FieldId;
};

export const CompositeUniqueConstraintSchema = z.object({
  id: ConstraintIdSchema,
  key: KeySchema,
  label: z.string().optional(),
  type: z.literal('compositeUnique'),
  fieldIds: z.array(FieldIdSchema).min(2, {
    message: 'Composite unique constraints must include at least two fields',
  }),
});

export type CompositeUniqueConstraint = {
  id: ConstraintId;
  key: string;
  label?: string;
  type: 'compositeUnique';
  fieldIds: FieldId[];
};

export const EntityConstraintSchema = z.discriminatedUnion('type', [
  UniqueConstraintSchema,
  CompositeUniqueConstraintSchema,
]);

export type EntityConstraint = UniqueConstraint | CompositeUniqueConstraint;
