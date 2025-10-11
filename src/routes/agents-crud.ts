import { Request, Response, Router } from 'express';
import { getService, IAgentService, TOKENS } from '../container/dependency-container';
import {
  CreateAgentRequestSchema,
  createZodValidationMiddleware,
  GetAgentsRequestSchema,
  UpdateAgentRequestSchema
} from '../schemas/production-architecture.schemas';

const router = Router();

// ===== CRUD: Full Create/Read/Update/Delete operations for Agents =====

/**
 * GET /api/v1/agents - List all agents
 * CRUD: Read operation
 */
router.get('/api/v1/agents', async (req: Request, res: Response) => {
  try {
    const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
    const request = GetAgentsRequestSchema.parse(req.query);

    const agents = await agentService.list(request);

    res.json({
      success: true,
      data: agents.data,
      pagination: agents.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENTS_LIST_ERROR',
        message: 'Failed to list agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/agents/:id - Get agent by ID
 * CRUD: Read operation
 */
router.get('/api/v1/agents/:id', async (req: Request, res: Response) => {
  try {
    const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
    const { id } = req.params;

    const agent = await agentService.get(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent '${id}' not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: agent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_GET_ERROR',
        message: 'Failed to get agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/v1/agents - Create new agent
 * CRUD: Create operation
 */
router.post(
  '/api/v1/agents',
  createZodValidationMiddleware(CreateAgentRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
      const agentData = req.validatedBody;

      const createdAgent = await agentService.create(agentData);

      res.status(201).json({
        success: true,
        data: createdAgent,
        message: 'Agent created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'AGENT_CREATE_ERROR',
          message: 'Failed to create agent',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * PUT /api/v1/agents/:id - Update agent
 * CRUD: Update operation
 */
router.put(
  '/api/v1/agents/:id',
  createZodValidationMiddleware(UpdateAgentRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
      const { id } = req.params;
      const updates = req.validatedBody;

      const updatedAgent = await agentService.update(id, updates);

      if (!updatedAgent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'AGENT_NOT_FOUND',
            message: `Agent '${id}' not found`
          },
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: updatedAgent,
        message: 'Agent updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'AGENT_UPDATE_ERROR',
          message: 'Failed to update agent',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /api/v1/agents/:id - Delete agent
 * CRUD: Delete operation
 */
router.delete('/api/v1/agents/:id', async (req: Request, res: Response) => {
  try {
    const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
    const { id } = req.params;

    const success = await agentService.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent '${id}' not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_DELETE_ERROR',
        message: 'Failed to delete agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/v1/agents/:id/deploy - Deploy agent
 * CRUD: Update operation (deployment)
 */
router.post('/api/v1/agents/:id/deploy', async (req: Request, res: Response) => {
  try {
    const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
    const { id } = req.params;

    const success = await agentService.deploy(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_DEPLOY_ERROR',
          message: `Failed to deploy agent '${id}'`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Agent deployed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_DEPLOY_ERROR',
        message: 'Failed to deploy agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/v1/agents/:id/undeploy - Undeploy agent
 * CRUD: Update operation (undeployment)
 */
router.post('/api/v1/agents/:id/undeploy', async (req: Request, res: Response) => {
  try {
    const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
    const { id } = req.params;

    const success = await agentService.undeploy(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_UNDEPLOY_ERROR',
          message: `Failed to undeploy agent '${id}'`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Agent undeployed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_UNDEPLOY_ERROR',
        message: 'Failed to undeploy agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/agents/:id/health - Get agent health status
 * CRUD: Read operation (health)
 */
router.get('/api/v1/agents/:id/health', async (req: Request, res: Response) => {
  try {
    const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
    const { id } = req.params;

    const health = await agentService.getHealth(id);

    if (!health) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent '${id}' not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_HEALTH_ERROR',
        message: 'Failed to get agent health',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/agents/:id/metrics - Get agent metrics
 * CRUD: Read operation (metrics)
 */
router.get('/api/v1/agents/:id/metrics', async (req: Request, res: Response) => {
  try {
    const agentService = getService<IAgentService>(TOKENS.AGENT_SERVICE);
    const { id } = req.params;

    const metrics = await agentService.getMetrics(id);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent '${id}' not found`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_METRICS_ERROR',
        message: 'Failed to get agent metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
