// OSSA version constants
// AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Update package.json version instead, then run: npm run sync-version

import versionsData from './versions.json';

export const OSSA_VERSION = "0.2.3";
export const OSSA_VERSION_TAG = `v${OSSA_VERSION}`;
export const OSSA_API_VERSION = `ossa/v${OSSA_VERSION}`;
export const OSSA_SCHEMA_VERSION = OSSA_VERSION;

// Aliases for backward compatibility
export const STABLE_VERSION = OSSA_VERSION;
export const STABLE_VERSION_TAG = OSSA_VERSION_TAG;

// Version data from versions.json
export const STABLE_VERSIONS = versionsData.all.filter((v: any) => v.type === 'stable');
export const DEV_VERSIONS = versionsData.all.filter((v: any) => v.type === 'dev' || v.type === 'prerelease');
export const ALL_VERSIONS = versionsData.all;
export const DEV_VERSION_TAG = versionsData.dev ? `v${versionsData.dev}` : undefined;

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
