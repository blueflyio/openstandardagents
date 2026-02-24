/**
 * Export routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { ExportService } from '../../services/export/export.service.js';
import { ManifestCrudService } from '../../services/manifest/manifest-crud.service.js';
import { validateBody } from '../middleware/validate.js';

const ExportSchema = z.object({
  manifest: z.record(z.string(), z.unknown()).optional(),
  path: z.string().optional(),
  target: z.string().min(1),
  output_dir: z.string().optional(),
});

export function exportRouter(): Router {
  const router = Router();
  const service = container.get(ExportService);
  const manifestService = container.get(ManifestCrudService);

  // Export manifest to platform
  router.post('/', validateBody(ExportSchema), async (req, res, next) => {
    try {
      let manifest = req.body.manifest;
      if (!manifest && req.body.path) {
        manifest = await manifestService.read(req.body.path);
      }
      const result = await service.export({
        manifest,
        target: req.body.target,
        output_dir: req.body.output_dir,
      });
      res.json(result);
    } catch (err) { next(err); }
  });

  // List platforms
  router.get('/platforms', (_req, res) => {
    res.json(service.listPlatforms());
  });

  return router;
}
