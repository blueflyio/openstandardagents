import type { FieldDescriptor, FieldType, WizardStep, ExportTarget } from '../types.js';

interface JsonSchemaProperty {
  type?: string;
  enum?: string[];
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  $ref?: string;
  allOf?: JsonSchemaProperty[];
  oneOf?: JsonSchemaProperty[];
  anyOf?: JsonSchemaProperty[];
}

interface JsonSchema extends JsonSchemaProperty {
  $schema?: string;
  $id?: string;
  title?: string;
  definitions?: Record<string, JsonSchemaProperty>;
}

/** Reads an OSSA JSON Schema and extracts typed field descriptors, wizard steps, and export targets. */
export class SchemaIntrospector {
  private schema: JsonSchema;
  private definitions: Record<string, JsonSchemaProperty>;

  constructor(schema: JsonSchema) {
    this.schema = schema;
    this.definitions = schema.definitions ?? {};
  }

  /** Get all fields under a given dotted path (e.g. 'spec.llm') */
  getFields(sectionPath?: string): FieldDescriptor[] {
    const target = sectionPath
      ? this.resolveSection(sectionPath)
      : this.schema;

    if (!target?.properties) return [];

    const requiredSet = new Set(target.required ?? []);
    return Object.entries(target.properties).map(([key, prop]) => {
      const resolved = this.resolveRef(prop);
      return this.toFieldDescriptor(
        sectionPath ? `${sectionPath}.${key}` : key,
        resolved,
        requiredSet.has(key),
      );
    });
  }

  /** Get wizard steps derived from top-level schema structure */
  getWizardSteps(): WizardStep[] {
    const steps: WizardStep[] = [];

    // Step 1: metadata
    const metadataDef = this.resolveRefByName('Metadata');
    if (metadataDef) {
      steps.push({
        id: 'metadata',
        title: 'Agent Identity',
        description: 'Name, version, labels, and annotations',
        fields: this.getFields('metadata'),
      });
    }

    // Step 2: spec — resolve AgentSpec (default kind)
    const agentSpec = this.resolveRefByName('AgentSpec');
    if (agentSpec?.properties) {
      const specSections = [
        { key: 'description', title: 'Description & Role' },
        { key: 'role', title: 'Agent Role' },
        { key: 'llm', title: 'LLM Configuration' },
        { key: 'tools', title: 'Tool Integration' },
        { key: 'safety', title: 'Safety & Guardrails' },
        { key: 'autonomy', title: 'Autonomy Level' },
        { key: 'triggers', title: 'Triggers & Events' },
        { key: 'observability', title: 'Observability' },
        { key: 'constraints', title: 'Constraints & Limits' },
      ];

      for (const section of specSections) {
        if (section.key in agentSpec.properties) {
          steps.push({
            id: `spec.${section.key}`,
            title: section.title,
            fields: this.getFields(`spec.${section.key}`),
          });
        }
      }
    }

    // Step 3: extensions
    if (this.schema.properties?.extensions) {
      steps.push({
        id: 'extensions',
        title: 'Framework Extensions',
        description: 'Platform-specific configuration (MCP, LangChain, etc.)',
        fields: this.getFields('extensions'),
      });
    }

    return steps;
  }

  /** Get available export target platforms from extension definitions */
  getExportTargets(): ExportTarget[] {
    return [
      'docker',
      'kubernetes',
      'langchain',
      'crewai',
      'anthropic',
      'openai',
      'npm',
      'mcp',
      'drupal',
      'gitlab-duo',
      'vercel-ai',
      'kagent',
      'langgraph',
      'autogen',
    ];
  }

  /** Get all available kinds from the schema */
  getKinds(): string[] {
    const kindProp = this.schema.properties?.kind;
    if (!kindProp) return ['Agent'];
    const resolved = this.resolveRef(kindProp);
    return resolved.enum ?? ['Agent'];
  }

  /** Get the schema version from $id */
  getSchemaVersion(): string {
    const id = this.schema.$id ?? '';
    const match = id.match(/v([\d.]+)/);
    return match ? match[1] : 'unknown';
  }

  /** Resolve a section path like 'spec.llm' to its schema node */
  private resolveSection(path: string): JsonSchemaProperty | null {
    const parts = path.split('.');
    let current: JsonSchemaProperty | undefined = this.schema;

    for (const part of parts) {
      if (!current) return null;

      // Check if we need to resolve through definitions (for spec, which uses allOf/if-then)
      if (part === 'spec' && current === this.schema) {
        const agentSpec = this.resolveRefByName('AgentSpec');
        if (agentSpec) {
          current = agentSpec;
          continue;
        }
      }

      const resolved = this.resolveRef(current);
      if (resolved.properties?.[part]) {
        current = this.resolveRef(resolved.properties[part]);
      } else {
        return null;
      }
    }

    return current ?? null;
  }

  /** Resolve a $ref to its definition */
  private resolveRef(prop: JsonSchemaProperty): JsonSchemaProperty {
    if (prop.$ref) {
      const refName = prop.$ref.replace('#/definitions/', '');
      return this.definitions[refName] ?? prop;
    }
    return prop;
  }

  /** Resolve a definition by name */
  private resolveRefByName(name: string): JsonSchemaProperty | undefined {
    return this.definitions[name];
  }

  /** Convert a JSON Schema property to a FieldDescriptor */
  private toFieldDescriptor(
    path: string,
    prop: JsonSchemaProperty,
    required: boolean,
  ): FieldDescriptor {
    const resolved = this.resolveRef(prop);
    const type = this.inferType(resolved);

    const descriptor: FieldDescriptor = {
      path,
      type,
      required,
      description: resolved.description,
      default: resolved.default,
    };

    if (type === 'enum' && resolved.enum) {
      descriptor.values = resolved.enum;
    }

    if (resolved.minimum !== undefined) descriptor.min = resolved.minimum;
    if (resolved.maximum !== undefined) descriptor.max = resolved.maximum;
    if (resolved.minLength !== undefined)
      descriptor.minLength = resolved.minLength;
    if (resolved.maxLength !== undefined)
      descriptor.maxLength = resolved.maxLength;
    if (resolved.pattern) descriptor.pattern = resolved.pattern;

    if (type === 'array' && resolved.items) {
      const itemResolved = this.resolveRef(resolved.items);
      descriptor.items = this.toFieldDescriptor(
        `${path}[]`,
        itemResolved,
        false,
      );
    }

    if (type === 'object' && resolved.properties) {
      const reqSet = new Set(resolved.required ?? []);
      descriptor.properties = Object.entries(resolved.properties).map(
        ([key, p]) =>
          this.toFieldDescriptor(
            `${path}.${key}`,
            this.resolveRef(p),
            reqSet.has(key),
          ),
      );
    }

    return descriptor;
  }

  /** Infer the FieldType from a JSON Schema property */
  private inferType(prop: JsonSchemaProperty): FieldType {
    if (prop.enum) return 'enum';
    switch (prop.type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'integer':
        return 'integer';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }
}
