/**
 * CORS middleware for ossa-ui and other consumers
 */

import type { Request, Response, NextFunction } from 'express';

export function corsMiddleware(origin?: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-Id'
    );
    res.setHeader('Access-Control-Max-Age', '86400');

    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}
