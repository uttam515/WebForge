import { z } from 'zod';
import { EntityIdSchema, FieldIdSchema, type EntityId, type FieldId } from './identity.js';

export const EntityFieldBindingSchema = z.object({
  source: z.literal('entityField'),
  entityId: EntityIdSchema,
  fieldId: FieldIdSchema,
});

export type EntityFieldBinding = {
  source: 'entityField';
  entityId: EntityId;
  fieldId: FieldId;
};

export const RouteParamBindingSchema = z.object({
  source: z.literal('routeParam'),
  paramName: z.string().min(1),
});

export type RouteParamBinding = {
  source: 'routeParam';
  paramName: string;
};

export const CurrentUserBindingSchema = z.object({
  source: z.literal('currentUser'),
  property: z.enum(['id', 'role', 'email']),
});

export type CurrentUserBinding = {
  source: 'currentUser';
  property: 'id' | 'role' | 'email';
};

export const DataBindingSchema = z.discriminatedUnion('source', [
  EntityFieldBindingSchema,
  RouteParamBindingSchema,
  CurrentUserBindingSchema,
]);

export type DataBinding = EntityFieldBinding | RouteParamBinding | CurrentUserBinding;
