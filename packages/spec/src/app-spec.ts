import { z } from 'zod';
import { AppSpecMetadataSchema, type AppSpecMetadata } from './metadata.js';
import { SettingsSpecSchema, type SettingsSpec } from './settings.js';
import { EntitySpecSchema, type EntitySpec } from './entities.js';
import { AuthSpecSchema, type AuthSpec } from './auth.js';
import { AccessSpecSchema, type AccessSpec } from './access.js';
import { AdminSpecSchema, type AdminSpec } from './admin.js';
import { NavigationSpecSchema, type NavigationSpec } from './navigation.js';
import { LayoutSpecSchema, type LayoutSpec } from './layouts.js';
import { PageSpecSchema, type PageSpec } from './pages.js';
import { RuleSpecSchema, type RuleSpec } from './rules.js';
import { ThemeSpecSchema, type ThemeSpec } from './theme.js';
import { AssetSpecSchema, type AssetSpec } from './assets.js';
import { IntegrationSpecSchema, type IntegrationSpec } from './integrations.js';
import { ProvenanceSpecSchema, type ProvenanceSpec } from './provenance.js';

export const CURRENT_APPSPEC_VERSION = '1.0.0';

export const AppSpecVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/, {
  message: 'schemaVersion must follow semantic versioning format (e.g. 1.0.0)',
});

export const AppSpecSchema: z.ZodType<AppSpec, z.ZodTypeDef, unknown> = z.object({
  schemaVersion: AppSpecVersionSchema.default(CURRENT_APPSPEC_VERSION),
  metadata: AppSpecMetadataSchema,
  settings: SettingsSpecSchema,
  entities: z.array(EntitySpecSchema).default([]),
  auth: AuthSpecSchema.optional(),
  access: AccessSpecSchema.optional(),
  admin: AdminSpecSchema.optional(),
  navigation: NavigationSpecSchema.optional(),
  layouts: z.array(LayoutSpecSchema).default([]),
  pages: z.array(PageSpecSchema).default([]),
  rules: z.array(RuleSpecSchema).default([]),
  theme: ThemeSpecSchema,
  assets: z.array(AssetSpecSchema).default([]),
  integrations: z.array(IntegrationSpecSchema).default([]),
  provenance: ProvenanceSpecSchema.optional(),
});

export type AppSpec = {
  schemaVersion: string;
  metadata: AppSpecMetadata;
  settings: SettingsSpec;
  entities: EntitySpec[];
  auth?: AuthSpec;
  access?: AccessSpec;
  admin?: AdminSpec;
  navigation?: NavigationSpec;
  layouts: LayoutSpec[];
  pages: PageSpec[];
  rules: RuleSpec[];
  theme: ThemeSpec;
  assets: AssetSpec[];
  integrations: IntegrationSpec[];
  provenance?: ProvenanceSpec;
};
