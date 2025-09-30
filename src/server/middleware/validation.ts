/**
 * Validation middleware
 */

import { Request, Response, NextFunction } from 'express';

export const validationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Mock implementation
  next();
};
