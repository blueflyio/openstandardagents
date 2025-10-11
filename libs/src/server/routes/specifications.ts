/**
 * OSSA Specifications Router
 * Basic router for OpenAPI specifications
 */

import { Router } from 'express';

export const specificationsRouter = Router();

// Mock implementation
specificationsRouter.get('/', (req, res) => {
  res.json({ message: 'Specifications endpoint' });
});
