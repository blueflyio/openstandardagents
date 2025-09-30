/**
 * Metrics collection middleware
 */

import { Request, Response, NextFunction } from 'express';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Mock implementation
  next();
};
