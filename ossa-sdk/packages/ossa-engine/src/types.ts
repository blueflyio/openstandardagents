/** Field type descriptors extracted from JSON Schema */
export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'object';

/** A single field descriptor from schema introspection */
export interface FieldDescriptor {
  path: string;
  type: FieldType;
  required: boolean;
  description?: string;
  default?: unknown;
  values?: string[]; // for enums
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: FieldDescriptor; // for arrays
  properties?: FieldDescriptor[]; // for objects
}

/** A wizard step derived from the schema structure */
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  fields: FieldDescriptor[];
}

/** Validation severity */
export type Severity = 'error' | 'warning' | 'info';

/** A single validation issue */
export interface ValidationIssue {
  path: string;
  message: string;
  severity: Severity;
  keyword?: string;
  params?: Record<string, unknown>;
}

/** Result of validating a manifest */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  parsedManifest?: Record<string, unknown>;
  schemaVersion?: string;
}

/** A generated file from export */
export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
}

/** Supported export target platforms */
export type ExportTarget =
  | 'docker'
  | 'kubernetes'
  | 'langchain'
  | 'crewai'
  | 'anthropic'
  | 'openai'
  | 'npm'
  | 'mcp'
  | 'drupal'
  | 'gitlab-duo'
  | 'vercel-ai'
  | 'kagent'
  | 'langgraph'
  | 'autogen';

/** Export result containing all generated files */
export interface ExportResult {
  target: ExportTarget;
  files: GeneratedFile[];
  manifest: Record<string, unknown>;
}

/** Diff operation types */
export type DiffOp = 'added' | 'removed' | 'changed' | 'unchanged';

/** A single diff entry between two manifests */
export interface DiffEntry {
  path: string;
  op: DiffOp;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Result of diffing two manifests */
export interface DiffResult {
  entries: DiffEntry[];
  hasChanges: boolean;
  summary: string;
}

/** Migration result */
export interface MigrationResult {
  fromVersion: string;
  toVersion: string;
  migrated: Record<string, unknown>;
  changes: string[];
}

/** OSSA manifest kinds */
export type OssaKind = 'Agent' | 'Task' | 'Workflow' | 'Flow';
