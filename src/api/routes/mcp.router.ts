/**
 * MCP Bridge routes
 *
 * SOD: HTTP-to-service mapping only. No business logic here.
 */

import { Router } from 'express';
import { container } from '../../di-container.js';
import { McpBridgeService } from '../../services/mcp/bridge.service.js';

export function mcpRouter(): Router {
  const router = Router();
  const service = container.get(McpBridgeService);

  /**
   * POST /api/v1/mcp/bridge/sync
   * Body: { source: 'claude-desktop' | 'cursor', directory?: string }
   * Imports an external MCP config into the OSSA central registry.
   */
  router.post('/bridge/sync', async (req, res, next) => {
    try {
      const { source, directory = '.' } = req.body;
      if (!source) {
        res.status(400).json({ error: 'source is required (e.g. claude-desktop, cursor)' });
        return;
      }
      const result = await service.sync(source, directory);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/mcp/bridge/list?directory=.
   * Lists all registered MCP servers in the OSSA bridge registry.
   */
  router.get('/bridge/list', async (req, res, next) => {
    try {
      const directory = (req.query.directory as string) || '.';
      const result = await service.list(directory);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/mcp/bridge/execute
   * Body: { agentId, toolName, directory? }
   * Policy-gate check before forwarding a tool call.
   */
  router.post('/bridge/execute', async (req, res, next) => {
    try {
      const { agentId, toolName, directory = '.' } = req.body;
      if (!agentId || !toolName) {
        res.status(400).json({ error: 'agentId and toolName are required' });
        return;
      }
      const result = await service.executeTool(agentId, toolName, directory);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
