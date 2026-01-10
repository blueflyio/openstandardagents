# OSSA SDKs

Official Software Development Kits for the Open Standard for Scalable AI Agents (OSSA).

## Architecture

**SOLID**: Single Responsibility per SDK, Open/Closed for extensibility
**DRY**: Shared validation, types, and utilities
**Zod**: Runtime validation for all SDKs
**OpenAPI**: SDK contracts defined in openapi/
**CRUD**: Full Create/Read/Update/Delete operations

## Structure

```
src/sdks/
├── index.ts              # Unified SDK exports
├── shared/               # DRY: Shared utilities
│   ├── validation.ts    # Zod validation schemas
│   ├── types.ts         # Shared type definitions
│   ├── manifest-loader.ts  # CRUD: Read operations
│   └── schema-validator.ts # Validation logic
├── typescript/           # TypeScript SDK
│   ├── client.ts        # SDK client (OpenAPI)
│   ├── manifest.ts     # CRUD operations
│   ├── validator.ts     # Validation service
│   └── types.ts        # TypeScript types (Zod)
└── python/              # Python SDK bridge
    └── index.ts
```

## TypeScript SDK

### Installation

```bash
npm install @bluefly/ossa-sdk
```

### Usage

```typescript
import { OSSASDKClient } from '@bluefly/ossa-sdk/typescript';

const client = new OSSASDKClient();

// Load manifest
const manifest = client.loadManifest('my-agent.ossa.yaml');

// Validate
const result = client.validateManifest(manifest);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Export
const yaml = client.exportManifest(manifest, 'yaml');
```

## Python SDK

Python SDK implementation lives in `sdks/python/` directory.

## Features

- **Type-Safe**: Full TypeScript types with Zod validation
- **CRUD Operations**: Create, Read, Update, Delete manifests
- **Multi-Format**: Export to YAML, JSON, TypeScript
- **Validation**: Zod + JSON Schema validation
- **OpenAPI**: Types align with OpenAPI spec
