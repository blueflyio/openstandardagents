/**
 * Wizard routes — headless wizard via REST
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { WizardStateService } from '../../services/wizard/wizard-state.service.js';
import { validateBody } from '../middleware/validate.js';

const CreateSessionSchema = z.object({
  kind: z.enum(['Agent', 'Skill', 'MCPServer']).optional(),
  mode: z.enum(['quick', 'guided', 'expert']).optional(),
  template: z.string().optional(),
});

const DefinitionsQuerySchema = z.object({
  kind: z.enum(['Agent', 'Skill', 'MCPServer']).optional().default('Agent'),
  mode: z.enum(['quick', 'guided', 'expert']).optional().default('guided'),
});

const SubmitStepSchema = z.object({}).passthrough();

export function wizardRouter(): Router {
  const router = Router();
  const service = container.get(WizardStateService);

  // Get step definitions (no session required)
  router.get('/definitions', (req, res) => {
    const parsed = DefinitionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
      return;
    }
    const steps = service.getStepDefinitions(parsed.data.kind, parsed.data.mode);
    res.json({ steps });
  });

  // Create session
  router.post('/sessions', validateBody(CreateSessionSchema), (req, res) => {
    const session = service.createSession(req.body);
    const currentStep = service.getCurrentStep(session);
    res.status(201).json({ session, currentStep });
  });

  // Get session
  router.get('/sessions/:id', (req, res) => {
    const session = service.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found or expired' });
      return;
    }
    const currentStep = service.getCurrentStep(session);
    const steps = service.getSteps(session);
    res.json({ session, currentStep, totalSteps: steps.length });
  });

  // Get current step
  router.get('/sessions/:id/steps/current', (req, res) => {
    const session = service.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found or expired' });
      return;
    }
    const currentStep = service.getCurrentStep(session);
    if (!currentStep) {
      res.json({ complete: true, session });
      return;
    }
    res.json({ step: currentStep, stepIndex: session.currentStepIndex });
  });

  // Submit step data
  router.post(
    '/sessions/:id/steps/:stepId',
    validateBody(SubmitStepSchema),
    (req, res) => {
      const session = service.getSession(req.params.id);
      if (!session) {
        res.status(404).json({ error: 'Session not found or expired' });
        return;
      }
      const result = service.submitStep(session, req.params.stepId, req.body);
      if (!result.success) {
        res.status(400).json({ errors: result.errors });
        return;
      }
      res.json({ session: result.session, nextStep: result.nextStep });
    }
  );

  // Undo last step
  router.post('/sessions/:id/undo', (req, res) => {
    const session = service.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found or expired' });
      return;
    }
    const result = service.undo(session);
    res.json(result);
  });

  // Complete wizard
  router.post('/sessions/:id/complete', async (req, res, next) => {
    try {
      const session = service.getSession(req.params.id);
      if (!session) {
        res.status(404).json({ error: 'Session not found or expired' });
        return;
      }
      const result = await service.complete(session);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Get templates
  router.get('/templates', (_req, res) => {
    res.json(service.getTemplates());
  });

  return router;
}
