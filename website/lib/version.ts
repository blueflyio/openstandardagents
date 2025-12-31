// OSSA version constants
// AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Run: npm run sync-version (fetches latest from GitLab tags or npm registry)

import versionsData from './versions.json';

// Type definitions for version data
export interface VersionInfo {
  version: string;
  tag: string;
  apiVersion: string;
  type: 'stable' | 'dev' | 'prerelease';
  published: boolean;
  available: boolean;
}

export const OSSA_VERSION = "0.3.1";
export const OSSA_VERSION_TAG = `v${OSSA_VERSION}`;
export const OSSA_API_VERSION = `ossa/v${OSSA_VERSION}`;
export const OSSA_SCHEMA_VERSION = OSSA_VERSION;

// Display version for marketing (doesn't change on patch releases)
export const OSSA_DISPLAY_VERSION = "0.3.1";
export const OSSA_DISPLAY_VERSION_TAG = "v0.3.1";

// Aliases for backward compatibility
export const STABLE_VERSION = OSSA_VERSION;
export const STABLE_VERSION_TAG = OSSA_VERSION_TAG;

// Version data from versions.json
export const STABLE_VERSIONS = (versionsData.all as VersionInfo[]).filter((v) => v.type === 'stable');
export const DEV_VERSIONS = (versionsData.all as VersionInfo[]).filter((v) => v.type === 'dev' || v.type === 'prerelease');
export const ALL_VERSIONS = versionsData.all as VersionInfo[];
export const DEV_VERSION_TAG = versionsData.dev ? `v${versionsData.dev}` : undefined;

// Utility to get version info
export function getVersionInfo(version: string): VersionInfo | undefined {
  return (versionsData.all as VersionInfo[]).find((v) => v.version === version);
}

// Utility to get schema path
export function getSchemaPath(ver = OSSA_VERSION): string {
  return `/schemas/ossa-${ver}.schema.json`;
}

// Utility to get spec path
export function getSpecPath(ver = OSSA_VERSION): string {
  return `/spec/v${ver}/ossa-${ver}.schema.json`;
}
