import { z } from 'zod';
import {
  PageIdSchema,
  KeySchema,
  LayoutIdSchema,
  RoleIdSchema,
  type PageId,
  type LayoutId,
  type RoleId,
} from './identity.js';
import { SeoSettingsSchema, type SeoSettings } from './settings.js';
import { BlockSpecSchema, type BlockSpec } from './blocks.js';

export const PageAccessSchema = z.object({
  roles: z.array(RoleIdSchema).optional(),
  allowAnonymous: z.boolean().default(true),
});

export type PageAccess = {
  roles?: RoleId[];
  allowAnonymous: boolean;
};

export const PageSpecSchema = z.object({
  id: PageIdSchema,
  key: KeySchema,
  route: z.string().min(1),
  title: z.string().min(1),
  seo: SeoSettingsSchema.optional(),
  access: PageAccessSchema.optional(),
  layoutId: LayoutIdSchema.optional(),
  blocks: z.array(BlockSpecSchema).default([]),
});

export type PageSpec = {
  id: PageId;
  key: string;
  route: string;
  title: string;
  seo?: SeoSettings;
  access?: PageAccess;
  layoutId?: LayoutId;
  blocks: BlockSpec[];
};
