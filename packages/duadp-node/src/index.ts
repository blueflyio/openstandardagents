/**
 * DUADP Node — Cloudflare Worker
 *
 * A fully UADP-compliant node running on Cloudflare Workers.
 * D1 for storage, KV for peer cache.
 *
 * Endpoints:
 *   GET  /.well-known/uadp.json     — Discovery manifest
 *   GET  /uadp/v1/skills            — List skills (paginated, searchable)
 *   GET  /uadp/v1/agents            — List agents (paginated, searchable)
 *   POST /api/v1/publish             — Publish agent or skill
 *   GET  /uadp/v1/federation         — List federation peers
 *   POST /uadp/v1/federation         — Register as federation peer
 *   POST /uadp/v1/skills/validate    — Validate OSSA manifest
 */

export interface Env {
  DB: D1Database;
  PEERS_KV: KVNamespace;
  NODE_NAME: string;
  NODE_DESCRIPTION: string;
  NODE_CONTACT: string;
  BOOTSTRAP_URL: string;
}

interface PaginationParams {
  search: string;
  category: string;
  trust_tier: string;
  page: number;
  limit: number;
}

function parseParams(url: URL): PaginationParams {
  return {
    search: url.searchParams.get('search') || '',
    category: url.searchParams.get('category') || '',
    trust_tier: url.searchParams.get('trust_tier') || '',
    page: Math.max(1, parseInt(url.searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10))),
  };
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message, code: `ERR_${status}` }, status);
}

// /.well-known/uadp.json
function handleManifest(url: URL, env: Env): Response {
  const base = `${url.protocol}//${url.host}`;
  return json({
    protocol_version: '0.1.0',
    node_name: env.NODE_NAME,
    node_description: env.NODE_DESCRIPTION,
    contact: env.NODE_CONTACT,
    endpoints: {
      skills: `${base}/uadp/v1/skills`,
      agents: `${base}/uadp/v1/agents`,
      federation: `${base}/uadp/v1/federation`,
      validate: `${base}/uadp/v1/skills/validate`,
    },
    capabilities: ['skills', 'agents', 'federation', 'validation', 'publish'],
    ossa_versions: ['v0.4', 'v0.5'],
  });
}

// GET /uadp/v1/skills
async function handleListSkills(url: URL, env: Env): Promise<Response> {
  const params = parseParams(url);
  const offset = (params.page - 1) * params.limit;

  let where = '1=1';
  const bindings: string[] = [];

  if (params.search) {
    where += ' AND (name LIKE ? OR description LIKE ?)';
    bindings.push(`%${params.search}%`, `%${params.search}%`);
  }
  if (params.category) {
    where += ' AND category = ?';
    bindings.push(params.category);
  }
  if (params.trust_tier) {
    where += ' AND trust_tier = ?';
    bindings.push(params.trust_tier);
  }

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM skills WHERE ${where}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const rows = await env.DB.prepare(
    `SELECT manifest FROM skills WHERE ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...bindings, params.limit, offset)
    .all<{ manifest: string }>();

  return json({
    data: rows.results.map((r) => JSON.parse(r.manifest)),
    meta: {
      total: countResult?.total || 0,
      page: params.page,
      limit: params.limit,
      node_name: env.NODE_NAME,
    },
  });
}

// GET /uadp/v1/agents
async function handleListAgents(url: URL, env: Env): Promise<Response> {
  const params = parseParams(url);
  const offset = (params.page - 1) * params.limit;

  let where = '1=1';
  const bindings: string[] = [];

  if (params.search) {
    where += ' AND (name LIKE ? OR description LIKE ?)';
    bindings.push(`%${params.search}%`, `%${params.search}%`);
  }
  if (params.category) {
    where += ' AND category = ?';
    bindings.push(params.category);
  }

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM agents WHERE ${where}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const rows = await env.DB.prepare(
    `SELECT manifest FROM agents WHERE ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...bindings, params.limit, offset)
    .all<{ manifest: string }>();

  return json({
    data: rows.results.map((r) => JSON.parse(r.manifest)),
    meta: {
      total: countResult?.total || 0,
      page: params.page,
      limit: params.limit,
      node_name: env.NODE_NAME,
    },
  });
}

