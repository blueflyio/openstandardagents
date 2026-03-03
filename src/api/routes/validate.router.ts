/**
 * Top-level validate route: POST /api/v1/validate
 * Accepts manifest object or path; delegates to ManifestCrudService.
 */

import { Router } from 'express';
import yaml from 'js-yaml';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { ManifestCrudService } from '../../services/manifest/manifest-crud.service.js';
import { validateBody } from '../middleware/validate.js';

const ValidateSchema = z.object({
  manifest: z.record(z.string(), z.unknown()).optional(),
  manifestYaml: z.string().optional(),
  path: z.string().optional(),
  platform: z.string().optional(),
  strict: z.boolean().optional(),
});

export function validateRouter(): Router {
  const router = Router();
  const service = container.get(ManifestCrudService);

  router.post('/', validateBody(ValidateSchema), async (req, res, next) => {
    try {
      let manifest = req.body.manifest;
      if (!manifest && req.body.manifestYaml) {
        manifest = yaml.load(req.body.manifestYaml);
      } else if (!manifest && req.body.path) {
        manifest = await service.read(req.body.path);
      }
      const result = await service.validate(manifest, {
        platform: req.body.platform,
        strict: req.body.strict,
      });
      res.json({
        valid: result.valid,
        errors: result.errors ?? [],
        warnings: result.warnings ?? [],
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
