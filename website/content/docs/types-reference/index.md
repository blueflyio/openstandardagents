# TypeScript Types Reference

Auto-generated from `src/types/index.ts`

## Interfaces

### Capability

```typescript
export interface Capability {
  name: string;
  description: string;
  input_schema: Record<string, unknown> | string;
  output_schema: Record<string, unknown> | string;
  examples?: Array<{
    name?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  }
```

### OssaAgent

```typescript
export interface OssaAgent {
  // v0.2.8 format
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name: string;
    version?: string;
    description?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  }
```

### ValidationResult

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
  warnings: string[];
  manifest?: OssaAgent;
}
```

### AgentTemplate

```typescript
export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  description?: string;
  runtimeType?: string;
  capabilities?: Capability[];
}
```

### IValidationService

```typescript
export interface IValidationService {
  validate(
    manifest: unknown,
    version: SchemaVersion
  ): Promise<ValidationResult>;
}
```

### ISchemaRepository

```typescript
export interface ISchemaRepository {
  getSchema(version: SchemaVersion): Promise<Record<string, unknown>>;
  clearCache(): void;
  getAvailableVersions(): string[];
  getCurrentVersion(): string;
}
```

### IManifestRepository

```typescript
export interface IManifestRepository {
  load(path: string): Promise<unknown>;
  save(path: string, manifest: OssaAgent): Promise<void>;
}
```

## Type Aliases

### SchemaVersion

```typescript
export type SchemaVersion = string;
```

## Usage

```typescript
import { OSSAManifest, AgentSpec } from '@bluefly/openstandardagents';
```
