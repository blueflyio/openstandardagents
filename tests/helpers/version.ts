/**
 * Version Helper for Tests
 *
 * Provides version constants for tests without ESM issues.
 * Reads directly from .version.json
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from .version.json
const versionJsonPath = join(__dirname, '../../.version.json');
const versionData = JSON.parse(readFileSync(versionJsonPath, 'utf-8'));

/**
 * API version string for manifests (e.g., "ossa/v0.4.1")
 */
export const API_VERSION = `ossa/v${versionData.spec_version}`;

/**
 * Current package version
 */
export const VERSION = versionData.current;

/**
 * Spec version
 */
export const SPEC_VERSION = versionData.spec_version;
