/**
 * Agent access validation middleware
 */

import { Request, Response, NextFunction } from 'express';

export const validateAgentAccess = (req: Request, res: Response, next: NextFunction) => {
  // Mock implementation - always allow access
  next();
};
