/**
 * Release Automation - Zod Schemas
 * DRY: Reusable validation schemas for release entities
 */

import { z } from 'zod';

/**
 * Version pattern: v0.2.5, 0.2.5-RC, 0.2.5-dev.1, etc.
 */
const VersionPattern = z
  .string()
  .regex(/^v?[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9]+(\.[0-9]+)?)?$/, {
    message: 'Invalid version format. Expected: v0.2.5, 0.2.5-RC, 0.2.5-dev.1',
  });

/**
 * Tag name pattern: v0.2.5-RC, v0.2.5-dev.1, etc.
 */
const TagNamePattern = z
  .string()
  .regex(/^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.?[0-9]+)?$/, {
    message: 'Invalid tag format. Expected: v0.2.5-RC, v0.2.5-dev.1',
  });

/**
 * Git commit SHA pattern
 */
const CommitShaPattern = z.string().regex(/^[0-9a-f]{40}$/, {
  message: 'Invalid commit SHA. Must be 40 character hex string',
});

/**
 * Release State
 */
export const ReleaseStateSchema = z.enum([
  'draft',
  'dev',
  'rc',
  'released',
  'deprecated',
]);

/**
 * Tag Type
 */
export const TagTypeSchema = z.enum(['dev', 'rc', 'release']);

/**
 * Milestone State
 */
export const MilestoneStateSchema = z.enum(['active', 'closed']);

/**
 * Merge Request State
 */
export const MergeRequestStateSchema = z.enum([
  'opened',
  'closed',
  'merged',
  'locked',
]);

/**
 * Merge Status
 */
export const MergeStatusSchema = z.enum([
  'can_be_merged',
  'cannot_be_merged',
  'checking',
  'unchecked',
]);

/**
 * Base Pagination Schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().min(1).max(100).default(20),
});

/**
 * Release Schema
 */
export const ReleaseSchema = z.object({
  id: z.string(),
  version: VersionPattern,
  state: ReleaseStateSchema,
  milestoneId: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  mergeRequestId: z.number().int().positive().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  releasedAt: z.string().datetime().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Create Release Request
 */
export const CreateReleaseRequestSchema = z.object({
  version: VersionPattern,
  milestoneId: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Update Release Request
 */
export const UpdateReleaseRequestSchema = z.object({
  state: ReleaseStateSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Milestone Schema
 */
export const MilestoneSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().optional(),
  state: MilestoneStateSchema,
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  statistics: z
    .object({
      totalIssues: z.number().int().nonnegative().default(0),
      closedIssues: z.number().int().nonnegative().default(0),
      openIssues: z.number().int().nonnegative().default(0),
      completionPercentage: z.number().min(0).max(100).default(0),
    })
    .default({
      totalIssues: 0,
      closedIssues: 0,
      openIssues: 0,
      completionPercentage: 0,
    }),
});

/**
 * Create Milestone Request
 */
export const CreateMilestoneRequestSchema = z.object({
  title: z.string().regex(/^v?[0-9]+\.[0-9]+\.[0-9]+/, {
    message: 'Milestone title must contain version (e.g., v0.3.0)',
  }),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
});

/**
 * Update Milestone Request
 */
export const UpdateMilestoneRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  state: MilestoneStateSchema.optional(),
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
});

/**
 * Tag Schema
 */
export const TagSchema = z.object({
  name: TagNamePattern,
  type: TagTypeSchema,
  version: VersionPattern,
  commitSha: CommitShaPattern,
  message: z.string().optional(),
  createdAt: z.string().datetime(),
  ref: z.string(),
});

/**
 * Create Tag Request
 */
export const CreateTagRequestSchema = z.object({
  name: TagNamePattern,
  ref: z.string(),
  message: z.string().optional(),
});

/**
 * Merge Request Schema
 */
export const MergeRequestSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().optional(),
  sourceBranch: z.string(),
  targetBranch: z.string(),
  state: MergeRequestStateSchema,
  mergeStatus: MergeStatusSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  mergedAt: z.string().datetime().nullable().optional(),
  labels: z.array(z.string()).default([]),
  approvals: z
    .object({
      required: z.number().int().nonnegative().default(0),
      received: z.number().int().nonnegative().default(0),
    })
    .default({ required: 0, received: 0 }),
});

/**
 * Create Merge Request Request
 */
export const CreateMergeRequestRequestSchema = z.object({
  sourceBranch: z.string().min(1),
  targetBranch: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  labels: z.array(z.string()).default([]),
  milestoneId: z.number().int().positive().optional(),
});

/**
 * Update Merge Request Request
 */
export const UpdateMergeRequestRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  state: MergeRequestStateSchema.optional(),
  labels: z.array(z.string()).optional(),
});

/**
 * Webhook Payloads
 */
export const MilestoneWebhookPayloadSchema = z.object({
  object_kind: z.literal('milestone'),
  project: z.object({
    id: z.number().int().positive(),
    path_with_namespace: z.string(),
  }),
  object_attributes: z.object({
    id: z.number().int().positive(),
    title: z.string(),
    state: MilestoneStateSchema,
    created_at: z.string(),
    updated_at: z.string(),
  }),
});

export const PushWebhookPayloadSchema = z.object({
  object_kind: z.literal('push'),
  project: z.object({
    id: z.number().int().positive(),
  }),
  ref: z.string(),
  commits: z.array(z.record(z.string(), z.unknown())).default([]),
});

/**
 * Webhook Response
 */
export const WebhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        status: z.string(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([])
    .optional(),
});

/**
 * Error Response
 */
export const ErrorResponseSchema = z
  .object({
    message: z.string(),
    code: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

/**
 * List Response (with pagination)
 */
export function createListResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    items: z.array(itemSchema),
    pagination: PaginationSchema.extend({
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  });
}

/**
 * Type exports for TypeScript
 */
export type Release = z.infer<typeof ReleaseSchema>;
export type CreateReleaseRequest = z.infer<typeof CreateReleaseRequestSchema>;
export type UpdateReleaseRequest = z.infer<typeof UpdateReleaseRequestSchema>;

export type Milestone = z.infer<typeof MilestoneSchema>;
export type CreateMilestoneRequest = z.infer<
  typeof CreateMilestoneRequestSchema
>;
export type UpdateMilestoneRequest = z.infer<
  typeof UpdateMilestoneRequestSchema
>;

export type Tag = z.infer<typeof TagSchema>;
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>;

export type MergeRequest = z.infer<typeof MergeRequestSchema>;
export type CreateMergeRequestRequest = z.infer<
  typeof CreateMergeRequestRequestSchema
>;
export type UpdateMergeRequestRequest = z.infer<
  typeof UpdateMergeRequestRequestSchema
>;

export type MilestoneWebhookPayload = z.infer<
  typeof MilestoneWebhookPayloadSchema
>;
export type PushWebhookPayload = z.infer<typeof PushWebhookPayloadSchema>;
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
