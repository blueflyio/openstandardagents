/**
 * Error handler middleware
 */

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: error.message || 'Internal server error' });
};
