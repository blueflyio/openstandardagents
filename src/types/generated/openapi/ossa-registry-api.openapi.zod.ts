/**
 * OSSA Agent Registry API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: openapi/core/ossa-registry-api.openapi.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.321Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const agentSchema = z.object({
  id: z.string().uuid(),
  namespace: z.string(),
  name: z.string(),
  full_name: z.string().optional(),
  description: z.string(),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  latest_version: z.string(),
  downloads: z.number().int().optional(),
  stars: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  certified: z.boolean().optional(),
  compliance: z.array(z.enum(["fedramp", "iso27001", "soc2", "hipaa"])).optional(),
  maintainers: z.array(maintainerSchema).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type Agent = z.infer<typeof agentSchema>;

export const agentCreateRequestSchema = z.object({
  namespace: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  name: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  description: z.string().max(500),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

export type AgentCreateRequest = z.infer<typeof agentCreateRequestSchema>;

export const agentUpdateRequestSchema = z.object({
  description: z.string().max(500).optional(),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

export type AgentUpdateRequest = z.infer<typeof agentUpdateRequestSchema>;

export const agentListResponseSchema = z.object({
  data: z.array(agentSchema),
  pagination: paginationSchema
});

export type AgentListResponse = z.infer<typeof agentListResponseSchema>;

export const versionSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  agent_id: z.string().uuid(),
  manifest_url: z.string().url(),
  readme: z.string().optional(),
  signature: z.string().optional(),
  verified: z.boolean().optional(),
  downloads: z.number().int().optional(),
  sha256: z.string().optional(),
  size: z.number().int().optional(),
  created_at: z.string().datetime()
});

export type Version = z.infer<typeof versionSchema>;

export const versionListResponseSchema = z.object({
  data: z.array(versionSchema),
  pagination: paginationSchema
});

export type VersionListResponse = z.infer<typeof versionListResponseSchema>;

export const searchResponseSchema = z.object({
  data: z.array(searchResultSchema),
  total: z.number().int(),
  query: z.string(),
  pagination: paginationSchema.optional()
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

export const searchResultSchema = z.intersection(agentSchema, z.object({
  score: z.number().optional(),
  highlight: z.record(z.string(), z.unknown()).optional()
}));

export type SearchResult = z.infer<typeof searchResultSchema>;

export const certificationSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  level: z.enum(["compatible", "certified", "enterprise"]),
  compliance_frameworks: z.array(z.enum(["fedramp", "iso27001", "soc2", "hipaa"])).optional(),
  status: z.enum(["pending", "in_review", "approved", "rejected", "expired"]),
  badge_url: z.string().url().optional(),
  certificate_url: z.string().url().optional(),
  expires_at: z.string().datetime().optional(),
  requested_at: z.string().datetime(),
  reviewed_at: z.string().datetime().optional(),
  notes: z.string().optional()
});

export type Certification = z.infer<typeof certificationSchema>;

export const certificationRequestSchema = z.object({
  level: z.enum(["compatible", "certified", "enterprise"]),
  version: z.string(),
  compliance_frameworks: z.array(z.enum(["fedramp", "iso27001", "soc2", "hipaa"])).optional(),
  documentation_url: z.string().url().optional(),
  notes: z.string().optional()
});

export type CertificationRequest = z.infer<typeof certificationRequestSchema>;

export const certificationListResponseSchema = z.object({
  data: z.array(certificationSchema),
  pagination: paginationSchema
});

export type CertificationListResponse = z.infer<typeof certificationListResponseSchema>;

export const analyticsSchema = z.object({
  agent_id: z.string().uuid(),
  period: z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
}),
  downloads: z.object({
  total: z.number().int().optional(),
  by_version: z.record(z.string(), z.unknown()).optional(),
  by_day: z.array(z.object({
  date: z.string().date().optional(),
  count: z.number().int().optional()
})).optional()
}).optional(),
  geography: z.record(z.string(), z.unknown()).optional(),
  top_referrers: z.array(z.object({
  url: z.string().optional(),
  count: z.number().int().optional()
})).optional()
});

export type Analytics = z.infer<typeof analyticsSchema>;

export const maintainerSchema = z.object({
  username: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["owner", "maintainer", "contributor"]),
  avatar_url: z.string().url().optional()
});

export type Maintainer = z.infer<typeof maintainerSchema>;

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next: z.boolean().optional(),
  has_prev: z.boolean().optional()
});

export type Pagination = z.infer<typeof paginationSchema>;

export const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  trace_id: z.string().uuid().optional()
});

export type Error = z.infer<typeof errorSchema>;
