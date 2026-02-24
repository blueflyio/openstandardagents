/**
 * Convert routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { ConvertService } from '../../services/convert/convert.service.js';
import { ManifestCrudService } from '../../services/manifest/manifest-crud.service.js';
import { validateBody } from '../middleware/validate.js';

const ConvertSchema = z.object({
  manifest: z.record(z.string(), z.unknown()).optional(),
  path: z.string().optional(),
  target: z.string().min(1),
  output_dir: z.string().optional(),
});

export function convertRouter(): Router {
  const router = Router();
  const service = container.get(ConvertService);
  const manifestService = container.get(ManifestCrudService);

  router.post('/', validateBody(ConvertSchema), async (req, res, next) => {
    try {
      let manifest = req.body.manifest;
      if (!manifest && req.body.path) {
        manifest = await manifestService.read(req.body.path);
      }
      const result = await service.convert({
        manifest,
        target: req.body.target,
        output_dir: req.body.output_dir,
      });
      res.json(result);
    } catch (err) { next(err); }
  });

  router.get('/targets', (_req, res) => {
    res.json(service.listTargets());
  });

  return router;
}
