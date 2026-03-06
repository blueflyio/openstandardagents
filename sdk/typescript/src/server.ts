import type { Request, Response, Router } from 'express';
import type {
  UadpManifest, OssaSkill, OssaAgent, PaginatedResponse,
  FederationResponse, ValidationResult, Peer
} from './types.js';

export interface UadpNodeConfig {
  /** Human-readable node name */
  nodeName: string;
  /** Optional description */
  nodeDescription?: string;
  /** Base URL where this node is hosted */
  baseUrl: string;
  /** Contact info */
  contact?: string;
  /** PEM-encoded public key for signature verification */
  publicKey?: string;
  /** Supported OSSA versions */
  ossaVersions?: string[];
}

export interface UadpDataProvider {
  /** Return paginated skills. Called on GET /uadp/v1/skills */
  listSkills(params: { search?: string; category?: string; page: number; limit: number }): Promise<PaginatedResponse<OssaSkill>>;
  /** Return paginated agents. Called on GET /uadp/v1/agents */
  listAgents?(params: { search?: string; page: number; limit: number }): Promise<PaginatedResponse<OssaAgent>>;
  /** Return federation peers. Called on GET /uadp/v1/federation */
  listPeers?(): Promise<Peer[]>;
  /** Handle incoming peer registration. Called on POST /uadp/v1/federation */
  addPeer?(url: string, name: string): Promise<{ success: boolean; peer?: Peer }>;
  /** Validate a manifest. Called on POST /uadp/v1/skills/validate */
  validateManifest?(manifest: string): Promise<ValidationResult>;
}

/**
 * Mount UADP protocol endpoints on an Express router.
 *
 * Usage:
 * ```ts
 * import express from 'express';
 * import { createUadpRouter } from '@bluefly/duadp/server';
 *
 * const app = express();
 * app.use(createUadpRouter({ nodeName: 'My Node', baseUrl: 'https://my-node.com' }, myProvider));
 * ```
 */
export function createUadpRouter(config: UadpNodeConfig, provider: UadpDataProvider): Router {
  // Dynamic import to keep express as optional peer dep
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Router: ExpressRouter } = require('express') as typeof import('express');
  const router = ExpressRouter();

  const capabilities: string[] = ['skills'];
  if (provider.listAgents) capabilities.push('agents');
  if (provider.listPeers) capabilities.push('federation');
  if (provider.validateManifest) capabilities.push('validation');

  // /.well-known/uadp.json
  router.get('/.well-known/uadp.json', (_req: Request, res: Response) => {
    const manifest: UadpManifest = {
      protocol_version: '0.1.0',
      node_name: config.nodeName,
      node_description: config.nodeDescription,
      contact: config.contact,
      endpoints: {
        skills: `${config.baseUrl}/uadp/v1/skills`,
        ...(provider.listAgents ? { agents: `${config.baseUrl}/uadp/v1/agents` } : {}),
        ...(provider.listPeers ? { federation: `${config.baseUrl}/uadp/v1/federation` } : {}),
        ...(provider.validateManifest ? { validate: `${config.baseUrl}/uadp/v1/skills/validate` } : {}),
      },
      capabilities,
      public_key: config.publicKey,
      ossa_versions: config.ossaVersions ?? ['v0.4'],
    };
    res.json(manifest);
  });

  // GET /uadp/v1/skills
  router.get('/uadp/v1/skills', async (req: Request, res: Response) => {
    try {
      const params = {
        search: req.query.search as string | undefined,
        category: req.query.category as string | undefined,
        page: Math.max(1, parseInt(req.query.page as string) || 1),
        limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)),
      };
      const result = await provider.listSkills(params);
      result.meta.node_name = config.nodeName;
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // GET /uadp/v1/agents
  if (provider.listAgents) {
    router.get('/uadp/v1/agents', async (req: Request, res: Response) => {
      try {
        const params = {
          search: req.query.search as string | undefined,
          page: Math.max(1, parseInt(req.query.page as string) || 1),
          limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)),
        };
        const result = await provider.listAgents!(params);
        result.meta.node_name = config.nodeName;
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });
  }

  // GET /uadp/v1/federation
  if (provider.listPeers) {
    router.get('/uadp/v1/federation', async (_req: Request, res: Response) => {
      try {
        const peers = await provider.listPeers!();
        const response: FederationResponse = {
          protocol_version: '0.1.0',
          node_name: config.nodeName,
          peers,
        };
        res.json(response);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });
  }

  // POST /uadp/v1/federation
  if (provider.addPeer) {
    router.post('/uadp/v1/federation', async (req: Request, res: Response) => {
      try {
        const { url, name } = req.body ?? {};
        if (!url || !name) {
          res.status(400).json({ error: 'Missing required fields: url, name' });
          return;
        }
        const result = await provider.addPeer!(url, name);
        res.status(result.success ? 201 : 400).json(result);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });
  }

  // POST /uadp/v1/skills/validate
  if (provider.validateManifest) {
    router.post('/uadp/v1/skills/validate', async (req: Request, res: Response) => {
      try {
        const { manifest } = req.body ?? {};
        if (!manifest) {
          res.status(400).json({ valid: false, errors: ['Missing manifest field'] });
          return;
        }
        const result = await provider.validateManifest!(manifest);
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });
  }

  return router;
}
