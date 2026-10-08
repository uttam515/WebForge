import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  toAppSpecId,
  toEntityId,
  toFieldId,
  type AppSpecMetadata,
  type EntityId,
  type RoleId,
} from '@webforge/spec';

import {
  ModuleRegistry,
  DefaultModuleContext,
  resolveModuleDependencies,
  mergeSpecFragments,
  composeAppSpec,
  type Module,
  type SpecFragment,
  type EmptyModuleParams,
  emptyModuleParamsSchema,
  DuplicateModuleError,
  MissingDependencyError,
  CircularDependencyError,
  InvalidModuleParamsError,
  MergeConflictError,
  MissingTargetError,
  InvalidExtensionError,
  ModuleCompilationError,
} from './index.js';

const testMetadata: AppSpecMetadata = {
  id: toAppSpecId('app_test_module_system'),
  name: 'Test Application',
  description: 'Application compiled by module system tests',
};

describe('@webforge/modules - Module Registration', () => {
  it('should register and retrieve a capability module with explicit parameter types', () => {
    const registry = new ModuleRegistry();
    const mockModule: Module<{ enabled: boolean }> = {
      id: 'mock_feature',
      params: z.object({ enabled: z.boolean() }),
      contribute: (params, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('item'),
            key: 'item',
            label: 'Item',
            pluralLabel: 'Items',
            fields: [
              {
                id: ctx.toFieldId('name'),
                key: 'name',
                label: 'Name',
                type: 'text',
                required: true,
              },
            ],
          },
        ],
      }),
    };

    registry.register(mockModule);
    expect(registry.has('mock_feature')).toBe(true);
    expect(registry.get<{ enabled: boolean }>('mock_feature')).toBe(mockModule);
  });

  it('should support parameterless modules with EmptyModuleParams and emptyModuleParamsSchema', () => {
    const registry = new ModuleRegistry();
    const parameterlessModule: Module<EmptyModuleParams> = {
      id: 'simple_feature',
      params: emptyModuleParamsSchema,
      contribute: (_params, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('simple_item'),
            key: 'simple_item',
            label: 'Simple Item',
            pluralLabel: 'Simple Items',
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
      }),
    };

    registry.register(parameterlessModule);
    expect(registry.has('simple_feature')).toBe(true);
  });

  it('should throw DuplicateModuleError on duplicate registration', () => {
    const registry = new ModuleRegistry();
    const modA: Module<EmptyModuleParams> = {
      id: 'duplicate_id',
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const modB: Module<EmptyModuleParams> = {
      id: 'duplicate_id',
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    registry.register(modA);
    expect(() => registry.register(modB)).toThrow(DuplicateModuleError);
  });
});

describe('@webforge/modules - Parameter Validation', () => {
  it('should validate module parameters against Zod schema and throw on invalid input', () => {
    const registry = new ModuleRegistry();
    const typedModule: Module<{ maxItems: number; name: string }> = {
      id: 'typed_mod',
      params: z.object({
        maxItems: z.number().int().positive(),
        name: z.string().min(2),
      }),
      contribute: () => ({}),
    };
    registry.register(typedModule);

    expect(() =>
      composeAppSpec({
        metadata: testMetadata,
        registry,
        modules: [
          {
            id: 'typed_mod',
            params: { maxItems: -5, name: 'A' }, // invalid
          },
        ],
      }),
    ).toThrow(InvalidModuleParamsError);
  });
});

