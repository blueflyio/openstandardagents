/**
 * OSSA Helm Chart Generator API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: /Users/flux423/Sites/LLM/OssA/openstandardagents/openapi/reference-implementations/helm-generator.openapi.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.288Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const generateRequestSchema = z.object({
  manifest: z.record(z.string(), z.unknown()),
  options: generationOptionsSchema.optional()
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const generationOptionsSchema = z.object({
  chart_name: z.string().optional(),
  namespace: z.string().optional(),
  replicas: z.number().int().min(1).optional(),
  image: z.object({
  repository: z.string().optional(),
  tag: z.string().optional(),
  pullPolicy: z.enum(["Always", "IfNotPresent", "Never"]).optional()
}).optional(),
  resources: z.object({
  limits: z.object({
  cpu: z.string().optional(),
  memory: z.string().optional()
}).optional(),
  requests: z.object({
  cpu: z.string().optional(),
  memory: z.string().optional()
}).optional()
}).optional(),
  autoscaling: z.object({
  enabled: z.boolean().optional(),
  minReplicas: z.number().int().optional(),
  maxReplicas: z.number().int().optional(),
  targetCPUUtilization: z.number().int().optional()
}).optional(),
  ingress: z.object({
  enabled: z.boolean().optional(),
  className: z.string().optional(),
  hosts: z.array(z.string()).optional(),
  tls: z.array(z.record(z.string(), z.unknown())).optional()
}).optional(),
  compliance: z.object({
  enabled: z.boolean().optional(),
  frameworks: z.array(z.enum(["fedramp", "iso27001", "soc2", "hipaa"])).optional(),
  policies: z.array(z.string()).optional()
}).optional(),
  monitoring: z.object({
  enabled: z.boolean().optional(),
  prometheus: z.boolean().optional(),
  jaeger: z.boolean().optional()
}).optional()
});

export type GenerationOptions = z.infer<typeof generationOptionsSchema>;

export const generateResponseSchema = z.object({
  chart: z.string(),
  files: z.object({
  Chart.yaml: z.string().optional(),
  values.yaml: z.string().optional(),
  templates: z.record(z.string(), z.unknown()).optional()
}),
  metadata: z.object({
  chart_name: z.string().optional(),
  version: z.string().optional(),
  app_version: z.string().optional(),
  size: z.number().int().optional()
}).optional()
});

export type GenerateResponse = z.infer<typeof generateResponseSchema>;

export const batchGenerateRequestSchema = z.object({
  agents: z.array(z.object({
  manifest: z.record(z.string(), z.unknown()),
  options: generationOptionsSchema.optional()
}))
});

export type BatchGenerateRequest = z.infer<typeof batchGenerateRequestSchema>;

export const batchGenerateResponseSchema = z.object({
  results: z.array(z.object({
  success: z.boolean().optional(),
  chart_name: z.string().optional(),
  chart: z.string().optional(),
  error: z.string().optional()
}))
});

export type BatchGenerateResponse = z.infer<typeof batchGenerateResponseSchema>;

export const validationResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export type ValidationResponse = z.infer<typeof validationResponseSchema>;

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["deployment", "statefulset", "daemonset", "job", "cronjob"]),
  template: z.string().optional(),
  created_at: z.string().datetime().optional()
});

export type Template = z.infer<typeof templateSchema>;

export const templateListResponseSchema = z.object({
  data: z.array(templateSchema)
});

export type TemplateListResponse = z.infer<typeof templateListResponseSchema>;

export const templateCreateRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["deployment", "statefulset", "daemonset", "job", "cronjob"]),
  template: z.string()
});

export type TemplateCreateRequest = z.infer<typeof templateCreateRequestSchema>;

export const errorSchema = z.object({
  error: z.string(),
  message: z.string()
});

export type Error = z.infer<typeof errorSchema>;
