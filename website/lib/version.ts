// OSSA version constants
// TODO: Auto-sync with package.json during build
export const OSSA_VERSION = "0.2.3"; // e.g., "0.2.3"
export const OSSA_VERSION_TAG = `v${OSSA_VERSION}`; // e.g., "v0.2.3"
export const OSSA_API_VERSION = `ossa/v${OSSA_VERSION}`; // e.g., "ossa/v0.2.3"
export const OSSA_SCHEMA_VERSION = OSSA_VERSION; // For schema files

// Utility to get schema path
export function getSchemaPath(version = OSSA_VERSION): string {
  return `/schemas/ossa-${version}.schema.json`;
}

// Utility to get spec path
export function getSpecPath(version = OSSA_VERSION): string {
  return `/spec/v${version}/ossa-${version}.schema.json`;
}