describe('@webforge/modules - Dependency Resolution', () => {
  it('should detect missing dependencies and throw MissingDependencyError', () => {
    const moduleA: Module<EmptyModuleParams> = {
      id: 'orders',
      requires: ['auth', 'catalog'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const moduleAuth: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    expect(() =>
      resolveModuleDependencies([
        { module: moduleA, params: {} },
        { module: moduleAuth, params: {} },
        // catalog is missing
      ]),
    ).toThrow(MissingDependencyError);
  });

  it('should detect circular dependencies and throw CircularDependencyError', () => {
    const moduleA: Module<EmptyModuleParams> = {
      id: 'mod_a',
      requires: ['mod_b'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const moduleB: Module<EmptyModuleParams> = {
      id: 'mod_b',
      requires: ['mod_c'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const moduleC: Module<EmptyModuleParams> = {
      id: 'mod_c',
      requires: ['mod_a'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    expect(() =>
      resolveModuleDependencies([
        { module: moduleA, params: {} },
        { module: moduleB, params: {} },
        { module: moduleC, params: {} },
      ]),
    ).toThrow(CircularDependencyError);
  });

  it('should resolve dependencies in deterministic topological order with alphabetical tie-breaking', () => {
    const modAuth: Module<EmptyModuleParams> = {
      id: 'auth',
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const modCatalog: Module<EmptyModuleParams> = {
      id: 'catalog',
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const modCart: Module<EmptyModuleParams> = {
      id: 'cart',
      requires: ['catalog'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const modOrders: Module<EmptyModuleParams> = {
      id: 'orders',
      requires: ['cart', 'auth'],
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };
    const modAnalytics: Module<EmptyModuleParams> = {
      id: 'analytics',
      params: emptyModuleParamsSchema,
      contribute: () => ({}),
    };

    // Input in arbitrary mixed order
    const inputs = [
      { module: modOrders, params: {} },
      { module: modCart, params: {} },
      { module: modAnalytics, params: {} },
      { module: modAuth, params: {} },
      { module: modCatalog, params: {} },
    ];

    const resolved = resolveModuleDependencies(inputs);
    const resolvedIds = resolved.map((r) => r.module.id);

    // Independent modules: 'analytics', 'auth', 'catalog' (sorted alphabetically)
    // 'cart' requires 'catalog' -> must come after 'catalog'
    // 'orders' requires 'cart' & 'auth' -> must come after 'cart' and 'auth'
    expect(resolvedIds).toEqual(['analytics', 'auth', 'catalog', 'cart', 'orders']);
  });
});

describe('@webforge/modules - Explicit Merge Semantics', () => {
  it('should fail explicitly with MergeConflictError when two modules define conflicting entity IDs or keys', () => {
    const fragment1: SpecFragment = {
      entities: [
        {
          id: toEntityId('ent_user'),
          key: 'user',
          label: 'User 1',
          pluralLabel: 'Users 1',
          fields: [{ id: toFieldId('fld_1'), key: 'f1', label: 'F1', type: 'text' }],
        },
      ],
    };
    const fragment2: SpecFragment = {
      entities: [
        {
          id: toEntityId('ent_user_conflict'),
          key: 'user', // Conflicting key!
          label: 'User 2',
          pluralLabel: 'Users 2',
          fields: [{ id: toFieldId('fld_2'), key: 'f2', label: 'F2', type: 'text' }],
        },
      ],
    };

    expect(() => mergeSpecFragments([fragment1, fragment2])).toThrow(MergeConflictError);
  });

  it('should fail explicitly with MissingTargetError when extending a non-existent entity', () => {
    const fragment: SpecFragment = {
      entityExtensions: [
        {
          targetEntityKey: 'non_existent_entity',
          fields: [{ id: toFieldId('fld_avatar'), key: 'avatar', label: 'Avatar', type: 'image' }],
        },
      ],
    };

    expect(() => mergeSpecFragments([fragment])).toThrow(MissingTargetError);
  });

  it('should fail explicitly with InvalidExtensionError when adding duplicate fields to an entity', () => {
    const fragment1: SpecFragment = {
      entities: [
        {
          id: toEntityId('ent_user'),
          key: 'user',
          label: 'User',
          pluralLabel: 'Users',
          fields: [{ id: toFieldId('fld_email'), key: 'email', label: 'Email', type: 'email' }],
        },
      ],
    };
    const fragment2: SpecFragment = {
      entityExtensions: [
        {
          targetEntityKey: 'user',
          fields: [
            {
              id: toFieldId('fld_email_duplicate'),
              key: 'email',
              label: 'Duplicate Email',
              type: 'text',
            },
          ],
        },
      ],
    };

    expect(() => mergeSpecFragments([fragment1, fragment2])).toThrow(InvalidExtensionError);
  });

  it('should successfully extend an entity by appending new fields without overwriting', () => {
    const fragment1: SpecFragment = {
      entities: [
        {
          id: toEntityId('ent_user'),
          key: 'user',
          label: 'User',
          pluralLabel: 'Users',
          fields: [{ id: toFieldId('fld_email'), key: 'email', label: 'Email', type: 'email' }],
        },
      ],
    };
    const fragment2: SpecFragment = {
      entityExtensions: [
        {
          targetEntityKey: 'user',
          fields: [{ id: toFieldId('fld_phone'), key: 'phone', label: 'Phone', type: 'text' }],
        },
      ],
    };

    const merged = mergeSpecFragments([fragment1, fragment2]);
    expect(merged.entities.length).toBe(1);
    expect(merged.entities[0]!.fields.length).toBe(2);
    expect(merged.entities[0]!.fields.map((f) => f.key)).toEqual(['email', 'phone']);
  });
});

describe('@webforge/modules - Determinism, Opaque Identities & Cross-Module References', () => {
  it('should allocate stable, deterministic IDs that never change when labels change', () => {
    const ctx = new DefaultModuleContext('auth');

    const entityId = ctx.toEntityId('user');
    const fieldId = ctx.toFieldId('email');
    const roleId = ctx.toRoleId('admin');

    expect(entityId).toBe('ent_auth_user');
    expect(fieldId).toBe('fld_auth_email');
    expect(roleId).toBe('role_auth_admin');

    // Repeat execution
    const ctx2 = new DefaultModuleContext('auth');
    expect(ctx2.toEntityId('user')).toBe(entityId);
    expect(ctx2.toFieldId('email')).toBe(fieldId);
    expect(ctx2.toRoleId('admin')).toBe(roleId);
  });

  it('should treat generated IDs as opaque branded values without parsing formats', () => {
    const ctx = new DefaultModuleContext('catalog');
    const prodEntityId: EntityId = ctx.toEntityId('product');
    const roleId: RoleId = ctx.toRoleId('manager');

    // IDs are used directly as typed branded references without string manipulation
    expect(typeof prodEntityId).toBe('string');
    expect(typeof roleId).toBe('string');
    expect(prodEntityId.length).toBeGreaterThan(0);
    expect(roleId.length).toBeGreaterThan(0);
  });

  it('should enable typed cross-module identity referencing via ctx.forModule() without hardcoding raw ID strings', () => {
    const ctxReviews = new DefaultModuleContext('reviews');
    const ctxAuth = ctxReviews.forModule('auth');
    const ctxCatalog = ctxReviews.forModule('catalog');

    // reviews module references auth and catalog identities in a typed manner
    const authUserId = ctxAuth.toEntityId('user');
    const catalogProductId = ctxCatalog.toEntityId('product');
    const authAdminRoleId = ctxAuth.toRoleId('admin');

    expect(authUserId).toBe(new DefaultModuleContext('auth').toEntityId('user'));
    expect(catalogProductId).toBe(new DefaultModuleContext('catalog').toEntityId('product'));
    expect(authAdminRoleId).toBe(new DefaultModuleContext('auth').toRoleId('admin'));
  });

  it('should produce identical AppSpec JSON strings for identical inputs across runs', () => {
    const registry = new ModuleRegistry();

    const authModule: Module<{ allowSignup: boolean }> = {
      id: 'auth',
      params: z.object({ allowSignup: z.boolean().default(true) }),
      contribute: (_params, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('user'),
            key: 'user',
            label: 'User Account',
            pluralLabel: 'User Accounts',
            fields: [
              {
                id: ctx.toFieldId('email'),
                key: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
              },
            ],
          },
        ],
        auth: {
          methods: ['password'],
          roles: [
            {
              id: ctx.toRoleId('user'),
              key: 'user',
              label: 'User',
            },
          ],
          signup: {
            defaultRoleId: ctx.toRoleId('user'),
          },
        },
      }),
    };

    const profileModule: Module<EmptyModuleParams> = {
      id: 'profile',
      requires: ['auth'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entityExtensions: [
          {
            targetEntityKey: 'user',
            fields: [
              {
                id: ctx.toFieldId('bio'),
                key: 'bio',
                label: 'Bio',
                type: 'textarea',
              },
            ],
          },
        ],
      }),
    };

    registry.register(authModule).register(profileModule);

    const result1 = composeAppSpec({
      metadata: testMetadata,
      registry,
      modules: [
        { id: 'profile', params: {} },
        { id: 'auth', params: { allowSignup: true } },
      ],
    });

    const result2 = composeAppSpec({
      metadata: testMetadata,
      registry,
      modules: [
        { id: 'auth', params: { allowSignup: true } },
        { id: 'profile', params: {} },
      ],
    });

    expect(result1.canonicalJson).toBe(result2.canonicalJson);
    expect(result1.spec.entities[0]!.fields.length).toBe(2);
  });
});

describe('@webforge/modules - Full AppSpec Structural & Semantic Validation', () => {
  it('should catch semantic validation errors (e.g. dangling entity references) and throw ModuleCompilationError', () => {
    const registry = new ModuleRegistry();
    const brokenModule: Module<EmptyModuleParams> = {
      id: 'broken',
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('post'),
            key: 'post',
            label: 'Post',
            pluralLabel: 'Posts',
            fields: [
              {
                id: ctx.toFieldId('authorId'),
                key: 'authorId',
                label: 'Author',
                type: 'reference',
                config: {
                  targetEntityId: toEntityId('ent_non_existent_author'), // DANGLING!
                  onDelete: 'restrict',
                },
              },
            ],
          },
        ],
      }),
    };

    registry.register(brokenModule);

    expect(() =>
      composeAppSpec({
        metadata: testMetadata,
        registry,
        modules: [{ id: 'broken', params: {} }],
      }),
    ).toThrow(ModuleCompilationError);
  });

  it('should successfully compile a complete multi-module capability composition into a valid AppSpec using ctx.forModule()', () => {
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
            fields: [
              {
                id: ctx.toFieldId('email'),
                key: 'email',
                label: 'Email',
                type: 'email',
                required: true,
              },
            ],
          },
        ],
        auth: {
          methods: ['password'],
          roles: [
            {
              id: ctx.toRoleId('member'),
              key: 'member',
              label: 'Member',
            },
          ],
          signup: {
            defaultRoleId: ctx.toRoleId('member'),
          },
        },
      }),
    };

    const blogModule: Module<EmptyModuleParams> = {
      id: 'blog',
      requires: ['auth'],
      params: emptyModuleParamsSchema,
      contribute: (_, ctx) => ({
        entities: [
          {
            id: ctx.toEntityId('article'),
            key: 'article',
            label: 'Article',
            pluralLabel: 'Articles',
            fields: [
              {
                id: ctx.toFieldId('title'),
                key: 'title',
                label: 'Title',
                type: 'text',
                required: true,
              },
              {
                id: ctx.toFieldId('authorId'),
                key: 'authorId',
                label: 'Author',
                type: 'reference',
                config: {
                  // Referencing auth entity via ctx.forModule('auth') rather than hardcoding raw strings
                  targetEntityId: ctx.forModule('auth').toEntityId('user'),
                  onDelete: 'restrict',
                },
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
            id: ctx.toPageId('blog_home'),
            key: 'blogHome',
            route: '/blog',
            title: 'Blog',
            layoutId: ctx.toLayoutId('default'),
            blocks: [
              {
                id: ctx.toBlockId('list'),
                type: 'EntityList',
                props: {
                  entityId: ctx.toEntityId('article'),
                },
              },
            ],
          },
        ],
      }),
    };

    registry.register(authModule).register(blogModule);

    const result = composeAppSpec({
      metadata: testMetadata,
      registry,
      modules: [
        { id: 'blog', params: {} },
        { id: 'auth', params: {} },
      ],
    });

    expect(result.spec).toBeDefined();
    expect(result.spec.entities.length).toBe(2);
    expect(result.spec.pages.length).toBe(1);
    expect(result.canonicalJson).toContain('"schemaVersion": "1.0.0"');
  });
});