// POST /api/v1/publish (used by `ossa init --duadp` and `ossa agents-sync --publish`)
async function handlePublish(request: Request, url: URL, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;

  // Accept either { manifest: {...} } or direct manifest object
  const manifest = (body.manifest || body) as Record<string, unknown>;

  if (!manifest.apiVersion || !manifest.kind || !manifest.metadata) {
    return error('Invalid OSSA manifest: requires apiVersion, kind, metadata');
  }

  const metadata = manifest.metadata as Record<string, unknown>;
  const name = metadata.name as string;
  const version = (metadata.version as string) || '0.0.0';
  const description = (metadata.description as string) || '';
  const category = (metadata.category as string) || '';
  const trust_tier = (metadata.trust_tier as string) || 'community';
  const kind = manifest.kind as string;
  const id = `${name}@${version}`;
  const uri = `uadp://${url.host}/${kind.toLowerCase()}s/${name}`;

  // Add URI to metadata
  (manifest.metadata as Record<string, unknown>).uri = uri;

  const table = kind === 'Skill' ? 'skills' : 'agents';

  await env.DB.prepare(
    `INSERT OR REPLACE INTO ${table} (id, name, version, api_version, description, category, trust_tier, uri, manifest, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )
    .bind(id, name, version, manifest.apiVersion as string, description, category, trust_tier, uri, JSON.stringify(manifest))
    .run();

  return json({
    apiVersion: manifest.apiVersion,
    kind,
    metadata: { name, version, description, uri },
  }, 201);
}

// GET /uadp/v1/federation
async function handleListPeers(env: Env): Promise<Response> {
  const rows = await env.DB.prepare('SELECT * FROM peers ORDER BY name').all<{
    url: string;
    name: string;
    status: string;
    last_synced: string | null;
    skill_count: number;
    agent_count: number;
  }>();

  return json({
    protocol_version: '0.1.0',
    node_name: env.NODE_NAME,
    peers: rows.results.map((p) => ({
      url: p.url,
      name: p.name,
      status: p.status,
      last_synced: p.last_synced,
      skill_count: p.skill_count,
      agent_count: p.agent_count,
    })),
  });
}

// POST /uadp/v1/federation
async function handleRegisterPeer(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { url?: string; name?: string };

  if (!body.url || !body.name) {
    return error('Missing required fields: url, name');
  }

  // Validate peer by fetching its well-known manifest
  try {
    const wellKnown = await fetch(`${body.url.replace(/\/$/, '')}/.well-known/uadp.json`);
    if (!wellKnown.ok) {
      return error(`Peer validation failed: ${body.url} returned ${wellKnown.status}`, 400);
    }
    const peerManifest = await wellKnown.json() as { protocol_version?: string };
    if (!peerManifest.protocol_version) {
      return error('Peer is not a valid UADP node (missing protocol_version)', 400);
    }
  } catch (e) {
    return error(`Could not reach peer: ${e instanceof Error ? e.message : String(e)}`, 400);
  }

  await env.DB.prepare(
    `INSERT OR REPLACE INTO peers (url, name, status, last_synced, created_at)
     VALUES (?, ?, 'healthy', datetime('now'), datetime('now'))`
  )
    .bind(body.url, body.name)
    .run();

  // Cache in KV for fast lookup
  await env.PEERS_KV.put(`peer:${body.url}`, JSON.stringify({ name: body.name, status: 'healthy' }));

  return json({
    success: true,
    peer: { url: body.url, name: body.name, status: 'healthy', last_synced: new Date().toISOString() },
  }, 201);
}

// POST /uadp/v1/skills/validate
async function handleValidate(request: Request): Promise<Response> {
  const body = await request.json() as { manifest?: string };

  if (!body.manifest) {
    return error('Missing required field: manifest');
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: Record<string, unknown>;
  try {
    parsed = typeof body.manifest === 'string' ? JSON.parse(body.manifest) : body.manifest;
  } catch {
    return json({ valid: false, errors: ['Invalid JSON'], warnings: [] });
  }

  if (!parsed.apiVersion) errors.push('Missing required field: apiVersion');
  if (!parsed.kind) errors.push('Missing required field: kind');
  if (!parsed.metadata) errors.push('Missing required field: metadata');

  if (parsed.metadata) {
    const meta = parsed.metadata as Record<string, unknown>;
    if (!meta.name) errors.push('Missing required field: metadata.name');
    if (!meta.version) warnings.push('metadata.version is recommended');
    if (!meta.description) warnings.push('metadata.description is recommended');
  }

  if (parsed.kind && !['Agent', 'Skill', 'Tool'].includes(parsed.kind as string)) {
    errors.push(`Invalid kind: ${parsed.kind}. Must be Agent, Skill, or Tool`);
  }

  return json({ valid: errors.length === 0, errors, warnings });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Discovery
      if (path === '/.well-known/uadp.json' && request.method === 'GET') {
        return handleManifest(url, env);
      }

      // Skills
      if (path === '/uadp/v1/skills' && request.method === 'GET') {
        return handleListSkills(url, env);
      }

      // Agents
      if (path === '/uadp/v1/agents' && request.method === 'GET') {
        return handleListAgents(url, env);
      }

      // Publish (OSSA CLI compat: /api/v1/publish)
      if ((path === '/api/v1/publish' || path === '/uadp/v1/publish') && request.method === 'POST') {
        return handlePublish(request, url, env);
      }

      // Federation
      if (path === '/uadp/v1/federation') {
        if (request.method === 'GET') return handleListPeers(env);
        if (request.method === 'POST') return handleRegisterPeer(request, env);
      }

      // Validation
      if (path === '/uadp/v1/skills/validate' && request.method === 'POST') {
        return handleValidate(request);
      }

      // Health check
      if (path === '/health') {
        return json({ status: 'ok', node: env.NODE_NAME, timestamp: new Date().toISOString() });
      }

      return error('Not found', 404);
    } catch (e) {
      console.error('DUADP Worker error:', e);
      return error(`Internal error: ${e instanceof Error ? e.message : 'unknown'}`, 500);
    }
  },
};
