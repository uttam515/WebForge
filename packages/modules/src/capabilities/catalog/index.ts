import { z } from 'zod';
import type { EntitySpec, FieldSpec, AdminResource, AccessPolicy } from '@webforge/spec';
import type { Module, ModuleContext, SpecFragment } from '../../types.js';

export interface CatalogModuleParams {
  enableCategories?: boolean;
  enablePricing?: boolean;
  enableImages?: boolean;
  itemEntityKey?: string;
  itemLabel?: string;
  itemPluralLabel?: string;
}

export const catalogModuleParamsSchema = z.object({
  enableCategories: z.boolean().default(true),
  enablePricing: z.boolean().default(true),
  enableImages: z.boolean().default(true),
  itemEntityKey: z.string().default('item'),
  itemLabel: z.string().default('Catalog Item'),
  itemPluralLabel: z.string().default('Catalog Items'),
});

/**
 * Catalog capability module.
 * Provides generic item and category listing schemas suitable for products, services, or content.
 */
export const catalogModule: Module<CatalogModuleParams> = {
  id: 'catalog',
  params: catalogModuleParamsSchema,
  contribute: (params: CatalogModuleParams, ctx: ModuleContext): SpecFragment => {
    const enableCategories = params.enableCategories ?? true;
    const enablePricing = params.enablePricing ?? true;
    const enableImages = params.enableImages ?? true;

    const itemEntityId = ctx.toEntityId('item');
    const categoryEntityId = ctx.toEntityId('category');

    const itemNameFieldId = ctx.toFieldId('name');
    const itemSlugFieldId = ctx.toFieldId('slug');
    const itemDescFieldId = ctx.toFieldId('description');
    const itemActiveFieldId = ctx.toFieldId('active');
    const itemPriceFieldId = ctx.toFieldId('price');
    const itemImageFieldId = ctx.toFieldId('image');
    const itemCatFieldId = ctx.toFieldId('categoryId');

    const catNameFieldId = ctx.toFieldId('category_name');
    const catSlugFieldId = ctx.toFieldId('category_slug');
    const catDescFieldId = ctx.toFieldId('category_desc');

    const entities: EntitySpec[] = [];
    const accessPolicies: AccessPolicy[] = [];
    const adminResources: AdminResource[] = [];

    // Category entity
    if (enableCategories) {
      entities.push({
        id: categoryEntityId,
        key: 'category',
        label: 'Category',
        pluralLabel: 'Categories',
        fields: [
          {
            id: catNameFieldId,
            key: 'name',
            label: 'Category Name',
            type: 'text',
            required: true,
            queryCapabilities: {
              searchable: true,
              sortable: true,
            },
          },
          {
            id: catSlugFieldId,
            key: 'slug',
            label: 'Slug',
            type: 'slug',
            required: true,
            config: {
              sourceFieldId: catNameFieldId,
            },
            queryCapabilities: {
              searchable: true,
              filterable: true,
            },
          },
          {
            id: catDescFieldId,
            key: 'description',
            label: 'Description',
            type: 'textarea',
            required: false,
          },
        ],
        constraints: [
          {
            id: ctx.toConstraintId('unique_cat_slug'),
            key: 'unique_cat_slug',
            label: 'Unique category slug',
            type: 'unique',
            fieldId: catSlugFieldId,
          },
        ],
      });

      accessPolicies.push({
        id: ctx.toPolicyId('category_public_read'),
        subject: 'anonymous',
        entityId: categoryEntityId,
        operations: ['read'],
        scope: 'public',
      });

      adminResources.push({
        entityId: categoryEntityId,
        columns: [catNameFieldId, catSlugFieldId],
        searchFields: [catNameFieldId],
      });
    }

    // Item entity
    const itemFields: FieldSpec[] = [
      {
        id: itemNameFieldId,
        key: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        queryCapabilities: {
          searchable: true,
          filterable: true,
          sortable: true,
        },
      },
      {
        id: itemSlugFieldId,
        key: 'slug',
        label: 'Slug',
        type: 'slug',
        required: true,
        config: {
          sourceFieldId: itemNameFieldId,
        },
        queryCapabilities: {
          searchable: true,
          filterable: true,
        },
      },
      {
        id: itemDescFieldId,
        key: 'description',
        label: 'Description',
        type: 'richText',
        required: false,
      },
      {
        id: itemActiveFieldId,
        key: 'active',
        label: 'Active',
        type: 'boolean',
        required: false,
        config: {
          defaultValue: true,
        },
        queryCapabilities: {
          filterable: true,
        },
      },
    ];

    if (enablePricing) {
      itemFields.push({
        id: itemPriceFieldId,
        key: 'price',
        label: 'Price',
        type: 'money',
        required: false,
        queryCapabilities: {
          filterable: true,
          sortable: true,
        },
      });
    }

    if (enableImages) {
      itemFields.push({
        id: itemImageFieldId,
        key: 'image',
        label: 'Image',
        type: 'image',
        required: false,
      });
    }

    if (enableCategories) {
      itemFields.push({
        id: itemCatFieldId,
        key: 'categoryId',
        label: 'Category',
        type: 'reference',
        required: false,
        config: {
          targetEntityId: categoryEntityId,
          onDelete: 'setNull',
        },
        queryCapabilities: {
          filterable: true,
        },
      });
    }

    entities.push({
      id: itemEntityId,
      key: params.itemEntityKey ?? 'item',
      label: params.itemLabel ?? 'Catalog Item',
      pluralLabel: params.itemPluralLabel ?? 'Catalog Items',
      fields: itemFields,
      constraints: [
        {
          id: ctx.toConstraintId('unique_item_slug'),
          key: 'unique_item_slug',
          label: 'Unique item slug',
          type: 'unique',
          fieldId: itemSlugFieldId,
        },
      ],
    });

    accessPolicies.push({
      id: ctx.toPolicyId('item_public_read'),
      subject: 'anonymous',
      entityId: itemEntityId,
      operations: ['read'],
      scope: 'public',
    });

    const adminItemCols = [itemNameFieldId];
    if (enablePricing) {
      adminItemCols.push(itemPriceFieldId);
    }
    adminItemCols.push(itemActiveFieldId);

    adminResources.push({
      entityId: itemEntityId,
      columns: adminItemCols,
      searchFields: [itemNameFieldId],
      filterFields: [itemActiveFieldId],
    });

    return {
      entities,
      access: {
        policies: accessPolicies,
      },
      admin: {
        resources: adminResources,
      },
    };
  },
};
