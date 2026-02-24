/**
 * Workspace routes
 */

import { Router } from 'express';
import { container } from '../../di-container.js';
import { WorkspaceService } from '../../services/workspace/workspace.service.js';

export function workspaceRouter(): Router {
  const router = Router();
  const service = container.get(WorkspaceService);

  router.post('/init', async (req, res, next) => {
    try {
      const { directory = '.', name } = req.body;
      const result = await service.init(directory, name);
      res.json(result);
    } catch (err) { next(err); }
  });

  router.post('/discover', async (req, res, next) => {
    try {
      const { directory = '.' } = req.body;
      const result = await service.discover(directory);
      res.json(result);
    } catch (err) { next(err); }
  });

  router.get('/status', async (req, res, next) => {
    try {
      const dir = (req.query.directory as string) || '.';
      const result = await service.status(dir);
      res.json(result);
    } catch (err) { next(err); }
  });

  return router;
}
