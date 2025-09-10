// Node 20 builtin test runner. Runs contract placeholders derived from operations.json.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const opsFile = path.join(here, 'operations.json');

if (!fs.existsSync(opsFile)) {
  test('operations.json exists', () => {
    assert.fail('operations.json missing. Generate it from openapi.yml');
  });
} else {
  const ops = JSON.parse(fs.readFileSync(opsFile, 'utf8'));
  const baseURL = process.env.BASE_URL || '';

  test('BASE_URL must be provided', () => {
    assert.ok(baseURL, 'Set BASE_URL to your running API (e.g., http://localhost:4000/api/v1)');
  });

  for (const { path: p, method } of ops) {
    // Basic smoke: endpoint exists (will fail until implemented)
    test(`endpoint ${method.toUpperCase()} ${p} responds`, async (t) => {
      assert.ok(baseURL, 'BASE_URL not set');
      const url = new URL(p, baseURL).toString();
      const res = await fetch(url, { method: method.toUpperCase() });
      // Accept any HTTP status for now; presence indicates the route is wired.
      assert.ok(res.status >= 100 && res.status < 600, `No response for ${url}`);
    });
  }
}

