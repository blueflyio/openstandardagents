import { z } from 'zod';

// ===== OPENAPI-FIRST: Zod schemas derived from OpenAPI spec =====

// ===== OSSA CORE SCHEMAS =====

export const AgentClassSchema = z.enum(['general', 'specialist', 'workflow', 'integration']);
export const AgentTierSchema = z.enum(['core', 'governed', 'advanced']);
export const AgentStatusSchema = z.enum(['active', 'inactive', 'deploying', 'failed', 'terminated']);

export const AgentCapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()).optional(),
  required: z.boolean().default(false),
  version: z.string().optional()
});

export const AgentMetadataSchema = z.object({
  version: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  license: z.string().optional(),
  repository: z.string().optional(),
  documentation: z.string().optional()
});

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  class: AgentClassSchema,
  tier: AgentTierSchema,
  status: AgentStatusSchema,
  capabilities: z.array(AgentCapabilitySchema),
  metadata: AgentMetadataSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deployedAt: z.string().datetime().optional(),
  lastHealthCheck: z.string().datetime().optional(),
  healthStatus: z.enum(['healthy', 'unhealthy', 'degraded']).optional()
});

// ===== ORCHESTRATION SCHEMAS =====

export const WorkflowStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
export const TaskStatusSchema = z.enum(['pending', 'assigned', 'running', 'completed', 'failed', 'cancelled']);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema,
  assignedAgent: z.string().uuid().optional(),
  parameters: z.record(z.any()).optional(),
  result: z.any().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  status: WorkflowStatusSchema,
  tasks: z.array(TaskSchema),
  parameters: z.record(z.any()).optional(),
  result: z.any().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

// ===== SPECIFICATION SCHEMAS =====

export const SpecificationTypeSchema = z.enum(['ossa', 'acdl', 'voice-agent', 'orchestration', 'project-discovery']);
export const SpecificationStatusSchema = z.enum(['draft', 'review', 'approved', 'deprecated']);

export const SpecificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: SpecificationTypeSchema,
  status: SpecificationStatusSchema,
  version: z.string(),
  description: z.string(),
  content: z.string(), // OpenAPI YAML content
  metadata: AgentMetadataSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  approvedAt: z.string().datetime().optional()
});

// ===== MONITORING SCHEMAS =====

export const MetricTypeSchema = z.enum(['counter', 'gauge', 'histogram', 'summary']);
export const AlertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const MetricSchema = z.object({
  name: z.string(),
  type: MetricTypeSchema,
  value: z.number(),
  labels: z.record(z.string()).optional(),
  timestamp: z.string().datetime()
});

export const AlertSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  severity: AlertSeveritySchema,
  condition: z.string(),
  threshold: z.number(),
  currentValue: z.number(),
  status: z.enum(['active', 'resolved', 'acknowledged']),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional()
});

// ===== REQUEST/RESPONSE SCHEMAS =====

export const CreateAgentRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  class: AgentClassSchema,
  tier: AgentTierSchema,
  capabilities: z.array(AgentCapabilitySchema),
  metadata: AgentMetadataSchema.optional()
});

export const UpdateAgentRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  class: AgentClassSchema.optional(),
  tier: AgentTierSchema.optional(),
  capabilities: z.array(AgentCapabilitySchema).optional(),
  metadata: AgentMetadataSchema.optional()
});

export const CreateWorkflowRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  tasks: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      parameters: z.record(z.any()).optional()
    })
  ),
  parameters: z.record(z.any()).optional()
});

export const CreateSpecificationRequestSchema = z.object({
  name: z.string(),
  type: SpecificationTypeSchema,
  description: z.string(),
  content: z.string(),
  metadata: AgentMetadataSchema.optional()
});

export const GetAgentsRequestSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  class: AgentClassSchema.optional(),
  tier: AgentTierSchema.optional(),
  status: AgentStatusSchema.optional(),
  search: z.string().optional()
});

export const GetWorkflowsRequestSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  status: WorkflowStatusSchema.optional(),
  search: z.string().optional()
});

