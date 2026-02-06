import { Router, Request, Response } from 'express';
import { agentRuntimeService } from '../services/agent-runtime.service.js';
import {
  ExecuteAgentRequestSchema,
  ExecuteAgentResponse,
  BridgeError,
  BridgeErrorCode,
} from '../types/index.js';
import { tracingService } from '../services/tracing.service.js';

const router = Router();

/**
 * POST /api/v1/execute
 *
 * Execute an OSSA agent with the provided input.
 * Returns agent result or error with tracing metadata.
 *
 * Request Body:
 * {
 *   "agentId": "agent-name",
 *   "input": { ... },
 *   "context": { "userId": "123", ... },
 *   "timeout": 300000
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "result": { ... },
 *   "metadata": {
 *     "agentId": "agent-name",
 *     "executionTime": 1234,
 *     "traceId": "abc123",
 *     "timestamp": "2026-02-04T..."
 *   }
 * }
 */
router.post('/api/v1/execute', async (req: Request, res: Response<ExecuteAgentResponse>) => {
  const startTime = Date.now();

  try {
    // Validate request body
    const validationResult = ExecuteAgentRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: BridgeErrorCode.INVALID_INPUT,
          message: 'Invalid request body',
          details: validationResult.error.flatten(),
        },
        metadata: {
          agentId: 'unknown',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const { agentId, input, context, timeout } = validationResult.data;

    // Execute agent
    const result = await agentRuntimeService.executeAgent(agentId, input, context, timeout);

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      result,
      metadata: {
        agentId,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;

    if (error instanceof BridgeError) {
      const statusCode = {
        [BridgeErrorCode.AGENT_NOT_FOUND]: 404,
        [BridgeErrorCode.INVALID_INPUT]: 400,
        [BridgeErrorCode.TIMEOUT]: 504,
        [BridgeErrorCode.AGENT_EXECUTION_FAILED]: 500,
        [BridgeErrorCode.INTERNAL_ERROR]: 500,
      }[error.code] || 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        metadata: {
          agentId: req.body?.agentId || 'unknown',
          executionTime,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Unexpected error
    console.error('Unexpected error during agent execution:', error);
    res.status(500).json({
      success: false,
      error: {
        code: BridgeErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        agentId: req.body?.agentId || 'unknown',
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
