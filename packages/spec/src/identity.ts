import { z } from 'zod';

/**
 * Brand helper for nominal/branded types in TypeScript.
 */
export type Brand<K, T> = K & { readonly __brand: T };

export type AppSpecId = Brand<string, 'AppSpecId'>;
export type EntityId = Brand<string, 'EntityId'>;
export type FieldId = Brand<string, 'FieldId'>;
export type ConstraintId = Brand<string, 'ConstraintId'>;
export type PageId = Brand<string, 'PageId'>;
export type LayoutId = Brand<string, 'LayoutId'>;
export type BlockId = Brand<string, 'BlockId'>;
export type RuleId = Brand<string, 'RuleId'>;
export type AssetId = Brand<string, 'AssetId'>;
export type RoleId = Brand<string, 'RoleId'>;
export type MenuId = Brand<string, 'MenuId'>;
export type MenuItemId = Brand<string, 'MenuItemId'>;
export type IntegrationId = Brand<string, 'IntegrationId'>;
export type PolicyId = Brand<string, 'PolicyId'>;

// Zod Schemas for Identifiers and Keys
// IDs are opaque strings; Keys are machine/API friendly identifiers (e.g. kebab-case or camelCase or snake_case)
export const IdentifierSchema = z.string().min(1);
export const KeySchema = z
  .string()
  .min(1)
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'Key must contain only alphanumeric characters, underscores, or hyphens',
  });

export const AppSpecIdSchema = IdentifierSchema as unknown as z.ZodType<AppSpecId>;
export const EntityIdSchema = IdentifierSchema as unknown as z.ZodType<EntityId>;
export const FieldIdSchema = IdentifierSchema as unknown as z.ZodType<FieldId>;
export const ConstraintIdSchema = IdentifierSchema as unknown as z.ZodType<ConstraintId>;
export const PageIdSchema = IdentifierSchema as unknown as z.ZodType<PageId>;
export const LayoutIdSchema = IdentifierSchema as unknown as z.ZodType<LayoutId>;
export const BlockIdSchema = IdentifierSchema as unknown as z.ZodType<BlockId>;
export const RuleIdSchema = IdentifierSchema as unknown as z.ZodType<RuleId>;
export const AssetIdSchema = IdentifierSchema as unknown as z.ZodType<AssetId>;
export const RoleIdSchema = IdentifierSchema as unknown as z.ZodType<RoleId>;
export const MenuIdSchema = IdentifierSchema as unknown as z.ZodType<MenuId>;
export const MenuItemIdSchema = IdentifierSchema as unknown as z.ZodType<MenuItemId>;
export const IntegrationIdSchema = IdentifierSchema as unknown as z.ZodType<IntegrationId>;
export const PolicyIdSchema = IdentifierSchema as unknown as z.ZodType<PolicyId>;

// Helper creators
export const createId = <T extends Brand<string, unknown>>(id: string): T => id as T;
export const toAppSpecId = (id: string): AppSpecId => createId<AppSpecId>(id);
export const toEntityId = (id: string): EntityId => createId<EntityId>(id);
export const toFieldId = (id: string): FieldId => createId<FieldId>(id);
export const toConstraintId = (id: string): ConstraintId => createId<ConstraintId>(id);
export const toPageId = (id: string): PageId => createId<PageId>(id);
export const toLayoutId = (id: string): LayoutId => createId<LayoutId>(id);
export const toBlockId = (id: string): BlockId => createId<BlockId>(id);
export const toRuleId = (id: string): RuleId => createId<RuleId>(id);
export const toAssetId = (id: string): AssetId => createId<AssetId>(id);
export const toRoleId = (id: string): RoleId => createId<RoleId>(id);
export const toMenuId = (id: string): MenuId => createId<MenuId>(id);
export const toMenuItemId = (id: string): MenuItemId => createId<MenuItemId>(id);
export const toIntegrationId = (id: string): IntegrationId => createId<IntegrationId>(id);
export const toPolicyId = (id: string): PolicyId => createId<PolicyId>(id);
