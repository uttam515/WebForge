import { z } from 'zod';
import {
  EntityIdSchema,
  SelectOptionSchema,
  type EntityId,
  type SelectOption,
  type FieldSpec,
} from '@webforge/spec';
import type { Module, ModuleContext, SpecFragment } from '../../types.js';

export interface RegistrationTargetReference {
  /** Target module ID contributing the entity (default: 'events') */
  targetModuleId?: string;
  /** Slot key used by the target module (default: 'event') */
  targetSlotKey?: string;
  /** Direct EntityId (if explicitly overriding module/slot) */
  targetEntityId?: EntityId;
}

export const registrationTargetReferenceSchema = z.object({
  targetModuleId: z.string().default('events'),
  targetSlotKey: z.string().default('event'),
  targetEntityId: EntityIdSchema.optional(),
});

export interface RegistrationModuleParams {
  target?: RegistrationTargetReference;
  requireAuth?: boolean;
  authModuleId?: string;
  statuses?: SelectOption[];
}

export const registrationModuleParamsSchema = z.object({
  target: registrationTargetReferenceSchema.default({}),
  requireAuth: z.boolean().default(true),
  authModuleId: z.string().default('auth'),
  statuses: z.array(SelectOptionSchema).default([
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]),
});

/**
 * Registration capability module.
 * Provides generic signup/registration tracking against any target entity (events, courses, programs).
 */
export const registrationModule: Module<RegistrationModuleParams> = {
  id: 'registration',
  requires: (params: RegistrationModuleParams) => {
    const deps: string[] = [];
    if (params.requireAuth ?? true) {
      deps.push(params.authModuleId ?? 'auth');
    }
    if (!params.target?.targetEntityId) {
      deps.push(params.target?.targetModuleId ?? 'events');
    }
    return deps;
  },
  params: registrationModuleParamsSchema,
  contribute: (params: RegistrationModuleParams, ctx: ModuleContext): SpecFragment => {
    const targetConfig = params.target ?? {};
    const targetEntityId: EntityId =
      targetConfig.targetEntityId ??
      ctx
        .forModule(targetConfig.targetModuleId ?? 'events')
        .toEntityId(targetConfig.targetSlotKey ?? 'event');

    const requireAuth = params.requireAuth ?? true;
    const authModuleId = params.authModuleId ?? 'auth';
    const authUserEntityId = requireAuth
      ? ctx.forModule(authModuleId).toEntityId('user')
      : undefined;

    const regEntityId = ctx.toEntityId('registration');
    const targetFieldId = ctx.toFieldId('targetId');
    const statusFieldId = ctx.toFieldId('status');
    const userIdFieldId = ctx.toFieldId('userId');
    const emailFieldId = ctx.toFieldId('email');
    const nameFieldId = ctx.toFieldId('name');
    const notesFieldId = ctx.toFieldId('notes');

    const statuses = params.statuses ?? [
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];

    const fields: FieldSpec[] = [
      {
        id: targetFieldId,
        key: 'targetId',
        label: 'Target',
        type: 'reference',
        required: true,
        config: {
          targetEntityId,
          onDelete: 'cascade',
        },
        queryCapabilities: {
          filterable: true,
        },
      },
      {
        id: statusFieldId,
        key: 'status',
        label: 'Registration Status',
        type: 'select',
        required: true,
        config: {
          options: statuses,
          defaultValue: 'confirmed',
        },
        queryCapabilities: {
          filterable: true,
          sortable: true,
        },
      },
    ];

    if (requireAuth) {
      fields.push({
        id: userIdFieldId,
        key: 'userId',
        label: 'Registrant User',
        type: 'reference',
        required: true,
        config: {
          targetEntityId: authUserEntityId!,
          onDelete: 'cascade',
        },
        queryCapabilities: {
          filterable: true,
        },
      });
    } else {
      fields.push(
        {
          id: emailFieldId,
          key: 'email',
          label: 'Registrant Email',
          type: 'email',
          required: true,
          queryCapabilities: {
            searchable: true,
            filterable: true,
          },
        },
        {
          id: nameFieldId,
          key: 'name',
          label: 'Registrant Name',
          type: 'text',
          required: true,
          queryCapabilities: {
            searchable: true,
          },
        },
      );
    }

    fields.push({
      id: notesFieldId,
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
    });

    const constraintFieldIds = requireAuth
      ? [userIdFieldId, targetFieldId]
      : [emailFieldId, targetFieldId];

    return {
      entities: [
        {
          id: regEntityId,
          key: 'registration',
          label: 'Registration',
          pluralLabel: 'Registrations',
          ownership: requireAuth ? { ownerFieldId: userIdFieldId } : undefined,
          fields,
          constraints: [
            {
              id: ctx.toConstraintId('unique_registrant_target'),
              key: 'unique_registrant_target',
              label: 'One registration per registrant per target',
              type: 'compositeUnique',
              fieldIds: constraintFieldIds,
            },
          ],
        },
      ],
      access: {
        policies: requireAuth
          ? [
              {
                id: ctx.toPolicyId('reg_auth_create'),
                subject: 'authenticated',
                entityId: regEntityId,
                operations: ['create'],
                scope: 'all',
              },
              {
                id: ctx.toPolicyId('reg_owner_manage'),
                subject: 'authenticated',
                entityId: regEntityId,
                operations: ['read', 'update'],
                scope: 'own',
              },
            ]
          : [
              {
                id: ctx.toPolicyId('reg_anon_create'),
                subject: 'anonymous',
                entityId: regEntityId,
                operations: ['create'],
                scope: 'public',
              },
            ],
      },
      admin: {
        resources: [
          {
            entityId: regEntityId,
            columns: [targetFieldId, requireAuth ? userIdFieldId : emailFieldId, statusFieldId],
            filterFields: [statusFieldId],
          },
        ],
      },
    };
  },
};
