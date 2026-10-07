import { z } from 'zod';
import {
  MenuIdSchema,
  MenuItemIdSchema,
  KeySchema,
  PageIdSchema,
  RoleIdSchema,
  type MenuId,
  type MenuItemId,
  type PageId,
  type RoleId,
} from './identity.js';

export const NavigationMenuItemSchema = z.object({
  id: MenuItemIdSchema,
  label: z.string().min(1),
  path: z.string().min(1),
  pageId: PageIdSchema.optional(),
  icon: z.string().optional(),
  requiredRole: RoleIdSchema.optional(),
});

export type NavigationMenuItem = {
  id: MenuItemId;
  label: string;
  path: string;
  pageId?: PageId;
  icon?: string;
  requiredRole?: RoleId;
};

export const NavigationMenuSchema = z.object({
  id: MenuIdSchema,
  key: KeySchema,
  label: z.string().min(1),
  items: z.array(NavigationMenuItemSchema).default([]),
});

export type NavigationMenu = {
  id: MenuId;
  key: string;
  label: string;
  items: NavigationMenuItem[];
};

export const NavigationSpecSchema = z.object({
  menus: z.array(NavigationMenuSchema).default([]),
});

export type NavigationSpec = {
  menus: NavigationMenu[];
};
