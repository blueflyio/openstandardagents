/**
 * Version routes
 */

import { Router } from 'express';
import { container } from '../../di-container.js';
import { VersionDetectionService } from '../../services/version-detection.service.js';
import { getVersion, getApiVersion } from '../../utils/version.js';

export function versionRouter(): Router {
  const router = Router();
  const versionService = container.get(VersionDetectionService);

  router.get('/', (_req, res) => {
    res.json({
      cli_version: getVersion(),
      api_version: getApiVersion(),
    });
  });

  router.post('/detect', async (req, res, next) => {
    try {
      const result = await versionService.detectVersion(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
