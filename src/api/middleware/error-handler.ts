/**
 * Global error handler middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler() {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    // Known OSSA errors
    if (err.message?.includes('not found') || err.message?.includes('No such file')) {
      res.status(404).json({ error: err.message });
      return;
    }

    if (err.message?.includes('already exists')) {
      res.status(409).json({ error: err.message });
      return;
    }

    // Unknown errors
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  };
}
