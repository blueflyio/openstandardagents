/**
 * Manifests CRUD routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { ManifestCrudService } from '../../services/manifest/manifest-crud.service.js';
import { validateBody } from '../middleware/validate.js';

const CreateSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/),
  output_dir: z.string().optional(),
  description: z.string().optional(),
  role: z.string().optional(),
  type: z.enum(['worker', 'orchestrator', 'reviewer', 'analyzer', 'executor', 'approver']).optional(),
  version: z.string().optional(),
});

const ValidateSchema = z.object({
  manifest: z.record(z.string(), z.unknown()).optional(),
  path: z.string().optional(),
  platform: z.string().optional(),
  strict: z.boolean().optional(),
});
// We validate manifest-or-path in the handler instead

const DiffSchema = z.object({
  path_a: z.string().min(1),
  path_b: z.string().min(1),
});

const MigrateSchema = z.object({
  path: z.string().min(1),
  target_version: z.string().optional(),
  output_dir: z.string().optional(),
});

export function manifestsRouter(): Router {
  const router = Router();
  const service = container.get(ManifestCrudService);

  // List manifests
  router.get('/', async (req, res, next) => {
    try {
      const dir = (req.query.directory as string) || '.';
      const recursive = req.query.recursive !== 'false';
      const result = await service.list(dir, { recursive });
      res.json(result);
    } catch (err) { next(err); }
  });

  // Create (scaffold)
  router.post('/', validateBody(CreateSchema), async (req, res, next) => {
    try {
      const result = await service.create(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  });

  // Validate
  router.post('/validate', validateBody(ValidateSchema), async (req, res, next) => {
    try {
      let manifest = req.body.manifest;
      if (!manifest && req.body.path) {
        manifest = await service.read(req.body.path);
      }
      const result = await service.validate(manifest, {
        platform: req.body.platform,
        strict: req.body.strict,
      });
      res.json({
        valid: result.valid,
        errors: result.errors || [],
        warnings: result.warnings || [],
      });
    } catch (err) { next(err); }
  });

  // Inspect
  router.post('/inspect', async (req, res, next) => {
    try {
      const { path: manifestPath } = req.body;
      if (!manifestPath) { res.status(400).json({ error: 'path is required' }); return; }
      const result = await service.inspect(manifestPath);
      res.json(result);
    } catch (err) { next(err); }
  });

  // Diff
  router.post('/diff', validateBody(DiffSchema), async (req, res, next) => {
    try {
      const result = await service.diff(req.body.path_a, req.body.path_b);
      res.json(result);
    } catch (err) { next(err); }
  });

  // Migrate
  router.post('/migrate', validateBody(MigrateSchema), async (req, res, next) => {
    try {
      const result = await service.migrate(req.body.path, req.body.target_version, req.body.output_dir);
      res.json(result);
    } catch (err) { next(err); }
  });

  return router;
}
