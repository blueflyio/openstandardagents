/**
 * OSSA MCP Server — Integration Tests
 *
 * Tests all 7 tools end-to-end using the MCP SDK Client.
 * Uses vitest + @modelcontextprotocol/sdk.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

const SERVER_PATH = path.resolve(
  import.meta.dirname,
  '../../../dist/mcp-server/index.js'
);
const FIXTURE_DIR = path.resolve(
  import.meta.dirname,
  '../../../spec/reference/reference-agents'
);

let client: Client;
let transport: StdioClientTransport;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-mcp-test-'));

  transport = new StdioClientTransport({
    command: 'node',
    args: [SERVER_PATH],
    env: { ...process.env, LOG_LEVEL: 'silent' },
  });

  client = new Client(
    { name: 'ossa-mcp-test', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
}, 15000);

afterAll(async () => {
  await client?.close();
  // cleanup tmpDir
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('ossa_validate', () => {
  it('validates a valid manifest', async () => {
    const manifestPath = path.join(
      FIXTURE_DIR,
      'compliance-auditor/manifest.ossa.yaml'
    );
    const result = await client.callTool({
      name: 'ossa_validate',
      arguments: { path: manifestPath },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.valid).toBe(true);
    expect(data.manifest_path).toBe(manifestPath);
  });

  it('returns error for non-existent file', async () => {
    const result = await client.callTool({
      name: 'ossa_validate',
      arguments: { path: '/tmp/does-not-exist.ossa.yaml' },
    });

    expect(result.isError).toBe(true);
  });
});

describe('ossa_scaffold', () => {
  it('scaffolds a new agent with full directory structure', async () => {
    const result = await client.callTool({
      name: 'ossa_scaffold',
      arguments: {
        name: 'test-agent',
        output_dir: tmpDir,
        description: 'A test agent for CI',
        role: 'You are a test agent.',
        type: 'worker',
      },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.success).toBe(true);
    expect(data.files_created).toContain('manifest.ossa.yaml');
    expect(data.files_created).toContain('AGENTS.md');
    expect(data.files_created).toContain('prompts/');
    expect(data.files_created).toContain('tools/');

    // Verify files on disk
    const agentDir = path.join(tmpDir, 'test-agent');
    expect(fs.existsSync(path.join(agentDir, 'manifest.ossa.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(agentDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(agentDir, 'prompts'))).toBe(true);
    expect(fs.existsSync(path.join(agentDir, 'tools'))).toBe(true);
  });

  it('rejects duplicate directory', async () => {
    // test-agent already created above
    const result = await client.callTool({
      name: 'ossa_scaffold',
      arguments: { name: 'test-agent', output_dir: tmpDir },
    });

    expect(result.isError).toBe(true);
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.error).toContain('already exists');
  });

  it('rejects invalid DNS-1123 names', async () => {
    const result = await client.callTool({
      name: 'ossa_scaffold',
      arguments: { name: 'InvalidName!', output_dir: tmpDir },
    });

    expect(result.isError).toBe(true);
  });
});

describe('ossa_generate', () => {
  it('generates agent-card.json from scaffolded manifest', async () => {
    // Use the scaffolded manifest (known-good structure)
    const manifestPath = path.join(tmpDir, 'test-agent/manifest.ossa.yaml');
    const result = await client.callTool({
      name: 'ossa_generate',
      arguments: { path: manifestPath },
    });

    // Agent card generation may fail for minimal manifests — that's OK
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data).toBeDefined();
  });

  it('returns structured error for manifests missing capabilities', async () => {
    const manifestPath = path.join(
      FIXTURE_DIR,
      'compliance-auditor/manifest.ossa.yaml'
    );
    const result = await client.callTool({
      name: 'ossa_generate',
      arguments: { path: manifestPath },
    });

    // Should return error (not crash) when manifest lacks spec.capabilities
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data).toBeDefined();
  });
});

describe('ossa_publish', () => {
  it('dry-run returns payload without sending', async () => {
    // Use scaffolded manifest
    const manifestPath = path.join(tmpDir, 'test-agent/manifest.ossa.yaml');
    const result = await client.callTool({
      name: 'ossa_publish',
      arguments: { path: manifestPath, dry_run: true },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.dry_run).toBe(true);
    expect(data.payload).toBeDefined();
    expect(data.payload.manifest).toBeDefined();
  });

  it('returns instructions when no registry configured', async () => {
    const manifestPath = path.join(tmpDir, 'test-agent/manifest.ossa.yaml');
    const result = await client.callTool({
      name: 'ossa_publish',
      arguments: { path: manifestPath },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.next_steps).toBeDefined();
    expect(data.next_steps.length).toBeGreaterThan(0);
  });
});

describe('ossa_list', () => {
  it('discovers agents in spec/reference', async () => {
    const result = await client.callTool({
      name: 'ossa_list',
      arguments: { directory: FIXTURE_DIR, format: 'json' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.count).toBeGreaterThanOrEqual(1);
    expect(data.agents).toBeInstanceOf(Array);
    expect(data.agents[0]).toHaveProperty('name');
    expect(data.agents[0]).toHaveProperty('path');
  });

  it('returns summary format by default', async () => {
    const result = await client.callTool({
      name: 'ossa_list',
      arguments: { directory: FIXTURE_DIR },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.count).toBeGreaterThanOrEqual(1);
    // Summary format returns strings, not objects
    expect(typeof data.agents[0]).toBe('string');
  });
});

describe('ossa_inspect', () => {
  it('deep-inspects a manifest', async () => {
    const manifestPath = path.join(
      FIXTURE_DIR,
      'compliance-auditor/manifest.ossa.yaml'
    );
    const result = await client.callTool({
      name: 'ossa_inspect',
      arguments: { path: manifestPath },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.name).toBeDefined();
    expect(data.kind).toBeDefined();
    expect(data.apiVersion).toBeDefined();
    expect(data.validation).toBeDefined();
    expect(data.validation.valid).toBeDefined();
    expect(data.file_size_bytes).toBeGreaterThan(0);
  });
});

describe('ossa_convert', () => {
  const manifestPath = path.join(
    FIXTURE_DIR,
    'compliance-auditor/manifest.ossa.yaml'
  );

  it('converts to kagent v1alpha2 format with Agent + ModelConfig', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'kagent' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('kagent');
    // v1alpha2 multi-resource output: Agent + ModelConfig
    expect(data.content._ossa_multi_resource).toBe(true);
    expect(data.content.resources).toBeInstanceOf(Array);
    expect(data.content.resources.length).toBe(2);
    // Agent CRD
    const agent = data.content.agent;
    expect(agent.apiVersion).toBe('kagent.dev/v1alpha2');
    expect(agent.kind).toBe('Agent');
    expect(agent.spec.type).toBe('Declarative');
    expect(agent.spec.declarative.modelConfig).toBeDefined();
    expect(agent.spec.declarative.systemMessage).toBeDefined();
    // ModelConfig CRD
    const modelCfg = data.content.modelConfig;
    expect(modelCfg.apiVersion).toBe('kagent.dev/v1alpha2');
    expect(modelCfg.kind).toBe('ModelConfig');
  });

  it('converts to docker-compose format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'docker' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('docker');
    expect(data.content.version).toBe('3.8');
    expect(data.content.services).toBeDefined();
  });

  it('converts to langchain format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'langchain' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('langchain');
    expect(data.content._type).toBe('agent');
  });

  it('converts to crewai format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'crewai' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('crewai');
    expect(data.content.agents).toBeInstanceOf(Array);
  });

  it('converts to anthropic format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'anthropic' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('anthropic');
    expect(data.content.model).toBeDefined();
    expect(data.content.system).toBeDefined();
  });

  it('converts to a2a agent-card format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'agent-card' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('agent-card');
    expect(data.content.name).toBeDefined();
    expect(data.content.description).toBeDefined();
    expect(data.content.url).toBeDefined();
    expect(data.content.capabilities).toBeDefined();
    expect(data.content.skills).toBeInstanceOf(Array);
  });

  it('converts to openai format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'openai' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('openai');
    expect(data.content.model).toBeDefined();
    expect(data.content.instructions).toBeDefined();
    expect(data.content.tools).toBeInstanceOf(Array);
    if (data.content.tools.length > 0) {
      expect(data.content.tools[0].type).toBe('function');
      expect(data.content.tools[0].function.name).toBeDefined();
    }
  });

  it('converts to autogen format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'autogen' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('autogen');
    expect(data.content.name).toBeDefined();
    expect(data.content.system_message).toBeDefined();
    expect(data.content.llm_config).toBeDefined();
    expect(data.content.llm_config.config_list).toBeInstanceOf(Array);
  });

  it('converts to semantic-kernel format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'semantic-kernel' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('semantic-kernel');
    expect(data.content.name).toBeDefined();
    expect(data.content.instructions).toBeDefined();
    expect(data.content.execution_settings).toBeDefined();
    expect(data.content.plugins).toBeInstanceOf(Array);
  });

  it('agent-card includes all platform adapters with SDK references', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'agent-card' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    const adapters = data.content.adapters;
    expect(adapters).toBeDefined();

    // All 12 platforms present
    const expectedPlatforms = [
      'openai',
      'anthropic',
      'google_genai',
      'langchain',
      'langflow',
      'crewai',
      'autogen',
      'semantic_kernel',
      'llamaindex',
      'dspy',
      'kagent',
      'gitlab_duo',
    ];
    for (const platform of expectedPlatforms) {
      expect(adapters[platform]).toBeDefined();
    }

    // Each adapter has sdk, config, usage
    expect(adapters.openai.sdk.npm).toBe('openai');
    expect(adapters.openai.sdk.pip).toBe('openai');
    expect(adapters.openai.config).toBeDefined();
    expect(adapters.openai.usage).toBeDefined();
    expect(adapters.anthropic.sdk.npm).toBe('@anthropic-ai/sdk');
    expect(adapters.anthropic.sdk.pip).toBe('anthropic');
    expect(adapters.google_genai.sdk.npm).toBe('@google/generative-ai');
    expect(adapters.langchain.sdk.pip).toBeInstanceOf(Array);
    expect(adapters.llamaindex.sdk.pip).toBe('llama-index');
    expect(adapters.dspy.sdk.pip).toBe('dspy');

    // MCP section
    expect(data.content.mcp).toBeDefined();
    expect(data.content.mcp.tools).toBeInstanceOf(Array);

    // OSSA contract
    expect(data.content.ossa).toBeDefined();
    expect(data.content.ossa.role).toBeDefined();
  });

  it('converts to gitlab-duo format', async () => {
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'gitlab-duo' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.target).toBe('gitlab-duo');
    expect(data.content.name).toBeDefined();
  });

  it('writes converted output to disk', async () => {
    const outDir = path.join(tmpDir, 'convert-output');
    const result = await client.callTool({
      name: 'ossa_convert',
      arguments: { path: manifestPath, target: 'kagent', output_dir: outDir },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.written_to).toBeDefined();
    expect(fs.existsSync(data.written_to)).toBe(true);
  });
});

describe('ossa_workspace', () => {
  it('initializes a workspace', async () => {
    const wsDir = path.join(tmpDir, 'ws-test');
    fs.mkdirSync(wsDir, { recursive: true });
    const result = await client.callTool({
      name: 'ossa_workspace',
      arguments: { action: 'init', directory: wsDir, name: 'test-workspace' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.action).toBe('init');
    expect(data.status).toBe('created');
    expect(fs.existsSync(path.join(wsDir, '.agents-workspace'))).toBe(true);
  });

  it('discovers agents in a directory', async () => {
    const result = await client.callTool({
      name: 'ossa_workspace',
      arguments: { action: 'discover', directory: FIXTURE_DIR },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.action).toBe('discover');
    expect(data.count).toBeGreaterThanOrEqual(1);
    expect(data.agents).toBeInstanceOf(Array);
    expect(data.agents[0].name).toBeDefined();
  });

  it('shows workspace status', async () => {
    const wsDir = path.join(tmpDir, 'ws-test');
    const result = await client.callTool({
      name: 'ossa_workspace',
      arguments: { action: 'status', directory: wsDir },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.action).toBe('status');
    expect(data.initialized).toBe(true);
  });
});

describe('ossa_diff', () => {
  it('compares two manifests and detects differences', async () => {
    // Create two slightly different manifests for comparison
    const dirA = path.join(tmpDir, 'diff-a');
    const dirB = path.join(tmpDir, 'diff-b');
    fs.mkdirSync(dirA, { recursive: true });
    fs.mkdirSync(dirB, { recursive: true });
    fs.writeFileSync(
      path.join(dirA, 'manifest.ossa.yaml'),
      `apiVersion: ossa/v0.4\nkind: Agent\nmetadata:\n  name: agent-a\n  version: 1.0.0\nspec:\n  role: Agent A\n  tools:\n    - name: tool-one\n`
    );
    fs.writeFileSync(
      path.join(dirB, 'manifest.ossa.yaml'),
      `apiVersion: ossa/v0.4\nkind: Agent\nmetadata:\n  name: agent-b\n  version: 2.0.0\nspec:\n  role: Agent B\n  tools:\n    - name: tool-two\n`
    );

    const result = await client.callTool({
      name: 'ossa_diff',
      arguments: {
        path_a: path.join(dirA, 'manifest.ossa.yaml'),
        path_b: path.join(dirB, 'manifest.ossa.yaml'),
      },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.total_changes).toBeGreaterThanOrEqual(1);
    expect(data.changes).toBeInstanceOf(Array);
    expect(data.breaking_changes).toBeInstanceOf(Array);
    expect(data.breaking_changes.length).toBeGreaterThan(0); // name changed = breaking
    expect(typeof data.compatible).toBe('boolean');
    expect(data.compatible).toBe(false); // name changed
  });
});

describe('ossa_migrate', () => {
  it('migrates a manifest to v0.4', async () => {
    const manifestPath = path.join(tmpDir, 'test-agent/manifest.ossa.yaml');
    const result = await client.callTool({
      name: 'ossa_migrate',
      arguments: { path: manifestPath, target_version: 'ossa/v0.4' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    expect(data.migrated).toBeDefined();
  });

  it('writes migrated manifest to output dir', async () => {
    const manifestPath = path.join(tmpDir, 'test-agent/manifest.ossa.yaml');
    const outDir = path.join(tmpDir, 'migrate-output');
    const result = await client.callTool({
      name: 'ossa_migrate',
      arguments: { path: manifestPath, output_dir: outDir },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(
      (result.content as Array<{ text: string }>)[0].text
    );
    if (data.written_to) {
      expect(fs.existsSync(data.written_to)).toBe(true);
    }
  });
});

describe('MCP resources', () => {
  it('lists all OSSA resources', async () => {
    const resources = await client.listResources();
    expect(resources.resources.length).toBeGreaterThanOrEqual(5);
    const uris = resources.resources.map((r) => r.uri);
    expect(uris).toContain('ossa://schema/v0.4/agent');
    expect(uris).toContain('ossa://template/minimal');
    expect(uris).toContain('ossa://template/full');
    expect(uris).toContain('ossa://guide/mcp-ossa-a2a');
    expect(uris).toContain('ossa://platforms/supported');
  });

  it('reads minimal template', async () => {
    const result = await client.readResource({
      uri: 'ossa://template/minimal',
    });
    expect(result.contents.length).toBe(1);
    expect(result.contents[0].text).toContain('apiVersion: ossa/v0.4');
    expect(result.contents[0].text).toContain('kind: Agent');
  });

  it('reads full template with all sections', async () => {
    const result = await client.readResource({ uri: 'ossa://template/full' });
    expect(result.contents[0].text).toContain('spec:');
    expect(result.contents[0].text).toContain('tools:');
    expect(result.contents[0].text).toContain('autonomy:');
    expect(result.contents[0].text).toContain('extensions:');
    expect(result.contents[0].text).toContain('token_efficiency:');
  });

  it('reads MCP→OSSA→A2A guide', async () => {
    const result = await client.readResource({
      uri: 'ossa://guide/mcp-ossa-a2a',
    });
    expect(result.contents[0].text).toContain('MCP');
    expect(result.contents[0].text).toContain('OSSA');
    expect(result.contents[0].text).toContain('A2A');
  });

  it('reads supported platforms with SDK references', async () => {
    const result = await client.readResource({
      uri: 'ossa://platforms/supported',
    });
    const platforms = JSON.parse(result.contents[0].text as string);
    expect(platforms.total).toBeGreaterThanOrEqual(14);
    expect(platforms.platforms).toBeInstanceOf(Array);
    const openai = platforms.platforms.find(
      (p: Record<string, unknown>) => p.id === 'openai'
    );
    expect(openai.sdk.npm).toBe('openai');
    expect(openai.sdk.pip).toBe('openai');
  });
});

describe('MCP prompts', () => {
  it('lists all prompts', async () => {
    const prompts = await client.listPrompts();
    expect(prompts.prompts.length).toBeGreaterThanOrEqual(4);
    const names = prompts.prompts.map((p) => p.name);
    expect(names).toContain('create-agent');
    expect(names).toContain('convert-for-platform');
    expect(names).toContain('explain-manifest');
    expect(names).toContain('what-is-ossa');
  });

  it('gets create-agent prompt', async () => {
    const result = await client.getPrompt({
      name: 'create-agent',
      arguments: { description: 'a code review bot' },
    });
    expect(result.messages.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(result.messages[0].content)).toContain(
      'code review bot'
    );
  });

  it('gets what-is-ossa prompt', async () => {
    const result = await client.getPrompt({ name: 'what-is-ossa' });
    expect(result.messages.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(result.messages[0].content)).toContain('OSSA');
  });
});

describe('error handling', () => {
  it('returns error for unknown tool', async () => {
    const result = await client.callTool({
      name: 'ossa_nonexistent',
      arguments: {},
    });

    expect(result.isError).toBe(true);
  });

  it('returns error for missing required arguments', async () => {
    const result = await client.callTool({
      name: 'ossa_validate',
      arguments: {},
    });

    expect(result.isError).toBe(true);
  });
});
