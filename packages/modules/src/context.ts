import {
  toEntityId,
  toFieldId,
  toPageId,
  toLayoutId,
  toBlockId,
  toRuleId,
  toRoleId,
  toPolicyId,
  toAssetId,
  toIntegrationId,
  toMenuId,
  toMenuItemId,
  toConstraintId,
  type EntityId,
  type FieldId,
  type PageId,
  type LayoutId,
  type BlockId,
  type RuleId,
  type RoleId,
  type PolicyId,
  type AssetId,
  type IntegrationId,
  type MenuId,
  type MenuItemId,
  type ConstraintId,
} from '@webforge/spec';
import type { ModuleContext } from './types.js';

/**
 * Standard deterministic ModuleContext implementation.
 *
 * Guarantees that:
 * 1. IDs are 100% deterministic given (moduleId, slotKey).
 * 2. Generated IDs are opaque identities — callers must treat them as black-box branded
 *    strings (e.g., EntityId, FieldId) and never parse the format or rely on prefix conventions.
 * 3. IDs never encode semantic UI labels, so label changes never break identity.
 * 4. IDs never use random values, time, or process-specific state.
 * 5. Cross-module references use `ctx.forModule(dependencyModuleId)` instead of hardcoding raw strings.
 */
export class DefaultModuleContext implements ModuleContext {
  constructor(public readonly moduleId: string) {}

  /**
   * Returns a ModuleContext scoped to another module, enabling typed cross-module identity references.
   */
  forModule(moduleId: string): ModuleContext {
    return new DefaultModuleContext(moduleId);
  }

  private sanitize(slotKey: string): string {
    return slotKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  toEntityId(slotKey: string): EntityId {
    return toEntityId(`ent_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toFieldId(slotKey: string): FieldId {
    return toFieldId(`fld_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toPageId(slotKey: string): PageId {
    return toPageId(`page_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toLayoutId(slotKey: string): LayoutId {
    return toLayoutId(`lay_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toBlockId(slotKey: string): BlockId {
    return toBlockId(`blk_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toRuleId(slotKey: string): RuleId {
    return toRuleId(`rule_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toRoleId(slotKey: string): RoleId {
    return toRoleId(`role_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toPolicyId(slotKey: string): PolicyId {
    return toPolicyId(`pol_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toAssetId(slotKey: string): AssetId {
    return toAssetId(`asset_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toIntegrationId(slotKey: string): IntegrationId {
    return toIntegrationId(`int_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toMenuId(slotKey: string): MenuId {
    return toMenuId(`menu_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toMenuItemId(slotKey: string): MenuItemId {
    return toMenuItemId(`item_${this.moduleId}_${this.sanitize(slotKey)}`);
  }

  toConstraintId(slotKey: string): ConstraintId {
    return toConstraintId(`cst_${this.moduleId}_${this.sanitize(slotKey)}`);
  }
}
