/**
 * AGENTS.md API routes — discover, maintain, get/put/delete per agent.
 * Base dir from query `dir` or env OSSA_AGENTS_MD_BASE_DIR (default process.cwd()).
 */

import { Router } from 'express';
import { container } from '../../di-container.js';
import { AgentsMdApiService } from '../../services/agents-md/agents-md-api.service.js';

function getBaseDir(queryDir?: string): string {
  const dir = queryDir ?? process.env.OSSA_AGENTS_MD_BASE_DIR ?? process.cwd();
  return dir;
}

export function agentsMdRouter(): Router {
  const router = Router();
  const api = container.get(AgentsMdApiService);

  router.get('/discover', async (req, res, next) => {
    try {
      const baseDir = getBaseDir(req.query.dir as string | undefined);
      const configDir =
        (req.query.configDir as string) ?? process.env.CONFIG_DIR;
      const wikiRoot = (req.query.wikiRoot as string) ?? process.env.WIKI_ROOT;
      const discovered = await api.discover(baseDir);
      res.json({
        dir: baseDir,
        configDir: configDir ?? undefined,
        wikiRoot: wikiRoot ?? undefined,
        count: discovered.length,
        discovered,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/maintain', async (req, res, next) => {
    try {
      const body = req.body as {
        dir?: string;
        regenerate?: boolean;
        dryRun?: boolean;
        configDir?: string;
        wikiRoot?: string;
      };
      const baseDir = getBaseDir(
        body.dir ?? (req.query.dir as string | undefined)
      );
      const result = await api.maintain(baseDir, {
        regenerate: body.regenerate ?? false,
        dryRun: body.dryRun ?? false,
      });
      res.json({
        dir: baseDir,
        configDir: body.configDir ?? process.env.CONFIG_DIR ?? undefined,
        wikiRoot: body.wikiRoot ?? process.env.WIKI_ROOT ?? undefined,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/agents/:name/agents-md', async (req, res, next) => {
    try {
      const baseDir = getBaseDir(req.query.dir as string | undefined);
      const generate = req.query.generate === 'true';
      const out = await api.getAgentsMd(req.params.name, baseDir, { generate });
      if (!out) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  router.put('/agents/:name/agents-md', async (req, res, next) => {
    try {
      const baseDir = getBaseDir(req.query.dir as string | undefined);
      const out = await api.putAgentsMd(req.params.name, baseDir, req.body);
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/agents/:name/agents-md', async (req, res, next) => {
    try {
      const baseDir = getBaseDir(req.query.dir as string | undefined);
      const ok = await api.deleteAgentsMd(req.params.name, baseDir);
      if (!ok) {
        res.status(404).json({ deleted: false });
        return;
      }
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
