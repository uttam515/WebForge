import { z } from 'zod';
import type { FieldSpec } from '@webforge/spec';
import type { Module, ModuleContext, SpecFragment } from '../../types.js';

export interface ProfilesModuleParams {
  enableBio?: boolean;
  enableAvatar?: boolean;
  enablePhone?: boolean;
  enableWebsite?: boolean;
}

export const profilesModuleParamsSchema = z.object({
  enableBio: z.boolean().default(true),
  enableAvatar: z.boolean().default(true),
  enablePhone: z.boolean().default(false),
  enableWebsite: z.boolean().default(false),
});

/**
 * User Profiles capability module.
 * Provides extensible public/private profile metadata linked to the core auth User.
 */
export const profilesModule: Module<ProfilesModuleParams> = {
  id: 'profiles',
  requires: ['auth'],
  params: profilesModuleParamsSchema,
  contribute: (params: ProfilesModuleParams, ctx: ModuleContext): SpecFragment => {
    const profileEntityId = ctx.toEntityId('profile');
    const authUserEntityId = ctx.forModule('auth').toEntityId('user');

    const userIdFieldId = ctx.toFieldId('userId');
    const handleFieldId = ctx.toFieldId('handle');
    const bioFieldId = ctx.toFieldId('bio');
    const avatarFieldId = ctx.toFieldId('avatarUrl');
    const phoneFieldId = ctx.toFieldId('phoneNumber');
    const websiteFieldId = ctx.toFieldId('website');

    const fields: FieldSpec[] = [
      {
        id: userIdFieldId,
        key: 'userId',
        label: 'User',
        type: 'reference',
        required: true,
        config: {
          targetEntityId: authUserEntityId,
          onDelete: 'cascade',
        },
        queryCapabilities: {
          filterable: true,
        },
      },
      {
        id: handleFieldId,
        key: 'handle',
        label: 'Profile Handle',
        type: 'slug',
        required: true,
        queryCapabilities: {
          searchable: true,
          filterable: true,
          sortable: true,
        },
      },
    ];

    if (params.enableBio ?? true) {
      fields.push({
        id: bioFieldId,
        key: 'bio',
        label: 'Bio',
        type: 'textarea',
        required: false,
        validation: {
          maxLength: 1000,
        },
      });
    }

    if (params.enableAvatar ?? true) {
      fields.push({
        id: avatarFieldId,
        key: 'avatarUrl',
        label: 'Avatar',
        type: 'image',
        required: false,
      });
    }

    if (params.enablePhone) {
      fields.push({
        id: phoneFieldId,
        key: 'phoneNumber',
        label: 'Phone Number',
        type: 'text',
        required: false,
        config: {
          format: 'phone',
        },
      });
    }

    if (params.enableWebsite) {
      fields.push({
        id: websiteFieldId,
        key: 'website',
        label: 'Website',
        type: 'url',
        required: false,
      });
    }

    return {
      entities: [
        {
          id: profileEntityId,
          key: 'profile',
          label: 'User Profile',
          pluralLabel: 'User Profiles',
          ownership: {
            ownerFieldId: userIdFieldId,
          },
          fields,
          constraints: [
            {
              id: ctx.toConstraintId('unique_user_profile'),
              key: 'unique_user_profile',
              label: 'One profile per user',
              type: 'unique',
              fieldId: userIdFieldId,
            },
            {
              id: ctx.toConstraintId('unique_handle'),
              key: 'unique_handle',
              label: 'Unique profile handle',
              type: 'unique',
              fieldId: handleFieldId,
            },
          ],
        },
      ],
      access: {
        policies: [
          {
            id: ctx.toPolicyId('profile_public_read'),
            subject: 'anonymous',
            entityId: profileEntityId,
            operations: ['read'],
            scope: 'public',
          },
          {
            id: ctx.toPolicyId('profile_auth_read'),
            subject: 'authenticated',
            entityId: profileEntityId,
            operations: ['read'],
            scope: 'all',
          },
          {
            id: ctx.toPolicyId('profile_owner_manage'),
            subject: 'authenticated',
            entityId: profileEntityId,
            operations: ['create', 'update'],
            scope: 'own',
          },
        ],
      },
      admin: {
        resources: [
          {
            entityId: profileEntityId,
            columns: [userIdFieldId, handleFieldId],
            searchFields: [handleFieldId],
          },
        ],
      },
    };
  },
};
