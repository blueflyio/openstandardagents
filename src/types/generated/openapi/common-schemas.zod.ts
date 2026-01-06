/**
 * Common Shared Schemas - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: shared schemas
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:11:54.127Z
 */

import { z } from 'zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const tokenResponseSchema = z.object({
  access_token: z.string().optional(),
  token_type: z.string().optional(),
  expires_in: z.number().int().optional(),
  scope: z.array(z.string()).optional(),
  instance_id: z.string().uuid().optional(),
  issued_at: z.string().datetime().optional(),
  token_id: z.string().uuid().optional()
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

export const securityContextSchema = z.object({
  authenticated: z.boolean().optional(),
  principal: z.object({
  agent_id: z.string().optional(),
  instance_id: z.string().uuid().optional(),
  tenant_id: z.string().optional(),
  user_id: z.string().optional()
}).optional(),
  scopes: z.array(z.string()).optional(),
  permissions: z.object({
  resources: z.array(z.record(z.string(), z.unknown())).optional(),
  policy_version: z.string().optional()
}).optional()
});

export type SecurityContext = z.infer<typeof securityContextSchema>;

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next: z.boolean().optional(),
  has_prev: z.boolean().optional()
});

export type Pagination = z.infer<typeof paginationSchema>;

export const timestampsSchema = z.object({
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().optional()
});

export type Timestamps = z.infer<typeof timestampsSchema>;

/**
 * Key-value labels for categorization and filtering
 */
export const labelsSchema = z.record(z.string(), z.unknown());

export type Labels = z.infer<typeof labelsSchema>;

/**
 * Key-value annotations for metadata
 */
export const annotationsSchema = z.record(z.string(), z.unknown());

export type Annotations = z.infer<typeof annotationsSchema>;

export const healthStatusSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]).optional(),
  version: z.string().optional(),
  uptime: z.number().int().optional(),
  timestamp: z.string().datetime().optional(),
  checks: z.record(z.string(), z.unknown()).optional()
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

/**
 * RFC7807 Problem Details for HTTP APIs
 */
export const problemSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().url().optional(),
  traceId: z.string(),
  errors: z.record(z.string(), z.unknown()).optional()
});

export type Problem = z.infer<typeof problemSchema>;

export const validationErrorSchema = z.object({
  path: z.string().optional(),
  message: z.string().optional(),
  rule: z.string().optional()
});

export type ValidationError = z.infer<typeof validationErrorSchema>;

export const validationWarningSchema = z.object({
  path: z.string().optional(),
  message: z.string().optional(),
  suggestion: z.string().optional()
});

export type ValidationWarning = z.infer<typeof validationWarningSchema>;

export const executionErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime().optional()
});

export type ExecutionError = z.infer<typeof executionErrorSchema>;

export const metadataSchema = z.object({
  name: z.string().regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/),
  namespace: z.string().optional(),
  labels: z.record(z.string(), z.unknown()).optional(),
  annotations: z.record(z.string(), z.unknown()).optional()
});

export type Metadata = z.infer<typeof metadataSchema>;

/**
 * Agent type classification
 */
export const agentTypeSchema = z.enum(["orchestrator", "worker", "specialist", "critic", "monitor", "gateway"]);

export type AgentType = z.infer<typeof agentTypeSchema>;

export const capabilitySchema = z.object({
  name: z.string(),
  category: z.enum(["core", "analysis", "generation", "transformation", "integration"]),
  description: z.string().optional(),
  version: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional()
});

export type Capability = z.infer<typeof capabilitySchema>;

export const interfaceSchema = z.object({
  type: z.enum(["rest", "graphql", "grpc", "websocket", "mcp"]),
  endpoint: z.string().url(),
  protocol: z.string().optional(),
  authentication: z.object({
  type: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional()
}).optional()
});

export type Interface = z.infer<typeof interfaceSchema>;

export const resourceRequirementsSchema = z.object({
  cpu: z.string().regex(/^[0-9]+m?$/).optional(),
  memory: z.string().regex(/^[0-9]+(Mi|Gi)$/).optional(),
  storage: z.string().regex(/^[0-9]+(Mi|Gi)$/).optional(),
  gpu: z.string().optional()
});

export type ResourceRequirements = z.infer<typeof resourceRequirementsSchema>;

export const requirementsSchema = z.object({
  runtime: z.string().optional(),
  resources: resourceRequirementsSchema.optional(),
  dependencies: z.array(z.string()).optional(),
  environment: z.record(z.string(), z.unknown()).optional()
});

export type Requirements = z.infer<typeof requirementsSchema>;

export const agentSpecSchema = z.object({
  type: agentTypeSchema,
  description: z.string().optional(),
  capabilities: z.array(capabilitySchema),
  interfaces: z.array(interfaceSchema).optional(),
  requirements: requirementsSchema.optional(),
  configuration: z.record(z.string(), z.unknown()).optional()
});

export type AgentSpec = z.infer<typeof agentSpecSchema>;

export const agentManifestSchema = z.object({
  apiVersion: z.literal("ossa/v0.3.3"),
  kind: z.literal("AgentManifest"),
  metadata: metadataSchema,
  spec: agentSpecSchema
});

export type AgentManifest = z.infer<typeof agentManifestSchema>;

/**
 * Current operational status of the agent
 */
export const agentStatusSchema = z.enum(["registered", "active", "inactive", "suspended", "deprecated"]);

export type AgentStatus = z.infer<typeof agentStatusSchema>;

export const agentRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  registeredAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  registeredBy: z.string().optional(),
  federationNode: z.string().optional()
});

export type AgentRegistration = z.infer<typeof agentRegistrationSchema>;

export const agentMetricsSchema = z.object({
  requestCount: z.number().int().optional(),
  errorCount: z.number().int().optional(),
  averageResponseTime: z.number().optional(),
  uptime: z.number().int().optional(),
  lastActive: z.string().datetime().optional()
});

export type AgentMetrics = z.infer<typeof agentMetricsSchema>;

export const agentSchema = z.object({
  id: z.string().uuid().optional(),
  manifest: agentManifestSchema.optional(),
  status: agentStatusSchema.optional(),
  registration: agentRegistrationSchema.optional(),
  certification: z.unknown().optional(),
  metrics: agentMetricsSchema.optional()
});

export type Agent = z.infer<typeof agentSchema>;
