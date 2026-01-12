import { z } from 'zod';

export const GitHubPRSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  author: z.object({
    login: z.string(),
  }),
  state: z.enum(['open', 'closed']),
  labels: z.array(
    z.object({
      name: z.string(),
    })
  ),
  created_at: z.string(),
  updated_at: z.string(),
});

export const GitLabMRSchema = z.object({
  iid: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  source_branch: z.string(),
  target_branch: z.string(),
  state: z.enum(['opened', 'closed', 'merged']),
  web_url: z.string().url(),
});

export const SyncConfigSchema = z.object({
  github: z.object({
    owner: z.string(),
    repo: z.string(),
    token: z.string(),
  }),
  gitlab: z.object({
    projectId: z.string(),
    token: z.string(),
  }),
});

export type GitHubPR = z.infer<typeof GitHubPRSchema>;
export type GitLabMR = z.infer<typeof GitLabMRSchema>;
export type SyncConfig = z.infer<typeof SyncConfigSchema>;
