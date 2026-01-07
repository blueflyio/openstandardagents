/**
 * TypeScript SDK Types
 *
 * Generated from OSSA OpenAPI spec
 * Zod: Runtime validation schemas
 * OpenAPI: Types align with OpenAPI spec
 */

import { z } from 'zod';
import {
  MetadataSchema,
  LLMConfigSchema,
  ApiVersionSchema,
} from '../shared/validation.js';
import { ToolSchema, AutonomySchema, StateConfigSchema } from '../shared/types.js';

export const AgentSpecSchema = z.object({
  role: z.string(),
  llm: LLMConfigSchema,
  tools: z.array(ToolSchema).optional(),
  autonomy: AutonomySchema.optional(),
  state: StateConfigSchema.optional(),
  constraints: z.record(z.unknown()).optional(),
});

export const AgentManifestSchema = z.object({
  apiVersion: ApiVersionSchema,
  kind: z.literal('Agent'),
  metadata: MetadataSchema,
  spec: AgentSpecSchema,
});

export const TaskSpecSchema = z.object({
  description: z.string(),
  steps: z.array(z.record(z.unknown())),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
});

export const TaskManifestSchema = z.object({
  apiVersion: ApiVersionSchema,
  kind: z.literal('Task'),
  metadata: MetadataSchema,
  spec: TaskSpecSchema,
});

export const WorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  kind: z.enum(['Task', 'Agent', 'Parallel', 'Conditional', 'Loop']),
  ref: z.string().optional(),
  depends_on: z.array(z.string()).optional(),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
});

export const WorkflowSpecSchema = z.object({
  triggers: z.array(z.record(z.unknown())).optional(),
  inputs: z.record(z.unknown()).optional(),
  steps: z.array(WorkflowStepSchema),
  concurrency: z.record(z.unknown()).optional(),
});

export const WorkflowManifestSchema = z.object({
  apiVersion: ApiVersionSchema,
  kind: z.literal('Workflow'),
  metadata: MetadataSchema,
  spec: WorkflowSpecSchema,
});

export type AgentSpec = z.infer<typeof AgentSpecSchema>;
export type AgentManifest = z.infer<typeof AgentManifestSchema>;
export type TaskSpec = z.infer<typeof TaskSpecSchema>;
export type TaskManifest = z.infer<typeof TaskManifestSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type WorkflowSpec = z.infer<typeof WorkflowSpecSchema>;
export type WorkflowManifest = z.infer<typeof WorkflowManifestSchema>;

export type OSSAManifest = AgentManifest | TaskManifest | WorkflowManifest;
