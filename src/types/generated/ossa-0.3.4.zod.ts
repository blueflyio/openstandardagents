/**
 * OSSA v0.3.4 Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: spec/v0.3.4/ossa-0.3.4.schema.json
 *
 * Regenerate with: ossa generate zod
 */

import { z } from 'zod';

// Basic OSSA schema - manual generation fallback
// Accept v0.3.4 with optional prerelease suffix (e.g., -dev.1, -rc.1)
export const OssaApiVersionSchema = z
  .string()
  .regex(/^ossa\/v0\.3\.4(-[a-zA-Z0-9.-]+)?$/);

export const OssaMetadataSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  description: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  annotations: z.record(z.string(), z.string()).optional(),
});

export const OssaAgentSchema = z.object({
  apiVersion: OssaApiVersionSchema,
  kind: z.enum(['Agent', 'Task', 'Workflow', 'AgentRegistry']),
  metadata: OssaMetadataSchema,
  spec: z.record(z.string(), z.unknown()),
});

export type OssaAgent = z.infer<typeof OssaAgentSchema>;
export type OssaMetadata = z.infer<typeof OssaMetadataSchema>;
