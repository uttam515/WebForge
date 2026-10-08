import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  toAppSpecId,
  toEntityId,
  toFieldId,
  type AppSpecMetadata,
  type EntityId,
} from '@webforge/spec';
import {
  ModuleRegistry,
  type Module,
  type EmptyModuleParams,
  emptyModuleParamsSchema,
} from '@webforge/modules';

import {
  compileAppSpec,
  getCompilerVersion,
  DuplicateModuleError,
  ModuleNotFoundError,
  MissingDependencyError,
  CircularDependencyError,
  InvalidModuleParamsError,
  ModuleContributionError,
  MergeConflictError,
  MissingTargetError,
  InvalidExtensionError,
  ModuleCompilationError,
} from './index.js';

const testMetadata: AppSpecMetadata = {
  id: toAppSpecId('app_compiler_test'),
  name: 'Compiler Test Application',
  description: 'Application compiled by compiler foundation tests',
};

describe('@webforge/compiler - Compiler Foundation', () => {
  it('should return the correct compiler target version', () => {
    expect(getCompilerVersion()).toBe('1.0.0');
  });

  it('should compile a single simple module into a canonical AppSpec', () => {
    const registry = new ModuleRegistry();
    const itemModule: Module<{ prefix: string }> = {
      id: 'items',
      params: z.object({ prefix: z.string().default('Item') }),
      contribute: (params, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('item'),
            key: 'item',
            label: `${params.prefix} Model`,
            pluralLabel: `${params.prefix} Models`,
            fields: [
              {
                id: ctx.toFieldId('title'),
                key: 'title',
                label: 'Title',
                type: 'text',
                required: true,
              },
            ],
          },
        ],
        layouts: [
          {
            id: ctx.toLayoutId('default'),
            key: 'default',
            label: 'Default Layout',
            regions: [{ name: 'main', blocks: [] }],
          },
        ],
        pages: [
          {
            id: ctx.toPageId('list'),
            key: 'itemList',
            route: '/items',
            title: 'Items List',
            layoutId: ctx.toLayoutId('default'),
            blocks: [],
          },
        ],
      }),
    };

    registry.register(itemModule);

    const result = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [{ moduleId: 'items', params: { prefix: 'Product' } }],
      },
      registry,
    );

    expect(result.spec).toBeDefined();
    expect(result.spec.schemaVersion).toBe('1.0.0');
    expect(result.spec.metadata.id).toBe('app_compiler_test');
    expect(result.spec.entities.length).toBe(1);
    expect(result.spec.entities[0]!.label).toBe('Product Model');
    expect(result.spec.pages.length).toBe(1);
    expect(result.canonicalJson).toContain('"schemaVersion": "1.0.0"');
  });

  it('should compile multiple independent modules in deterministic order', () => {
    const registry = new ModuleRegistry();

    const authModule: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('user'),
            key: 'user',
            label: 'User',
            pluralLabel: 'Users',
            fields: [{ id: ctx.toFieldId('email'), key: 'email', label: 'Email', type: 'email' }],
          },
        ],
      }),
    };

    const catalogModule: Module<EmptyModuleParams> = {
      id: 'catalog',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('product'),
            key: 'product',
            label: 'Product',
            pluralLabel: 'Products',
            fields: [{ id: ctx.toFieldId('name'), key: 'name', label: 'Name', type: 'text' }],
          },
        ],
      }),
    };

    registry.register(authModule).register(catalogModule);

    const result = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [
          { moduleId: 'catalog', params: {} },
          { moduleId: 'auth', params: {} },
        ],
      },
      registry,
    );

    expect(result.spec.entities.length).toBe(2);
    // Topological + alphabetical ordering: 'auth' before 'catalog'
    expect(result.spec.entities.map((e) => e.key)).toEqual(['user', 'product']);
  });

  it('should automatically resolve transitive module dependencies', () => {
    const registry = new ModuleRegistry();

    const authModule: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('user'),
            key: 'user',
            label: 'User',
            pluralLabel: 'Users',
            fields: [{ id: ctx.toFieldId('email'), key: 'email', label: 'Email', type: 'email' }],
          },
        ],
      }),
    };

    const catalogModule: Module<EmptyModuleParams> = {
      id: 'catalog',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('product'),
            key: 'product',
            label: 'Product',
            pluralLabel: 'Products',
            fields: [{ id: ctx.toFieldId('name'), key: 'name', label: 'Name', type: 'text' }],
          },
        ],
      }),
    };

    const cartModule: Module<EmptyModuleParams> = {
      id: 'cart',
      requires: ['catalog'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('cart_item'),
            key: 'cart_item',
            label: 'Cart Item',
            pluralLabel: 'Cart Items',
            fields: [
              {
                id: ctx.toFieldId('productId'),
                key: 'productId',
                label: 'Product',
                type: 'reference',
                config: {
                  targetEntityId: ctx.forModule('catalog').toEntityId('product'),
                  onDelete: 'cascade',
                },
              },
            ],
          },
        ],
      }),
    };

    const ordersModule: Module<EmptyModuleParams> = {
      id: 'orders',
      requires: ['cart', 'auth'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('order'),
            key: 'order',
            label: 'Order',
            pluralLabel: 'Orders',
            fields: [
              {
                id: ctx.toFieldId('userId'),
                key: 'userId',
                label: 'User',
                type: 'reference',
                config: {
                  targetEntityId: ctx.forModule('auth').toEntityId('user'),
                  onDelete: 'restrict',
                },
              },
            ],
          },
        ],
      }),
    };

    registry
      .register(authModule)
      .register(catalogModule)
      .register(cartModule)
      .register(ordersModule);

    // Caller only explicitly selects 'orders'
    const result = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [{ moduleId: 'orders', params: {} }],
      },
      registry,
    );

    // All transitive dependencies (auth, catalog, cart, orders) are resolved and compiled
    expect(result.spec.entities.length).toBe(4);
    const keys = result.spec.entities.map((e) => e.key);
    expect(keys).toEqual(['user', 'product', 'cart_item', 'order']);
  });

  it('should compile shared dependencies exactly once when required by multiple modules', () => {
    let catalogContributeCount = 0;
    const registry = new ModuleRegistry();

    const catalogModule: Module<EmptyModuleParams> = {
      id: 'catalog',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => {
        catalogContributeCount++;
        return {
          entities: [
            {
              id: ctx.toEntityId('product'),
              key: 'product',
              label: 'Product',
              pluralLabel: 'Products',
              fields: [{ id: ctx.toFieldId('name'), key: 'name', label: 'Name', type: 'text' }],
            },
          ],
        };
      },
    };

    const cartModule: Module<EmptyModuleParams> = {
      id: 'cart',
      requires: ['catalog'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    const reviewsModule: Module<EmptyModuleParams> = {
      id: 'reviews',
      requires: ['catalog'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    registry.register(catalogModule).register(cartModule).register(reviewsModule);

    const result = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [
          { moduleId: 'cart', params: {} },
          { moduleId: 'reviews', params: {} },
        ],
      },
      registry,
    );

    expect(catalogContributeCount).toBe(1);
    expect(result.spec.entities.length).toBe(1);
  });

  it('should produce identical canonical output regardless of selected module input array order', () => {
    const registry = new ModuleRegistry();

    const authModule: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('user'),
            key: 'user',
            label: 'User',
            pluralLabel: 'Users',
            fields: [{ id: ctx.toFieldId('email'), key: 'email', label: 'Email', type: 'email' }],
          },
        ],
      }),
    };

    const catalogModule: Module<EmptyModuleParams> = {
      id: 'catalog',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('product'),
            key: 'product',
            label: 'Product',
            pluralLabel: 'Products',
            fields: [{ id: ctx.toFieldId('name'), key: 'name', label: 'Name', type: 'text' }],
          },
        ],
      }),
    };

    const cartModule: Module<EmptyModuleParams> = {
      id: 'cart',
      requires: ['catalog'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('cart_item'),
            key: 'cart_item',
            label: 'Cart Item',
            pluralLabel: 'Cart Items',
            fields: [{ id: ctx.toFieldId('qty'), key: 'qty', label: 'Qty', type: 'number' }],
          },
        ],
      }),
    };

    registry.register(authModule).register(catalogModule).register(cartModule);

    const orderA = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [
          { moduleId: 'cart', params: {} },
          { moduleId: 'auth', params: {} },
          { moduleId: 'catalog', params: {} },
        ],
      },
      registry,
    );

    const orderB = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [
          { moduleId: 'catalog', params: {} },
          { moduleId: 'cart', params: {} },
          { moduleId: 'auth', params: {} },
        ],
      },
      registry,
    );

    const orderC = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [
          { moduleId: 'auth', params: {} },
          { moduleId: 'catalog', params: {} },
          { moduleId: 'cart', params: {} },
        ],
      },
      registry,
    );

    expect(orderA.canonicalJson).toBe(orderB.canonicalJson);
    expect(orderB.canonicalJson).toBe(orderC.canonicalJson);
  });

  it('should throw InvalidModuleParamsError on invalid module parameters', () => {
    const registry = new ModuleRegistry();
    const typedMod: Module<{ minCount: number }> = {
      id: 'counter',
      params: z.object({ minCount: z.number().int().positive() }),
      contribute: () => ({}),
    };
    registry.register(typedMod);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'counter', params: { minCount: -1 } }],
        },
        registry,
      ),
    ).toThrow(InvalidModuleParamsError);
  });

  it('should throw ModuleNotFoundError when selecting an unknown module ID', () => {
    const registry = new ModuleRegistry();
    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'missing_feature', params: {} }],
        },
        registry,
      ),
    ).toThrow(ModuleNotFoundError);
  });

  it('should throw MissingDependencyError when a module requires a missing dependency', () => {
    const registry = new ModuleRegistry();
    const brokenMod: Module<EmptyModuleParams> = {
      id: 'feature_x',
      requires: ['feature_y'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    registry.register(brokenMod);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'feature_x', params: {} }],
        },
        registry,
      ),
    ).toThrow(MissingDependencyError);
  });

  it('should throw CircularDependencyError on circular module dependencies', () => {
    const registry = new ModuleRegistry();
    const modA: Module<EmptyModuleParams> = {
      id: 'mod_a',
      requires: ['mod_b'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const modB: Module<EmptyModuleParams> = {
      id: 'mod_b',
      requires: ['mod_c'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const modC: Module<EmptyModuleParams> = {
      id: 'mod_c',
      requires: ['mod_a'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    registry.register(modA).register(modB).register(modC);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'mod_a', params: {} }],
        },
        registry,
      ),
    ).toThrow(CircularDependencyError);
  });

  it('should wrap unhandled module contribution exceptions into ModuleContributionError', () => {
    const registry = new ModuleRegistry();
    const failingModule: Module<EmptyModuleParams> = {
      id: 'crash_module',
      params: emptyModuleParamsSchema,
      contribute: () => {
        throw new Error('Unexpected internal contribution crash');
      },
    };
    registry.register(failingModule);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'crash_module', params: {} }],
        },
        registry,
      ),
    ).toThrow(ModuleContributionError);
  });

  it('should throw MergeConflictError when two modules define conflicting entity keys', () => {
    const registry = new ModuleRegistry();
    const modA: Module<EmptyModuleParams> = {
      id: 'mod_a',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('account'),
            key: 'account',
            label: 'Account A',
            pluralLabel: 'Accounts A',
            fields: [{ id: ctx.toFieldId('name'), key: 'name', label: 'Name', type: 'text' }],
          },
        ],
      }),
    };
    const modB: Module<EmptyModuleParams> = {
      id: 'mod_b',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('account'),
            key: 'account', // Conflicting key!
            label: 'Account B',
            pluralLabel: 'Accounts B',
            fields: [{ id: ctx.toFieldId('title'), key: 'title', label: 'Title', type: 'text' }],
          },
        ],
      }),
    };

    registry.register(modA).register(modB);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [
            { moduleId: 'mod_a', params: {} },
            { moduleId: 'mod_b', params: {} },
          ],
        },
        registry,
      ),
    ).toThrow(MergeConflictError);
  });

  it('should extend entities and navigation menus properly without silent overwrites', () => {
    const registry = new ModuleRegistry();

    const baseModule: Module<EmptyModuleParams> = {
      id: 'base_mod',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('profile'),
            key: 'profile',
            label: 'Profile',
            pluralLabel: 'Profiles',
            fields: [{ id: ctx.toFieldId('handle'), key: 'handle', label: 'Handle', type: 'text' }],
          },
        ],
        navigation: {
          menus: [
            {
              id: ctx.toMenuId('main'),
              key: 'main',
              label: 'Main Navigation',
              items: [
                {
                  id: ctx.toMenuItemId('home'),
                  label: 'Home',
                  path: '/',
                },
              ],
            },
          ],
        },
      }),
    };

    const extModule: Module<EmptyModuleParams> = {
      id: 'ext_mod',
      requires: ['base_mod'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entityExtensions: [
          {
            targetEntityKey: 'profile',
            fields: [{ id: ctx.toFieldId('bio'), key: 'bio', label: 'Bio', type: 'textarea' }],
          },
        ],
        navigationExtensions: [
          {
            targetMenuKey: 'main',
            items: [
              {
                id: ctx.toMenuItemId('dashboard'),
                label: 'Dashboard',
                path: '/dashboard',
              },
            ],
          },
        ],
      }),
    };

    registry.register(baseModule).register(extModule);

    const result = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [{ moduleId: 'ext_mod', params: {} }],
      },
      registry,
    );

    expect(result.spec.entities[0]!.fields.length).toBe(2);
    expect(result.spec.entities[0]!.fields.map((f) => f.key)).toEqual(['handle', 'bio']);
    expect(result.spec.navigation?.menus[0]!.items.length).toBe(2);
  });

  it('should throw MissingTargetError when extending a non-existent entity', () => {
    const registry = new ModuleRegistry();
    const badExtMod: Module<EmptyModuleParams> = {
      id: 'bad_ext',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entityExtensions: [
          {
            targetEntityKey: 'missing_entity',
            fields: [{ id: ctx.toFieldId('field'), key: 'f', label: 'F', type: 'text' }],
          },
        ],
      }),
    };
    registry.register(badExtMod);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'bad_ext', params: {} }],
        },
        registry,
      ),
    ).toThrow(MissingTargetError);
  });

  it('should throw InvalidExtensionError when extending an entity with duplicate field key', () => {
    const registry = new ModuleRegistry();
    const baseMod: Module<EmptyModuleParams> = {
      id: 'base_mod',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('customer'),
            key: 'customer',
            label: 'Customer',
            pluralLabel: 'Customers',
            fields: [{ id: ctx.toFieldId('email'), key: 'email', label: 'Email', type: 'email' }],
          },
        ],
      }),
    };
    const dupExtMod: Module<EmptyModuleParams> = {
      id: 'dup_ext',
      requires: ['base_mod'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entityExtensions: [
          {
            targetEntityKey: 'customer',
            fields: [
              {
                id: ctx.toFieldId('email_dup'),
                key: 'email',
                label: 'Duplicate Email',
                type: 'text',
              },
            ],
          },
        ],
      }),
    };

    registry.register(baseMod).register(dupExtMod);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'dup_ext', params: {} }],
        },
        registry,
      ),
    ).toThrow(InvalidExtensionError);
  });

  it('should support typed cross-module identity references via ctx.forModule()', () => {
    const registry = new ModuleRegistry();

    const authMod: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('user'),
            key: 'user',
            label: 'User',
            pluralLabel: 'Users',
            fields: [{ id: ctx.toFieldId('email'), key: 'email', label: 'Email', type: 'email' }],
          },
        ],
      }),
    };

    const notesMod: Module<EmptyModuleParams> = {
      id: 'notes',
      requires: ['auth'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('note'),
            key: 'note',
            label: 'Note',
            pluralLabel: 'Notes',
            fields: [
              {
                id: ctx.toFieldId('authorId'),
                key: 'authorId',
                label: 'Author',
                type: 'reference',
                config: {
                  targetEntityId: ctx.forModule('auth').toEntityId('user'),
                  onDelete: 'restrict',
                },
              },
            ],
          },
        ],
      }),
    };

    registry.register(authMod).register(notesMod);

    const result = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [{ moduleId: 'notes', params: {} }],
      },
      registry,
    );

    const noteEntity = result.spec.entities.find((e) => e.key === 'note')!;
    const authorField = noteEntity.fields.find((f) => f.key === 'authorId')!;
    expect(authorField.config).toBeDefined();
    expect((authorField.config as { targetEntityId: EntityId }).targetEntityId).toBe(
      'ent_auth_user',
    );
  });

  it('should catch semantic validation errors and throw ModuleCompilationError', () => {
    const registry = new ModuleRegistry();

    const brokenReferenceMod: Module<EmptyModuleParams> = {
      id: 'broken_ref',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('orphan'),
            key: 'orphan',
            label: 'Orphan',
            pluralLabel: 'Orphans',
            fields: [
              {
                id: ctx.toFieldId('target'),
                key: 'target',
                label: 'Target',
                type: 'reference',
                config: {
                  targetEntityId: toEntityId('ent_does_not_exist'),
                  onDelete: 'restrict',
                },
              },
            ],
          },
        ],
      }),
    };

    registry.register(brokenReferenceMod);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'broken_ref', params: {} }],
        },
        registry,
      ),
    ).toThrow(ModuleCompilationError);
  });

  it('should guarantee canonical deterministic output across repeated compilations', () => {
    const registry = new ModuleRegistry();

    const authMod: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('user'),
            key: 'user',
            label: 'User',
            pluralLabel: 'Users',
            fields: [
              {
                id: ctx.toFieldId('email'),
                key: 'email',
                label: 'Email',
                type: 'email',
                required: true,
              },
              { id: ctx.toFieldId('name'), key: 'name', label: 'Name', type: 'text' },
            ],
          },
        ],
      }),
    };

    registry.register(authMod);

    const firstRun = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [{ moduleId: 'auth', params: {} }],
      },
      registry,
    );

    for (let i = 0; i < 10; i++) {
      const run = compileAppSpec(
        {
          metadata: testMetadata,
          modules: [{ moduleId: 'auth', params: {} }],
        },
        registry,
      );
      expect(run.canonicalJson).toBe(firstRun.canonicalJson);
    }
  });

  it('should throw DuplicateModuleError when caller specifies duplicate explicit module selections', () => {
    const registry = new ModuleRegistry();
    const authMod: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    registry.register(authMod);

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [
            { moduleId: 'auth', params: {} },
            { moduleId: 'auth', params: {} },
          ],
        },
        registry,
      ),
    ).toThrow(DuplicateModuleError);
  });

  it('should strictly preserve explicit module parameters when required by another module', () => {
    const registry = new ModuleRegistry();

    const authMod: Module<{ roleLabel: string }> = {
      id: 'auth',
      params: z.object({ roleLabel: z.string().default('DefaultRole') }),
      contribute: (params, ctx) => ({
        auth: {
          methods: ['password'],
          roles: [{ id: ctx.toRoleId('user'), key: 'user', label: params.roleLabel }],
        },
      }),
    };

    const blogMod: Module<EmptyModuleParams> = {
      id: 'blog',
      requires: ['auth'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    registry.register(authMod).register(blogMod);

    // Explicitly select auth with custom params alongside blog
    const result = compileAppSpec(
      {
        metadata: testMetadata,
        modules: [
          { moduleId: 'blog', params: {} },
          { moduleId: 'auth', params: { roleLabel: 'CustomAdminRole' } },
        ],
      },
      registry,
    );

    // Ensure explicit parameters were not overwritten by blog's dependency auto-resolution
    expect(result.spec.auth?.roles[0]?.label).toBe('CustomAdminRole');
  });

  it('should enforce AppSpec validation invariants on baseSpec seeds and reject invalid structures', () => {
    const registry = new ModuleRegistry();

    expect(() =>
      compileAppSpec(
        {
          metadata: testMetadata,
          modules: [],
          baseSpec: {
            entities: [
              {
                id: toEntityId('ent_invalid'),
                key: 'invalid_entity',
                label: 'Invalid',
                pluralLabel: 'Invalids',
                fields: [
                  {
                    id: toFieldId('fld_dangling'),
                    key: 'dangling',
                    label: 'Dangling',
                    type: 'reference',
                    config: {
                      targetEntityId: toEntityId('ent_non_existent'),
                      onDelete: 'restrict',
                    },
                  },
                ],
              },
            ],
          },
        },
        registry,
      ),
    ).toThrow(ModuleCompilationError);
  });
});
