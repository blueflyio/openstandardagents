// OSSA version constants
// AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Update package.json version instead, then run: npm run sync-version

export const OSSA_VERSION = "0.2.3";
export const OSSA_VERSION_TAG = `v${OSSA_VERSION}`;
export const OSSA_API_VERSION = `ossa/v${OSSA_VERSION}`;
export const OSSA_SCHEMA_VERSION = OSSA_VERSION;

// Utility to get schema path
export function getSchemaPath(ver = OSSA_VERSION): string {
  return `/schemas/ossa-${ver}.schema.json`;
}

// Utility to get spec path
export function getSpecPath(ver = OSSA_VERSION): string {
  return `/spec/v${ver}/ossa-${ver}.schema.json`;
}
