import { Router, Request, Response } from 'express';
import { agentRuntimeService } from '../services/agent-runtime.service.js';
import { AgentMetadata, BridgeError, BridgeErrorCode } from '../types/index.js';

const router = Router();

/**
 * GET /api/v1/agents
 *
 * List all available agents in the registry.
 * Returns agent metadata including capabilities and schemas.
 */
router.get('/api/v1/agents', async (_req: Request, res: Response) => {
  try {
    const agents = await agentRuntimeService.listAgents();
    res.json({
      success: true,
      agents,
      count: agents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to list agents:', error);
    res.status(500).json({
      success: false,
      error: {
        code: BridgeErrorCode.INTERNAL_ERROR,
        message: 'Failed to list agents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/v1/agents/:agentId
 *
 * Get detailed metadata for a specific agent.
 * Includes input/output schemas and capabilities.
 */
router.get('/api/v1/agents/:agentId', async (req: Request, res: Response) => {
  const { agentId } = req.params;

  try {
    const agent = await agentRuntimeService.getAgent(agentId);
    res.json({
      success: true,
      agent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof BridgeError && error.code === BridgeErrorCode.AGENT_NOT_FOUND) {
      res.status(404).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    console.error('Failed to get agent:', error);
    res.status(500).json({
      success: false,
      error: {
        code: BridgeErrorCode.INTERNAL_ERROR,
        message: 'Failed to get agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
