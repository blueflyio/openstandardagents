/**
 * Drupal LLM Platform Agent API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: openapi/reference-implementations/drupal-agent-api.openapi.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.293Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const contentCreateRequestSchema = z.object({
  type: z.string(),
  title: z.string(),
  body: z.object({
  value: z.string().optional(),
  format: z.string().optional()
}).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  agent_metadata: z.object({
  created_by_agent: z.string().optional(),
  session_id: z.string().optional()
}).optional()
});

export type ContentCreateRequest = z.infer<typeof contentCreateRequestSchema>;

export const contentResponseSchema = z.object({
  nid: z.number().int().optional(),
  uuid: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  url: z.string().url().optional(),
  created: z.string().datetime().optional(),
  changed: z.string().datetime().optional()
});

export type ContentResponse = z.infer<typeof contentResponseSchema>;

export const contentUpdateRequestSchema = z.object({
  title: z.string().optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["published", "draft", "archived"]).optional()
});

export type ContentUpdateRequest = z.infer<typeof contentUpdateRequestSchema>;