export const GetSpecificationsRequestSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  type: SpecificationTypeSchema.optional(),
  status: SpecificationStatusSchema.optional(),
  search: z.string().optional()
});

// ===== API RESPONSE SCHEMAS =====

export const PaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean()
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  timestamp: z.string().datetime(),
  pagination: PaginationSchema.optional()
});

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        code: z.string().optional()
      })
    )
    .optional(),
  timestamp: z.string().datetime(),
  traceId: z.string().optional()
});

// ===== DRY: Single source of truth schemas =====
export const OSSASchemas = {
  // Core entities
  Agent: AgentSchema,
  Workflow: WorkflowSchema,
  Task: TaskSchema,
  Specification: SpecificationSchema,
  Metric: MetricSchema,
  Alert: AlertSchema,

  // Requests
  CreateAgentRequest: CreateAgentRequestSchema,
  UpdateAgentRequest: UpdateAgentRequestSchema,
  CreateWorkflowRequest: CreateWorkflowRequestSchema,
  CreateSpecificationRequest: CreateSpecificationRequestSchema,
  GetAgentsRequest: GetAgentsRequestSchema,
  GetWorkflowsRequest: GetWorkflowsRequestSchema,
  GetSpecificationsRequest: GetSpecificationsRequestSchema,

  // Responses
  ApiResponse: ApiResponseSchema,
  ErrorResponse: ErrorResponseSchema,
  Pagination: PaginationSchema,

  // Sub-schemas
  AgentCapability: AgentCapabilitySchema,
  AgentMetadata: AgentMetadataSchema,
  AgentClass: AgentClassSchema,
  AgentTier: AgentTierSchema,
  AgentStatus: AgentStatusSchema,
  WorkflowStatus: WorkflowStatusSchema,
  TaskStatus: TaskStatusSchema,
  SpecificationType: SpecificationTypeSchema,
  SpecificationStatus: SpecificationStatusSchema,
  MetricType: MetricTypeSchema,
  AlertSeverity: AlertSeveritySchema
} as const;

// ===== TYPE-SAFE: Auto-generated types from schemas =====
export type Agent = z.infer<typeof AgentSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Specification = z.infer<typeof SpecificationSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;
export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequestSchema>;
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type CreateSpecificationRequest = z.infer<typeof CreateSpecificationRequestSchema>;
export type GetAgentsRequest = z.infer<typeof GetAgentsRequestSchema>;
export type GetWorkflowsRequest = z.infer<typeof GetWorkflowsRequestSchema>;
export type GetSpecificationsRequest = z.infer<typeof GetSpecificationsRequestSchema>;
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data: T };
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;

// ===== VALIDATION HELPERS =====
export function validateAgent(data: unknown): Agent {
  return AgentSchema.parse(data);
}

export function validateWorkflow(data: unknown): Workflow {
  return WorkflowSchema.parse(data);
}

export function validateSpecification(data: unknown): Specification {
  return SpecificationSchema.parse(data);
}

export function validateCreateAgentRequest(data: unknown): CreateAgentRequest {
  return CreateAgentRequestSchema.parse(data);
}

export function validateUpdateAgentRequest(data: unknown): UpdateAgentRequest {
  return UpdateAgentRequestSchema.parse(data);
}

export function validateCreateWorkflowRequest(data: unknown): CreateWorkflowRequest {
  return CreateWorkflowRequestSchema.parse(data);
}

export function validateCreateSpecificationRequest(data: unknown): CreateSpecificationRequest {
  return CreateSpecificationRequestSchema.parse(data);
}

export function validateGetAgentsRequest(data: unknown): GetAgentsRequest {
  return GetAgentsRequestSchema.parse(data);
}

export function validateGetWorkflowsRequest(data: unknown): GetWorkflowsRequest {
  return GetWorkflowsRequestSchema.parse(data);
}

export function validateGetSpecificationsRequest(data: unknown): GetSpecificationsRequest {
  return GetSpecificationsRequestSchema.parse(data);
}

// ===== RUNTIME VALIDATION MIDDLEWARE =====
export function createZodValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedBody = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          timestamp: new Date().toISOString()
        });
        return;
      }
      next(error);
    }
  };
}
