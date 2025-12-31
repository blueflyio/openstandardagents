/**
 * OSSA v0.3.2 Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: spec/v0.3.2/ossa-0.3.2.schema.json
 *
 * Regenerate with: ossa generate zod
 */

import { z } from 'zod';


// Basic OSSA schema - manual generation fallback
export const OssaApiVersionSchema = z.literal('ossa/v0.3.2');

export const OssaMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  annotations: z.record(z.string(), z.string()).optional(),
});

export const OssaAgentSchema = z.object({
  apiVersion: OssaApiVersionSchema,
  kind: z.enum(['Agent', 'Task', 'Workflow']),
  metadata: OssaMetadataSchema,
  spec: z.record(z.string(), z.unknown()),
});

export type OssaAgent = z.infer<typeof OssaAgentSchema>;
export type OssaMetadata = z.infer<typeof OssaMetadataSchema>;
