/**
 * Shared Type Definitions
 *
 * DRY: Common types used across SDKs
 * OpenAPI: Types align with OpenAPI spec
 */

import { z } from 'zod';
import { MetadataSchema, LLMConfigSchema } from './validation.js';

export const OSSAKindSchema = z.enum(['Agent', 'Task', 'Workflow']);

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()).optional(),
});

export const AutonomySchema = z.object({
  level: z.enum(['none', 'semi', 'full']),
  max_iterations: z.number().positive().optional(),
  checkpoint_frequency: z.number().positive().optional(),
});

export const StateConfigSchema = z.object({
  persistence: z.object({
    enabled: z.boolean(),
    type: z.enum(['memory', 'database', 'file']).optional(),
    provider: z.string().optional(),
  }),
  schema: z.record(z.unknown()).optional(),
});

export type OSSAKind = z.infer<typeof OSSAKindSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type Autonomy = z.infer<typeof AutonomySchema>;
export type StateConfig = z.infer<typeof StateConfigSchema>;
