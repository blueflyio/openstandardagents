/**
 * OSSA Server-Sent Events (SSE) API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: openapi/protocols/sse-streams.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.305Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

/**
 * Text/event-stream format per SSE specification.
 * 
 * Format:
 * event: <event-name>
 * id: <event-id>
 * retry: <reconnect-time-ms>
 * data: <json-payload>
 * (blank line)
 * 
 */
export const eventStreamSchema = z.string();

export type EventStream = z.infer<typeof eventStreamSchema>;

export const sSEEventSchema = z.object({
  type: z.enum(["message", "status", "capability_response", "error"]),
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()),
  metadata: eventMetadataSchema
});

export type SSEEvent = z.infer<typeof sSEEventSchema>;

export const eventMetadataSchema = z.object({
  agentId: z.string().url(),
  streamId: z.string().uuid().optional(),
  correlationId: z.string().uuid().optional(),
  sequence: z.number().int().min(0).optional(),
  final: z.boolean().optional()
});

export type EventMetadata = z.infer<typeof eventMetadataSchema>;

export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
});

export type Error = z.infer<typeof errorSchema>;
