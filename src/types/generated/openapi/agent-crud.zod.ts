/**
 * OSSA Agent CRUD API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: /Users/flux423/Sites/LLM/OssA/openstandardagents/openapi/agent-crud.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:11:54.160Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const agentMetadataSchema = z.object({
  name: z.string().min(1).max(63).regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/),
  description: z.string().optional(),
  labels: z.record(z.string(), z.unknown()).optional()
});

export type AgentMetadata = z.infer<typeof agentMetadataSchema>;

export const fallbackModelSchema = z.object({
  provider: z.string(),
  model: z.string(),
  condition: z.enum(["on_error", "on_rate_limit", "on_timeout"])
});

export type FallbackModel = z.infer<typeof fallbackModelSchema>;

export const retryConfigSchema = z.object({
  max_attempts: z.number().int().min(1).max(10).optional(),
  backoff_strategy: z.enum(["linear", "exponential", "fibonacci"]).optional()
});

export type RetryConfig = z.infer<typeof retryConfigSchema>;

export const lLMConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  profile: z.enum(["fast", "balanced", "deep", "safe"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(200000).optional(),
  topP: z.number().min(0).max(1).optional(),
  fallback_models: z.array(fallbackModelSchema).optional(),
  retry_config: retryConfigSchema.optional()
});

export type LLMConfig = z.infer<typeof lLMConfigSchema>;

export const executionProfileSchema = z.object({
  default: z.enum(["fast", "balanced", "deep", "safe"]).optional(),
  profiles: z.record(z.string(), z.unknown()).optional()
});

export type ExecutionProfile = z.infer<typeof executionProfileSchema>;

export const schedulingConfigSchema = z.object({
  strategy: z.enum(["fair", "priority", "round-robin"]).optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  max_concurrent: z.number().int().min(1).optional(),
  timeout_seconds: z.number().int().min(1).optional()
});

export type SchedulingConfig = z.infer<typeof schedulingConfigSchema>;

export const resourceLimitsSchema = z.object({
  memory_mb: z.number().int().min(128).optional(),
  cpu_millicores: z.number().int().min(100).optional()
});

export type ResourceLimits = z.infer<typeof resourceLimitsSchema>;

export const runtimeConfigSchema = z.object({
  type: z.enum(["unified", "kubernetes", "docker", "serverless", "local"]),
  supports: z.array(z.enum(["google-a2a", "gitlab-duo", "ossa-mesh", "mcp", "local-execution"])).optional(),
  scheduling: schedulingConfigSchema.optional(),
  resource_limits: resourceLimitsSchema.optional()
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export const capabilitySchema = z.object({
  name: z.string(),
  type: z.enum(["action", "query", "monitor", "transform"]),
  runtime: z.enum(["llm", "code", "hybrid"]).optional(),
  description: z.string().optional(),
  input_schema: z.record(z.string(), z.unknown()).optional()
});

export type Capability = z.infer<typeof capabilitySchema>;

export const functionSchema = z.object({
  name: z.string().regex(/^[a-z_][a-z0-9_]*$/),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()),
  returns: z.record(z.string(), z.unknown()).optional()
});

export type Function = z.infer<typeof functionSchema>;

export const extensionSchema = z.object({
  type: z.enum(["http", "mcp", "grpc", "websocket"]),
  name: z.string(),
  endpoint: z.string().url(),
  credentials_ref: z.string().optional()
});

export type Extension = z.infer<typeof extensionSchema>;

export const taxonomySchema = z.object({
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  capability: z.string().optional()
});

export type Taxonomy = z.infer<typeof taxonomySchema>;

export const toolSourceSchema = z.object({
  type: z.enum(["mcp", "http", "grpc"]),
  uri: z.string().url()
});

export type ToolSource = z.infer<typeof toolSourceSchema>;

export const toolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  source: toolSourceSchema
});

export type Tool = z.infer<typeof toolSchema>;

export const graphConnectionSchema = z.object({
  endpoint: z.string().url().optional(),
  credentials_ref: z.string().optional()
});

export type GraphConnection = z.infer<typeof graphConnectionSchema>;

export const knowledgeGraphSchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(["neo4j", "memgraph", "dgraph"]).optional(),
  connection: graphConnectionSchema.optional()
});

export type KnowledgeGraph = z.infer<typeof knowledgeGraphSchema>;

export const agentSpecSchema = z.object({
  llm: lLMConfigSchema,
  execution_profile: executionProfileSchema.optional(),
  runtime: runtimeConfigSchema,
  capabilities: z.array(capabilitySchema),
  functions: z.array(functionSchema).optional(),
  extensions: z.array(extensionSchema).optional(),
  role: z.string().optional(),
  taxonomy: taxonomySchema.optional(),
  tools: z.array(toolSchema).optional(),
  knowledge_graph: knowledgeGraphSchema.optional()
});

export type AgentSpec = z.infer<typeof agentSpecSchema>;

export const agentCreateSchema = z.object({
  apiVersion: z.literal("ossa/v0.3.3"),
  kind: z.literal("Agent"),
  metadata: agentMetadataSchema,
  spec: agentSpecSchema
});

export type AgentCreate = z.infer<typeof agentCreateSchema>;

/**
 * Partial update of agent configuration. Only provided fields will be updated.
 */
export const agentUpdateSchema = z.object({
  metadata: z.object({
  description: z.string().optional(),
  labels: z.record(z.string(), z.unknown()).optional()
}).optional(),
  spec: z.object({
  llm: lLMConfigSchema.optional(),
  runtime: runtimeConfigSchema.optional(),
  capabilities: z.array(capabilitySchema).optional()
}).optional()
});

export type AgentUpdate = z.infer<typeof agentUpdateSchema>;

export const agentStatusSchema = CommonSchemas.agentStatusSchema;

export type AgentStatus = z.infer<typeof agentStatusSchema>;

export const agentMetricsSchema = z.object({
  requestCount: z.number().int().optional(),
  errorCount: z.number().int().optional(),
  averageResponseTime: z.number().optional(),
  uptime: z.number().int().optional(),
  lastActive: z.string().datetime().optional()
});

export type AgentMetrics = z.infer<typeof agentMetricsSchema>;

export const agentResponseSchema = z.object({
  id: z.string().uuid(),
  apiVersion: z.literal("ossa/v0.3.3"),
  kind: z.literal("Agent"),
  metadata: agentMetadataSchema,
  spec: agentSpecSchema,
  status: agentStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().optional(),
  metrics: agentMetricsSchema.optional()
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;

export const agentsListSchema = z.object({
  agents: z.array(agentResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int()
});

export type AgentsList = z.infer<typeof agentsListSchema>;

export const profileConfigSchema = z.object({
  maxTokens: z.number().int().optional(),
  temperature: z.number().optional(),
  reasoning_enabled: z.boolean().optional(),
  validation_required: z.boolean().optional(),
  audit_log: z.boolean().optional(),
  description: z.string().optional()
});

export type ProfileConfig = z.infer<typeof profileConfigSchema>;

export const agentTypeSchema = CommonSchemas.agentTypeSchema;

export type AgentType = z.infer<typeof agentTypeSchema>;

export const problemSchema = CommonSchemas.problemSchema;

export type Problem = z.infer<typeof problemSchema>;
