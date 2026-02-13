import { describe, it, expect } from 'vitest';
import {
  OssaEngine,
  ManifestBuilder,
  ValidationEngine,
  ExportEngine,
  MigrationEngine,
  DiffEngine,
  SchemaIntrospector,
} from '../src/index.js';

// Minimal valid OSSA v0.4 schema for testing
const MINI_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://openstandardagents.org/schemas/v0.4/agent.schema.json',
  title: 'OSSA v0.4 Agent Manifest Schema',
  type: 'object',
  required: ['apiVersion', 'kind', 'metadata'],
  properties: {
    apiVersion: {
      type: 'string',
      pattern: '^ossa/v',
    },
    kind: {
      type: 'string',
      enum: ['Agent', 'Task', 'Workflow', 'Flow'],
    },
    metadata: {
      $ref: '#/definitions/Metadata',
    },
    spec: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        role: { type: 'string' },
        llm: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: ['anthropic', 'openai', 'google', 'mistral'],
            },
            model: { type: 'string' },
            temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
            maxTokens: { type: 'integer', minimum: 1, maximum: 200000 },
          },
          required: ['provider', 'model'],
        },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['mcp', 'builtin', 'api'] },
            },
            required: ['name', 'type'],
          },
        },
        safety: { type: 'object' },
        autonomy: {
          type: 'object',
          properties: {
            level: { type: 'string' },
          },
        },
      },
    },
    extensions: { type: 'object', additionalProperties: true },
  },
  definitions: {
    Metadata: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Agent name' },
        version: { type: 'string', description: 'Semantic version' },
        namespace: { type: 'string' },
        labels: { type: 'object', additionalProperties: { type: 'string' } },
        annotations: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
    AgentSpec: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        role: { type: 'string' },
        llm: { type: 'object' },
        tools: { type: 'array' },
        safety: { type: 'object' },
        autonomy: { type: 'object' },
        triggers: { type: 'array' },
        observability: { type: 'object' },
        constraints: { type: 'object' },
      },
    },
  },
};

