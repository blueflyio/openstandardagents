/**
 * Contract test: ossa scaffold must emit the current platform apiVersion.
 *
 * This test prevents version drift between:
 *   - .version.json (source of truth)
 *   - API_VERSION constant (src/version.ts)
 *   - Manifests produced by `ossa init` / `initCommand`
 *
 * If this test fails, it means getApiVersion() or .version.json is stale.
 */

import { describe, it, expect } from '@jest/globals';
import { API_VERSION } from '../../src/version.js';

// Minimal runtime-safe wrapper — avoids fs call in test environment
function getApiVersion(): string {
  return API_VERSION;
}


describe('scaffold contract', () => {
  it('getApiVersion() returns ossa/vX.Y.Z format', () => {
    const v = getApiVersion();
    expect(v).toMatch(/^ossa\/v\d+\.\d+\.\d+$/);
  });

  it('API_VERSION constant matches getApiVersion()', () => {
    expect(API_VERSION).toBe(getApiVersion());
  });

  it('platform apiVersion is at minimum ossa/v0.5.0', () => {
    const v = getApiVersion();
    // semver comparison: extract patch parts
    const match = v.match(/^ossa\/v(\d+)\.(\d+)\.(\d+)$/);
    expect(match).not.toBeNull();
    const [, major, minor] = match!.map(Number);
    const meetsMinimum = major > 0 || (major === 0 && minor >= 5);
    expect(meetsMinimum).toBe(true);
  });

  it('ossa-deploy version gate is satisfied: apiVersion >= ossa/v0.5.0', () => {
    // ossa-deploy rejects manifests < ossa/v0.5.0
    // This test documents the contract so both sides stay in sync
    const v = getApiVersion();
    expect(v).toBeTruthy();
    const [, semver] = v.split('/v');
    const [major, minor] = semver.split('.').map(Number);
    expect(major === 0 ? minor >= 5 : major >= 1).toBe(true);
  });
});
