import { z } from 'zod';
import {
  FieldIdSchema,
  KeySchema,
  EntityIdSchema,
  type FieldId,
  type EntityId,
} from './identity.js';

export const QueryCapabilitiesSchema = z.object({
  searchable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  sortable: z.boolean().optional(),
});

export type QueryCapabilities = {
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
};

// Base field properties shared by all field types
const BaseFieldProps = {
  id: FieldIdSchema,
  key: KeySchema,
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().default(false),
  hidden: z.boolean().default(false),
  queryCapabilities: QueryCapabilitiesSchema.optional(),
  queryable: QueryCapabilitiesSchema.optional(),
};

// 1. Text
export const TextFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('text'),
  config: z
    .object({
      format: z.enum(['plain', 'phone', 'postal']).optional(),
      defaultValue: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      minLength: z.number().int().nonnegative().optional(),
      maxLength: z.number().int().positive().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

// 2. Textarea
export const TextareaFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('textarea'),
  config: z
    .object({
      rows: z.number().int().positive().optional(),
      defaultValue: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      minLength: z.number().int().nonnegative().optional(),
      maxLength: z.number().int().positive().optional(),
    })
    .optional(),
});

// 3. RichText
export const RichTextFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('richText'),
  config: z
    .object({
      features: z.array(z.string()).optional(),
      defaultValue: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      maxLength: z.number().int().positive().optional(),
    })
    .optional(),
});

// 4. Number
export const NumberFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('number'),
  config: z
    .object({
      integer: z.boolean().optional(),
      decimals: z.number().int().nonnegative().optional(),
      unit: z.string().optional(),
      defaultValue: z.number().optional(),
    })
    .optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      multipleOf: z.number().positive().optional(),
    })
    .optional(),
});

// 5. Money
export const MoneyFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('money'),
  config: z
    .object({
      currencyCode: z.string().min(1).optional(),
      defaultValue: z.number().optional(),
    })
    .optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

// 6. Boolean
export const BooleanFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('boolean'),
  config: z
    .object({
      defaultValue: z.boolean().optional(),
    })
    .optional(),
  validation: z.object({}).optional(),
});

// 7. Email
export const EmailFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('email'),
  config: z
    .object({
      defaultValue: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      allowedDomains: z.array(z.string()).optional(),
    })
    .optional(),
});

// 8. URL
export const UrlFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('url'),
  config: z
    .object({
      defaultValue: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      allowedProtocols: z.array(z.string()).optional(),
    })
    .optional(),
});

// 9. Slug
export const SlugFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('slug'),
  config: z
    .object({
      sourceFieldId: FieldIdSchema.optional(),
    })
    .optional(),
  validation: z
    .object({
      maxLength: z.number().int().positive().optional(),
    })
    .optional(),
});

// 10. Date
export const DateFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('date'),
  config: z
    .object({
      format: z.string().optional(),
      defaultValue: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    })
    .optional(),
});

// 11. DateTime
export const DateTimeFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('datetime'),
  config: z
    .object({
      format: z.string().optional(),
      defaultValue: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    })
    .optional(),
});

// Select option item
export const SelectOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});
export type SelectOption = z.infer<typeof SelectOptionSchema>;

// 12. Select
export const SelectFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('select'),
  config: z.object({
    options: z.array(SelectOptionSchema).min(1),
    defaultValue: z.string().optional(),
  }),
  validation: z.object({}).optional(),
});

// 13. Multiselect
export const MultiselectFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('multiselect'),
  config: z.object({
    options: z.array(SelectOptionSchema).min(1),
    defaultValues: z.array(z.string()).optional(),
  }),
  validation: z
    .object({
      minItems: z.number().int().nonnegative().optional(),
      maxItems: z.number().int().positive().optional(),
    })
    .optional(),
});

// 14. Image
export const ImageFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('image'),
  config: z
    .object({
      aspectRatio: z.string().optional(),
      allowedTypes: z.array(z.string()).optional(),
    })
    .optional(),
  validation: z
    .object({
      maxSizeBytes: z.number().int().positive().optional(),
    })
    .optional(),
});

// 15. File
export const FileFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('file'),
  config: z
    .object({
      allowedExtensions: z.array(z.string()).optional(),
    })
    .optional(),
  validation: z
    .object({
      maxSizeBytes: z.number().int().positive().optional(),
    })
    .optional(),
});

