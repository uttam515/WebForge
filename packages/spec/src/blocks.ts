import { z } from 'zod';
import {
  BlockIdSchema,
  EntityIdSchema,
  FieldIdSchema,
  AssetIdSchema,
  MenuIdSchema,
  type BlockId,
  type EntityId,
  type FieldId,
  type AssetId,
  type MenuId,
} from './identity.js';
import { DataBindingSchema, type DataBinding } from './bindings.js';
import { ActionSpecSchema, type ActionSpec } from './actions.js';

// Block Props Schemas
export const NavbarBlockPropsSchema = z.object({
  brandTitle: z.string().optional(),
  logoAssetId: AssetIdSchema.optional(),
  menuId: MenuIdSchema.optional(),
});
export type NavbarBlockProps = {
  brandTitle?: string;
  logoAssetId?: AssetId;
  menuId?: MenuId;
};

export const HeroBlockPropsSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaAction: ActionSpecSchema.optional(),
  imageAssetId: AssetIdSchema.optional(),
});
export type HeroBlockProps = {
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaAction?: ActionSpec;
  imageAssetId?: AssetId;
};

export const FooterBlockPropsSchema = z.object({
  copyrightText: z.string().optional(),
  menuId: MenuIdSchema.optional(),
});
export type FooterBlockProps = {
  copyrightText?: string;
  menuId?: MenuId;
};

export const EntityListBlockPropsSchema = z.object({
  entityId: EntityIdSchema,
  view: z.enum(['grid', 'table', 'cards']).default('grid'),
  pageSize: z.number().int().positive().optional(),
  filterFields: z.array(FieldIdSchema).optional(),
  sortField: FieldIdSchema.optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  itemAction: ActionSpecSchema.optional(),
});
export type EntityListBlockProps = {
  entityId: EntityId;
  view?: 'grid' | 'table' | 'cards';
  pageSize?: number;
  filterFields?: FieldId[];
  sortField?: FieldId;
  sortDirection?: 'asc' | 'desc';
  itemAction?: ActionSpec;
};

export const EntityDetailsBlockPropsSchema = z.object({
  entityId: EntityIdSchema,
  fields: z.array(FieldIdSchema).optional(),
});
export type EntityDetailsBlockProps = {
  entityId: EntityId;
  fields?: FieldId[];
};

export const EntityFormBlockPropsSchema = z.object({
  entityId: EntityIdSchema,
  mode: z.enum(['create', 'update']).default('create'),
  fields: z.array(FieldIdSchema).optional(),
  submitAction: ActionSpecSchema.optional(),
});
export type EntityFormBlockProps = {
  entityId: EntityId;
  mode?: 'create' | 'update';
  fields?: FieldId[];
  submitAction?: ActionSpec;
};

export const SearchBlockPropsSchema = z.object({
  entityId: EntityIdSchema,
  targetFields: z.array(FieldIdSchema).min(1),
  placeholder: z.string().optional(),
});
export type SearchBlockProps = {
  entityId: EntityId;
  targetFields: FieldId[];
  placeholder?: string;
};

export const FilterBlockPropsSchema = z.object({
  entityId: EntityIdSchema,
  filterFields: z.array(FieldIdSchema).min(1),
});
export type FilterBlockProps = {
  entityId: EntityId;
  filterFields: FieldId[];
};

export const TestimonialItemSchema = z.object({
  quote: z.string().min(1),
  author: z.string().min(1),
  role: z.string().optional(),
  avatarAssetId: AssetIdSchema.optional(),
});
export type TestimonialItem = {
  quote: string;
  author: string;
  role?: string;
  avatarAssetId?: AssetId;
};

export const TestimonialsBlockPropsSchema = z.object({
  items: z.array(TestimonialItemSchema).min(1),
});
export type TestimonialsBlockProps = {
  items: TestimonialItem[];
};

export const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});
export type FaqItem = {
  question: string;
  answer: string;
};

export const FaqBlockPropsSchema = z.object({
  items: z.array(FaqItemSchema).min(1),
});
export type FaqBlockProps = {
  items: FaqItem[];
};

export const GalleryBlockPropsSchema = z.object({
  assetIds: z.array(AssetIdSchema).min(1),
  columns: z.number().int().positive().optional(),
});
export type GalleryBlockProps = {
  assetIds: AssetId[];
  columns?: number;
};

export const ContainerBlockPropsSchema = z.object({
  layout: z.enum(['stack', 'grid', 'flex']).default('stack'),
  gap: z.string().optional(),
});
export type ContainerBlockProps = {
  layout?: 'stack' | 'grid' | 'flex';
  gap?: string;
};

// Base Block type and recursive definition
export type NavbarBlock = {
  id: BlockId;
  type: 'Navbar';
  props: NavbarBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type HeroBlock = {
  id: BlockId;
  type: 'Hero';
  props: HeroBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type FooterBlock = {
  id: BlockId;
  type: 'Footer';
  props: FooterBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type EntityListBlock = {
  id: BlockId;
  type: 'EntityList';
  props: EntityListBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type EntityDetailsBlock = {
  id: BlockId;
  type: 'EntityDetails';
  props: EntityDetailsBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type EntityFormBlock = {
  id: BlockId;
  type: 'EntityForm';
  props: EntityFormBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type SearchBlock = {
  id: BlockId;
  type: 'Search';
  props: SearchBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type FilterBlock = {
  id: BlockId;
  type: 'Filter';
  props: FilterBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type TestimonialsBlock = {
  id: BlockId;
  type: 'Testimonials';
  props: TestimonialsBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type FaqBlock = {
  id: BlockId;
  type: 'FAQ';
  props: FaqBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type GalleryBlock = {
  id: BlockId;
  type: 'Gallery';
  props: GalleryBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type ContainerBlock = {
  id: BlockId;
  type: 'Container';
  props: ContainerBlockProps;
  bindings?: Record<string, DataBinding>;
  actions?: ActionSpec[];
  children?: BlockSpec[];
};

export type BlockSpec =
  | NavbarBlock
  | HeroBlock
  | FooterBlock
  | EntityListBlock
  | EntityDetailsBlock
  | EntityFormBlock
  | SearchBlock
  | FilterBlock
  | TestimonialsBlock
  | FaqBlock
  | GalleryBlock
  | ContainerBlock;

export type BlockType = BlockSpec['type'];

const BaseBlockSchemaFields = {
  id: BlockIdSchema,
  bindings: z.record(DataBindingSchema).optional(),
  actions: z.array(ActionSpecSchema).optional(),
};

export const BlockSpecSchema: z.ZodType<BlockSpec> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Navbar'),
      props: NavbarBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Hero'),
      props: HeroBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Footer'),
      props: FooterBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('EntityList'),
      props: EntityListBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('EntityDetails'),
      props: EntityDetailsBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('EntityForm'),
      props: EntityFormBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Search'),
      props: SearchBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Filter'),
      props: FilterBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Testimonials'),
      props: TestimonialsBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('FAQ'),
      props: FaqBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Gallery'),
      props: GalleryBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
    z.object({
      ...BaseBlockSchemaFields,
      type: z.literal('Container'),
      props: ContainerBlockPropsSchema,
      children: z.array(BlockSpecSchema).optional(),
    }),
  ]),
);
