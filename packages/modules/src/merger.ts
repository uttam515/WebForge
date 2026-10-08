import type {
  EntitySpec,
  PageSpec,
  LayoutSpec,
  NavigationSpec,
  AuthSpec,
  AccessSpec,
  AdminSpec,
  RuleSpec,
  ThemeSpec,
  AssetSpec,
  IntegrationSpec,
  ProvenanceSpec,
  AuthMethod,
  RoleSpec,
  AccessPolicy,
  AdminResource,
  RoleId,
} from '@webforge/spec';

import type { SpecFragment } from './types.js';
import { MergeConflictError, MissingTargetError, InvalidExtensionError } from './errors.js';

export interface MergedAppSpecState {
  entities: EntitySpec[];
  pages: PageSpec[];
  layouts: LayoutSpec[];
  navigation?: NavigationSpec;
  auth?: AuthSpec;
  access?: AccessSpec;
  admin?: AdminSpec;
  rules: RuleSpec[];
  theme?: ThemeSpec;
  assets: AssetSpec[];
  integrations: IntegrationSpec[];
  provenance?: ProvenanceSpec;
}

/**
 * Deterministically merges an ordered list of SpecFragments into a cohesive AppSpec structure.
 * Enforces explicit define/extend semantics and rejects silent overwrites or duplicate identities.
 */
