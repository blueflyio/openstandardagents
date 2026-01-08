/**
 * OSSA Agent Registry API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: /Users/flux423/Sites/LLM/OssA/openstandardagents/openapi/core/ossa-registry.openapi.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.315Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const agentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string().optional(),
  role: z.enum(["compliance", "chat", "orchestration", "audit", "workflow", "monitoring", "data_sync", "search", "custom"]),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: z.enum(["active", "deprecated", "beta", "experimental"]),
  author: z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  organization: z.string().optional()
}).optional(),
  capabilities: z.array(z.string()).optional(),
  deployment: z.object({
  clouds: z.array(z.enum(["aws", "gcp", "azure", "local", "hybrid"])).optional(),
  regions: z.array(z.string()).optional(),
  helm: z.object({
  chart: z.string().optional(),
  repository: z.string().optional()
}).optional()
}).optional(),
  compliance: z.array(z.enum(["fedramp", "iso27001", "soc2", "hipaa", "gdpr"])).optional(),
  metrics: agentMetricsSchema.optional(),
  certifications: z.array(z.string()).optional(),
  signature: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Agent = z.infer<typeof agentSchema>;

export const agentRegistrationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  role: z.enum(["compliance", "chat", "orchestration", "audit", "workflow", "monitoring", "data_sync", "search", "custom"]),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  manifest: z.record(z.string(), z.unknown()),
  author: z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  organization: z.string().optional()
}).optional(),
  capabilities: z.array(z.string()).optional(),
  deployment: z.record(z.string(), z.unknown()).optional(),
  signature: z.string().optional()
});

export type AgentRegistration = z.infer<typeof agentRegistrationSchema>;

export const agentUpdateSchema = z.object({
  description: z.string().optional(),
  status: z.enum(["active", "deprecated", "beta", "experimental"]).optional(),
  capabilities: z.array(z.string()).optional()
});

export type AgentUpdate = z.infer<typeof agentUpdateSchema>;

export const agentVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  releaseDate: z.string().datetime(),
  changelog: z.string().optional(),
  manifest: z.record(z.string(), z.unknown()),
  breaking: z.boolean().optional(),
  signature: z.string().optional()
});

export type AgentVersion = z.infer<typeof agentVersionSchema>;

export const versionPublishSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  changelog: z.string().optional(),
  manifest: z.record(z.string(), z.unknown()),
  breaking: z.boolean().optional(),
  signature: z.string().optional()
});

export type VersionPublish = z.infer<typeof versionPublishSchema>;

export const certificationSchema = z.object({
  type: z.enum(["fedramp", "iso27001", "soc2", "hipaa", "gdpr", "custom"]),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  issuer: z.string().optional(),
  certificateUrl: z.string().url().optional(),
  verified: z.boolean().optional()
});

export type Certification = z.infer<typeof certificationSchema>;

export const certificationRequestSchema = z.object({
  type: z.enum(["fedramp", "iso27001", "soc2", "hipaa", "gdpr", "custom"]),
  expiresAt: z.string().datetime(),
  certificateUrl: z.string().url().optional()
});

export type CertificationRequest = z.infer<typeof certificationRequestSchema>;

export const deploymentRequestSchema = z.object({
  environment: z.enum(["development", "staging", "production"]),
  cloud: z.enum(["aws", "gcp", "azure", "local", "hybrid"]),
  region: z.string().optional(),
  namespace: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional()
});

export type DeploymentRequest = z.infer<typeof deploymentRequestSchema>;

export const deploymentStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "deploying", "deployed", "failed", "rollback"]),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  message: z.string().optional(),
  logs: z.array(z.string()).optional()
});

export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;

export const healthMetricsSchema = z.object({
  healthy: z.boolean(),
  score: z.number().min(0).max(100),
  checkedAt: z.string().datetime(),
  uptime: z.number().optional(),
  responseTime: z.number().optional(),
  errorRate: z.number().optional(),
  compliance: z.object({
  fedramp: z.boolean().optional(),
  iso27001: z.boolean().optional(),
  soc2: z.boolean().optional()
}).optional()
});

export type HealthMetrics = z.infer<typeof healthMetricsSchema>;

export const agentMetricsSchema = z.object({
  downloads: z.number().int().optional(),
  deployments: z.number().int().optional(),
  healthScore: z.number().min(0).max(100).optional(),
  successRate: z.number().min(0).max(1).optional()
});

export type AgentMetrics = z.infer<typeof agentMetricsSchema>;

export const complianceValidationSchema = z.object({
  agentId: z.string(),
  frameworks: z.array(z.enum(["fedramp", "iso27001", "soc2", "hipaa", "gdpr"]))
});

export type ComplianceValidation = z.infer<typeof complianceValidationSchema>;

export const complianceResultSchema = z.object({
  compliant: z.boolean(),
  results: z.array(z.object({
  framework: z.string().optional(),
  compliant: z.boolean().optional(),
  issues: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional()
}))
});

export type ComplianceResult = z.infer<typeof complianceResultSchema>;

export const searchQuerySchema = z.object({
  query: z.string().optional(),
  filters: z.object({
  role: z.array(z.string()).optional(),
  cloud: z.array(z.string()).optional(),
  compliance: z.array(z.string()).optional(),
  certified: z.boolean().optional()
}).optional(),
  sort: z.enum(["relevance", "downloads", "health", "recent"]).optional(),
  page: z.number().int().optional(),
  limit: z.number().int().optional()
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchResultSchema = z.object({
  agent: agentSchema.optional(),
  relevance: z.number().optional()
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const paginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  pages: z.number().int().optional()
});

export type Pagination = z.infer<typeof paginationSchema>;

export const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional()
});

export type Error = z.infer<typeof errorSchema>;
