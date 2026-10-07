import { z } from 'zod';
import { AssetIdSchema, type AssetId } from './identity.js';

export const BrandSettingsSchema = z.object({
  name: z.string().min(1),
  logoAssetId: AssetIdSchema.optional(),
  faviconAssetId: AssetIdSchema.optional(),
  tagline: z.string().optional(),
});

export type BrandSettings = {
  name: string;
  logoAssetId?: AssetId;
  faviconAssetId?: AssetId;
  tagline?: string;
};

export const SeoSettingsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImageAssetId: AssetIdSchema.optional(),
  twitterHandle: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export type SeoSettings = {
  title?: string;
  description?: string;
  ogImageAssetId?: AssetId;
  twitterHandle?: string;
  keywords?: string[];
};

export const SettingsSpecSchema = z.object({
  locale: z.string().min(1).default('en-US'),
  timezone: z.string().min(1).default('UTC'),
  currency: z.string().min(1).default('USD'),
  brand: BrandSettingsSchema.optional(),
  defaultSEO: SeoSettingsSchema.optional(),
});

export type SettingsSpec = {
  locale: string;
  timezone: string;
  currency: string;
  brand?: BrandSettings;
  defaultSEO?: SeoSettings;
};
