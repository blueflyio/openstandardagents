import { SchemaIntrospector } from './schema/introspector.js';
import { ValidationEngine } from './validation/engine.js';
import { ManifestBuilder } from './builder/manifest-builder.js';
import { ExportEngine } from './export/engine.js';
import { MigrationEngine } from './migration/engine.js';
import { DiffEngine } from './diff/engine.js';
import type { ValidationResult, ExportResult, ExportTarget, DiffResult, MigrationResult, WizardStep, FieldDescriptor } from './types.js';

/** Main entry point — schema-driven engine that reads the OSSA JSON Schema and provides all SDK capabilities. */
export class OssaEngine {
  readonly introspector: SchemaIntrospector;
  readonly validation: ValidationEngine;
  readonly builder: typeof ManifestBuilder;
  readonly exporter: ExportEngine;
  readonly migration: MigrationEngine;
  readonly differ: DiffEngine;

  private schema: object;

  constructor(schema: object) {
    this.schema = schema;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.introspector = new SchemaIntrospector(schema as any);
    this.validation = new ValidationEngine();
    this.builder = ManifestBuilder;
    this.exporter = new ExportEngine();
    this.migration = new MigrationEngine();
    this.differ = new DiffEngine();
  }

  /** Validate a manifest string (YAML/JSON) */
  async validate(content: string): Promise<ValidationResult> {
    return this.validation.validateString(content, this.schema);
  }

  /** Validate a parsed manifest object */
  validateManifest(manifest: Record<string, unknown>): ValidationResult {
    return this.validation.validate(manifest, this.schema);
  }

  /** Create a new ManifestBuilder */
  createBuilder(): ManifestBuilder {
    return new ManifestBuilder();
  }

  /** Export a manifest to a target platform */
  export(manifest: Record<string, unknown>, target: ExportTarget): ExportResult {
    return this.exporter.export(manifest, target);
  }

  /** Diff two manifests */
  diff(old: Record<string, unknown>, current: Record<string, unknown>): DiffResult {
    return this.differ.diff(old, current);
  }

  /** Migrate a manifest to a target version */
  migrate(manifest: Record<string, unknown>, targetVersion: string): MigrationResult {
    return this.migration.migrate(manifest, targetVersion);
  }

  /** Get wizard steps from schema structure */
  getWizardSteps(): WizardStep[] {
    return this.introspector.getWizardSteps();
  }

  /** Get fields for a schema section */
  getFields(sectionPath?: string): FieldDescriptor[] {
    return this.introspector.getFields(sectionPath);
  }

  /** Get available export targets */
  getExportTargets(): ExportTarget[] {
    return this.exporter.getTargets();
  }

  /** Get schema version */
  getSchemaVersion(): string {
    return this.introspector.getSchemaVersion();
  }
}
