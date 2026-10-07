import { z } from 'zod';
import { EntityIdSchema, type EntityId } from './identity.js';
import { DataBindingSchema, type DataBinding } from './bindings.js';

export type NavigateAction = {
  type: 'Navigate';
  target: string;
  params?: Record<string, string>;
};

export type CreateRecordAction = {
  type: 'CreateRecord';
  entityId: EntityId;
  fields?: Record<string, DataBinding>;
};

export type UpdateRecordAction = {
  type: 'UpdateRecord';
  entityId: EntityId;
  recordIdBinding?: DataBinding;
  fields?: Record<string, DataBinding>;
};

export type DeleteRecordAction = {
  type: 'DeleteRecord';
  entityId: EntityId;
  recordIdBinding?: DataBinding;
};

export type LoginAction = {
  type: 'Login';
  redirectTo?: string;
};

export type LogoutAction = {
  type: 'Logout';
  redirectTo?: string;
};

export type ShowMessageAction = {
  type: 'ShowMessage';
  message: string;
  level?: 'info' | 'success' | 'warning' | 'error';
};

export type ActionSpec =
  | NavigateAction
  | CreateRecordAction
  | UpdateRecordAction
  | DeleteRecordAction
  | LoginAction
  | LogoutAction
  | ShowMessageAction;

export const ActionSpecSchema: z.ZodType<ActionSpec> = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('Navigate'),
    target: z.string().min(1),
    params: z.record(z.string()).optional(),
  }),
  z.object({
    type: z.literal('CreateRecord'),
    entityId: EntityIdSchema,
    fields: z.record(DataBindingSchema).optional(),
  }),
  z.object({
    type: z.literal('UpdateRecord'),
    entityId: EntityIdSchema,
    recordIdBinding: DataBindingSchema.optional(),
    fields: z.record(DataBindingSchema).optional(),
  }),
  z.object({
    type: z.literal('DeleteRecord'),
    entityId: EntityIdSchema,
    recordIdBinding: DataBindingSchema.optional(),
  }),
  z.object({
    type: z.literal('Login'),
    redirectTo: z.string().optional(),
  }),
  z.object({
    type: z.literal('Logout'),
    redirectTo: z.string().optional(),
  }),
  z.object({
    type: z.literal('ShowMessage'),
    message: z.string().min(1),
    level: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  }),
]);
