/**
 * OSSA Registry Schemas
 * Generated from OpenAPI spec: ossa-registry-api.yaml
 *
 * OpenAPI-First Architecture:
 * - Single source of truth (OpenAPI spec)
 * - Runtime validation with Zod
 * - Type-safe throughout
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const ComplianceFramework = z.enum(['fedramp', 'iso27001', 'soc2', 'hipaa']);

export const CertificationLevel = z.enum(['compatible', 'certified', 'enterprise']);

export const CertificationStatus = z.enum(['pending', 'in_review', 'approved', 'rejected', 'expired']);

export const MaintainerRole = z.enum(['owner', 'maintainer', 'contributor']);

export const SortField = z.enum(['name', 'downloads', 'updated', 'created']);

// ============================================================================
// Core Schemas
// ============================================================================

export const MaintainerSchema = z.object({
  username: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: MaintainerRole,
  avatar_url: z.string().url().optional()
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next: z.boolean().optional(),
  has_prev: z.boolean().optional()
});

export const ErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  trace_id: z.string().uuid().optional()
});

// ============================================================================
// Agent Schemas
// ============================================================================

export const AgentSchema = z.object({
  id: z.string().uuid(),
  namespace: z.string(),
  name: z.string(),
  full_name: z.string().optional(),
  description: z.string(),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  latest_version: z.string(),
  downloads: z.number().int().default(0),
  stars: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  certified: z.boolean().default(false),
  compliance: z.array(ComplianceFramework).default([]),
  maintainers: z.array(MaintainerSchema).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const AgentCreateRequestSchema = z.object({
  namespace: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid namespace format'),
  name: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid name format'),
  description: z.string().max(500),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

export const AgentUpdateRequestSchema = z.object({
  description: z.string().max(500).optional(),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

export const AgentListResponseSchema = z.object({
  data: z.array(AgentSchema),
  pagination: PaginationSchema
});

// ============================================================================
// Version Schemas
// ============================================================================

export const VersionSchema = z.object({
  id: z.string().uuid(),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$/),
  agent_id: z.string().uuid(),
  manifest_url: z.string().url(),
  readme: z.string().optional(),
  signature: z.string().optional(),
  verified: z.boolean().default(false),
  downloads: z.number().int().default(0),
  sha256: z.string().optional(),
  size: z.number().int().optional(),
  created_at: z.string().datetime()
});

export const VersionListResponseSchema = z.object({
  data: z.array(VersionSchema),
  pagination: PaginationSchema
});

// ============================================================================
// Search Schemas
// ============================================================================

export const SearchResultSchema = AgentSchema.extend({
  score: z.number().optional(),
  highlight: z.record(z.any()).optional()
});

export const SearchResponseSchema = z.object({
  data: z.array(SearchResultSchema),
  total: z.number().int(),
  query: z.string(),
  pagination: PaginationSchema.optional()
});

// ============================================================================
// Certification Schemas
// ============================================================================

export const CertificationSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  level: CertificationLevel,
  compliance_frameworks: z.array(ComplianceFramework).optional(),
  status: CertificationStatus,
  badge_url: z.string().url().optional(),
  certificate_url: z.string().url().optional(),
  expires_at: z.string().datetime().optional(),
  requested_at: z.string().datetime(),
  reviewed_at: z.string().datetime().optional(),
  notes: z.string().optional()
});

export const CertificationRequestSchema = z.object({
  level: CertificationLevel,
  version: z.string(),
  compliance_frameworks: z.array(ComplianceFramework).optional(),
  documentation_url: z.string().url().optional(),
  notes: z.string().optional()
});

export const CertificationListResponseSchema = z.object({
  data: z.array(CertificationSchema),
  pagination: PaginationSchema
});

// ============================================================================
// Analytics Schemas
// ============================================================================

export const AnalyticsSchema = z.object({
  agent_id: z.string().uuid(),
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }),
  downloads: z
    .object({
      total: z.number().int(),
      by_version: z.record(z.number().int()).optional(),
      by_day: z
        .array(
          z.object({
            date: z.string(),
            count: z.number().int()
          })
        )
        .optional()
    })
    .optional(),
  geography: z.record(z.number().int()).optional(),
  top_referrers: z
    .array(
      z.object({
        url: z.string(),
        count: z.number().int()
      })
    )
    .optional()
});

// ============================================================================
// Query Parameters
// ============================================================================

export const ListAgentsParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: SortField.default('downloads'),
  namespace: z.string().optional(),
  certified: z.boolean().optional(),
  compliance: z.array(ComplianceFramework).optional()
});

export const SearchParamsSchema = z.object({
  q: z.string().min(1),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  filters: z
    .object({
      certified: z.boolean().optional(),
      compliance: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional()
    })
    .optional()
});

export const GetAnalyticsParamsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

// ============================================================================
// Type Exports
// ============================================================================

export type Agent = z.infer<typeof AgentSchema>;
export type AgentCreateRequest = z.infer<typeof AgentCreateRequestSchema>;
export type AgentUpdateRequest = z.infer<typeof AgentUpdateRequestSchema>;
export type AgentListResponse = z.infer<typeof AgentListResponseSchema>;

export type Version = z.infer<typeof VersionSchema>;
export type VersionListResponse = z.infer<typeof VersionListResponseSchema>;

export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export type Certification = z.infer<typeof CertificationSchema>;
export type CertificationRequest = z.infer<typeof CertificationRequestSchema>;
export type CertificationListResponse = z.infer<typeof CertificationListResponseSchema>;

export type Analytics = z.infer<typeof AnalyticsSchema>;

export type Maintainer = z.infer<typeof MaintainerSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ErrorResponse = z.infer<typeof ErrorSchema>;

export type ListAgentsParams = z.infer<typeof ListAgentsParamsSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type GetAnalyticsParams = z.infer<typeof GetAnalyticsParamsSchema>;