// 16. Reference
export const OnDeleteActionSchema = z.enum(['restrict', 'cascade', 'setNull']);
export type OnDeleteAction = z.infer<typeof OnDeleteActionSchema>;

export const ReferenceFieldSpecSchema = z.object({
  ...BaseFieldProps,
  type: z.literal('reference'),
  config: z.object({
    targetEntityId: EntityIdSchema,
    onDelete: OnDeleteActionSchema.default('restrict'),
  }),
  validation: z.object({}).optional(),
});

// Discriminated union of all FieldSpecs
export const FieldSpecSchema = z.discriminatedUnion('type', [
  TextFieldSpecSchema,
  TextareaFieldSpecSchema,
  RichTextFieldSpecSchema,
  NumberFieldSpecSchema,
  MoneyFieldSpecSchema,
  BooleanFieldSpecSchema,
  EmailFieldSpecSchema,
  UrlFieldSpecSchema,
  SlugFieldSpecSchema,
  DateFieldSpecSchema,
  DateTimeFieldSpecSchema,
  SelectFieldSpecSchema,
  MultiselectFieldSpecSchema,
  ImageFieldSpecSchema,
  FileFieldSpecSchema,
  ReferenceFieldSpecSchema,
]);

export type TextFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'text';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { format?: 'plain' | 'phone' | 'postal'; defaultValue?: string };
  validation?: { minLength?: number; maxLength?: number; pattern?: string };
};

export type TextareaFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'textarea';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { rows?: number; defaultValue?: string };
  validation?: { minLength?: number; maxLength?: number };
};

export type RichTextFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'richText';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { features?: string[]; defaultValue?: string };
  validation?: { maxLength?: number };
};

export type NumberFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'number';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { integer?: boolean; decimals?: number; unit?: string; defaultValue?: number };
  validation?: { min?: number; max?: number; multipleOf?: number };
};

export type MoneyFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'money';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { currencyCode?: string; defaultValue?: number };
  validation?: { min?: number; max?: number };
};

export type BooleanFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'boolean';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { defaultValue?: boolean };
  validation?: Record<string, never>;
};

export type EmailFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'email';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { defaultValue?: string };
  validation?: { allowedDomains?: string[] };
};

export type UrlFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'url';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { defaultValue?: string };
  validation?: { allowedProtocols?: string[] };
};

export type SlugFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'slug';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { sourceFieldId?: FieldId };
  validation?: { maxLength?: number };
};

export type DateFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'date';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { format?: string; defaultValue?: string };
  validation?: { minDate?: string; maxDate?: string };
};

export type DateTimeFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'datetime';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { format?: string; defaultValue?: string };
  validation?: { minDate?: string; maxDate?: string };
};

export type SelectFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'select';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config: { options: SelectOption[]; defaultValue?: string };
  validation?: Record<string, never>;
};

export type MultiselectFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'multiselect';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config: { options: SelectOption[]; defaultValues?: string[] };
  validation?: { minItems?: number; maxItems?: number };
};

export type ImageFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'image';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { aspectRatio?: string; allowedTypes?: string[] };
  validation?: { maxSizeBytes?: number };
};

export type FileFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'file';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config?: { allowedExtensions?: string[] };
  validation?: { maxSizeBytes?: number };
};

export type ReferenceFieldSpec = {
  id: FieldId;
  key: string;
  label: string;
  type: 'reference';
  description?: string;
  required?: boolean;
  hidden?: boolean;
  queryCapabilities?: QueryCapabilities;
  queryable?: QueryCapabilities;
  config: { targetEntityId: EntityId; onDelete?: OnDeleteAction };
  validation?: Record<string, never>;
};

export type FieldSpec =
  | TextFieldSpec
  | TextareaFieldSpec
  | RichTextFieldSpec
  | NumberFieldSpec
  | MoneyFieldSpec
  | BooleanFieldSpec
  | EmailFieldSpec
  | UrlFieldSpec
  | SlugFieldSpec
  | DateFieldSpec
  | DateTimeFieldSpec
  | SelectFieldSpec
  | MultiselectFieldSpec
  | ImageFieldSpec
  | FileFieldSpec
  | ReferenceFieldSpec;

export type FieldType = FieldSpec['type'];
