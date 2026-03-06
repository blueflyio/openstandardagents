import { UadpClient, UadpError } from './client.js';
import { validateManifest, validateResponse } from './validate.js';

export interface ConformanceResult {
  url: string;
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; error?: string }>;
}

/**
 * Run UADP conformance tests against a live node.
 *
 * Usage:
 * ```ts
 * import { runConformanceTests } from '@ossa/uadp';
 * const results = await runConformanceTests('https://marketplace.example.com');
 * ```
 */
export async function runConformanceTests(baseUrl: string): Promise<ConformanceResult> {
  const results: ConformanceResult['results'] = [];
  const client = new UadpClient(baseUrl, { timeout: 15000 });

  // Test 1: Discovery
  try {
    const manifest = await client.discover();
    const validation = validateManifest(manifest);
    if (validation.valid) {
      results.push({ test: 'GET /.well-known/uadp.json', passed: true });
    } else {
      results.push({ test: 'GET /.well-known/uadp.json', passed: false, error: validation.errors.join('; ') });
    }
  } catch (err) {
    results.push({ test: 'GET /.well-known/uadp.json', passed: false, error: String(err) });
  }

  // Test 2: Skills endpoint
  try {
    const manifest = await client.getManifest();
    if (manifest.endpoints.skills) {
      const skills = await client.listSkills({ limit: 5 });
      const validation = validateResponse(skills);
      results.push({ test: 'GET /uadp/v1/skills', passed: validation.valid, error: validation.valid ? undefined : validation.errors.join('; ') });
    } else {
      results.push({ test: 'GET /uadp/v1/skills', passed: true, error: 'Skipped (not advertised)' });
    }
  } catch (err) {
    results.push({ test: 'GET /uadp/v1/skills', passed: false, error: String(err) });
  }

  // Test 3: Agents endpoint
  try {
    const manifest = await client.getManifest();
    if (manifest.endpoints.agents) {
      const agents = await client.listAgents({ limit: 5 });
      const validation = validateResponse(agents);
      results.push({ test: 'GET /uadp/v1/agents', passed: validation.valid, error: validation.valid ? undefined : validation.errors.join('; ') });
    } else {
      results.push({ test: 'GET /uadp/v1/agents', passed: true, error: 'Skipped (not advertised)' });
    }
  } catch (err) {
    results.push({ test: 'GET /uadp/v1/agents', passed: false, error: String(err) });
  }

  // Test 4: Federation endpoint
  try {
    const manifest = await client.getManifest();
    if (manifest.endpoints.federation) {
      const fed = await client.getFederation();
      const valid = fed.protocol_version && fed.node_name && Array.isArray(fed.peers);
      results.push({ test: 'GET /uadp/v1/federation', passed: !!valid, error: valid ? undefined : 'Invalid federation response shape' });
    } else {
      results.push({ test: 'GET /uadp/v1/federation', passed: true, error: 'Skipped (not advertised)' });
    }
  } catch (err) {
    results.push({ test: 'GET /uadp/v1/federation', passed: false, error: String(err) });
  }

  // Test 5: Pagination
  try {
    const manifest = await client.getManifest();
    if (manifest.endpoints.skills) {
      const page1 = await client.listSkills({ page: 1, limit: 1 });
      const valid = page1.meta.page === 1 && page1.meta.limit === 1 && page1.data.length <= 1;
      results.push({ test: 'Pagination (page=1, limit=1)', passed: valid, error: valid ? undefined : 'Pagination params not respected' });
    }
  } catch (err) {
    results.push({ test: 'Pagination', passed: false, error: String(err) });
  }

  return {
    url: baseUrl,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results,
  };
}
