/**
 * Test Helpers - Dynamic Version Constants
 *
 * NEVER hardcode version strings in tests. Always use these helpers.
 * Version is derived dynamically from package.json.
 */

import {
  getApiVersion,
  getVersion,
  getSchemaPath,
  getVersionInfo,
} from '../src/utils/version.js';

// Re-export for easy use in tests
export { getApiVersion, getVersion, getSchemaPath, getVersionInfo };

// Convenience constants (evaluated at import time from package.json)
export const CURRENT_API_VERSION = getApiVersion();
export const CURRENT_VERSION = getVersion();
export const CURRENT_SCHEMA_PATH = getSchemaPath();

/**
 * Create a minimal valid manifest for testing
 */
export function createTestManifest(overrides: Record<string, unknown> = {}) {
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'Agent',
    metadata: { name: 'test-agent', version: '1.0.0' },
    spec: { role: 'Test assistant' },
    ...overrides,
  };
}

/**
 * Create a minimal valid Task manifest for testing
 */
export function createTestTaskManifest(
  overrides: Record<string, unknown> = {}
) {
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'Task',
    metadata: { name: 'test-task', version: '1.0.0' },
    spec: {
      execution: { type: 'deterministic' },
    },
    ...overrides,
  };
}
