/**
 * OSSA Monitoring Router
 * Basic router for monitoring and metrics
 */

import { Router } from 'express';

export const monitoringRouter = Router();

// Mock implementation
monitoringRouter.get('/', (req, res) => {
  res.json({ message: 'Monitoring endpoint' });
});
