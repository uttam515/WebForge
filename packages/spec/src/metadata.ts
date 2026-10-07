import { z } from 'zod';
import { AppSpecIdSchema, type AppSpecId } from './identity.js';

export const AppSpecMetadataSchema = z.object({
  id: AppSpecIdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  origin: z.string().optional(),
});

export type AppSpecMetadata = {
  id: AppSpecId;
  name: string;
  description?: string;
  origin?: string;
};
