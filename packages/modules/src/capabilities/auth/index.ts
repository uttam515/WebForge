import { z } from 'zod';
import { AuthMethodSchema, type AuthMethod } from '@webforge/spec';
import type { Module, ModuleContext, SpecFragment } from '../../types.js';

export interface AuthModuleParams {
  allowSignup?: boolean;
  defaultRoleKey?: string;
  methods?: AuthMethod[];
}

export const authModuleParamsSchema = z.object({
  allowSignup: z.boolean().default(true),
  defaultRoleKey: z.string().default('user'),
  methods: z.array(AuthMethodSchema).default(['password']),
});

/**
 * Authentication & Identity capability module.
 * Contributes the core User entity, role specifications, and minimal access controls.
 */
export const authModule: Module<AuthModuleParams> = {
  id: 'auth',
  params: authModuleParamsSchema,
  contribute: (params: AuthModuleParams, ctx: ModuleContext): SpecFragment => {
    const userEntityId = ctx.toEntityId('user');
    const emailFieldId = ctx.toFieldId('email');
    const displayNameFieldId = ctx.toFieldId('displayName');
    const emailConstraintId = ctx.toConstraintId('unique_email');

    const adminRoleId = ctx.toRoleId('admin');
    const userRoleId = ctx.toRoleId('user');

    const defaultRoleId =
      params.defaultRoleKey === 'admin'
        ? adminRoleId
        : params.defaultRoleKey === 'user' || !params.defaultRoleKey
          ? userRoleId
          : ctx.toRoleId(params.defaultRoleKey);

    return {
      entities: [
        {
          id: userEntityId,
          key: 'user',
          label: 'User',
          pluralLabel: 'Users',
          system: true,
          persist: true,
          fields: [
            {
              id: emailFieldId,
              key: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              queryCapabilities: {
                searchable: true,
                filterable: true,
                sortable: true,
              },
            },
            {
              id: displayNameFieldId,
              key: 'displayName',
              label: 'Display Name',
              type: 'text',
              required: false,
              queryCapabilities: {
                searchable: true,
                sortable: true,
              },
            },
          ],
          constraints: [
            {
              id: emailConstraintId,
              key: 'unique_email',
              label: 'Unique Email Address',
              type: 'unique',
              fieldId: emailFieldId,
            },
          ],
        },
      ],
      auth: {
        methods: params.methods ?? ['password'],
        signup: {
          enabled: params.allowSignup ?? true,
          defaultRoleId,
        },
        roles: [
          {
            id: adminRoleId,
            key: 'admin',
            label: 'Administrator',
            description: 'Full administrative access to the application',
          },
          {
            id: userRoleId,
            key: 'user',
            label: 'User',
            description: 'Standard authenticated application user',
          },
        ],
        userEntityId,
      },
      access: {
        policies: [
          {
            id: ctx.toPolicyId('user_self_read'),
            subject: 'authenticated',
            entityId: userEntityId,
            operations: ['read'],
            scope: 'all',
          },
          {
            id: ctx.toPolicyId('admin_user_manage'),
            subject: adminRoleId,
            entityId: userEntityId,
            operations: ['create', 'read', 'update', 'delete'],
            scope: 'all',
          },
        ],
      },
      admin: {
        roles: [adminRoleId],
        resources: [
          {
            entityId: userEntityId,
            columns: [emailFieldId, displayNameFieldId],
            searchFields: [emailFieldId, displayNameFieldId],
            filterFields: [emailFieldId],
          },
        ],
      },
    };
  },
};
