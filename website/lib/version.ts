// OSSA version constants
// AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Update package.json version instead, then run: npm run sync-version

const versionsData = {
  "stable": "0.2.4",
  "latest": "0.2.4",
  "dev": "0.2.5-dev",
  "all": [
    {
      "version": "0.2.4",
      "tag": "v0.2.4",
      "apiVersion": "ossa/v0.2.4",
      "type": "stable",
      "published": true,
      "available": true
    },
    {
      "version": "0.2.3",
      "tag": "v0.2.3",
      "apiVersion": "ossa/v0.2.3",
      "type": "stable",
      "published": false,
      "available": true,
      "schemaPath": "/Users/flux423/Sites/LLM/openstandardagents/spec/v0.2.3/ossa-0.2.3.schema.json"
    },
    {
      "version": "0.2.2",
      "tag": "v0.2.2",
      "apiVersion": "ossa/v0.2.2",
      "type": "stable",
      "published": false,
      "available": true,
      "schemaPath": "/Users/flux423/Sites/LLM/openstandardagents/spec/v0.2.2/ossa-0.2.2.schema.json"
    },
    {
      "version": "0.2.1",
      "tag": "v0.2.1",
      "apiVersion": "ossa/v0.2.1",
      "type": "stable",
      "published": false,
      "available": true,
      "schemaPath": "/Users/flux423/Sites/LLM/openstandardagents/spec/v0.2.1/ossa-0.2.1.schema.json"
    },
    {
      "version": "0.2.0",
      "tag": "v0.2.0",
      "apiVersion": "ossa/v0.2.0",
      "type": "stable",
      "published": false,
      "available": true,
      "schemaPath": "/Users/flux423/Sites/LLM/openstandardagents/spec/v0.2.0/ossa-0.2.0.schema.json"
    },
    {
      "version": "0.1.9",
      "tag": "v0.1.9",
      "apiVersion": "ossa/v0.1.9",
      "type": "stable",
      "published": false,
      "available": false
    },
    {
      "version": "0.2.5-dev",
      "tag": "v0.2.5-dev",
      "apiVersion": "ossa/v0.2.5-dev",
      "type": "dev",
      "published": true,
      "available": true
    },
    {
      "version": "0.2.4-dev",
      "tag": "v0.2.4-dev",
      "apiVersion": "ossa/v0.2.4-dev",
      "type": "prerelease",
      "published": false,
      "available": true,
      "schemaPath": "/Users/flux423/Sites/LLM/openstandardagents/spec/v0.2.4-dev/ossa-0.2.4-dev.schema.json"
    }
  ],
  "fallbackVersion": "0.2.3"
};

export const OSSA_VERSION = "0.2.4";
export const OSSA_VERSION_TAG = `v${OSSA_VERSION}`;
export const OSSA_API_VERSION = `ossa/v${OSSA_VERSION}`;
export const OSSA_SCHEMA_VERSION = OSSA_VERSION;

// Aliases for backward compatibility
export const STABLE_VERSION = OSSA_VERSION;
export const STABLE_VERSION_TAG = OSSA_VERSION_TAG;

// Version data from versions.json (inlined)
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
