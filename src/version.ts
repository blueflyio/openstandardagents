/**
 * Version Constants - Single Source of Truth
 *
 * NEVER hardcode versions in tests/examples/code.
 * ALWAYS import from this file.
 *
 * This file reads from .version.json at runtime
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from .version.json (single source of truth)
// Use process.cwd() which works in both ESM and CommonJS, and in tests
const versionJsonPath = resolve(process.cwd(), '.version.json');
const versionData = JSON.parse(readFileSync(versionJsonPath, 'utf-8'));

/**
 * Current package version (e.g., "0.4.1")
 */
export const VERSION = versionData.current as string;

/**
 * Current spec version (e.g., "0.4.1")
 */
export const SPEC_VERSION = versionData.spec_version as string;

/**
 * API version string for manifests (e.g., "ossa/v0.4.1")
 */
export const API_VERSION = `ossa/v${SPEC_VERSION}`;

/**
 * Spec path (e.g., "spec/v0.4")
 */
export const SPEC_PATH = versionData.spec_path as string;

/**
 * Schema filename (e.g., "agent.schema.json")
 */
export const SCHEMA_FILE = versionData.schema_file as string;

/**
 * Full schema path
 */
export const SCHEMA_PATH = `${SPEC_PATH}/${SCHEMA_FILE}`;

/**
 * Get version data object
 */
export function getVersionData() {
  return {
    version: VERSION,
    specVersion: SPEC_VERSION,
    apiVersion: API_VERSION,
    specPath: SPEC_PATH,
    schemaFile: SCHEMA_FILE,
    schemaPath: SCHEMA_PATH,
  };
}

/**
 * Validate that a manifest uses the correct apiVersion
 */
export function validateApiVersion(apiVersion: string): boolean {
  return apiVersion === API_VERSION;
}

/**
 * For CommonJS compatibility
 */
export default {
  VERSION,
  SPEC_VERSION,
  API_VERSION,
  SPEC_PATH,
  SCHEMA_FILE,
  SCHEMA_PATH,
  getVersionData,
  validateApiVersion,
};