export function mergeSpecFragments(
  fragments: SpecFragment[],
  baseOverrides?: Partial<MergedAppSpecState>,
): MergedAppSpecState {
  // Identity maps for conflict detection
  const entityIdMap = new Map<string, EntitySpec>();
  const entityKeyMap = new Map<string, EntitySpec>();

  const pageIdMap = new Map<string, PageSpec>();
  const pageKeyMap = new Map<string, PageSpec>();
  const pageRouteMap = new Map<string, PageSpec>();

  const layoutIdMap = new Map<string, LayoutSpec>();
  const layoutKeyMap = new Map<string, LayoutSpec>();

  const menuIdMap = new Map<string, NavigationSpec['menus'][number]>();
  const menuKeyMap = new Map<string, NavigationSpec['menus'][number]>();

  const ruleIdMap = new Map<string, RuleSpec>();
  const ruleKeyMap = new Map<string, RuleSpec>();

  const assetIdMap = new Map<string, AssetSpec>();
  const assetKeyMap = new Map<string, AssetSpec>();

  const integrationIdMap = new Map<string, IntegrationSpec>();
  const integrationKeyMap = new Map<string, IntegrationSpec>();

  const policyIdMap = new Map<string, AccessPolicy>();
  const roleIdMap = new Map<string, RoleSpec>();
  const roleKeyMap = new Map<string, RoleSpec>();

  const authMethods = new Set<AuthMethod>();
  let signupConfig = baseOverrides?.auth?.signup;

  const adminRoles = new Set<RoleId>();
  const adminResourceMap = new Map<string, AdminResource>();

  let mergedTheme: Partial<ThemeSpec> = baseOverrides?.theme ? { ...baseOverrides.theme } : {};
  let mergedProvenance: ProvenanceSpec = baseOverrides?.provenance
    ? { ...baseOverrides.provenance }
    : {};

  // Initialize base entities if provided
  if (baseOverrides?.entities) {
    for (const ent of baseOverrides.entities) {
      entityIdMap.set(ent.id, {
        ...ent,
        fields: [...ent.fields],
        constraints: ent.constraints ? [...ent.constraints] : [],
      });
      entityKeyMap.set(ent.key, entityIdMap.get(ent.id)!);
    }
  }

  // Iterate over fragments in topological order
  for (const fragment of fragments) {
    // 1. DEFINE: Entities
    if (fragment.entities) {
      for (const ent of fragment.entities) {
        if (entityIdMap.has(ent.id)) {
          throw new MergeConflictError(
            'Entity',
            ent.id,
            `Duplicate entity ID '${ent.id}' defined.`,
          );
        }
        if (entityKeyMap.has(ent.key)) {
          throw new MergeConflictError(
            'Entity',
            ent.key,
            `Duplicate entity key '${ent.key}' defined.`,
          );
        }

        // Check internal field conflicts
        const fldIds = new Set<string>();
        const fldKeys = new Set<string>();
        for (const f of ent.fields) {
          if (fldIds.has(f.id) || fldKeys.has(f.key)) {
            throw new MergeConflictError(
              'Field',
              f.key,
              `Duplicate field ID/key '${f.key}' in entity '${ent.key}'.`,
            );
          }
          fldIds.add(f.id);
          fldKeys.add(f.key);
        }

        const clonedEntity: EntitySpec = {
          ...ent,
          fields: [...ent.fields],
          constraints: ent.constraints ? [...ent.constraints] : [],
        };
        entityIdMap.set(ent.id, clonedEntity);
        entityKeyMap.set(ent.key, clonedEntity);
      }
    }

    // 2. EXTEND: Entity Extensions
    if (fragment.entityExtensions) {
      for (const ext of fragment.entityExtensions) {
        const target =
          (ext.targetEntityId ? entityIdMap.get(ext.targetEntityId) : undefined) ??
          (ext.targetEntityKey ? entityKeyMap.get(ext.targetEntityKey) : undefined);

        if (!target) {
          const identifier = ext.targetEntityId || ext.targetEntityKey || 'unknown';
          throw new MissingTargetError('Entity', identifier);
        }

        if (ext.fields) {
          const existingFieldIds = new Set(target.fields.map((f) => f.id));
          const existingFieldKeys = new Set(target.fields.map((f) => f.key));

          for (const newField of ext.fields) {
            if (existingFieldIds.has(newField.id)) {
              throw new InvalidExtensionError(
                'Entity',
                target.key,
                `Field ID '${newField.id}' already exists.`,
              );
            }
            if (existingFieldKeys.has(newField.key)) {
              throw new InvalidExtensionError(
                'Entity',
                target.key,
                `Field key '${newField.key}' already exists.`,
              );
            }
            existingFieldIds.add(newField.id);
            existingFieldKeys.add(newField.key);
            target.fields.push(newField);
          }
        }

        if (ext.constraints) {
          target.constraints = target.constraints ?? [];
          const existingConstraintIds = new Set(target.constraints.map((c) => c.id));
          const existingConstraintKeys = new Set(target.constraints.map((c) => c.key));

          for (const newConstraint of ext.constraints) {
            if (existingConstraintIds.has(newConstraint.id)) {
              throw new InvalidExtensionError(
                'Entity',
                target.key,
                `Constraint ID '${newConstraint.id}' already exists.`,
              );
            }
            if (existingConstraintKeys.has(newConstraint.key)) {
              throw new InvalidExtensionError(
                'Entity',
                target.key,
                `Constraint key '${newConstraint.key}' already exists.`,
              );
            }
            existingConstraintIds.add(newConstraint.id);
            existingConstraintKeys.add(newConstraint.key);
            target.constraints.push(newConstraint);
          }
        }
      }
    }

    // 3. DEFINE: Pages
    if (fragment.pages) {
      for (const page of fragment.pages) {
        if (pageIdMap.has(page.id)) {
          throw new MergeConflictError('Page', page.id, `Duplicate page ID '${page.id}'.`);
        }
        if (pageKeyMap.has(page.key)) {
          throw new MergeConflictError('Page', page.key, `Duplicate page key '${page.key}'.`);
        }
        if (pageRouteMap.has(page.route)) {
          throw new MergeConflictError('Page', page.route, `Duplicate page route '${page.route}'.`);
        }

        const clonedPage: PageSpec = {
          ...page,
          blocks: [...page.blocks],
        };
        pageIdMap.set(page.id, clonedPage);
        pageKeyMap.set(page.key, clonedPage);
        pageRouteMap.set(page.route, clonedPage);
      }
    }

    // 4. EXTEND: Page Extensions
    if (fragment.pageExtensions) {
      for (const ext of fragment.pageExtensions) {
        const target =
          (ext.targetPageId ? pageIdMap.get(ext.targetPageId) : undefined) ??
          (ext.targetPageKey ? pageKeyMap.get(ext.targetPageKey) : undefined);

        if (!target) {
          const identifier = ext.targetPageId || ext.targetPageKey || 'unknown';
          throw new MissingTargetError('Page', identifier);
        }

        if (ext.blocks) {
          target.blocks.push(...ext.blocks);
        }
      }
    }

    // 5. DEFINE: Layouts
    if (fragment.layouts) {
      for (const layout of fragment.layouts) {
        if (layoutIdMap.has(layout.id)) {
          throw new MergeConflictError('Layout', layout.id, `Duplicate layout ID '${layout.id}'.`);
        }
        if (layoutKeyMap.has(layout.key)) {
          throw new MergeConflictError(
            'Layout',
            layout.key,
            `Duplicate layout key '${layout.key}'.`,
          );
        }

        const clonedLayout: LayoutSpec = {
          ...layout,
          regions: layout.regions.map((r) => ({ ...r, blocks: [...r.blocks] })),
        };
        layoutIdMap.set(layout.id, clonedLayout);
        layoutKeyMap.set(layout.key, clonedLayout);
      }
    }

    // 6. EXTEND: Layout Extensions
    if (fragment.layoutExtensions) {
      for (const ext of fragment.layoutExtensions) {
        const target =
          (ext.targetLayoutId ? layoutIdMap.get(ext.targetLayoutId) : undefined) ??
          (ext.targetLayoutKey ? layoutKeyMap.get(ext.targetLayoutKey) : undefined);

        if (!target) {
          const identifier = ext.targetLayoutId || ext.targetLayoutKey || 'unknown';
          throw new MissingTargetError('Layout', identifier);
        }

        if (ext.regions) {
          for (const regExt of ext.regions) {
            const targetRegion = target.regions.find((r) => r.name === regExt.name);
            if (targetRegion) {
              targetRegion.blocks.push(...regExt.blocks);
            } else {
              target.regions.push({ name: regExt.name, blocks: [...regExt.blocks] });
            }
          }
        }
      }
    }

    // 7. DEFINE & EXTEND: Navigation
    if (fragment.navigation?.menus) {
      for (const menu of fragment.navigation.menus) {
        if (menuIdMap.has(menu.id)) {
          throw new MergeConflictError(
            'NavigationMenu',
            menu.id,
            `Duplicate menu ID '${menu.id}'.`,
          );
        }
        if (menuKeyMap.has(menu.key)) {
          throw new MergeConflictError(
            'NavigationMenu',
            menu.key,
            `Duplicate menu key '${menu.key}'.`,
          );
        }

        const clonedMenu = {
          ...menu,
          items: [...menu.items],
        };
        menuIdMap.set(menu.id, clonedMenu);
        menuKeyMap.set(menu.key, clonedMenu);
      }
    }

    if (fragment.navigationExtensions) {
      for (const ext of fragment.navigationExtensions) {
        const target =
          (ext.targetMenuId ? menuIdMap.get(ext.targetMenuId) : undefined) ??
          (ext.targetMenuKey ? menuKeyMap.get(ext.targetMenuKey) : undefined);

        if (!target) {
          const identifier = ext.targetMenuId || ext.targetMenuKey || 'unknown';
          throw new MissingTargetError('NavigationMenu', identifier);
        }

        if (ext.items) {
          const existingItemIds = new Set(target.items.map((i) => i.id));
          for (const item of ext.items) {
            if (existingItemIds.has(item.id)) {
              throw new InvalidExtensionError(
                'NavigationMenu',
                target.key,
                `Duplicate item ID '${item.id}'.`,
              );
            }
            existingItemIds.add(item.id);
            target.items.push(item);
          }
        }
      }
    }

    // 8. DEFINE & EXTEND: Auth
    if (fragment.auth) {
      if (fragment.auth.methods) {
        for (const m of fragment.auth.methods) {
          authMethods.add(m);
        }
      }
      if (fragment.auth.roles) {
        for (const role of fragment.auth.roles) {
          if (roleIdMap.has(role.id)) {
            throw new MergeConflictError('Role', role.id, `Duplicate role ID '${role.id}'.`);
          }
          if (roleKeyMap.has(role.key)) {
            throw new MergeConflictError('Role', role.key, `Duplicate role key '${role.key}'.`);
          }
          roleIdMap.set(role.id, role);
          roleKeyMap.set(role.key, role);
        }
      }
      if (fragment.auth.signup) {
        signupConfig = fragment.auth.signup;
      }
    }

    if (fragment.authExtensions) {
      if (fragment.authExtensions.methods) {
        for (const m of fragment.authExtensions.methods) {
          authMethods.add(m);
        }
      }
      if (fragment.authExtensions.roles) {
        for (const role of fragment.authExtensions.roles) {
          if (roleIdMap.has(role.id)) {
            throw new InvalidExtensionError(
              'Auth',
              'roles',
              `Role ID '${role.id}' already exists.`,
            );
          }
          if (roleKeyMap.has(role.key)) {
            throw new InvalidExtensionError(
              'Auth',
              'roles',
              `Role key '${role.key}' already exists.`,
            );
          }
          roleIdMap.set(role.id, role);
          roleKeyMap.set(role.key, role);
        }
      }
    }

    // 9. DEFINE: Access Policies
    if (fragment.access?.policies) {
      for (const policy of fragment.access.policies) {
        if (policyIdMap.has(policy.id)) {
          throw new MergeConflictError(
            'AccessPolicy',
            policy.id,
            `Duplicate policy ID '${policy.id}'.`,
          );
        }
        policyIdMap.set(policy.id, policy);
      }
    }

    // 10. DEFINE & EXTEND: Admin
    if (fragment.admin) {
      if (fragment.admin.roles) {
        for (const r of fragment.admin.roles) {
          adminRoles.add(r);
        }
      }
      if (fragment.admin.resources) {
        for (const res of fragment.admin.resources) {
          if (adminResourceMap.has(res.entityId)) {
            throw new MergeConflictError(
              'AdminResource',
              res.entityId,
              `Admin resource for entity '${res.entityId}' already defined.`,
            );
          }
          adminResourceMap.set(res.entityId, { ...res, columns: [...res.columns] });
        }
      }
    }

    if (fragment.adminExtensions) {
      if (fragment.adminExtensions.roles) {
        for (const r of fragment.adminExtensions.roles) {
          adminRoles.add(r);
        }
      }
      if (fragment.adminExtensions.resources) {
        for (const res of fragment.adminExtensions.resources) {
          const existing = adminResourceMap.get(res.entityId);
          if (existing) {
            // Extend existing resource columns without duplicates
            const colSet = new Set(existing.columns);
            for (const col of res.columns) {
              if (!colSet.has(col)) {
                existing.columns.push(col);
                colSet.add(col);
              }
            }
          } else {
            adminResourceMap.set(res.entityId, { ...res, columns: [...res.columns] });
          }
        }
      }
    }

    // 11. DEFINE: Rules
    if (fragment.rules) {
      for (const rule of fragment.rules) {
        if (ruleIdMap.has(rule.id)) {
          throw new MergeConflictError('Rule', rule.id, `Duplicate rule ID '${rule.id}'.`);
        }
        if (ruleKeyMap.has(rule.key)) {
          throw new MergeConflictError('Rule', rule.key, `Duplicate rule key '${rule.key}'.`);
        }
        ruleIdMap.set(rule.id, rule);
        ruleKeyMap.set(rule.key, rule);
      }
    }

    // 12. DEFINE: Assets
    if (fragment.assets) {
      for (const asset of fragment.assets) {
        if (assetIdMap.has(asset.id)) {
          throw new MergeConflictError('Asset', asset.id, `Duplicate asset ID '${asset.id}'.`);
        }
        if (assetKeyMap.has(asset.key)) {
          throw new MergeConflictError('Asset', asset.key, `Duplicate asset key '${asset.key}'.`);
        }
        assetIdMap.set(asset.id, asset);
        assetKeyMap.set(asset.key, asset);
      }
    }

    // 13. DEFINE: Integrations
    if (fragment.integrations) {
      for (const integration of fragment.integrations) {
        if (integrationIdMap.has(integration.id)) {
          throw new MergeConflictError(
            'Integration',
            integration.id,
            `Duplicate integration ID '${integration.id}'.`,
          );
        }
        if (integrationKeyMap.has(integration.key)) {
          throw new MergeConflictError(
            'Integration',
            integration.key,
            `Duplicate integration key '${integration.key}'.`,
          );
        }
        integrationIdMap.set(integration.id, integration);
        integrationKeyMap.set(integration.key, integration);
      }
    }

    // 14. Theme & Provenance
    if (fragment.theme) {
      mergedTheme = { ...mergedTheme, ...fragment.theme };
    }
    if (fragment.provenance) {
      mergedProvenance = { ...mergedProvenance, ...fragment.provenance };
    }
  }

  const entities = Array.from(entityIdMap.values());
  const pages = Array.from(pageIdMap.values());
  const layouts = Array.from(layoutIdMap.values());
  const menus = Array.from(menuIdMap.values());
  const rules = Array.from(ruleIdMap.values());
  const assets = Array.from(assetIdMap.values());
  const integrations = Array.from(integrationIdMap.values());
  const policies = Array.from(policyIdMap.values());
  const roles = Array.from(roleIdMap.values());

  const auth: AuthSpec | undefined =
    authMethods.size > 0 || roles.length > 0 || signupConfig
      ? {
          methods: Array.from(authMethods),
          roles,
          signup: signupConfig ?? { enabled: true, defaultRoleId: roles[0]?.id ?? ('' as RoleId) },
        }
      : undefined;

  const access: AccessSpec | undefined = policies.length > 0 ? { policies } : undefined;

  const admin: AdminSpec | undefined =
    adminResourceMap.size > 0 || adminRoles.size > 0
      ? {
          roles: adminRoles.size > 0 ? Array.from(adminRoles) : undefined,
          resources: Array.from(adminResourceMap.values()),
        }
      : undefined;

  const navigation: NavigationSpec | undefined = menus.length > 0 ? { menus } : undefined;

  return {
    entities,
    pages,
    layouts,
    navigation,
    auth,
    access,
    admin,
    rules,
    theme: Object.keys(mergedTheme).length > 0 ? (mergedTheme as ThemeSpec) : undefined,
    assets,
    integrations,
    provenance: Object.keys(mergedProvenance).length > 0 ? mergedProvenance : undefined,
  };
}