describe('OssaEngine', () => {
  it('initializes with a schema', () => {
    const engine = new OssaEngine(MINI_SCHEMA);
    expect(engine).toBeDefined();
    expect(engine.getSchemaVersion()).toBe('0.4');
  });

  it('validates a valid manifest', async () => {
    const engine = new OssaEngine(MINI_SCHEMA);
    const result = await engine.validate(`
apiVersion: ossa/v0.4
kind: Agent
metadata:
  name: test-agent
spec:
  role: tester
  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929
`);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('catches invalid manifests', async () => {
    const engine = new OssaEngine(MINI_SCHEMA);
    const result = await engine.validate(`
apiVersion: ossa/v0.4
kind: InvalidKind
metadata:
  name: test
`);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('exports to docker', () => {
    const engine = new OssaEngine(MINI_SCHEMA);
    const manifest = {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'my-agent', version: '1.0.0' },
      spec: {
        role: 'code-reviewer',
        llm: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
        tools: [{ name: 'gitlab-api', type: 'mcp' }],
      },
    };
    const result = engine.export(manifest, 'docker');
    expect(result.target).toBe('docker');
    expect(result.files.length).toBeGreaterThan(3);
    expect(result.files.some(f => f.path === 'Dockerfile')).toBe(true);
    expect(result.files.some(f => f.path === 'docker-compose.yml')).toBe(true);
    expect(result.files.some(f => f.path.includes('gitlab-api'))).toBe(true);
  });
});

describe('ManifestBuilder', () => {
  it('builds a manifest fluently', () => {
    const manifest = new ManifestBuilder()
      .apiVersion('ossa/v0.4')
      .kind('Agent')
      .metadata({ name: 'my-agent', version: '1.0.0' })
      .spec((s) =>
        s
          .role('code-reviewer')
          .llm({ provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' })
          .addTool({ name: 'gitlab-api', type: 'mcp' })
          .safety({ humanInTheLoop: true }),
      )
      .build();

    expect(manifest.apiVersion).toBe('ossa/v0.4');
    expect(manifest.kind).toBe('Agent');
    expect((manifest.metadata as Record<string, unknown>).name).toBe('my-agent');
    const spec = manifest.spec as Record<string, unknown>;
    expect(spec.role).toBe('code-reviewer');
    expect((spec.tools as unknown[]).length).toBe(1);
  });

  it('creates from existing manifest', () => {
    const original = { apiVersion: 'ossa/v0.3', kind: 'Agent', metadata: { name: 'old' } };
    const builder = ManifestBuilder.from(original);
    builder.set('metadata.name', 'new-name');
    const result = builder.build();
    expect((result.metadata as Record<string, unknown>).name).toBe('new-name');
    // Original unchanged
    expect((original.metadata as Record<string, unknown>).name).toBe('old');
  });
});

describe('SchemaIntrospector', () => {
  it('discovers top-level fields', () => {
    const introspector = new SchemaIntrospector(MINI_SCHEMA as any);
    const fields = introspector.getFields();
    expect(fields.length).toBeGreaterThan(0);
    const kindField = fields.find((f) => f.path === 'kind');
    expect(kindField?.type).toBe('enum');
    expect(kindField?.values).toContain('Agent');
  });

  it('discovers metadata fields', () => {
    const introspector = new SchemaIntrospector(MINI_SCHEMA as any);
    const fields = introspector.getFields('metadata');
    expect(fields.length).toBeGreaterThan(0);
    const nameField = fields.find((f) => f.path === 'metadata.name');
    expect(nameField?.required).toBe(true);
  });

  it('generates wizard steps', () => {
    const introspector = new SchemaIntrospector(MINI_SCHEMA as any);
    const steps = introspector.getWizardSteps();
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBe('metadata');
    expect(steps[0].title).toBe('Agent Identity');
  });

  it('gets available kinds', () => {
    const introspector = new SchemaIntrospector(MINI_SCHEMA as any);
    const kinds = introspector.getKinds();
    expect(kinds).toContain('Agent');
    expect(kinds).toContain('Task');
    expect(kinds).toContain('Workflow');
  });
});

describe('DiffEngine', () => {
  it('detects changes between manifests', () => {
    const differ = new DiffEngine();
    const old = { apiVersion: 'ossa/v0.3', kind: 'Agent', metadata: { name: 'old' } };
    const cur = { apiVersion: 'ossa/v0.4', kind: 'Agent', metadata: { name: 'new' } };
    const result = differ.diff(old, cur);
    expect(result.hasChanges).toBe(true);
    expect(result.entries.some((e) => e.path === 'apiVersion' && e.op === 'changed')).toBe(true);
    expect(result.entries.some((e) => e.path === 'metadata.name' && e.op === 'changed')).toBe(true);
  });

  it('detects no changes for identical manifests', () => {
    const differ = new DiffEngine();
    const manifest = { apiVersion: 'ossa/v0.4', kind: 'Agent' };
    const result = differ.diff(manifest, manifest);
    expect(result.hasChanges).toBe(false);
    expect(result.summary).toBe('No changes');
  });

  it('detects added and removed fields', () => {
    const differ = new DiffEngine();
    const old = { a: 1, b: 2 };
    const cur = { b: 2, c: 3 };
    const result = differ.diff(old, cur);
    expect(result.entries.some((e) => e.op === 'added' && e.path === 'c')).toBe(true);
    expect(result.entries.some((e) => e.op === 'removed' && e.path === 'a')).toBe(true);
  });
});

describe('MigrationEngine', () => {
  it('detects version from apiVersion', () => {
    const migration = new MigrationEngine();
    expect(migration.detectVersion({ apiVersion: 'ossa/v0.3.6' })).toBe('0.3.6');
    expect(migration.detectVersion({ apiVersion: 'ossa/v0.4' })).toBe('0.4');
    expect(migration.detectVersion({})).toBe('unknown');
  });

  it('migrates v0.3 to v0.4', () => {
    const migration = new MigrationEngine();
    const result = migration.migrate(
      { apiVersion: 'ossa/v0.3.6', spec: { tools: [{ name: 'test' }] } },
      '0.4',
    );
    expect(result.toVersion).toBe('0.4');
    expect(result.migrated.apiVersion).toBe('ossa/v0.4');
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it('detects migration need', () => {
    const migration = new MigrationEngine();
    expect(migration.needsMigration({ apiVersion: 'ossa/v0.3' }, '0.4')).toBe(true);
    expect(migration.needsMigration({ apiVersion: 'ossa/v0.4' }, '0.4')).toBe(false);
  });
});

describe('ValidationEngine', () => {
  it('validates JSON input', async () => {
    const engine = new ValidationEngine();
    const result = await engine.validateString(
      JSON.stringify({
        apiVersion: 'ossa/v0.4',
        kind: 'Agent',
        metadata: { name: 'test' },
      }),
      MINI_SCHEMA,
    );
    expect(result.valid).toBe(true);
  });

  it('quick validates', async () => {
    const engine = new ValidationEngine();
    expect(
      await engine.quickValidate(
        'apiVersion: ossa/v0.4\nkind: Agent\nmetadata:\n  name: test\nspec:\n  role: test',
      ),
    ).toBe(true);
    expect(await engine.quickValidate('invalid yaml: [[[[')).toBe(false);
  });
});

describe('ExportEngine', () => {
  it('lists all targets', () => {
    const exporter = new ExportEngine();
    const targets = exporter.getTargets();
    expect(targets).toContain('docker');
    expect(targets).toContain('kubernetes');
    expect(targets).toContain('mcp');
    expect(targets).toContain('anthropic');
    expect(targets.length).toBeGreaterThan(10);
  });

  it('generates kubernetes export', () => {
    const exporter = new ExportEngine();
    const manifest = {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'k8s-agent' },
      spec: { llm: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' } },
    };
    const result = exporter.export(manifest, 'kubernetes');
    expect(result.files.some((f) => f.path.includes('deployment.yaml'))).toBe(true);
    expect(result.files.some((f) => f.path.includes('service.yaml'))).toBe(true);
  });
});
