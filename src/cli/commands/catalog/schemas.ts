/**
 * Catalog Command Schemas
 *
 * Zod schemas for all catalog command options.
 * Single source of truth for CLI validation.
 */

import { z } from 'zod';

// Base schema for agent selection (shared across commands)
const AgentSelectionSchema = z.object({
  agent: z.string().optional().describe('Specific agent ID to operate on'),
  all: z.boolean().default(false).describe('Operate on all agents'),
});

// Base schema for dry-run support
const DryRunSchema = z.object({
  dryRun: z
    .boolean()
    .default(false)
    .describe('Show what would be done without making changes'),
});

// Convert command options
export const ConvertOptionsSchema = AgentSelectionSchema.merge(
  DryRunSchema
).extend({
  output: z
    .string()
    .optional()
    .describe('Output directory for converted files'),
});

// Validate command options
export const ValidateOptionsSchema = AgentSelectionSchema.extend({
  schema: z
    .enum(['ossa', 'duo', 'both'])
    .default('both')
    .describe('Schema to validate against'),
});

// Push command options
export const PushOptionsSchema = AgentSelectionSchema.merge(
  DryRunSchema
).extend({
  force: z.boolean().default(false).describe('Force overwrite remote'),
});

// Pull command options
export const PullOptionsSchema = AgentSelectionSchema.extend({
  overwrite: z.boolean().default(false).describe('Overwrite local files'),
});

// Sync command options
export const SyncOptionsSchema = DryRunSchema.extend({
  direction: z.enum(['push', 'pull', 'bidirectional']).default('bidirectional'),
});

// List command options
export const ListOptionsSchema = z.object({
  format: z.enum(['table', 'json', 'yaml']).default('table'),
  status: z.enum(['all', 'synced', 'unsynced', 'modified']).default('all'),
});

// Type exports (inferred from schemas)
export type ConvertOptions = z.infer<typeof ConvertOptionsSchema>;
export type ValidateOptions = z.infer<typeof ValidateOptionsSchema>;
export type PushOptions = z.infer<typeof PushOptionsSchema>;
export type PullOptions = z.infer<typeof PullOptionsSchema>;
export type SyncOptions = z.infer<typeof SyncOptionsSchema>;
export type ListOptions = z.infer<typeof ListOptionsSchema>;

// Helper to validate options
export function validateOptions<T extends z.ZodSchema>(
  schema: T,
  opts: unknown
): z.infer<T> {
  return schema.parse(opts);
}
