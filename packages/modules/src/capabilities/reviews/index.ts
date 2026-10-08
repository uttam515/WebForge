import { z } from 'zod';
import { EntityIdSchema, type EntityId } from '@webforge/spec';
import type { Module, ModuleContext, SpecFragment } from '../../types.js';

export interface TargetEntityReference {
  /** Target module ID contributing the entity (default: 'catalog') */
  targetModuleId?: string;
  /** Slot key used by the target module (default: 'item') */
  targetSlotKey?: string;
  /** Direct EntityId (if explicitly overriding module/slot) */
  targetEntityId?: EntityId;
}

export const targetEntityReferenceSchema = z.object({
  targetModuleId: z.string().default('catalog'),
  targetSlotKey: z.string().default('item'),
  targetEntityId: EntityIdSchema.optional(),
});

export interface ReviewsModuleParams {
  target?: TargetEntityReference;
  minRating?: number;
  maxRating?: number;
  allowAnonymousRead?: boolean;
}

export const reviewsModuleParamsSchema = z.object({
  target: targetEntityReferenceSchema.default({}),
  minRating: z.number().int().min(1).default(1),
  maxRating: z.number().int().max(10).default(5),
  allowAnonymousRead: z.boolean().default(true),
});

/**
 * Reviews & Ratings capability module.
 * Provides a generic review model that can target any entity (products, services, etc.).
 */
export const reviewsModule: Module<ReviewsModuleParams> = {
  id: 'reviews',
  requires: (params: ReviewsModuleParams) => {
    const deps = ['auth'];
    if (!params.target?.targetEntityId) {
      deps.push(params.target?.targetModuleId ?? 'catalog');
    }
    return deps;
  },
  params: reviewsModuleParamsSchema,
  contribute: (params: ReviewsModuleParams, ctx: ModuleContext): SpecFragment => {
    const targetConfig = params.target ?? {};
    const targetEntityId: EntityId =
      targetConfig.targetEntityId ??
      ctx
        .forModule(targetConfig.targetModuleId ?? 'catalog')
        .toEntityId(targetConfig.targetSlotKey ?? 'item');

    const authUserEntityId = ctx.forModule('auth').toEntityId('user');

    const reviewEntityId = ctx.toEntityId('review');
    const authorFieldId = ctx.toFieldId('authorId');
    const targetFieldId = ctx.toFieldId('targetId');
    const ratingFieldId = ctx.toFieldId('rating');
    const titleFieldId = ctx.toFieldId('title');
    const bodyFieldId = ctx.toFieldId('body');

    const minRating = params.minRating ?? 1;
    const maxRating = params.maxRating ?? 5;
    const allowAnonymousRead = params.allowAnonymousRead ?? true;

    return {
      entities: [
        {
          id: reviewEntityId,
          key: 'review',
          label: 'Review',
          pluralLabel: 'Reviews',
          ownership: {
            ownerFieldId: authorFieldId,
          },
          fields: [
            {
              id: authorFieldId,
              key: 'authorId',
              label: 'Author',
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
              id: targetFieldId,
              key: 'targetId',
              label: 'Reviewed Target',
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
              id: ratingFieldId,
              key: 'rating',
              label: 'Rating',
              type: 'number',
              required: true,
              config: {
                integer: true,
              },
              validation: {
                min: minRating,
                max: maxRating,
              },
              queryCapabilities: {
                filterable: true,
                sortable: true,
              },
            },
            {
              id: titleFieldId,
              key: 'title',
              label: 'Title',
              type: 'text',
              required: false,
              queryCapabilities: {
                searchable: true,
              },
            },
            {
              id: bodyFieldId,
              key: 'body',
              label: 'Review Body',
              type: 'textarea',
              required: true,
            },
          ],
          constraints: [
            {
              id: ctx.toConstraintId('unique_user_target_review'),
              key: 'unique_user_target_review',
              label: 'One review per user per target',
              type: 'compositeUnique',
              fieldIds: [authorFieldId, targetFieldId],
            },
          ],
        },
      ],
      access: {
        policies: [
          ...(allowAnonymousRead
            ? [
                {
                  id: ctx.toPolicyId('review_public_read'),
                  subject: 'anonymous' as const,
                  entityId: reviewEntityId,
                  operations: ['read' as const],
                  scope: 'all' as const,
                },
              ]
            : []),
          {
            id: ctx.toPolicyId('review_auth_create'),
            subject: 'authenticated',
            entityId: reviewEntityId,
            operations: ['create', 'read'],
            scope: 'all',
          },
          {
            id: ctx.toPolicyId('review_owner_manage'),
            subject: 'authenticated',
            entityId: reviewEntityId,
            operations: ['update', 'delete'],
            scope: 'own',
          },
        ],
      },
      admin: {
        resources: [
          {
            entityId: reviewEntityId,
            columns: [authorFieldId, targetFieldId, ratingFieldId, titleFieldId],
            filterFields: [ratingFieldId],
          },
        ],
      },
    };
  },
};
