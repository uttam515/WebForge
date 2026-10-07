import { z } from 'zod';
import { AssetIdSchema, KeySchema, type AssetId } from './identity.js';

export const AssetKindSchema = z.enum(['image', 'document', 'font', 'audio', 'video', 'other']);
export type AssetKind = z.infer<typeof AssetKindSchema>;

export const AssetVisibilitySchema = z.enum(['public', 'owner']);
export type AssetVisibility = z.infer<typeof AssetVisibilitySchema>;

export const AssetSpecSchema = z.object({
  id: AssetIdSchema,
  key: KeySchema,
  kind: AssetKindSchema,
  mimeType: z.string().min(1),
  alt: z.string().optional(),
  visibility: AssetVisibilitySchema.default('public'),
});

export type AssetSpec = {
  id: AssetId;
  key: string;
  kind: AssetKind;
  mimeType: string;
  alt?: string;
  visibility: AssetVisibility;
};
