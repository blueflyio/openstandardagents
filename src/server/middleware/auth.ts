/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Mock implementation - always allow access
  next();
};
