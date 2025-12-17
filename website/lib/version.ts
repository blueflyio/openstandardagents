// OSSA version constants
// AUTO-GENERATED from GitLab tags (patch only, no update needed) - DO NOT EDIT DIRECTLY
// Run: npm run sync-version (fetches latest from GitLab tags or npm registry)
// NOTE: Website only updates on major/minor releases, not patches

import versionsData from './versions.json';

export const OSSA_VERSION = "0.3.0-RC";
export const OSSA_VERSION_TAG = `v${OSSA_VERSION}`;
export const OSSA_API_VERSION = `ossa/v${OSSA_VERSION}`;
export const OSSA_SCHEMA_VERSION = OSSA_VERSION;

// Display version for marketing (doesn't change on patch releases)
export const OSSA_DISPLAY_VERSION = "0.3.x";
export const OSSA_DISPLAY_VERSION_TAG = "v0.3.x";

// Aliases for backward compatibility
export const STABLE_VERSION = OSSA_VERSION;
export const STABLE_VERSION_TAG = OSSA_VERSION_TAG;

// Version data from versions.json
export const STABLE_VERSIONS = versionsData.all.filter((v: any) => v.type === 'stable');
export const DEV_VERSIONS = versionsData.all.filter((v: any) => v.type === 'dev' || v.type === 'prerelease');
export const ALL_VERSIONS = versionsData.all;
export const DEV_VERSION_TAG = versionsData.dev ? `v${versionsData.dev}` : undefined;

// Latest tags - static exports for Turbopack
export const LATEST_STABLE_TAG = "v0.2.9";
export const LATEST_DEV_TAG = "v0.2.6-dev";

// Utility to get version info
export function getVersionInfo(version: string): any {
  return versionsData.all.find((v: any) => v.version === version);
}

// Utility to get schema path
export function getSchemaPath(ver = OSSA_VERSION): string {
  return `/schemas/ossa-${ver}.schema.json`;
}

// Utility to get spec path
export function getSpecPath(ver = OSSA_VERSION): string {
  return `/spec/v${ver}/ossa-${ver}.schema.json`;
}
