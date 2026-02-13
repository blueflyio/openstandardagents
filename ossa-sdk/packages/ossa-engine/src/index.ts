// @bluefly/ossa-engine — Schema-driven OSSA SDK core
// Zero React, runs anywhere JS runs.

export { OssaEngine } from './ossa-engine.js';
export { SchemaIntrospector } from './schema/introspector.js';
export { ValidationEngine } from './validation/engine.js';
export { ManifestBuilder, SpecBuilder } from './builder/manifest-builder.js';
export { ExportEngine } from './export/engine.js';
export { MigrationEngine } from './migration/engine.js';
export { DiffEngine } from './diff/engine.js';

export type {
  FieldDescriptor,
  FieldType,
  WizardStep,
  ValidationResult,
  ValidationIssue,
  Severity,
  GeneratedFile,
  ExportTarget,
  ExportResult,
  DiffResult,
  DiffEntry,
  DiffOp,
  MigrationResult,
  OssaKind,
} from './types.js';
