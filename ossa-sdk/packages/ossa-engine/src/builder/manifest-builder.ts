import type { OssaKind } from '../types.js';

type SpecConfigurator = (spec: SpecBuilder) => SpecBuilder;

/** Fluent builder for OSSA agent manifests. Validated at every step. */
export class ManifestBuilder {
  private manifest: Record<string, unknown> = {};

  apiVersion(version: string): this {
    this.manifest.apiVersion = version;
    return this;
  }

  kind(kind: OssaKind): this {
    this.manifest.kind = kind;
    return this;
  }

  metadata(meta: {
    name: string;
    version?: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  }): this {
    this.manifest.metadata = meta;
    return this;
  }

  spec(configurator: SpecConfigurator): this {
    const builder = new SpecBuilder();
    configurator(builder);
    this.manifest.spec = builder.build();
    return this;
  }

  extensions(ext: Record<string, unknown>): this {
    this.manifest.extensions = ext;
    return this;
  }

  /** Set any top-level field */
  set(path: string, value: unknown): this {
    const parts = path.split('.');
    let current: Record<string, unknown> = this.manifest;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
    return this;
  }

  /** Get the current partial manifest for validation */
  getPartial(): Record<string, unknown> {
    return structuredClone(this.manifest);
  }

  /** Build and return the final manifest (deep clone) */
  build(): Record<string, unknown> {
    return structuredClone(this.manifest);
  }

  /** Create from existing manifest (for editing) */
  static from(manifest: Record<string, unknown>): ManifestBuilder {
    const builder = new ManifestBuilder();
    builder.manifest = structuredClone(manifest);
    return builder;
  }
}

/** Fluent sub-builder for the spec section */
export class SpecBuilder {
  private spec: Record<string, unknown> = {};

  description(desc: string): this {
    this.spec.description = desc;
    return this;
  }

  role(role: string): this {
    this.spec.role = role;
    return this;
  }

  llm(config: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }): this {
    this.spec.llm = config;
    return this;
  }

  addTool(tool: {
    name: string;
    type: string;
    config?: Record<string, unknown>;
  }): this {
    if (!this.spec.tools) this.spec.tools = [];
    (this.spec.tools as unknown[]).push(tool);
    return this;
  }

  safety(config: Record<string, unknown>): this {
    this.spec.safety = config;
    return this;
  }

  autonomy(config: {
    level?: string;
    approvalRequired?: boolean;
    allowedActions?: string[];
    blockedActions?: string[];
  }): this {
    this.spec.autonomy = config;
    return this;
  }

  triggers(triggers: unknown[]): this {
    this.spec.triggers = triggers;
    return this;
  }

  observability(config: Record<string, unknown>): this {
    this.spec.observability = config;
    return this;
  }

  constraints(config: Record<string, unknown>): this {
    this.spec.constraints = config;
    return this;
  }

  /** Set any spec-level field */
  set(key: string, value: unknown): this {
    this.spec[key] = value;
    return this;
  }

  build(): Record<string, unknown> {
    return this.spec;
  }
}
