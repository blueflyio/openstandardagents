/**
 * Migration Schema
 *
 * Zod schemas for agent migration
 * SOLID: Single Responsibility - Schema definitions only
 */

import { z } from 'zod';

export const MigrateAgentsRequestSchema = z.object({
  targetVersion: z.string().optional(),
  paths: z.array(z.string()).optional(),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
});

export type MigrateAgentsRequest = z.infer<typeof MigrateAgentsRequestSchema>;

export const AgentUpgradeResultSchema = z.object({
  path: z.string(),
  success: z.boolean(),
  oldVersion: z.string(),
  newVersion: z.string(),
  error: z.string().optional(),
});

export type AgentUpgradeResult = z.infer<typeof AgentUpgradeResultSchema>;

export const MigrateAgentsResponseSchema = z.object({
  success: z.boolean(),
  targetVersion: z.string(),
  totalFiles: z.number(),
  upgraded: z.number(),
  skipped: z.number(),
  failed: z.number(),
  results: z.array(AgentUpgradeResultSchema),
  dryRun: z.boolean(),
});

export type MigrateAgentsResponse = z.infer<typeof MigrateAgentsResponseSchema>;
