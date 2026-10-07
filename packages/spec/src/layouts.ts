import { z } from 'zod';
import { LayoutIdSchema, KeySchema, type LayoutId } from './identity.js';
import { BlockSpecSchema, type BlockSpec } from './blocks.js';

export const LayoutRegionSchema = z.object({
  name: z.string().min(1),
  blocks: z.array(BlockSpecSchema).default([]),
});

export type LayoutRegion = {
  name: string;
  blocks: BlockSpec[];
};

export const LayoutSpecSchema = z.object({
  id: LayoutIdSchema,
  key: KeySchema,
  label: z.string().min(1),
  regions: z.array(LayoutRegionSchema).min(1),
});

export type LayoutSpec = {
  id: LayoutId;
  key: string;
  label: string;
  regions: LayoutRegion[];
};
