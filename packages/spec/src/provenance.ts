import { z } from 'zod';

export const ProvenanceEntrySchema = z.object({
  module: z.string().optional(),
  template: z.string().optional(),
});

export type ProvenanceEntry = {
  module?: string;
  template?: string;
};

export const ProvenanceSpecSchema = z.record(ProvenanceEntrySchema);

export type ProvenanceSpec = Record<string, ProvenanceEntry>;
