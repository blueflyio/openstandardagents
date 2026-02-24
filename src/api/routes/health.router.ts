/**
 * Health check routes
 */

import { Router } from 'express';
import { getVersion } from '../../utils/version.js';

export function healthRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: getVersion(), timestamp: new Date().toISOString() });
  });

  router.get('/ready', (_req, res) => {
    res.json({ status: 'ready' });
  });

  return router;
}
