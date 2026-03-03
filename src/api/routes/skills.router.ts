/**
 * Skills routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { SkillManifestService } from '../../services/skills/skill-manifest.service.js';
import { validateBody } from '../middleware/validate.js';

const CreateSkillSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  platforms: z.array(z.string()).optional(),
});

export function skillsRouter(): Router {
  const router = Router();
  const service = container.get(SkillManifestService);

  router.get('/', async (req, res, next) => {
    try {
      const dir = (req.query.directory as string) || '.';
      const skills = await service.list(dir);
      res.json({ count: skills.length, skills });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', validateBody(CreateSkillSchema), async (req, res, next) => {
    try {
      const skill = await service.create(req.body);
      res.status(201).json(skill);
    } catch (err) {
      next(err);
    }
  });

  router.post('/validate', async (req, res, next) => {
    try {
      const result = await service.validate(req.body);
      res.json({
        valid: result.valid,
        errors: result.errors || [],
        warnings: result.warnings || [],
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
