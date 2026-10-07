import { describe, it, expect } from 'vitest';
import {
  CURRENT_APPSPEC_VERSION,
  AppSpecSchema,
  parseAppSpec,
  validateAppSpec,
  validateAppSpecFull,
  canonicalizeAppSpec,
  toAppSpecId,
  toEntityId,
  toFieldId,
  toConstraintId,
  toPageId,
  toLayoutId,
  toBlockId,
  toRuleId,
  toRoleId,
  toPolicyId,
  toAssetId,
  type AppSpec,
  ecommerceFixture,
  educationFixture,
  eventManagementFixture,
  bookingFixture,
  jobBoardFixture,
  businessServiceFixture,
} from './index.js';

// Minimal valid base AppSpec for testing mutations
const createMinimalSpec = (): AppSpec => ({
  schemaVersion: CURRENT_APPSPEC_VERSION,
  metadata: {
    id: toAppSpecId('app_test_1'),
    name: 'Test Application',
  },
  settings: {
    locale: 'en-US',
    timezone: 'UTC',
    currency: 'USD',
  },
  entities: [
    {
      id: toEntityId('ent_user'),
      key: 'user',
      label: 'User',
      pluralLabel: 'Users',
      fields: [
        {
          id: toFieldId('fld_user_email'),
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
      constraints: [],
    },
  ],
  layouts: [
    {
      id: toLayoutId('lay_main'),
      key: 'main',
      label: 'Main Layout',
      regions: [
        {
          name: 'header',
          blocks: [],
        },
      ],
    },
  ],
  pages: [
    {
      id: toPageId('page_home'),
      key: 'home',
      route: '/',
      title: 'Home',
      layoutId: toLayoutId('lay_main'),
      blocks: [],
    },
  ],
  rules: [],
  theme: {
    colorModes: 'light',
    colors: {
      primary: '#000000',
      primaryForeground: '#ffffff',
      secondary: '#f0f0f0',
      secondaryForeground: '#000000',
      surface: '#ffffff',
      surfaceForeground: '#000000',
      background: '#ffffff',
      text: '#000000',
      muted: '#888888',
      mutedForeground: '#aaaaaa',
      border: '#cccccc',
      accent: '#0066cc',
      accentForeground: '#ffffff',
      destructive: '#ff0000',
      destructiveForeground: '#ffffff',
    },
    typography: {
      fontFamily: {
        heading: 'Inter',
        body: 'Inter',
      },
    },
  },
  assets: [],
  integrations: [],
});

describe('@webforge/spec - Structural Validation', () => {
  it('should parse a minimal valid AppSpec successfully', () => {
    const spec = createMinimalSpec();
    const parsed = parseAppSpec(spec);
    expect(parsed.metadata.name).toBe('Test Application');
    expect(parsed.schemaVersion).toBe('1.0.0');
  });

  it('should reject invalid field types', () => {
    const spec = createMinimalSpec();
    const entity = spec.entities[0]!;
    // Invalidate field type
    (entity.fields[0] as unknown as Record<string, unknown>)['type'] = 'invalid_custom_price_field';

    const result = AppSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });

  it('should reject invalid block props', () => {
    const spec = createMinimalSpec();
    // Invalidate block props (e.g. Hero block without heading)
    const invalidHeroBlock = {
      id: toBlockId('blk_hero_invalid'),
      type: 'Hero',
      props: {},
    };
    spec.pages[0]!.blocks.push(invalidHeroBlock as unknown as (typeof spec.pages)[0]['blocks'][0]);

    const result = AppSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });

  it('should reject invalid action configurations', () => {
    const spec = createMinimalSpec();
    // Action missing required target or entityId
    const invalidActionBlock = {
      id: toBlockId('blk_hero'),
      type: 'Hero',
      props: {
        heading: 'Welcome',
        ctaAction: {
          type: 'Navigate',
        },
      },
    };
    spec.pages[0]!.blocks.push(
      invalidActionBlock as unknown as (typeof spec.pages)[0]['blocks'][0],
    );

    const result = AppSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });

  it('should reject invalid rule configurations', () => {
    const spec = createMinimalSpec();
    // Rule with invalid kind
    const invalidRule = {
      id: toRuleId('rule_invalid'),
      key: 'bad_rule',
      label: 'Bad Rule',
      kind: 'unsupported_magic_rule',
    };
    spec.rules.push(invalidRule as unknown as (typeof spec.rules)[0]);

    const result = AppSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });
});

describe('@webforge/spec - Semantic Validation', () => {
  it('should detect duplicate entity IDs', () => {
    const spec = createMinimalSpec();
    spec.entities.push({
      id: toEntityId('ent_user'), // duplicate ID
      key: 'user_profile',
      label: 'Profile',
      pluralLabel: 'Profiles',
      fields: [],
      constraints: [],
    });

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_ID')).toBe(true);
  });

  it('should detect duplicate entity keys', () => {
    const spec = createMinimalSpec();
    spec.entities.push({
      id: toEntityId('ent_user_duplicate_key'),
      key: 'user', // duplicate key
      label: 'User Duplicate',
      pluralLabel: 'Users',
      fields: [],
      constraints: [],
    });

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_ENTITY_KEY')).toBe(true);
  });

  it('should detect dangling entity references in reference fields', () => {
    const spec = createMinimalSpec();
    spec.entities[0]!.fields.push({
      id: toFieldId('fld_company_ref'),
      key: 'companyId',
      label: 'Company',
      type: 'reference',
      config: {
        targetEntityId: toEntityId('ent_non_existent_company'),
        onDelete: 'restrict',
      },
    });

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DANGLING_ENTITY_REFERENCE')).toBe(true);
  });

  it('should detect dangling field references in constraints', () => {
    const spec = createMinimalSpec();
    spec.entities[0]!.constraints = [
      {
        id: toConstraintId('cst_missing_field'),
        key: 'unique_non_existent',
        type: 'unique',
        fieldId: toFieldId('fld_non_existent_field'),
      },
    ];

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DANGLING_FIELD_REFERENCE')).toBe(true);
  });

  it('should detect invalid ownership references when owner field does not exist', () => {
    const spec = createMinimalSpec();
    spec.entities[0]!.ownership = {
      ownerFieldId: toFieldId('fld_ghost_owner'),
    };

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_OWNERSHIP_REFERENCE')).toBe(true);
  });

  it('should detect invalid access policy scoping when entity lacks ownership', () => {
    const spec = createMinimalSpec();
    spec.access = {
      policies: [
        {
          id: toPolicyId('pol_own_unsupported'),
          subject: 'authenticated',
          entityId: toEntityId('ent_user'),
          operations: ['read', 'update'],
          scope: 'own', // ent_user has no ownership defined
        },
      ],
    };

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_POLICY_OWNERSHIP')).toBe(true);
  });

  it('should detect dangling asset references in settings', () => {
    const spec = createMinimalSpec();
    spec.settings.brand = {
      name: 'Test Brand',
      logoAssetId: toAssetId('asset_does_not_exist'),
    };

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DANGLING_ASSET_REFERENCE')).toBe(true);
  });

  it('should detect dangling layout references in pages', () => {
    const spec = createMinimalSpec();
    spec.pages[0]!.layoutId = toLayoutId('lay_missing_layout');

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DANGLING_LAYOUT_REFERENCE')).toBe(true);
  });

  it('should detect dangling role references in auth and policies', () => {
    const spec = createMinimalSpec();
    spec.auth = {
      methods: ['password'],
      signup: {
        enabled: true,
        defaultRoleId: toRoleId('role_missing'),
      },
      roles: [
        {
          id: toRoleId('role_user'),
          key: 'user',
          label: 'User',
        },
      ],
    };

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DANGLING_ROLE_REFERENCE')).toBe(true);
  });

  it('should detect invalid onDelete: setNull on required reference fields', () => {
    const spec = createMinimalSpec();
    spec.entities[0]!.fields.push({
      id: toFieldId('fld_company_ref_required'),
      key: 'companyId',
      label: 'Company',
      type: 'reference',
      required: true,
      config: {
        targetEntityId: toEntityId('ent_user'),
        onDelete: 'setNull',
      },
    });

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_ON_DELETE_SET_NULL')).toBe(true);
  });

  it('should detect dangling and circular sourceFieldId in slug fields', () => {
    const spec = createMinimalSpec();
    spec.entities[0]!.fields.push({
      id: toFieldId('fld_slug_dangling'),
      key: 'slugDangling',
      label: 'Slug',
      type: 'slug',
      config: {
        sourceFieldId: toFieldId('fld_non_existent'),
      },
    });

    const result1 = validateAppSpec(spec);
    expect(result1.valid).toBe(false);
    expect(result1.errors.some((e) => e.code === 'DANGLING_FIELD_REFERENCE')).toBe(true);

    // Circular
    spec.entities[0]!.fields[1]!.config = {
      sourceFieldId: toFieldId('fld_slug_dangling'),
    };
    const result2 = validateAppSpec(spec);
    expect(result2.valid).toBe(false);
    expect(result2.errors.some((e) => e.code === 'CIRCULAR_SLUG_REFERENCE')).toBe(true);
  });

  it('should detect dangling field targets in CreateRecord and UpdateRecord actions', () => {
    const spec = createMinimalSpec();
    spec.pages[0]!.blocks.push({
      id: toBlockId('blk_form'),
      type: 'EntityForm',
      props: {
        entityId: toEntityId('ent_user'),
        submitAction: {
          type: 'CreateRecord',
          entityId: toEntityId('ent_user'),
          fields: {
            nonExistentField: {
              source: 'routeParam',
              paramName: 'param1',
            },
          },
        },
      },
    });

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DANGLING_FIELD_REFERENCE')).toBe(true);
  });

  it('should detect dangling and duplicate roles in admin configuration', () => {
    const spec = createMinimalSpec();
    spec.auth = {
      methods: ['password'],
      signup: { defaultRoleId: toRoleId('role_admin') },
      roles: [{ id: toRoleId('role_admin'), key: 'admin', label: 'Admin' }],
    };
    spec.admin = {
      enabled: true,
      roles: [toRoleId('role_admin'), toRoleId('role_admin')], // Duplicate
    };

    const resultDuplicate = validateAppSpec(spec);
    expect(resultDuplicate.valid).toBe(false);
    expect(resultDuplicate.errors.some((e) => e.code === 'DUPLICATE_ROLE_REFERENCE')).toBe(true);

    spec.admin.roles = [toRoleId('role_ghost')]; // Dangling
    const resultDangling = validateAppSpec(spec);
    expect(resultDangling.valid).toBe(false);
    expect(resultDangling.errors.some((e) => e.code === 'DANGLING_ROLE_REFERENCE')).toBe(true);
  });

  it('should detect duplicate operations in access policies', () => {
    const spec = createMinimalSpec();
    spec.access = {
      policies: [
        {
          id: toPolicyId('pol_dup_op'),
          subject: 'authenticated',
          entityId: toEntityId('ent_user'),
          operations: ['read', 'read'],
          scope: 'all',
        },
      ],
    };

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_OPERATION')).toBe(true);
  });

  it('should detect duplicate roles in page access and status transition rules', () => {
    const spec = createMinimalSpec();
    spec.auth = {
      methods: ['password'],
      signup: { defaultRoleId: toRoleId('role_user') },
      roles: [{ id: toRoleId('role_user'), key: 'user', label: 'User' }],
    };
    spec.pages[0]!.access = {
      roles: [toRoleId('role_user'), toRoleId('role_user')],
    };

    const result = validateAppSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_ROLE_REFERENCE')).toBe(true);
  });
});

describe('@webforge/spec - Deterministic Canonical Serialization', () => {
  it('should produce identical serialized strings for equivalent specs with different key orders', () => {
    const spec1: AppSpec = {
      schemaVersion: '1.0.0',
      metadata: { id: toAppSpecId('app_1'), name: 'App 1', description: 'Desc' },
      settings: { locale: 'en-US', timezone: 'UTC', currency: 'USD' },
      entities: [],
      layouts: [],
      pages: [],
      rules: [],
      theme: {
        colorModes: 'light',
        colors: {
          primary: '#000',
          primaryForeground: '#fff',
          secondary: '#eee',
          secondaryForeground: '#000',
          surface: '#fff',
          surfaceForeground: '#000',
          background: '#fff',
          text: '#000',
          muted: '#888',
          mutedForeground: '#aaa',
          border: '#ccc',
          accent: '#06c',
          accentForeground: '#fff',
          destructive: '#f00',
          destructiveForeground: '#fff',
        },
        typography: { fontFamily: { heading: 'Inter', body: 'Inter' } },
      },
      assets: [],
      integrations: [],
    };

    const spec2: AppSpec = {
      integrations: [],
      assets: [],
      theme: {
        typography: { fontFamily: { body: 'Inter', heading: 'Inter' } },
        colorModes: 'light',
        colors: {
          destructiveForeground: '#fff',
          destructive: '#f00',
          accentForeground: '#fff',
          accent: '#06c',
          border: '#ccc',
          mutedForeground: '#aaa',
          muted: '#888',
          text: '#000',
          background: '#fff',
          surfaceForeground: '#000',
          surface: '#fff',
          secondaryForeground: '#000',
          secondary: '#eee',
          primaryForeground: '#fff',
          primary: '#000',
        },
      },
      rules: [],
      pages: [],
      layouts: [],
      entities: [],
      settings: { currency: 'USD', timezone: 'UTC', locale: 'en-US' },
      metadata: { description: 'Desc', name: 'App 1', id: toAppSpecId('app_1') },
      schemaVersion: '1.0.0',
    };

    const serialized1 = canonicalizeAppSpec(spec1);
    const serialized2 = canonicalizeAppSpec(spec2);

    expect(serialized1).toBe(serialized2);
  });
});

describe('@webforge/spec - Six Golden Application Fixtures', () => {
  it('1. E-Commerce fixture should be structurally and semantically valid', () => {
    const result = validateAppSpecFull(ecommerceFixture);
    expect(result.valid).toBe(true);
    expect(result.spec?.entities.length).toBe(8);
  });

  it('2. Education / EdTech fixture should be structurally and semantically valid', () => {
    const result = validateAppSpecFull(educationFixture);
    if (!result.valid) {
      console.error('Education errors:', result.structuralErrors, result.semanticErrors);
    }
    expect(result.valid).toBe(true);
    expect(result.spec?.entities.length).toBe(7);
  });

  it('3. Event Management fixture should be structurally and semantically valid', () => {
    const result = validateAppSpecFull(eventManagementFixture);
    if (!result.valid) {
      console.error('Event Management errors:', result.structuralErrors, result.semanticErrors);
    }
    expect(result.valid).toBe(true);
    expect(result.spec?.entities.length).toBe(6);
  });

  it('4. Booking / Appointments fixture should be structurally and semantically valid', () => {
    const result = validateAppSpecFull(bookingFixture);
    if (!result.valid) {
      console.error('Booking errors:', result.structuralErrors, result.semanticErrors);
    }
    expect(result.valid).toBe(true);
    expect(result.spec?.entities.length).toBe(6);
  });

  it('5. Job Board / Recruitment fixture should be structurally and semantically valid', () => {
    const result = validateAppSpecFull(jobBoardFixture);
    if (!result.valid) {
      console.error('Job Board errors:', result.structuralErrors, result.semanticErrors);
    }
    expect(result.valid).toBe(true);
    expect(result.spec?.entities.length).toBe(6);
  });

  it('6. Business / Service Website fixture should be structurally and semantically valid', () => {
    const result = validateAppSpecFull(businessServiceFixture);
    if (!result.valid) {
      console.error('Business Service errors:', result.structuralErrors, result.semanticErrors);
    }
    expect(result.valid).toBe(true);
    expect(result.spec?.entities.length).toBe(5);
    // Verify non-persisted ContactSubmission entity exists
    const contactEntity = result.spec?.entities.find((e) => e.key === 'contactSubmission');
    expect(contactEntity).toBeDefined();
    expect(contactEntity?.persist).toBe(false);
  });
});
