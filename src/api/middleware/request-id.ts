/**
 * Request ID middleware — adds X-Request-Id header
 */

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = (req.headers['x-request-id'] as string) || uuidv4();
    res.setHeader('X-Request-Id', id);
    next();
  };
}
