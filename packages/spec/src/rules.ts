import { z } from 'zod';
import {
  RuleIdSchema,
  KeySchema,
  EntityIdSchema,
  FieldIdSchema,
  RoleIdSchema,
  type RuleId,
  type EntityId,
  type FieldId,
  type RoleId,
} from './identity.js';

// Base Rule Properties
const BaseRuleProps = {
  id: RuleIdSchema,
  key: KeySchema,
  label: z.string().min(1),
  description: z.string().optional(),
};

// 1. Capacity Limit Rule
export const CapacityLimitRuleSchema = z.object({
  ...BaseRuleProps,
  kind: z.literal('capacityLimit'),
  entityId: EntityIdSchema,
  capacityFieldId: FieldIdSchema.optional(),
  limit: z.number().int().positive(),
  countFilter: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  errorMessage: z.string().min(1),
});
export type CapacityLimitRule = {
  id: RuleId;
  key: string;
  label: string;
  kind: 'capacityLimit';
  description?: string;
  entityId: EntityId;
  capacityFieldId?: FieldId;
  limit: number;
  countFilter?: Record<string, string | number | boolean>;
  errorMessage: string;
};

// 2. Status Transition Rule
export const StatusTransitionRuleSchema = z.object({
  ...BaseRuleProps,
  kind: z.literal('statusTransition'),
  entityId: EntityIdSchema,
  fieldId: FieldIdSchema,
  from: z.array(z.string().min(1)).min(1),
  to: z.string().min(1),
  allowedRoles: z.array(RoleIdSchema).optional(),
});
export type StatusTransitionRule = {
  id: RuleId;
  key: string;
  label: string;
  kind: 'statusTransition';
  description?: string;
  entityId: EntityId;
  fieldId: FieldId;
  from: string[];
  to: string;
  allowedRoles?: RoleId[];
};

// 3. Adjust Counter Rule
export const AdjustCounterRuleSchema = z.object({
  ...BaseRuleProps,
  kind: z.literal('adjustCounter'),
  targetEntityId: EntityIdSchema,
  targetFieldId: FieldIdSchema,
  triggerEntityId: EntityIdSchema,
  triggerEvent: z.enum(['create', 'delete']),
  amount: z.number().int(),
});
export type AdjustCounterRule = {
  id: RuleId;
  key: string;
  label: string;
  kind: 'adjustCounter';
  description?: string;
  targetEntityId: EntityId;
  targetFieldId: FieldId;
  triggerEntityId: EntityId;
  triggerEvent: 'create' | 'delete';
  amount: number;
};

// 4. Snapshot On Create Rule
export const FieldMappingSchema = z.object({
  sourceFieldId: FieldIdSchema,
  targetFieldId: FieldIdSchema,
});
export type FieldMapping = {
  sourceFieldId: FieldId;
  targetFieldId: FieldId;
};

export const SnapshotOnCreateRuleSchema = z.object({
  ...BaseRuleProps,
  kind: z.literal('snapshotOnCreate'),
  sourceEntityId: EntityIdSchema,
  targetEntityId: EntityIdSchema,
  fieldMappings: z.array(FieldMappingSchema).min(1),
});
export type SnapshotOnCreateRule = {
  id: RuleId;
  key: string;
  label: string;
  kind: 'snapshotOnCreate';
  description?: string;
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  fieldMappings: FieldMapping[];
};

// 5. Notify Rule
export const NotifyRuleSchema = z.object({
  ...BaseRuleProps,
  kind: z.literal('notify'),
  triggerEntityId: EntityIdSchema,
  triggerEvent: z.enum(['create', 'update', 'delete']),
  channel: z.enum(['email', 'inApp']),
  recipient: z.union([z.literal('owner'), z.literal('admin'), RoleIdSchema]),
  template: z.string().min(1),
});
export type NotifyRule = {
  id: RuleId;
  key: string;
  label: string;
  kind: 'notify';
  description?: string;
  triggerEntityId: EntityId;
  triggerEvent: 'create' | 'update' | 'delete';
  channel: 'email' | 'inApp';
  recipient: 'owner' | 'admin' | RoleId;
  template: string;
};

export const RuleSpecSchema = z.discriminatedUnion('kind', [
  CapacityLimitRuleSchema,
  StatusTransitionRuleSchema,
  AdjustCounterRuleSchema,
  SnapshotOnCreateRuleSchema,
  NotifyRuleSchema,
]);

export type RuleSpec =
  CapacityLimitRule | StatusTransitionRule | AdjustCounterRule | SnapshotOnCreateRule | NotifyRule;

export type RuleKind = RuleSpec['kind'];
