/**
 * OSSA Agent Discovery & Registry API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: openapi/agent-discovery.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:11:54.151Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const registrationRequestSchema = z.object({
  agentId: z
    .string()
    .max(253)
    .regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  name: z
    .string()
    .max(253)
    .regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  version: z
    .string()
    .regex(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    ),
  manifest: z.object({
    apiVersion: z.string().regex(/^ossa\/v0\.3\.3$/),
    kind: z.enum(['Agent', 'Task', 'Workflow']),
    metadata: z.object({
      name: z.string(),
      version: z.string(),
      description: z.string().optional(),
      labels: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  endpoint: z.string().url(),
  domains: z.array(z.string().regex(/^domain::[a-z0-9-]+$/)).optional(),
  subdomains: z.array(z.string().regex(/^subdomain::[a-z0-9-]+$/)).optional(),
  concerns: z.array(z.string().regex(/^concern::[a-z0-9-]+$/)).optional(),
  capabilities: z.array(z.string().regex(/^[a-z][a-z0-9_-]*$/)).optional(),
  status: z.enum(['active', 'inactive', 'degraded', 'maintenance']),
  healthEndpoint: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;

export const agentMetadataSchema = z.object({
  agentId: z.string(),
  name: z.string(),
  version: z.string(),
  domains: z.array(z.string()).optional(),
  subdomains: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'degraded', 'maintenance']),
  endpoint: z.string().url(),
  healthEndpoint: z.string().url().optional(),
  registeredAt: z.string().datetime(),
  lastSeen: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AgentMetadata = z.infer<typeof agentMetadataSchema>;

export const discoveryQuerySchema = z.object({
  domain: z
    .string()
    .regex(/^domain::[a-z0-9-]+$/)
    .optional(),
  subdomain: z
    .string()
    .regex(/^subdomain::[a-z0-9-]+$/)
    .optional(),
  concerns: z.array(z.string().regex(/^concern::[a-z0-9-]+$/)).optional(),
  capabilities: z.array(z.string().regex(/^[a-z][a-z0-9_-]*$/)).optional(),
  status: z.enum(['active', 'inactive', 'degraded', 'maintenance']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;

export const discoveryResultSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  agents: z.array(agentMetadataSchema),
});

export type DiscoveryResult = z.infer<typeof discoveryResultSchema>;

export const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  trace_id: z.string().uuid().optional(),
});

export type Error = z.infer<typeof errorSchema>;
