# TypeScript Types Reference

Auto-generated from `src/types/index.ts`

## Interfaces

### AgentArchitecture

```typescript
export interface AgentArchitecture {
  /** Architecture pattern */
  pattern?: ArchitecturePattern;

  /** Agent capabilities */
  capabilities?: AgentCapability[];

  /** Multi-agent coordination config */
  coordination?: {
    /** How agents coordinate handoffs */
    handoffStrategy?: HandoffStrategy;
    /** Leader/orchestrator agent name */
    leaderAgent?: string;
    /** Maximum orchestration depth */
    maxDepth?: number;
    /** Team coordination model */
    teamModel?: 'lead-teammate' | 'peer-to-peer' | 'hierarchical' | 'swarm';
    /** Communication pattern between agents */
    communicationPattern?:
      | 'task-list'
      | 'mailbox'
      | 'shared-file'
      | 'direct-message'
      | 'broadcast';
    /** Task coordination strategy */
    taskCoordination?: 'sequential' | 'parallel' | 'dependency-wave';
    /** Conflict resolution strategy */
    conflictResolution?: 'leader-decides' | 'vote' | 'round-robin';
    /** How task state is persisted */
    taskPersistence?: 'file-backed' | 'in-memory' | 'database';
    /** Whether to track task dependencies */
    dependencyTracking?: boolean;
  }
```

### Capability

```typescript
export interface Capability {
  id: string; // Unique identifier for the capability
  description: string;
  inputSchema: Record<string, unknown> | string; // JSON Schema for inputs
  outputSchema: Record<string, unknown> | string; // JSON Schema for outputs
  authRequirements?: {
    type: string; // e.g., 'apiKey', 'oauth2', 'bearer'
    scopes?: string[]; // Provider-specific scopes
    // ... other auth details mapped from OpenAPI securitySchemes
  }
```

### Publisher

```typescript
export interface Publisher {
  /** Publisher display name */
  name: string;
  /** Publisher contact email */
  email?: string;
  /** Publisher website URL */
  website?: string;
  /** PGP public key fingerprint or URL */
  pgp_key?: string;
  /** URL to the publisher's agent registry */
  registry_url?: string;
}
```

### AgentIdentity

```typescript
export interface AgentIdentity {
  /** Hierarchical namespace for scoping agent identifiers */
  namespace?: string;
  /** Unique agent identifier within the namespace */
  agent_id: string;
  /** Agent identity version (semver) */
  version?: string;
  /** Publisher information */
  publisher?: Publisher;
  /** Content-addressable checksum for integrity verification */
  checksum?: string;
  /** ISO 8601 creation timestamp */
  created_at?: string;
  /** ISO 8601 last update timestamp */
  updated_at?: string;
}
```

### TeamMember

```typescript
export interface TeamMember {
  name: string;
  kind?: 'team-lead' | 'teammate' | 'subagent' | 'reviewer' | 'specialist';
  role: string;
  model?: string;
  tools?: string[];
  skills?: string[];
  contextIsolation?: boolean;
  maxTokenBudget?: number;
}
```

### TeamDefinition

```typescript
export interface TeamDefinition {
  model: 'lead-teammate' | 'peer-to-peer' | 'hierarchical' | 'swarm';
  lead?: string;
  delegateMode?:
    | 'task-list'
    | 'round-robin'
    | 'capability-match'
    | 'load-balance';
  members: TeamMember[];
  taskList?: {
    persistence?: 'file-backed' | 'in-memory' | 'database';
    format?: 'markdown' | 'json' | 'yaml';
    path?: string;
    dependencyTracking?: boolean;
  }
```

### SubagentDefinition

```typescript
export interface SubagentDefinition {
  name: string;
  kind?: 'subagent' | 'worker' | 'specialist' | 'reviewer' | 'debugger';
  role: string;
  model?: string;
  tools?: string[];
  contextIsolation?: boolean;
  reportTo?: string;
  maxTokenBudget?: number;
}
```

### OssaAgent

```typescript
export interface OssaAgent {
  // k8s-style format (current)
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    tags?: string[];
    mesh_bindings?: {
      source_project_id?: string;
      execution_node_id?: string;
    }
```

### AgentsMdSection

```typescript
export interface AgentsMdSection {
  enabled?: boolean;
  source?: string;
  custom?: string;
  append?: string;
  prepend?: string;
  title_format?: string;
}
```

### AgentsMdExtension

```typescript
export interface AgentsMdExtension {
  enabled?: boolean;
  generate?: boolean;
  output_path?: string;
  sections?: {
    dev_environment?: AgentsMdSection;
    testing?: AgentsMdSection;
    pr_instructions?: AgentsMdSection;
  }
```

### LlmsTxtSection

```typescript
export interface LlmsTxtSection {
  enabled?: boolean;
  source?: string;
  custom?: string;
  append?: string;
  prepend?: string;
  title?: string;
  file_list?: string[];
}
```

### LlmsTxtExtension

```typescript
export interface LlmsTxtExtension {
  enabled?: boolean;
  generate?: boolean;
  file_path?: string;
  auto_discover?: boolean;
  format?: {
    include_h1_title?: boolean;
    include_blockquote?: boolean;
    include_h2_sections?: boolean;
    include_optional?: boolean;
  }
```

### CursorExtension

```typescript
export interface CursorExtension {
  enabled?: boolean;
  agent_type?: string;
  workspace_config?: {
    rules_file?: string;
    context_files?: string[];
    ignore_patterns?: string[];
    agents_md_path?: string;
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
  /** Agent version (not OSSA spec version) */
  version?: string;
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
  load(path: string): Promise<OssaAgent>;
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
