/**
 * OSSA Agents Router
 * Complete CRUD operations for agent management with OpenAPI 3.1 compliance
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AgentService } from '../services/AgentService';
import { ExecutionService } from '../services/ExecutionService';
import { WebhookService } from '../services/WebhookService';
import {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  ExecutionRequest,
  AgentListQuery,
  JsonPatchOperation
} from '../types/agent';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateAgentAccess } from '../middleware/agentAccess';

export const agentsRouter = Router();

// Services injection (in real app, use DI container)
let agentService: AgentService;
let executionService: ExecutionService;
let webhookService: WebhookService;

// Initialize services
export function initializeAgentRouter(
  agentSvc: AgentService,
  executionSvc: ExecutionService,
  webhookSvc: WebhookService
) {
  agentService = agentSvc;
  executionService = executionSvc;
  webhookService = webhookSvc;
}

// Validation rules
const agentIdValidation = [
  param('agent_id')
    .matches(/^[a-z0-9-]+$/)
    .isLength({ min: 3, max: 63 })
    .withMessage('Agent ID must be 3-63 characters, lowercase alphanumeric with hyphens')
];

const createAgentValidation = [
  body('type')
    .isIn(['worker', 'orchestrator', 'critic', 'judge', 'monitor', 'governor'])
    .withMessage('Invalid agent type'),
  body('name').isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be max 1000 characters'),
  body('version')
    .optional()
    .matches(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    )
    .withMessage('Version must follow semantic versioning'),
  body('capabilities').isArray({ min: 1, max: 50 }).withMessage('Capabilities must be array with 1-50 items'),
  body('capabilities.*')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Each capability must be lowercase alphanumeric with hyphens'),
  body('configuration').optional().isObject().withMessage('Configuration must be an object'),
  body('webhook_url').optional().isURL().withMessage('Webhook URL must be valid URL')
];

const updateAgentValidation = [
  ...agentIdValidation,
  body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be max 1000 characters'),
  body('version')
    .optional()
    .matches(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    )
    .withMessage('Version must follow semantic versioning'),
  body('capabilities')
    .optional()
    .isArray({ min: 1, max: 50 })
    .withMessage('Capabilities must be array with 1-50 items'),
  body('expected_version')
    .optional()
    .matches(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    )
    .withMessage('Expected version must follow semantic versioning')
];

const executeAgentValidation = [
  ...agentIdValidation,
  body('operation').isLength({ min: 1, max: 255 }).withMessage('Operation must be 1-255 characters'),
  body('input').isObject().withMessage('Input must be an object'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  query('timeout').optional().isInt({ min: 1, max: 3600 }).withMessage('Timeout must be 1-3600 seconds'),
  query('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be 1-10')
];

const listAgentsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('type')
    .optional()
    .isIn(['worker', 'orchestrator', 'critic', 'judge', 'monitor', 'governor'])
    .withMessage('Invalid agent type'),
  query('status')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return ['active', 'inactive', 'error', 'deploying', 'maintenance', 'deprecated'].includes(value);
      }
      if (Array.isArray(value)) {
        return value.every((v) =>
          ['active', 'inactive', 'error', 'deploying', 'maintenance', 'deprecated'].includes(v)
        );
      }
      return false;
    })
    .withMessage('Invalid status value(s)'),
  query('created_after').optional().isISO8601().withMessage('created_after must be valid ISO 8601 date'),
  query('performance_min').optional().isFloat({ min: 0, max: 100 }).withMessage('performance_min must be 0-100')
];

// GET /agents - List all agents
agentsRouter.get(
  '/',
  listAgentsValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const query: AgentListQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      type: req.query.type as string,
      status: Array.isArray(req.query.status)
        ? (req.query.status as string[])
        : req.query.status
          ? [req.query.status as string]
          : undefined,
      capabilities: Array.isArray(req.query.capabilities)
        ? (req.query.capabilities as string[])
        : req.query.capabilities
          ? [req.query.capabilities as string]
          : undefined,
      created_after: req.query.created_after as string,
      performance_min: req.query.performance_min ? parseFloat(req.query.performance_min as string) : undefined,
      sort: (req.query.sort as string) || 'created_at'
    };

    const result = await agentService.listAgents(query);

    // Set up webhook callback if agents are found
    if (result.agents.length > 0 && req.body.webhook_url) {
      await webhookService.registerCallback('agentStatusChange', req.body.webhook_url);
    }

    res.json(result);
  })
);

// POST /agents - Create new agent
agentsRouter.post(
  '/',
  createAgentValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid agent data',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const createRequest: CreateAgentRequest = req.body;
    const userId = req.user?.id; // From auth middleware
    const organizationId = req.user?.organization_id;

    try {
      const agent = await agentService.createAgent(createRequest, userId, organizationId);

      // Send webhook notification if URL provided
      if (createRequest.webhook_url) {
        await webhookService.sendWebhook(
          'agentCreated',
          {
            event_type: 'agent.created',
            event_id: require('uuid').v4(),
            timestamp: new Date().toISOString(),
            agent,
            organization_id: organizationId,
            user_id: userId
          },
          createRequest.webhook_url
        );
      }

      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return res.status(409).json({
            error: 'CONFLICT',
            message: 'Agent with this name already exists',
            conflicting_resource: {
              type: 'agent',
              id: createRequest.name
            },
            correlation_id: req.headers['x-correlation-id'],
            timestamp: new Date().toISOString()
          });
        }

        if (error.message.includes('validation')) {
          return res.status(422).json({
            error: 'VALIDATION_FAILED',
            message: error.message,
            correlation_id: req.headers['x-correlation-id'],
            timestamp: new Date().toISOString()
          });
        }
      }
      throw error;
    }
  })
);

// GET /agents/{agent_id} - Get agent details
agentsRouter.get(
  '/:agent_id',
  agentIdValidation,
  validateAgentAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid agent ID',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const agentId = req.params.agent_id;
    const include = Array.isArray(req.query.include)
      ? (req.query.include as string[])
      : req.query.include
        ? [req.query.include as string]
        : [];

    const agent = await agentService.getAgent(agentId, include);

    if (!agent) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Agent with ID '${agentId}' not found`,
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    res.json(agent);
  })
);

// PUT /agents/{agent_id} - Update agent (full replacement)
agentsRouter.put(
  '/:agent_id',
  updateAgentValidation,
  validateAgentAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid update data',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const agentId = req.params.agent_id;
    const updateRequest: UpdateAgentRequest = req.body;
    const userId = req.user?.id;

    try {
      const agent = await agentService.updateAgent(agentId, updateRequest, userId);

      if (!agent) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Agent with ID '${agentId}' not found`,
          correlation_id: req.headers['x-correlation-id'],
          timestamp: new Date().toISOString()
        });
      }

      res.json(agent);
    } catch (error) {
      if (error instanceof Error && error.message.includes('version conflict')) {
        return res.status(409).json({
          error: 'VERSION_CONFLICT',
          message: 'Agent version has changed since last read',
          correlation_id: req.headers['x-correlation-id'],
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  })
);

// PATCH /agents/{agent_id} - Partial update using JSON Patch
agentsRouter.patch(
  '/:agent_id',
  agentIdValidation,
  validateAgentAccess,
  body().isArray().withMessage('Request body must be array of patch operations'),
  body('*.op').isIn(['add', 'remove', 'replace', 'move', 'copy', 'test']).withMessage('Invalid patch operation'),
  body('*.path')
    .matches(/^(\/[^\/~]*(~[01][^\/~]*)*)*$/)
    .withMessage('Invalid JSON Pointer path'),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid patch operations',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const agentId = req.params.agent_id;
    const patchOps: JsonPatchOperation[] = req.body;
    const userId = req.user?.id;

    try {
      const agent = await agentService.patchAgent(agentId, patchOps, userId);

      if (!agent) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Agent with ID '${agentId}' not found`,
          correlation_id: req.headers['x-correlation-id'],
          timestamp: new Date().toISOString()
        });
      }

      res.json(agent);
    } catch (error) {
      if (error instanceof Error && error.message.includes('patch failed')) {
        return res.status(422).json({
          error: 'PATCH_FAILED',
          message: error.message,
          failed_operations: [], // TODO: Extract failed operations from error
          correlation_id: req.headers['x-correlation-id'],
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  })
);

// DELETE /agents/{agent_id} - Delete agent
agentsRouter.delete(
  '/:agent_id',
  agentIdValidation,
  validateAgentAccess,
  query('force').optional().isBoolean().withMessage('Force must be boolean'),
  query('retention_days').optional().isInt({ min: 0, max: 365 }).withMessage('Retention days must be 0-365'),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid delete parameters',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const agentId = req.params.agent_id;
    const force = req.query.force === 'true';
    const retentionDays = parseInt(req.query.retention_days as string) || 30;
    const userId = req.user?.id;

    try {
      const result = await agentService.deleteAgent(agentId, force, retentionDays, userId);

      if (!result.success) {
        if (result.reason === 'not_found') {
          return res.status(404).json({
            error: 'NOT_FOUND',
            message: `Agent with ID '${agentId}' not found`,
            correlation_id: req.headers['x-correlation-id'],
            timestamp: new Date().toISOString()
          });
        }

        if (result.reason === 'has_dependencies') {
          return res.status(409).json({
            error: 'HAS_DEPENDENCIES',
            message: 'Cannot delete agent due to active dependencies',
            dependencies: result.dependencies,
            correlation_id: req.headers['x-correlation-id'],
            timestamp: new Date().toISOString()
          });
        }
      }

      res.status(204).send();
    } catch (error) {
      throw error;
    }
  })
);

// POST /agents/{agent_id}/execute - Execute agent operation
agentsRouter.post(
  '/:agent_id/execute',
  executeAgentValidation,
  validateAgentAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid execution request',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const agentId = req.params.agent_id;
    const executionRequest: ExecutionRequest = req.body;
    const isAsync = req.query.async === 'true';
    const timeout = parseInt(req.query.timeout as string) || 300;
    const priority = parseInt(req.query.priority as string) || 5;
    const userId = req.user?.id;

    try {
      // Validate agent can perform the requested operation
      const agent = await agentService.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Agent with ID '${agentId}' not found`,
          correlation_id: req.headers['x-correlation-id'],
          timestamp: new Date().toISOString()
        });
      }

      // Validate operation against agent capabilities
      const validationResult = await executionService.validateExecution(
        agent,
        executionRequest.operation,
        executionRequest.input
      );

      if (!validationResult.valid) {
        return res.status(422).json({
          error: 'EXECUTION_VALIDATION_FAILED',
          message: 'Execution validation failed',
          validation_errors: validationResult.errors,
          operation: executionRequest.operation,
          agent_capabilities: agent.capabilities,
          correlation_id: req.headers['x-correlation-id'],
          timestamp: new Date().toISOString()
        });
      }

      if (isAsync) {
        // Start asynchronous execution
        const execution = await executionService.startExecution(agentId, executionRequest, {
          timeout,
          priority,
          userId
        });

        res.status(202).json({
          execution_id: execution.id,
          status: execution.status,
          estimated_duration_seconds: execution.estimated_duration,
          progress_url: `/api/v1/agents/${agentId}/executions/${execution.id}`,
          websocket_url: `ws://localhost:3000/api/v1/agents/${agentId}/executions/${execution.id}/progress`,
          started_at: execution.started_at
        });
      } else {
        // Execute synchronously
        const result = await executionService.executeSync(agentId, executionRequest, { timeout, priority, userId });

        res.status(200).json(result);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Agent execution rate limit exceeded',
          correlation_id: req.headers['x-correlation-id'],
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  })
);

// GET /agents/{agent_id}/executions/{execution_id} - Get execution status
agentsRouter.get(
  '/:agent_id/executions/:execution_id',
  agentIdValidation,
  param('execution_id')
    .matches(/^exec-[a-z0-9-]+$/)
    .withMessage('Invalid execution ID'),
  validateAgentAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid parameters',
        validation_errors: errors.array(),
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    const agentId = req.params.agent_id;
    const executionId = req.params.execution_id;

    const execution = await executionService.getExecutionStatus(agentId, executionId);

    if (!execution) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Execution with ID '${executionId}' not found`,
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
      });
    }

    // Check if client wants server-sent events
    if (req.headers.accept?.includes('text/event-stream')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial status
      res.write(`data: ${JSON.stringify(execution)}\n\n`);

      // Set up real-time updates
      const interval = setInterval(async () => {
        try {
          const updatedExecution = await executionService.getExecutionStatus(agentId, executionId);
          if (updatedExecution) {
            res.write(`data: ${JSON.stringify(updatedExecution)}\n\n`);

            // Close connection when execution is complete
            if (['completed', 'failed', 'cancelled'].includes(updatedExecution.status)) {
              clearInterval(interval);
              res.end();
            }
          }
        } catch (error) {
          clearInterval(interval);
          res.write(`event: error\ndata: ${JSON.stringify({ error: 'Failed to get execution status' })}\n\n`);
          res.end();
        }
      }, 1000);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(interval);
      });
    } else {
      res.json(execution);
    }
  })
);

// Error handling middleware specific to agents router
agentsRouter.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Agent router error:', error);

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred in agent operations',
    correlation_id: req.headers['x-correlation-id'],
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

export default agentsRouter;
