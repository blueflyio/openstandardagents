/**
 * OSSA Master API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: openapi/core/ossa-core-api.openapi.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.329Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const agentManifestSchema = CommonSchemas.agentManifestSchema;

export type AgentManifest = z.infer<typeof agentManifestSchema>;

export const metadataSchema = CommonSchemas.metadataSchema;

export type Metadata = z.infer<typeof metadataSchema>;

export const agentSpecSchema = CommonSchemas.agentSpecSchema;

export type AgentSpec = z.infer<typeof agentSpecSchema>;

export const agentTypeSchema = CommonSchemas.agentTypeSchema;

export type AgentType = z.infer<typeof agentTypeSchema>;

export const agentStatusSchema = CommonSchemas.agentStatusSchema;

export type AgentStatus = z.infer<typeof agentStatusSchema>;

export const capabilitySchema = CommonSchemas.capabilitySchema;

export type Capability = z.infer<typeof capabilitySchema>;

export const interfaceSchema = CommonSchemas.interfaceSchema;

export type Interface = z.infer<typeof interfaceSchema>;

export const requirementsSchema = CommonSchemas.requirementsSchema;

export type Requirements = z.infer<typeof requirementsSchema>;

export const resourceRequirementsSchema =
  CommonSchemas.resourceRequirementsSchema;

export type ResourceRequirements = z.infer<typeof resourceRequirementsSchema>;

export const agentSchema = z.object({
  id: z.string().uuid().optional(),
  manifest: agentManifestSchema.optional(),
  status: agentStatusSchema.optional(),
  registration: agentRegistrationSchema.optional(),
  certification: certificationSchema.optional(),
  metrics: agentMetricsSchema.optional(),
});

export type Agent = z.infer<typeof agentSchema>;

export const agentRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  registeredAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  registeredBy: z.string().optional(),
  federationNode: z.string().optional(),
});

export type AgentRegistration = z.infer<typeof agentRegistrationSchema>;

export const agentsListSchema = z.object({
  agents: z.array(agentSchema).optional(),
  total: z.number().int().optional(),
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
});

export type AgentsList = z.infer<typeof agentsListSchema>;

export const workflowDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  steps: z.array(workflowStepSchema),
  triggers: z.array(workflowTriggerSchema).optional(),
  timeout: z.number().int().optional(),
  retryPolicy: retryPolicySchema.optional(),
});

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

export const workflowStepSchema = z.object({
  name: z.string(),
  agentType: z.string(),
  action: z.string(),
  input: z.record(z.string(), z.unknown()).optional(),
  dependencies: z.array(z.string()).optional(),
  condition: z.string().optional(),
  timeout: z.number().int().optional(),
  retryPolicy: retryPolicySchema.optional(),
});

export type WorkflowStep = z.infer<typeof workflowStepSchema>;

export const workflowTriggerSchema = z.object({
  type: z.enum(['manual', 'scheduled', 'event', 'webhook']).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>;

export const retryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).optional(),
  backoffType: z.enum(['fixed', 'exponential']).optional(),
  initialDelay: z.number().int().optional(),
  maxDelay: z.number().int().optional(),
});

export type RetryPolicy = z.infer<typeof retryPolicySchema>;

export const workflowSchema = z.object({
  id: z.string().uuid().optional(),
  definition: workflowDefinitionSchema.optional(),
  status: z.enum(['draft', 'active', 'suspended', 'deprecated']).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Workflow = z.infer<typeof workflowSchema>;

export const workflowsListSchema = z.object({
  workflows: z.array(workflowSchema).optional(),
  total: z.number().int().optional(),
});

export type WorkflowsList = z.infer<typeof workflowsListSchema>;

export const workflowExecutionRequestSchema = z.object({
  input: z.record(z.string(), z.unknown()).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
});

export type WorkflowExecutionRequest = z.infer<
  typeof workflowExecutionRequestSchema
>;

export const workflowExecutionSchema = z.object({
  id: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  status: z
    .enum(['pending', 'running', 'completed', 'failed', 'cancelled'])
    .optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  steps: z.array(stepExecutionSchema).optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  errors: z.array(executionErrorSchema).optional(),
});

export type WorkflowExecution = z.infer<typeof workflowExecutionSchema>;

export const stepExecutionSchema = z.object({
  name: z.string().optional(),
  status: z
    .enum(['pending', 'running', 'completed', 'failed', 'skipped'])
    .optional(),
  agentId: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  error: executionErrorSchema.optional(),
});

export type StepExecution = z.infer<typeof stepExecutionSchema>;

export const executionErrorSchema = CommonSchemas.executionErrorSchema;

export type ExecutionError = z.infer<typeof executionErrorSchema>;

export const taxonomiesListSchema = z.object({
  taxonomies: z.array(taxonomySchema).optional(),
});

export type TaxonomiesList = z.infer<typeof taxonomiesListSchema>;

export const taxonomySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  version: z.string().optional(),
});

export type Taxonomy = z.infer<typeof taxonomySchema>;

export const capabilitiesListSchema = z.object({
  capabilities: z.array(capabilityDefinitionSchema).optional(),
});

export type CapabilitiesList = z.infer<typeof capabilitiesListSchema>;

export const capabilityDefinitionSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  inputSchema: z.record(z.string(), z.unknown()).optional(),
  outputSchema: z.record(z.string(), z.unknown()).optional(),
  examples: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type CapabilityDefinition = z.infer<typeof capabilityDefinitionSchema>;

export const validationResultSchema = z.object({
  valid: z.boolean().optional(),
  errors: z.array(validationErrorSchema).optional(),
  warnings: z.array(validationWarningSchema).optional(),
  score: z.number().min(0).max(100).optional(),
});

export type ValidationResult = z.infer<typeof validationResultSchema>;

export const validationErrorSchema = CommonSchemas.validationErrorSchema;

export type ValidationError = z.infer<typeof validationErrorSchema>;

export const validationWarningSchema = CommonSchemas.validationWarningSchema;

export type ValidationWarning = z.infer<typeof validationWarningSchema>;

export const certificationRequestSchema = z.object({
  agentId: z.string().uuid(),
  level: z.enum(['basic', 'standard', 'advanced', 'enterprise']),
  evidence: z.array(evidenceSchema).optional(),
});

export type CertificationRequest = z.infer<typeof certificationRequestSchema>;

export const evidenceSchema = z.object({
  type: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type Evidence = z.infer<typeof evidenceSchema>;

export const certificationProcessSchema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_review', 'approved', 'rejected']).optional(),
  requestedAt: z.string().datetime().optional(),
  steps: z.array(certificationStepSchema).optional(),
});

export type CertificationProcess = z.infer<typeof certificationProcessSchema>;

export const certificationStepSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['pending', 'passed', 'failed']).optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});

export type CertificationStep = z.infer<typeof certificationStepSchema>;

export const certificationSchema = z.object({
  id: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  level: z.string().optional(),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  issuer: z.string().optional(),
  signature: z.string().optional(),
});

export type Certification = z.infer<typeof certificationSchema>;

export const policiesListSchema = z.object({
  policies: z.array(policySchema).optional(),
});

export type PoliciesList = z.infer<typeof policiesListSchema>;

export const policySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['security', 'compliance', 'operational', 'quality']).optional(),
  rules: z.array(policyRuleSchema).optional(),
  enforcement: z.enum(['mandatory', 'recommended', 'optional']).optional(),
});

export type Policy = z.infer<typeof policySchema>;

export const policyRuleSchema = z.object({
  id: z.string().optional(),
  condition: z.string().optional(),
  action: z.string().optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
});

export type PolicyRule = z.infer<typeof policyRuleSchema>;

export const complianceStatusSchema = z.object({
  agentId: z.string().optional(),
  compliant: z.boolean().optional(),
  policies: z.array(policyComplianceSchema).optional(),
  score: z.number().min(0).max(100).optional(),
  lastChecked: z.string().datetime().optional(),
});

export type ComplianceStatus = z.infer<typeof complianceStatusSchema>;

export const policyComplianceSchema = z.object({
  policyId: z.string().optional(),
  compliant: z.boolean().optional(),
  violations: z.array(violationSchema).optional(),
});

export type PolicyCompliance = z.infer<typeof policyComplianceSchema>;

export const violationSchema = z.object({
  ruleId: z.string().optional(),
  message: z.string().optional(),
  severity: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export type Violation = z.infer<typeof violationSchema>;

export const federationNodesListSchema = z.object({
  nodes: z.array(federationNodeSchema).optional(),
});

export type FederationNodesList = z.infer<typeof federationNodesListSchema>;

export const federationNodeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  endpoint: z.string().url().optional(),
  status: z.enum(['online', 'offline', 'degraded']).optional(),
  region: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  joinedAt: z.string().datetime().optional(),
});

export type FederationNode = z.infer<typeof federationNodeSchema>;

export const federationJoinRequestSchema = z.object({
  nodeName: z.string(),
  endpoint: z.string().url(),
  capabilities: z.array(z.string()).optional(),
  region: z.string().optional(),
  certificate: z.string().optional(),
});

export type FederationJoinRequest = z.infer<typeof federationJoinRequestSchema>;

export const federationMembershipSchema = z.object({
  nodeId: z.string().uuid().optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  joinedAt: z.string().datetime().optional(),
  certificate: z.string().optional(),
});

export type FederationMembership = z.infer<typeof federationMembershipSchema>;

export const platformMetricsSchema = z.object({
  agents: agentsMetricsSchema.optional(),
  workflows: workflowsMetricsSchema.optional(),
  federation: federationMetricsSchema.optional(),
  system: systemMetricsSchema.optional(),
});

export type PlatformMetrics = z.infer<typeof platformMetricsSchema>;

export const agentsMetricsSchema = z.object({
  total: z.number().int().optional(),
  active: z.number().int().optional(),
  byType: z.record(z.string(), z.unknown()).optional(),
  byStatus: z.record(z.string(), z.unknown()).optional(),
});

export type AgentsMetrics = z.infer<typeof agentsMetricsSchema>;

export const workflowsMetricsSchema = z.object({
  total: z.number().int().optional(),
  executions: z
    .object({
      total: z.number().int().optional(),
      running: z.number().int().optional(),
      completed: z.number().int().optional(),
      failed: z.number().int().optional(),
    })
    .optional(),
  averageDuration: z.number().optional(),
  successRate: z.number().optional(),
});

export type WorkflowsMetrics = z.infer<typeof workflowsMetricsSchema>;

export const federationMetricsSchema = z.object({
  nodes: z.number().int().optional(),
  onlineNodes: z.number().int().optional(),
  totalAgents: z.number().int().optional(),
  crossNodeTraffic: z.number().int().optional(),
});

export type FederationMetrics = z.infer<typeof federationMetricsSchema>;

export const systemMetricsSchema = z.object({
  cpu: z.number().optional(),
  memory: z.number().optional(),
  storage: z.number().optional(),
  requestRate: z.number().optional(),
  errorRate: z.number().optional(),
});

export type SystemMetrics = z.infer<typeof systemMetricsSchema>;

export const agentMetricsSchema = CommonSchemas.agentMetricsSchema;

export type AgentMetrics = z.infer<typeof agentMetricsSchema>;

export const eventsListSchema = z.object({
  events: z.array(eventSchema).optional(),
  total: z.number().int().optional(),
});

export type EventsList = z.infer<typeof eventsListSchema>;

export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type Event = z.infer<typeof eventSchema>;

export const healthStatusSchema = CommonSchemas.healthStatusSchema;

export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const problemSchema = CommonSchemas.problemSchema;

export type Problem = z.infer<typeof problemSchema>;
