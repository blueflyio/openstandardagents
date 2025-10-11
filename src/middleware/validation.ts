import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { getService, ILoggerService, TOKENS } from '../container/dependency-container';

// ===== TYPE-SAFE: Zod-based validation middleware =====

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

/**
 * Create Zod validation middleware
 */
export function createZodValidation(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const logger = getService<ILoggerService>(TOKENS.LOGGER_SERVICE);

    try {
      // Validate request body
      if (options.body) {
        const validatedBody = options.body.parse(req.body);
        req.body = validatedBody;
        logger.debug('Request body validated', { schema: 'body' });
      }

      // Validate query parameters
      if (options.query) {
        const validatedQuery = options.query.parse(req.query);
        req.query = validatedQuery;
        logger.debug('Query parameters validated', { schema: 'query' });
      }

      // Validate route parameters
      if (options.params) {
        const validatedParams = options.params.parse(req.params);
        req.params = validatedParams;
        logger.debug('Route parameters validated', { schema: 'params' });
      }

      // Validate headers
      if (options.headers) {
        const validatedHeaders = options.headers.parse(req.headers);
        req.headers = { ...req.headers, ...validatedHeaders };
        logger.debug('Headers validated', { schema: 'headers' });
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation failed', {
          errors: error.errors,
          path: req.path,
          method: req.method
        });

        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          })),
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Validation middleware error',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Validate request body only
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return createZodValidation({ body: schema });
}

/**
 * Validate query parameters only
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return createZodValidation({ query: schema });
}

/**
 * Validate route parameters only
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return createZodValidation({ params: schema });
}

/**
 * Validate headers only
 */
export function validateHeaders<T>(schema: z.ZodSchema<T>) {
  return createZodValidation({ headers: schema });
}

// ===== COMMON VALIDATION SCHEMAS =====

export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export const SearchSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional()
});

export const AgentClassSchema = z.object({
  class: z.enum(['general', 'specialist', 'workflow', 'integration']).optional()
});

export const AgentTierSchema = z.object({
  tier: z.enum(['core', 'governed', 'advanced']).optional()
});

export const AgentStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'deploying', 'failed', 'terminated']).optional()
});

export const WorkflowStatusSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional()
});

export const SpecificationTypeSchema = z.object({
  type: z.enum(['ossa', 'acdl', 'voice-agent', 'orchestration', 'project-discovery']).optional()
});

export const SpecificationStatusSchema = z.object({
  status: z.enum(['draft', 'review', 'approved', 'deprecated']).optional()
});

// ===== COMPOSED VALIDATION SCHEMAS =====

export const GetAgentsQuerySchema = PaginationSchema.merge(SortSchema)
  .merge(SearchSchema)
  .merge(AgentClassSchema)
  .merge(AgentTierSchema)
  .merge(AgentStatusSchema);

export const GetWorkflowsQuerySchema = PaginationSchema.merge(SortSchema)
  .merge(SearchSchema)
  .merge(WorkflowStatusSchema);

export const GetSpecificationsQuerySchema = PaginationSchema.merge(SortSchema)
  .merge(SearchSchema)
  .merge(SpecificationTypeSchema)
  .merge(SpecificationStatusSchema);

export const GetAgentParamsSchema = z.object({
  id: z.string().uuid()
});

export const GetWorkflowParamsSchema = z.object({
  id: z.string().uuid()
});

export const GetSpecificationParamsSchema = z.object({
  id: z.string().uuid()
});

// ===== VALIDATION MIDDLEWARE EXPORTS =====
export const validateGetAgents = createZodValidation({
  query: GetAgentsQuerySchema
});

export const validateGetWorkflows = createZodValidation({
  query: GetWorkflowsQuerySchema
});

export const validateGetSpecifications = createZodValidation({
  query: GetSpecificationsQuerySchema
});

export const validateGetAgent = createZodValidation({
  params: GetAgentParamsSchema
});

export const validateGetWorkflow = createZodValidation({
  params: GetWorkflowParamsSchema
});

export const validateGetSpecification = createZodValidation({
  params: GetSpecificationParamsSchema
});

// ===== VALIDATION UTILITIES =====
export function createValidationError(field: string, message: string, code: string = 'VALIDATION_ERROR') {
  return {
    code,
    message: 'Validation failed',
    details: [
      {
        field,
        message,
        code
      }
    ],
    timestamp: new Date().toISOString()
  };
}

export function createValidationSuccess(data: any) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

export function validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
