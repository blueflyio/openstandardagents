/**
 * Unified Agent Gateway - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: openapi/core/unified-agent-gateway.openapi.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.310Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const createAgentRequestSchema = z.object({
  ossa_manifest: z.string().url(),
  deployment_target: z.enum(['kubernetes', 'docker', 'serverless']),
  namespace: z.string().optional(),
  helm_values: z.record(z.string(), z.unknown()).optional(),
  gitlab_package: z.string().optional(),
});

export type CreateAgentRequest = z.infer<typeof createAgentRequestSchema>;

export const agentResponseSchema = z.object({
  agent_id: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(['deploying', 'running', 'error']).optional(),
  endpoints: z
    .object({
      api: z.string().url().optional(),
      health: z.string().url().optional(),
      metrics: z.string().url().optional(),
    })
    .optional(),
  phoenix_traces: z.string().url().optional(),
  helm_release: z.string().optional(),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;

export const agentListSchema = z.object({
  agents: z.array(agentSummarySchema).optional(),
  total: z.number().int().optional(),
});

export type AgentList = z.infer<typeof agentListSchema>;

export const agentSummarySchema = z.object({
  agent_id: z.string().optional(),
  name: z.string().optional(),
  framework: z.string().optional(),
  status: z.string().optional(),
  namespace: z.string().optional(),
});

export type AgentSummary = z.infer<typeof agentSummarySchema>;

export const agentDetailsSchema = z.intersection(
  agentResponseSchema,
  z.object({
    ossa_manifest: z.record(z.string(), z.unknown()).optional(),
    metrics: z.record(z.string(), z.unknown()).optional(),
    recent_tasks: z.array(z.record(z.string(), z.unknown())).optional(),
  })
);

export type AgentDetails = z.infer<typeof agentDetailsSchema>;

export const updateAgentRequestSchema = z.object({
  replicas: z.number().int().optional(),
  image_tag: z.string().optional(),
  helm_values: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateAgentRequest = z.infer<typeof updateAgentRequestSchema>;

export const agentTaskRequestSchema = z.object({
  capability: z.string(),
  input: z.record(z.string(), z.unknown()),
  async: z.boolean().optional(),
});

export type AgentTaskRequest = z.infer<typeof agentTaskRequestSchema>;

export const agentTaskResponseSchema = z.object({
  task_id: z.string().optional(),
  status: z.enum(['queued', 'running', 'completed', 'failed']).optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  traces: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type AgentTaskResponse = z.infer<typeof agentTaskResponseSchema>;

export const drupalContentRequestSchema = z.object({
  type: z.string(),
  title: z.string(),
  body: z.string().optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['published', 'draft']).optional(),
});

export type DrupalContentRequest = z.infer<typeof drupalContentRequestSchema>;

export const drupalContentResponseSchema = z.object({
  nid: z.number().int().optional(),
  uuid: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  url: z.string().url().optional(),
  created: z.string().datetime().optional(),
});

export type DrupalContentResponse = z.infer<typeof drupalContentResponseSchema>;

export const drupalUserRequestSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()).optional(),
});

export type DrupalUserRequest = z.infer<typeof drupalUserRequestSchema>;

export const drupalSiteRequestSchema = z.object({
  site_name: z.string(),
  modules: z.array(z.string()),
  theme: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type DrupalSiteRequest = z.infer<typeof drupalSiteRequestSchema>;

export const drupalJobResponseSchema = z.object({
  job_id: z.string().optional(),
  status: z.string().optional(),
  gitlab_pipeline: z.string().url().optional(),
});

export type DrupalJobResponse = z.infer<typeof drupalJobResponseSchema>;

export const workflowRequestSchema = z.object({
  framework: z.enum(['langflow', 'langchain', 'kagent']),
  definition: z.record(z.string(), z.unknown()),
  agents: z.array(z.string()).optional(),
});

export type WorkflowRequest = z.infer<typeof workflowRequestSchema>;

export const studioSessionRequestSchema = z.object({
  device_type: z.enum(['ios', 'ipad', 'carplay', 'watch']),
  repository: z.string(),
  branch: z.string().optional(),
});

export type StudioSessionRequest = z.infer<typeof studioSessionRequestSchema>;

export const studioSessionResponseSchema = z.object({
  session_id: z.string().optional(),
  websocket_url: z.string().url().optional(),
  api_endpoint: z.string().url().optional(),
  expires_at: z.string().datetime().optional(),
});

export type StudioSessionResponse = z.infer<typeof studioSessionResponseSchema>;

export const studioTaskRequestSchema = z.object({
  task_type: z.enum(['code', 'test', 'deploy', 'review']),
  description: z.string(),
  files: z.array(z.string()).optional(),
  agent_id: z.string().optional(),
});

export type StudioTaskRequest = z.infer<typeof studioTaskRequestSchema>;

export const gitLabPipelineRequestSchema = z.object({
  project: z.string(),
  ref: z.string(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

export type GitLabPipelineRequest = z.infer<typeof gitLabPipelineRequestSchema>;

export const gitLabPackageSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  package_type: z.enum(['npm', 'python', 'generic']).optional(),
  url: z.string().url().optional(),
});

export type GitLabPackage = z.infer<typeof gitLabPackageSchema>;

export const serviceEndpointSchema = z.object({
  service_id: z.string().optional(),
  name: z.string().optional(),
  url: z.string().url().optional(),
  capabilities: z.array(z.string()).optional(),
  health: z.enum(['healthy', 'degraded', 'unhealthy']).optional(),
  framework: z.string().optional(),
});

export type ServiceEndpoint = z.infer<typeof serviceEndpointSchema>;
