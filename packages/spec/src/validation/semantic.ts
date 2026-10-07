import type { AppSpec } from '../app-spec.js';
import type { BlockSpec } from '../blocks.js';
import type { ActionSpec } from '../actions.js';
import type { DataBinding } from '../bindings.js';

export type ValidationErrorSeverity = 'error' | 'warning';

export type SemanticValidationError = {
  path: string;
  message: string;
  code: string;
};

export type SemanticValidationWarning = {
  path: string;
  message: string;
  code: string;
};

export type SemanticValidationResult = {
  valid: boolean;
  errors: SemanticValidationError[];
  warnings: SemanticValidationWarning[];
};

export function validateAppSpec(spec: AppSpec): SemanticValidationResult {
  const errors: SemanticValidationError[] = [];
  const warnings: SemanticValidationWarning[] = [];

  const addError = (path: string, message: string, code: string) => {
    errors.push({ path, message, code });
  };

  // Maps and Sets for reference tracking
  const allIds = new Map<string, string>(); // ID -> Path where it was declared

  const trackId = (id: string, path: string) => {
    if (allIds.has(id)) {
      addError(
        path,
        `Duplicate ID '${id}' detected. Already defined at '${allIds.get(id)}'.`,
        'DUPLICATE_ID',
      );
    } else {
      allIds.set(id, path);
    }
  };

  // 1. Entities & Fields tracking
  const entityMap = new Map<string, (typeof spec.entities)[number]>();
  const entityKeys = new Set<string>();

  for (let i = 0; i < spec.entities.length; i++) {
    const entity = spec.entities[i]!;
    const entityPath = `entities[${i}]`;
    trackId(entity.id, entityPath);

    if (entityKeys.has(entity.key)) {
      addError(
        `${entityPath}.key`,
        `Duplicate entity key '${entity.key}'. Entity keys must be unique.`,
        'DUPLICATE_ENTITY_KEY',
      );
    } else {
      entityKeys.add(entity.key);
    }

    entityMap.set(entity.id, entity);

    // Track fields within entity
    const fieldKeys = new Set<string>();
    const fieldMap = new Map<string, (typeof entity.fields)[number]>();

    for (let j = 0; j < entity.fields.length; j++) {
      const field = entity.fields[j]!;
      const fieldPath = `${entityPath}.fields[${j}]`;
      trackId(field.id, fieldPath);

      if (fieldKeys.has(field.key)) {
        addError(
          `${fieldPath}.key`,
          `Duplicate field key '${field.key}' in entity '${entity.key}'.`,
          'DUPLICATE_FIELD_KEY',
        );
      } else {
        fieldKeys.add(field.key);
      }

      fieldMap.set(field.id, field);
    }

    // Validate field configurations within entity
    for (let j = 0; j < entity.fields.length; j++) {
      const field = entity.fields[j]!;
      const fieldPath = `${entityPath}.fields[${j}]`;

      if (field.type === 'slug' && field.config?.sourceFieldId) {
        if (field.config.sourceFieldId === field.id) {
          addError(
            `${fieldPath}.config.sourceFieldId`,
            `Slug field '${field.key}' cannot reference itself as sourceFieldId.`,
            'CIRCULAR_SLUG_REFERENCE',
          );
        } else if (!fieldMap.has(field.config.sourceFieldId)) {
          addError(
            `${fieldPath}.config.sourceFieldId`,
            `Slug field '${field.key}' references non-existent source field '${field.config.sourceFieldId}' in entity '${entity.key}'.`,
            'DANGLING_FIELD_REFERENCE',
          );
        }
      }
    }

    // Constraints within entity
    const constraintKeys = new Set<string>();
    if (entity.constraints) {
      for (let k = 0; k < entity.constraints.length; k++) {
        const constraint = entity.constraints[k]!;
        const constraintPath = `${entityPath}.constraints[${k}]`;
        trackId(constraint.id, constraintPath);

        if (constraintKeys.has(constraint.key)) {
          addError(
            `${constraintPath}.key`,
            `Duplicate constraint key '${constraint.key}' in entity '${entity.key}'.`,
            'DUPLICATE_CONSTRAINT_KEY',
          );
        } else {
          constraintKeys.add(constraint.key);
        }

        if (constraint.type === 'unique') {
          if (!fieldMap.has(constraint.fieldId)) {
            addError(
              `${constraintPath}.fieldId`,
              `Unique constraint references non-existent field '${constraint.fieldId}' in entity '${entity.key}'.`,
              'DANGLING_FIELD_REFERENCE',
            );
          }
        } else if (constraint.type === 'compositeUnique') {
          const seenFields = new Set<string>();
          for (let f = 0; f < constraint.fieldIds.length; f++) {
            const fId = constraint.fieldIds[f]!;
            if (!fieldMap.has(fId)) {
              addError(
                `${constraintPath}.fieldIds[${f}]`,
                `Composite unique constraint references non-existent field '${fId}' in entity '${entity.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
            if (seenFields.has(fId)) {
              addError(
                `${constraintPath}.fieldIds[${f}]`,
                `Composite unique constraint has duplicate field '${fId}'.`,
                'DUPLICATE_CONSTRAINT_FIELD',
              );
            }
            seenFields.add(fId);
          }
        }
      }
    }

    // Ownership within entity
    if (entity.ownership) {
      const ownerField = fieldMap.get(entity.ownership.ownerFieldId);
      if (!ownerField) {
        addError(
          `${entityPath}.ownership.ownerFieldId`,
          `Ownership references non-existent field '${entity.ownership.ownerFieldId}' in entity '${entity.key}'.`,
          'INVALID_OWNERSHIP_REFERENCE',
        );
      }
    }
  }

  // 2. Reference fields targetEntity and setNull validation
  for (let i = 0; i < spec.entities.length; i++) {
    const entity = spec.entities[i]!;
    for (let j = 0; j < entity.fields.length; j++) {
      const field = entity.fields[j]!;
      if (field.type === 'reference') {
        if (field.required && field.config?.onDelete === 'setNull') {
          addError(
            `entities[${i}].fields[${j}].config.onDelete`,
            `Reference field '${field.key}' is required and cannot specify onDelete: 'setNull'.`,
            'INVALID_ON_DELETE_SET_NULL',
          );
        }
        const targetEntityId = field.config?.targetEntityId;
        if (targetEntityId && !entityMap.has(targetEntityId)) {
          addError(
            `entities[${i}].fields[${j}].config.targetEntityId`,
            `Reference field '${field.key}' targets non-existent entity '${targetEntityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        }
      }
    }
  }

  // 3. Roles & Auth tracking
  const roleMap = new Map<string, string>();
  const roleKeys = new Set<string>();

  if (spec.auth) {
    if (spec.auth.userEntityId && !entityMap.has(spec.auth.userEntityId)) {
      addError(
        'auth.userEntityId',
        `Auth userEntityId references non-existent entity '${spec.auth.userEntityId}'.`,
        'DANGLING_ENTITY_REFERENCE',
      );
    }

    for (let i = 0; i < spec.auth.roles.length; i++) {
      const role = spec.auth.roles[i]!;
      const rolePath = `auth.roles[${i}]`;
      trackId(role.id, rolePath);

      if (roleKeys.has(role.key)) {
        addError(`${rolePath}.key`, `Duplicate role key '${role.key}'.`, 'DUPLICATE_ROLE_KEY');
      } else {
        roleKeys.add(role.key);
      }

      roleMap.set(role.id, role.key);
    }

    if (!roleMap.has(spec.auth.signup.defaultRoleId)) {
      addError(
        'auth.signup.defaultRoleId',
        `Default signup role '${spec.auth.signup.defaultRoleId}' does not exist in auth.roles.`,
        'DANGLING_ROLE_REFERENCE',
      );
    }
  }

  // 4. Access Policies validation
  if (spec.access) {
    for (let i = 0; i < spec.access.policies.length; i++) {
      const policy = spec.access.policies[i]!;
      const policyPath = `access.policies[${i}]`;
      trackId(policy.id, policyPath);

      const targetEntity = entityMap.get(policy.entityId);
      if (!targetEntity) {
        addError(
          `${policyPath}.entityId`,
          `Policy references non-existent entity '${policy.entityId}'.`,
          'DANGLING_ENTITY_REFERENCE',
        );
      } else if (policy.scope === 'own' && !targetEntity.ownership) {
        addError(
          `${policyPath}.scope`,
          `Policy specifies 'own' scope on entity '${targetEntity.key}' which does not declare ownership.`,
          'INVALID_POLICY_OWNERSHIP',
        );
      }

      if (
        policy.subject !== 'anonymous' &&
        policy.subject !== 'authenticated' &&
        !roleMap.has(policy.subject)
      ) {
        addError(
          `${policyPath}.subject`,
          `Policy subject references non-existent role '${policy.subject}'.`,
          'DANGLING_ROLE_REFERENCE',
        );
      }

      const seenOps = new Set<string>();
      for (let opIdx = 0; opIdx < policy.operations.length; opIdx++) {
        const op = policy.operations[opIdx]!;
        if (seenOps.has(op)) {
          addError(
            `${policyPath}.operations[${opIdx}]`,
            `Access policy contains duplicate operation '${op}'.`,
            'DUPLICATE_OPERATION',
          );
        }
        seenOps.add(op);
      }
    }
  }

  // 5. Assets tracking
  const assetMap = new Map<string, (typeof spec.assets)[number]>();
  const assetKeys = new Set<string>();

  for (let i = 0; i < spec.assets.length; i++) {
    const asset = spec.assets[i]!;
    const assetPath = `assets[${i}]`;
    trackId(asset.id, assetPath);

    if (assetKeys.has(asset.key)) {
      addError(`${assetPath}.key`, `Duplicate asset key '${asset.key}'.`, 'DUPLICATE_ASSET_KEY');
    } else {
      assetKeys.add(asset.key);
    }

    assetMap.set(asset.id, asset);
  }

  // Check asset references in Settings
  if (spec.settings.brand?.logoAssetId && !assetMap.has(spec.settings.brand.logoAssetId)) {
    addError(
      'settings.brand.logoAssetId',
      `Brand logo references non-existent asset '${spec.settings.brand.logoAssetId}'.`,
      'DANGLING_ASSET_REFERENCE',
    );
  }
  if (spec.settings.brand?.faviconAssetId && !assetMap.has(spec.settings.brand.faviconAssetId)) {
    addError(
      'settings.brand.faviconAssetId',
      `Brand favicon references non-existent asset '${spec.settings.brand.faviconAssetId}'.`,
      'DANGLING_ASSET_REFERENCE',
    );
  }
  if (
    spec.settings.defaultSEO?.ogImageAssetId &&
    !assetMap.has(spec.settings.defaultSEO.ogImageAssetId)
  ) {
    addError(
      'settings.defaultSEO.ogImageAssetId',
      `Default SEO ogImage references non-existent asset '${spec.settings.defaultSEO.ogImageAssetId}'.`,
      'DANGLING_ASSET_REFERENCE',
    );
  }

  // 6. Navigation tracking
  const menuMap = new Map<string, NonNullable<typeof spec.navigation>['menus'][number]>();
  const menuKeys = new Set<string>();

  if (spec.navigation) {
    for (let i = 0; i < spec.navigation.menus.length; i++) {
      const menu = spec.navigation.menus[i]!;
      const menuPath = `navigation.menus[${i}]`;
      trackId(menu.id, menuPath);

      if (menuKeys.has(menu.key)) {
        addError(
          `${menuPath}.key`,
          `Duplicate navigation menu key '${menu.key}'.`,
          'DUPLICATE_MENU_KEY',
        );
      } else {
        menuKeys.add(menu.key);
      }

      for (let j = 0; j < menu.items.length; j++) {
        const item = menu.items[j]!;
        const itemPath = `${menuPath}.items[${j}]`;
        trackId(item.id, itemPath);

        if (item.requiredRole && !roleMap.has(item.requiredRole)) {
          addError(
            `${itemPath}.requiredRole`,
            `Navigation item references non-existent role '${item.requiredRole}'.`,
            'DANGLING_ROLE_REFERENCE',
          );
        }
      }

      menuMap.set(menu.id, menu);
    }
  }

  // 7. Layouts tracking
  const layoutMap = new Map<string, (typeof spec.layouts)[number]>();
  const layoutKeys = new Set<string>();

  for (let i = 0; i < spec.layouts.length; i++) {
    const layout = spec.layouts[i]!;
    const layoutPath = `layouts[${i}]`;
    trackId(layout.id, layoutPath);

    if (layoutKeys.has(layout.key)) {
      addError(
        `${layoutPath}.key`,
        `Duplicate layout key '${layout.key}'.`,
        'DUPLICATE_LAYOUT_KEY',
      );
    } else {
      layoutKeys.add(layout.key);
    }

    for (let r = 0; r < layout.regions.length; r++) {
      const region = layout.regions[r]!;
      for (let b = 0; b < region.blocks.length; b++) {
        validateBlock(region.blocks[b]!, `${layoutPath}.regions[${r}].blocks[${b}]`);
      }
    }

    layoutMap.set(layout.id, layout);
  }

  // Helper to recursively validate a block
  function validateBlock(block: BlockSpec, path: string) {
    trackId(block.id, path);

    // Validate block props
    switch (block.type) {
      case 'Navbar': {
        if (block.props.logoAssetId && !assetMap.has(block.props.logoAssetId)) {
          addError(
            `${path}.props.logoAssetId`,
            `Navbar references non-existent logo asset '${block.props.logoAssetId}'.`,
            'DANGLING_ASSET_REFERENCE',
          );
        }
        if (block.props.menuId && !menuMap.has(block.props.menuId)) {
          addError(
            `${path}.props.menuId`,
            `Navbar references non-existent navigation menu '${block.props.menuId}'.`,
            'DANGLING_MENU_REFERENCE',
          );
        }
        break;
      }
      case 'Hero': {
        if (block.props.imageAssetId && !assetMap.has(block.props.imageAssetId)) {
          addError(
            `${path}.props.imageAssetId`,
            `Hero references non-existent image asset '${block.props.imageAssetId}'.`,
            'DANGLING_ASSET_REFERENCE',
          );
        }
        if (block.props.ctaAction) {
          validateAction(block.props.ctaAction, `${path}.props.ctaAction`);
        }
        break;
      }
      case 'Footer': {
        if (block.props.menuId && !menuMap.has(block.props.menuId)) {
          addError(
            `${path}.props.menuId`,
            `Footer references non-existent navigation menu '${block.props.menuId}'.`,
            'DANGLING_MENU_REFERENCE',
          );
        }
        break;
      }
      case 'EntityList': {
        const ent = entityMap.get(block.props.entityId);
        if (!ent) {
          addError(
            `${path}.props.entityId`,
            `EntityList references non-existent entity '${block.props.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else {
          const fieldIds = new Set(ent.fields.map((f) => f.id));
          if (block.props.filterFields) {
            for (const fId of block.props.filterFields) {
              if (!fieldIds.has(fId)) {
                addError(
                  `${path}.props.filterFields`,
                  `EntityList filter field '${fId}' does not exist on entity '${ent.key}'.`,
                  'DANGLING_FIELD_REFERENCE',
                );
              }
            }
          }
          if (block.props.sortField && !fieldIds.has(block.props.sortField)) {
            addError(
              `${path}.props.sortField`,
              `EntityList sort field '${block.props.sortField}' does not exist on entity '${ent.key}'.`,
              'DANGLING_FIELD_REFERENCE',
            );
          }
        }
        if (block.props.itemAction) {
          validateAction(block.props.itemAction, `${path}.props.itemAction`);
        }
        break;
      }
      case 'EntityDetails': {
        const ent = entityMap.get(block.props.entityId);
        if (!ent) {
          addError(
            `${path}.props.entityId`,
            `EntityDetails references non-existent entity '${block.props.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else if (block.props.fields) {
          const fieldIds = new Set(ent.fields.map((f) => f.id));
          for (const fId of block.props.fields) {
            if (!fieldIds.has(fId)) {
              addError(
                `${path}.props.fields`,
                `EntityDetails field '${fId}' does not exist on entity '${ent.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
          }
        }
        break;
      }
      case 'EntityForm': {
        const ent = entityMap.get(block.props.entityId);
        if (!ent) {
          addError(
            `${path}.props.entityId`,
            `EntityForm references non-existent entity '${block.props.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else if (block.props.fields) {
          const fieldIds = new Set(ent.fields.map((f) => f.id));
          for (const fId of block.props.fields) {
            if (!fieldIds.has(fId)) {
              addError(
                `${path}.props.fields`,
                `EntityForm field '${fId}' does not exist on entity '${ent.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
          }
        }
        if (block.props.submitAction) {
          validateAction(block.props.submitAction, `${path}.props.submitAction`);
        }
        break;
      }
      case 'Search': {
        const ent = entityMap.get(block.props.entityId);
        if (!ent) {
          addError(
            `${path}.props.entityId`,
            `Search block references non-existent entity '${block.props.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else {
          const fieldIds = new Set(ent.fields.map((f) => f.id));
          for (const fId of block.props.targetFields) {
            if (!fieldIds.has(fId)) {
              addError(
                `${path}.props.targetFields`,
                `Search block target field '${fId}' does not exist on entity '${ent.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
          }
        }
        break;
      }
      case 'Filter': {
        const ent = entityMap.get(block.props.entityId);
        if (!ent) {
          addError(
            `${path}.props.entityId`,
            `Filter block references non-existent entity '${block.props.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else {
          const fieldIds = new Set(ent.fields.map((f) => f.id));
          for (const fId of block.props.filterFields) {
            if (!fieldIds.has(fId)) {
              addError(
                `${path}.props.filterFields`,
                `Filter block field '${fId}' does not exist on entity '${ent.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
          }
        }
        break;
      }
      case 'Testimonials': {
        for (let t = 0; t < block.props.items.length; t++) {
          const item = block.props.items[t]!;
          if (item.avatarAssetId && !assetMap.has(item.avatarAssetId)) {
            addError(
              `${path}.props.items[${t}].avatarAssetId`,
              `Testimonial avatar references non-existent asset '${item.avatarAssetId}'.`,
              'DANGLING_ASSET_REFERENCE',
            );
          }
        }
        break;
      }
      case 'Gallery': {
        for (let g = 0; g < block.props.assetIds.length; g++) {
          const aId = block.props.assetIds[g]!;
          if (!assetMap.has(aId)) {
            addError(
              `${path}.props.assetIds[${g}]`,
              `Gallery references non-existent asset '${aId}'.`,
              'DANGLING_ASSET_REFERENCE',
            );
          }
        }
        break;
      }
    }

    // Validate bindings on block
    if (block.bindings) {
      for (const [bindingKey, binding] of Object.entries(block.bindings)) {
        validateBinding(binding, `${path}.bindings.${bindingKey}`);
      }
    }

    // Validate actions on block
    if (block.actions) {
      for (let a = 0; a < block.actions.length; a++) {
        validateAction(block.actions[a]!, `${path}.actions[${a}]`);
      }
    }

    // Recursively validate children
    if (block.children) {
      for (let c = 0; c < block.children.length; c++) {
        validateBlock(block.children[c]!, `${path}.children[${c}]`);
      }
    }
  }

  function validateBinding(binding: DataBinding, path: string) {
    if (binding.source === 'entityField') {
      const ent = entityMap.get(binding.entityId);
      if (!ent) {
        addError(
          `${path}.entityId`,
          `Binding references non-existent entity '${binding.entityId}'.`,
          'DANGLING_ENTITY_REFERENCE',
        );
      } else {
        const fieldExists = ent.fields.some((f) => f.id === binding.fieldId);
        if (!fieldExists) {
          addError(
            `${path}.fieldId`,
            `Binding references non-existent field '${binding.fieldId}' on entity '${ent.key}'.`,
            'DANGLING_FIELD_REFERENCE',
          );
        }
      }
    }
  }

  function validateAction(action: ActionSpec, path: string) {
    if (
      action.type === 'CreateRecord' ||
      action.type === 'UpdateRecord' ||
      action.type === 'DeleteRecord'
    ) {
      const targetEnt = entityMap.get(action.entityId);
      if (!targetEnt) {
        addError(
          `${path}.entityId`,
          `Action references non-existent entity '${action.entityId}'.`,
          'DANGLING_ENTITY_REFERENCE',
        );
      } else if ('fields' in action && action.fields) {
        const fieldIds = new Set<string>(targetEnt.fields.map((f) => f.id));
        const fieldKeys = new Set<string>(targetEnt.fields.map((f) => f.key));
        for (const targetField of Object.keys(action.fields)) {
          if (!fieldIds.has(targetField) && !fieldKeys.has(targetField)) {
            addError(
              `${path}.fields.${targetField}`,
              `Action field target '${targetField}' does not exist on entity '${targetEnt.key}'.`,
              'DANGLING_FIELD_REFERENCE',
            );
          }
        }
      }
      if ('recordIdBinding' in action && action.recordIdBinding) {
        validateBinding(action.recordIdBinding, `${path}.recordIdBinding`);
      }
    }
  }

  // 8. Pages tracking
  const pageKeys = new Set<string>();
  const pageRoutes = new Set<string>();

  for (let i = 0; i < spec.pages.length; i++) {
    const page = spec.pages[i]!;
    const pagePath = `pages[${i}]`;
    trackId(page.id, pagePath);

    if (pageKeys.has(page.key)) {
      addError(`${pagePath}.key`, `Duplicate page key '${page.key}'.`, 'DUPLICATE_PAGE_KEY');
    } else {
      pageKeys.add(page.key);
    }

    if (pageRoutes.has(page.route)) {
      addError(
        `${pagePath}.route`,
        `Duplicate page route '${page.route}'. Routes must be unique.`,
        'DUPLICATE_PAGE_ROUTE',
      );
    } else {
      pageRoutes.add(page.route);
    }

    if (page.layoutId && !layoutMap.has(page.layoutId)) {
      addError(
        `${pagePath}.layoutId`,
        `Page '${page.key}' references non-existent layout '${page.layoutId}'.`,
        'DANGLING_LAYOUT_REFERENCE',
      );
    }

    if (page.access?.roles) {
      const seenRoles = new Set<string>();
      for (let r = 0; r < page.access.roles.length; r++) {
        const rId = page.access.roles[r]!;
        if (!roleMap.has(rId)) {
          addError(
            `${pagePath}.access.roles[${r}]`,
            `Page access references non-existent role '${rId}'.`,
            'DANGLING_ROLE_REFERENCE',
          );
        }
        if (seenRoles.has(rId)) {
          addError(
            `${pagePath}.access.roles[${r}]`,
            `Page access contains duplicate role '${rId}'.`,
            'DUPLICATE_ROLE_REFERENCE',
          );
        }
        seenRoles.add(rId);
      }
    }

    if (page.seo?.ogImageAssetId && !assetMap.has(page.seo.ogImageAssetId)) {
      addError(
        `${pagePath}.seo.ogImageAssetId`,
        `Page SEO ogImage references non-existent asset '${page.seo.ogImageAssetId}'.`,
        'DANGLING_ASSET_REFERENCE',
      );
    }

    for (let b = 0; b < page.blocks.length; b++) {
      validateBlock(page.blocks[b]!, `${pagePath}.blocks[${b}]`);
    }
  }

  // Check pageId references in menu items
  if (spec.navigation) {
    for (let i = 0; i < spec.navigation.menus.length; i++) {
      const menu = spec.navigation.menus[i]!;
      for (let j = 0; j < menu.items.length; j++) {
        const item = menu.items[j]!;
        if (item.pageId) {
          const pageExists = spec.pages.some((p) => p.id === item.pageId);
          if (!pageExists) {
            addError(
              `navigation.menus[${i}].items[${j}].pageId`,
              `Navigation item '${item.label}' references non-existent page '${item.pageId}'.`,
              'DANGLING_PAGE_REFERENCE',
            );
          }
        }
      }
    }
  }

  // 9. Rules validation
  const ruleKeys = new Set<string>();

  for (let i = 0; i < spec.rules.length; i++) {
    const rule = spec.rules[i]!;
    const rulePath = `rules[${i}]`;
    trackId(rule.id, rulePath);

    if (ruleKeys.has(rule.key)) {
      addError(`${rulePath}.key`, `Duplicate rule key '${rule.key}'.`, 'DUPLICATE_RULE_KEY');
    } else {
      ruleKeys.add(rule.key);
    }

    switch (rule.kind) {
      case 'capacityLimit': {
        const ent = entityMap.get(rule.entityId);
        if (!ent) {
          addError(
            `${rulePath}.entityId`,
            `Rule references non-existent entity '${rule.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else if (rule.capacityFieldId) {
          const fieldExists = ent.fields.some((f) => f.id === rule.capacityFieldId);
          if (!fieldExists) {
            addError(
              `${rulePath}.capacityFieldId`,
              `Rule capacityFieldId '${rule.capacityFieldId}' does not exist on entity '${ent.key}'.`,
              'DANGLING_FIELD_REFERENCE',
            );
          }
        }
        break;
      }
      case 'statusTransition': {
        const ent = entityMap.get(rule.entityId);
        if (!ent) {
          addError(
            `${rulePath}.entityId`,
            `Rule references non-existent entity '${rule.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else {
          const field = ent.fields.find((f) => f.id === rule.fieldId);
          if (!field) {
            addError(
              `${rulePath}.fieldId`,
              `Rule fieldId '${rule.fieldId}' does not exist on entity '${ent.key}'.`,
              'DANGLING_FIELD_REFERENCE',
            );
          }
        }
        if (rule.allowedRoles) {
          const seenRoles = new Set<string>();
          for (let r = 0; r < rule.allowedRoles.length; r++) {
            const rId = rule.allowedRoles[r]!;
            if (!roleMap.has(rId)) {
              addError(
                `${rulePath}.allowedRoles[${r}]`,
                `Rule references non-existent role '${rId}'.`,
                'DANGLING_ROLE_REFERENCE',
              );
            }
            if (seenRoles.has(rId)) {
              addError(
                `${rulePath}.allowedRoles[${r}]`,
                `Rule allowedRoles contains duplicate role '${rId}'.`,
                'DUPLICATE_ROLE_REFERENCE',
              );
            }
            seenRoles.add(rId);
          }
        }
        break;
      }
      case 'adjustCounter': {
        const targetEnt = entityMap.get(rule.targetEntityId);
        if (!targetEnt) {
          addError(
            `${rulePath}.targetEntityId`,
            `Rule references non-existent target entity '${rule.targetEntityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else {
          const fieldExists = targetEnt.fields.some((f) => f.id === rule.targetFieldId);
          if (!fieldExists) {
            addError(
              `${rulePath}.targetFieldId`,
              `Rule targetFieldId '${rule.targetFieldId}' does not exist on target entity '${targetEnt.key}'.`,
              'DANGLING_FIELD_REFERENCE',
            );
          }
        }
        if (!entityMap.has(rule.triggerEntityId)) {
          addError(
            `${rulePath}.triggerEntityId`,
            `Rule references non-existent trigger entity '${rule.triggerEntityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        }
        break;
      }
      case 'snapshotOnCreate': {
        const sourceEnt = entityMap.get(rule.sourceEntityId);
        const targetEnt = entityMap.get(rule.targetEntityId);
        if (!sourceEnt) {
          addError(
            `${rulePath}.sourceEntityId`,
            `Rule references non-existent source entity '${rule.sourceEntityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        }
        if (!targetEnt) {
          addError(
            `${rulePath}.targetEntityId`,
            `Rule references non-existent target entity '${rule.targetEntityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        }
        if (sourceEnt && targetEnt) {
          for (let m = 0; m < rule.fieldMappings.length; m++) {
            const mapping = rule.fieldMappings[m]!;
            const srcField = sourceEnt.fields.find((f) => f.id === mapping.sourceFieldId);
            const tgtField = targetEnt.fields.find((f) => f.id === mapping.targetFieldId);
            if (!srcField) {
              addError(
                `${rulePath}.fieldMappings[${m}].sourceFieldId`,
                `Snapshot rule source field '${mapping.sourceFieldId}' does not exist on entity '${sourceEnt.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
            if (!tgtField) {
              addError(
                `${rulePath}.fieldMappings[${m}].targetFieldId`,
                `Snapshot rule target field '${mapping.targetFieldId}' does not exist on entity '${targetEnt.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
          }
        }
        break;
      }
      case 'notify': {
        if (!entityMap.has(rule.triggerEntityId)) {
          addError(
            `${rulePath}.triggerEntityId`,
            `Rule references non-existent trigger entity '${rule.triggerEntityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        }
        if (
          rule.recipient !== 'owner' &&
          rule.recipient !== 'admin' &&
          !roleMap.has(rule.recipient)
        ) {
          addError(
            `${rulePath}.recipient`,
            `Notify rule recipient references non-existent role '${rule.recipient}'.`,
            'DANGLING_ROLE_REFERENCE',
          );
        }
        break;
      }
    }
  }

  // 10. Admin resources validation
  if (spec.admin) {
    if (spec.admin.roles) {
      const seenAdminRoles = new Set<string>();
      for (let r = 0; r < spec.admin.roles.length; r++) {
        const rId = spec.admin.roles[r]!;
        if (!roleMap.has(rId)) {
          addError(
            `admin.roles[${r}]`,
            `Admin config references non-existent role '${rId}'.`,
            'DANGLING_ROLE_REFERENCE',
          );
        }
        if (seenAdminRoles.has(rId)) {
          addError(
            `admin.roles[${r}]`,
            `Admin config contains duplicate role '${rId}'.`,
            'DUPLICATE_ROLE_REFERENCE',
          );
        }
        seenAdminRoles.add(rId);
      }
    }

    if (spec.admin.resources) {
      for (let i = 0; i < spec.admin.resources.length; i++) {
        const res = spec.admin.resources[i]!;
        const resPath = `admin.resources[${i}]`;
        const ent = entityMap.get(res.entityId);
        if (!ent) {
          addError(
            `${resPath}.entityId`,
            `Admin resource references non-existent entity '${res.entityId}'.`,
            'DANGLING_ENTITY_REFERENCE',
          );
        } else {
          const fieldIds = new Set(ent.fields.map((f) => f.id));
          for (let c = 0; c < res.columns.length; c++) {
            const col = res.columns[c]!;
            if (!fieldIds.has(col)) {
              addError(
                `${resPath}.columns[${c}]`,
                `Admin resource column '${col}' does not exist on entity '${ent.key}'.`,
                'DANGLING_FIELD_REFERENCE',
              );
            }
          }
          if (res.searchFields) {
            for (let s = 0; s < res.searchFields.length; s++) {
              const sField = res.searchFields[s]!;
              if (!fieldIds.has(sField)) {
                addError(
                  `${resPath}.searchFields[${s}]`,
                  `Admin search field '${sField}' does not exist on entity '${ent.key}'.`,
                  'DANGLING_FIELD_REFERENCE',
                );
              }
            }
          }
          if (res.filterFields) {
            for (let f = 0; f < res.filterFields.length; f++) {
              const fField = res.filterFields[f]!;
              if (!fieldIds.has(fField)) {
                addError(
                  `${resPath}.filterFields[${f}]`,
                  `Admin filter field '${fField}' does not exist on entity '${ent.key}'.`,
                  'DANGLING_FIELD_REFERENCE',
                );
              }
            }
          }
        }
      }
    }
  }

  // 11. Integrations tracking
  const integrationKeys = new Set<string>();
  for (let i = 0; i < spec.integrations.length; i++) {
    const integration = spec.integrations[i]!;
    const integrationPath = `integrations[${i}]`;
    trackId(integration.id, integrationPath);

    if (integrationKeys.has(integration.key)) {
      addError(
        `${integrationPath}.key`,
        `Duplicate integration key '${integration.key}'.`,
        'DUPLICATE_INTEGRATION_KEY',
      );
    } else {
      integrationKeys.add(integration.key);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
