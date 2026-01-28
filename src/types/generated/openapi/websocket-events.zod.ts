/**
 * OSSA WebSocket Events API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: openapi/protocols/websocket-events.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.302Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const webSocketEventSchema = z.object({
  type: z.enum(["message", "capability_call", "status_update", "error", "ack"]),
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()),
  metadata: eventMetadataSchema
});

export type WebSocketEvent = z.infer<typeof webSocketEventSchema>;

export const eventMetadataSchema = z.object({
  agentId: z.string().url(),
  correlationId: z.string().uuid().optional(),
  replyTo: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  ttl: z.number().int().min(1).optional(),
  retryCount: z.number().int().min(0).optional()
});

export type EventMetadata = z.infer<typeof eventMetadataSchema>;

export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
});

export type Error = z.infer<typeof errorSchema>;
