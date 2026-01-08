/**
 * GitHub Sync API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: /Users/flux423/Sites/LLM/OssA/openstandardagents/openapi/github-sync.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:11:54.133Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const gitHubPRSchema = z.object({
  number: z.number().int(),
  title: z.string(),
  body: z.string().nullable().optional(),
  author: z.object({
  login: z.string().optional()
}),
  state: z.enum(["open", "closed"])
});

export type GitHubPR = z.infer<typeof gitHubPRSchema>;

export const gitLabMRSchema = z.object({
  iid: z.number().int(),
  title: z.string(),
  description: z.string().nullable().optional(),
  source_branch: z.string(),
  target_branch: z.string(),
  state: z.enum(["opened", "closed", "merged"]),
  web_url: z.string().url()
});

export type GitLabMR = z.infer<typeof gitLabMRSchema>;
