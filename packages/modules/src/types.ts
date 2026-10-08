import { z } from 'zod';
import type {
  EntitySpec,
  FieldSpec,
  EntityConstraint,
  PageSpec,
  LayoutSpec,
  BlockSpec,
  NavigationSpec,
  NavigationMenuItem,
  AuthSpec,
  AuthMethod,
  RoleSpec,
  AccessSpec,
  AccessPolicy,
  AdminSpec,
  AdminResource,
  RuleSpec,
  ThemeSpec,
  AssetSpec,
  IntegrationSpec,
  ProvenanceSpec,
  EntityId,
  FieldId,
  PageId,
  LayoutId,
  BlockId,
  RuleId,
  RoleId,
  PolicyId,
  AssetId,
  IntegrationId,
  MenuId,
  MenuItemId,
  ConstraintId,
} from '@webforge/spec';

/**
 * Type and schema for parameterless capability modules.
 */
export type EmptyModuleParams = Record<string, never>;
export const emptyModuleParamsSchema: z.ZodType<EmptyModuleParams> = z.object({});

/**
 * Deterministic execution context provided to modules during contribution.
 *
 * Guarantees that:
 * 1. IDs are deterministic and reproducible.
 * 2. Generated IDs are opaque identities — they must be treated as black-box branded strings.
 *    No code should parse them or extract semantic information from them.
 * 3. Cross-module references use `ctx.forModule(moduleId)` rather than hardcoding ID formats.
 */
export interface ModuleContext {
  /** The module identifier */
  readonly moduleId: string;

  /** Returns a scoped ModuleContext for referencing identities allocated by another module */
  forModule(moduleId: string): ModuleContext;

  /** Deterministic ID allocators */
  toEntityId(slotKey: string): EntityId;
  toFieldId(slotKey: string): FieldId;
  toPageId(slotKey: string): PageId;
  toLayoutId(slotKey: string): LayoutId;
  toBlockId(slotKey: string): BlockId;
  toRuleId(slotKey: string): RuleId;
  toRoleId(slotKey: string): RoleId;
  toPolicyId(slotKey: string): PolicyId;
  toAssetId(slotKey: string): AssetId;
  toIntegrationId(slotKey: string): IntegrationId;
  toMenuId(slotKey: string): MenuId;
  toMenuItemId(slotKey: string): MenuItemId;
  toConstraintId(slotKey: string): ConstraintId;
}

/**
 * Extension for an existing entity.
 */
export interface EntityExtension {
  /** Target entity ID or key to extend */
  targetEntityId?: EntityId;
  targetEntityKey?: string;
  /** Additional fields to append */
  fields?: FieldSpec[];
  /** Additional constraints to append */
  constraints?: EntityConstraint[];
}

/**
 * Extension for an existing page.
 */
export interface PageExtension {
  /** Target page ID or key to extend */
  targetPageId?: PageId;
  targetPageKey?: string;
  /** Additional blocks to append */
  blocks?: BlockSpec[];
}

/**
 * Extension for an existing layout.
 */
export interface LayoutExtension {
  /** Target layout ID or key to extend */
  targetLayoutId?: LayoutId;
  targetLayoutKey?: string;
  /** Additional blocks for layout regions */
  regions?: {
    name: string;
    blocks: BlockSpec[];
  }[];
}

/**
 * Extension for an existing navigation menu.
 */
export interface NavigationExtension {
  /** Target menu ID or key to extend */
  targetMenuId?: MenuId;
  targetMenuKey?: string;
  /** Additional items to append to the menu */
  items?: NavigationMenuItem[];
}

/**
 * Extension for auth configuration.
 */
export interface AuthExtension {
  /** Additional auth methods to enable */
  methods?: AuthMethod[];
  /** Additional roles to define */
  roles?: RoleSpec[];
}

/**
 * Extension for admin configuration.
 */
export interface AdminExtension {
  /** Additional roles allowed to access admin */
  roles?: RoleId[];
  /** Additional admin resources */
  resources?: AdminResource[];
}

/**
 * Partial AppSpec fragment produced by a module.
 */
export interface SpecFragment {
  /** New entities defined by this fragment */
  entities?: EntitySpec[];
  /** Extensions to existing entities */
  entityExtensions?: EntityExtension[];

  /** New pages defined by this fragment */
  pages?: PageSpec[];
  /** Extensions to existing pages */
  pageExtensions?: PageExtension[];

  /** New layouts defined by this fragment */
  layouts?: LayoutSpec[];
  /** Extensions to existing layouts */
  layoutExtensions?: LayoutExtension[];

  /** Navigation configuration or new menus */
  navigation?: NavigationSpec;
  /** Extensions to existing navigation menus */
  navigationExtensions?: NavigationExtension[];

  /** Base auth configuration defined by this fragment */
  auth?: Partial<AuthSpec>;
  /** Extensions to existing auth configuration */
  authExtensions?: AuthExtension;

  /** Access policies defined by this fragment */
  access?: AccessSpec | { policies: AccessPolicy[] };

  /** Base admin configuration defined by this fragment */
  admin?: AdminSpec;
  /** Extensions to existing admin configuration */
  adminExtensions?: AdminExtension;

  /** Business rules defined by this fragment */
  rules?: RuleSpec[];

  /** Theme overrides defined by this fragment */
  theme?: Partial<ThemeSpec>;

  /** Assets defined by this fragment */
  assets?: AssetSpec[];

  /** Integrations defined by this fragment */
  integrations?: IntegrationSpec[];

  /** Provenance metadata */
  provenance?: ProvenanceSpec;
}

/**
 * Generic capability module definition.
 * Parameter type P must be explicitly specified (use EmptyModuleParams for parameterless modules).
 */
export interface Module<P> {
  /** Unique module identifier (e.g. 'auth', 'catalog', 'orders') */
  readonly id: string;

  /** Zod schema for validating input parameters */
  readonly params: z.ZodType<P, z.ZodTypeDef, unknown>;

  /** List of module IDs that must be executed before this module */
  readonly requires?: string[];

  /** Generates an AppSpec fragment based on parameters and context */
  contribute(params: P, ctx: ModuleContext): SpecFragment;
}
