#!/usr/bin/env node

/**
 * OSSA MCP Server — Production-grade
 *
 * 10 tools: ossa_validate, ossa_scaffold, ossa_generate, ossa_publish,
 *           ossa_list, ossa_inspect, ossa_convert, ossa_workspace,
 *           ossa_diff, ossa_migrate
 * 4 prompts: create-agent, convert-for-platform, explain-manifest, what-is-ossa
 * 5 resources: schema, minimal template, full template, MCP→OSSA→A2A guide, platforms
 *
 * Open-source stack:
 *  - @modelcontextprotocol/sdk  — MCP protocol
 *  - zod                        — Input validation (runtime type safety)
 *  - pino                       — Structured logging
 *  - fast-glob                  — Workspace agent discovery
 *  - js-yaml                    — YAML parse/serialize
 *  - RegistryService.publishToRemote — HTTP registry publish
 *  - semver                     — Version parsing and comparison
 */

import 'reflect-metadata';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import pino from 'pino';
import fg from 'fast-glob';
import yaml from 'js-yaml';
import semver from 'semver';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

import { container } from '../di-container.js';
import { ManifestRepository } from '../repositories/manifest.repository.js';
import { ValidationService } from '../services/validation.service.js';
import { MigrationTransformService } from '../services/migration-transform.service.js';
import { VersionDetectionService } from '../services/version-detection.service.js';
import { AgentCardGenerator } from '../services/agent-card-generator.js';
import { RegistryService } from '../services/registry.service.js';
import type { PublishRequest } from '../services/registry.service.js';
import { getApiVersion, getVersion } from '../utils/version.js';
import { scanManifests } from '../utils/manifest-scanner.js';
import {
  getDefaultAgentVersion,
  getDefaultAgentKind,
  getDefaultRoleTemplate,
  getDefaultDescriptionTemplate,
  getAgentTypeConfigs,
} from '../config/defaults.js';
import { initializeAdapters, registry as convertRegistry } from '../adapters/index.js';
import type { OssaAgent } from '../types/index.js';

// ---------------------------------------------------------------------------
// Logging — pino (structured JSON to stderr so MCP stdio stays clean)
// ---------------------------------------------------------------------------
const log = pino({
  name: 'ossa-mcp',
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino/file', options: { destination: 2 } } // stderr
      : undefined,
});

// ---------------------------------------------------------------------------
// Zod input schemas (runtime validation for every tool call)
// ---------------------------------------------------------------------------
const ValidateInput = z.object({
  path: z.string().min(1, 'path is required'),
  platform: z
    .enum(['kagent', 'langchain', 'crewai', 'docker', 'kubernetes', 'gitlab-duo', 'anthropic'])
    .optional(),
  strict: z.boolean().optional().default(false),
});

const ScaffoldInput = z.object({
  name: z.string().min(1).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Must be DNS-1123 format'),
  output_dir: z.string().optional().default('.agents'),
  description: z.string().optional(),
  role: z.string().optional(),
  type: z
    .enum(['worker', 'orchestrator', 'reviewer', 'analyzer', 'executor', 'approver'])
    .optional()
    .default('worker'),
  version: z.string().optional(),
});

const GenerateInput = z.object({
  path: z.string().min(1, 'path is required'),
  output_dir: z.string().optional(),
});

const PublishInput = z.object({
  path: z.string().min(1, 'path is required'),
  registry_url: z.string().optional(),
  dry_run: z.boolean().optional().default(false),
});

const ListInput = z.object({
  directory: z.string().optional().default('.'),
  recursive: z.boolean().optional().default(true),
  format: z.enum(['summary', 'detailed', 'json']).optional().default('summary'),
});

const InspectInput = z.object({
  path: z.string().min(1, 'path is required'),
});

const ConvertInput = z.object({
  path: z.string().min(1, 'path is required'),
  target: z.enum([
    'kagent',
    'docker',
    'langchain',
    'crewai',
    'gitlab-duo',
    'anthropic',
    'openai',
    'autogen',
    'semantic-kernel',
    'a2a',
    'agent-card',
    'claude-agent-sdk',
  ]),
  output_dir: z.string().optional(),
});

const WorkspaceInput = z.object({
  action: z.enum(['init', 'discover', 'status']),
  directory: z.string().optional().default('.'),
  name: z.string().optional(),
});

const DiffInput = z.object({
  path_a: z.string().min(1, 'path_a is required'),
  path_b: z.string().min(1, 'path_b is required'),
});

const MigrateInput = z.object({
  path: z.string().min(1, 'path is required'),
  target_version: z.string().optional().default('ossa/v0.4'),
  output_dir: z.string().optional(),
});

// ---------------------------------------------------------------------------
// DI — wire existing services (single source of truth for all logic)
// ---------------------------------------------------------------------------
const manifestRepo = container.get(ManifestRepository);
const validationService = container.get(ValidationService);
const migrationTransformService = container.get(MigrationTransformService);
const versionDetectionService = container.get(VersionDetectionService);
const registryService = container.get(RegistryService);
const agentCardGenerator = new AgentCardGenerator();

// Initialize adapter registry (config-only adapters for MCP convert)
initializeAdapters();

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
const pkgVersion = getVersion();
const server = new Server(
  { name: 'ossa-mcp', version: pkgVersion },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------
const tools: Tool[] = [
  {
    name: 'ossa_validate',
    description:
      'Validate an OSSA agent manifest against the OSSA v0.4 schema. Returns structured validation result with errors, warnings, and platform-specific checks.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to manifest file (.ossa.yaml, .ossa.yml, .json)' },
        platform: {
          type: 'string',
          enum: ['kagent', 'langchain', 'crewai', 'docker', 'kubernetes', 'gitlab-duo', 'anthropic'],
          description: 'Optional platform-specific validation',
        },
        strict: { type: 'boolean', description: 'Enable strict mode (warnings become errors)', default: false },
      },
      required: ['path'],
    },
  },
  {
    name: 'ossa_scaffold',
    description:
      'Scaffold a new OSSA agent: creates directory structure with manifest.ossa.yaml, prompts/, tools/ stubs, and AGENTS.md.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Agent name (DNS-1123: lowercase alphanumeric + hyphens)' },
        output_dir: { type: 'string', description: 'Parent directory (default: .agents)', default: '.agents' },
        description: { type: 'string', description: 'Short description' },
        role: { type: 'string', description: 'System prompt / role' },
        type: {
          type: 'string',
          enum: ['worker', 'orchestrator', 'reviewer', 'analyzer', 'executor', 'approver'],
          default: 'worker',
        },
        version: { type: 'string', description: 'Initial version (default: 1.0.0)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'ossa_generate',
    description:
      'Generate .well-known/agent-card.json (A2A discovery) from an OSSA manifest. Optionally writes to disk.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to OSSA manifest file' },
        output_dir: { type: 'string', description: 'Optional directory to write agent-card.json' },
      },
      required: ['path'],
    },
  },
  {
    name: 'ossa_publish',
    description:
      'Publish an OSSA agent to a registry. Supports: HTTP registry API, arctl CLI, or dry-run mode.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to OSSA manifest file' },
        registry_url: { type: 'string', description: 'Registry base URL (or set REGISTRY_URL / AGENT_REGISTRY_URL env)' },
        dry_run: { type: 'boolean', description: 'Preview publish payload without sending', default: false },
      },
      required: ['path'],
    },
  },
  {
    name: 'ossa_list',
    description:
      'Discover OSSA agents in a workspace. Scans for manifest.ossa.yaml, agent.ossa.yaml, *.ossa.yaml files using fast-glob.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Root directory to scan (default: cwd)', default: '.' },
        recursive: { type: 'boolean', description: 'Scan subdirectories', default: true },
        format: {
          type: 'string',
          enum: ['summary', 'detailed', 'json'],
          description: 'Output format',
          default: 'summary',
        },
      },
    },
  },
  {
    name: 'ossa_inspect',
    description:
      'Deep-inspect an OSSA manifest: metadata, capabilities, tools, access tiers, deployment targets, and dependency analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to OSSA manifest file' },
      },
      required: ['path'],
    },
  },
  {
    name: 'ossa_convert',
    description:
      'Convert an OSSA manifest to any agent platform: kagent (K8s), docker-compose, LangChain, CrewAI, GitLab Duo, Anthropic Claude, OpenAI, AutoGen, Semantic Kernel, A2A agent-card (universal cross-platform).',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to OSSA manifest file' },
        target: {
          type: 'string',
          enum: ['kagent', 'docker', 'langchain', 'crewai', 'gitlab-duo', 'anthropic', 'openai', 'autogen', 'semantic-kernel', 'a2a', 'agent-card'],
          description: 'Target format',
        },
        output_dir: { type: 'string', description: 'Optional directory to write converted output' },
      },
      required: ['path', 'target'],
    },
  },
  {
    name: 'ossa_workspace',
    description:
      'Manage OSSA agent workspace: init (create .agents-workspace), discover (scan for all agents), status (show workspace info).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['init', 'discover', 'status'],
          description: 'Workspace action',
        },
        directory: { type: 'string', description: 'Root directory to scan (default: current dir)' },
        name: { type: 'string', description: 'Workspace name (for init)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'ossa_diff',
    description:
      'Compare two OSSA manifests and show differences: added/removed/changed fields, tool changes, capability changes, breaking changes.',
    inputSchema: {
      type: 'object',
      properties: {
        path_a: { type: 'string', description: 'Path to first manifest' },
        path_b: { type: 'string', description: 'Path to second manifest' },
      },
      required: ['path_a', 'path_b'],
    },
  },
  {
    name: 'ossa_migrate',
    description:
      'Migrate an OSSA manifest to a newer spec version. Updates apiVersion, maps deprecated fields, and validates result.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to manifest to migrate' },
        target_version: {
          type: 'string',
          description: 'Target OSSA version (default: ossa/v0.4)',
          default: 'ossa/v0.4',
        },
        output_dir: { type: 'string', description: 'Optional directory to write migrated manifest' },
      },
      required: ['path'],
    },
  },
];

// ---------------------------------------------------------------------------
// Resources — expose OSSA schema as an MCP resource
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Resources — expose OSSA schemas, examples, and reference docs
// ---------------------------------------------------------------------------
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'ossa://schema/v0.4/agent',
      name: 'OSSA Agent Schema v0.4',
      description: 'JSON Schema for OSSA v0.4 agent manifests',
      mimeType: 'application/schema+json',
    },
    {
      uri: 'ossa://template/minimal',
      name: 'Minimal OSSA Manifest',
      description: 'Minimal valid OSSA manifest template (copy-paste starter)',
      mimeType: 'text/yaml',
    },
    {
      uri: 'ossa://template/full',
      name: 'Full OSSA Manifest Template',
      description: 'Complete OSSA manifest with all fields (identity, tools, llm, autonomy, safety, observability, a2a, mcp)',
      mimeType: 'text/yaml',
    },
    {
      uri: 'ossa://guide/mcp-ossa-a2a',
      name: 'MCP → OSSA → A2A Guide',
      description: 'How OSSA bridges MCP (tools) and A2A (communication) — the missing agent contract',
      mimeType: 'text/markdown',
    },
    {
      uri: 'ossa://platforms/supported',
      name: 'Supported Platforms',
      description: 'All platforms OSSA converts to with SDK package references (npm/pip)',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const baseDir = import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname);

  switch (request.params.uri) {
    case 'ossa://schema/v0.4/agent': {
      const schemaPath = path.resolve(baseDir, '../../spec/v0.4/agent.schema.json');
      const schemaContent = fs.existsSync(schemaPath)
        ? fs.readFileSync(schemaPath, 'utf8')
        : JSON.stringify({ error: 'Schema file not found', path: schemaPath });
      return { contents: [{ uri: request.params.uri, mimeType: 'application/schema+json', text: schemaContent }] };
    }

    case 'ossa://template/minimal':
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: 'text/yaml',
          text: `apiVersion: ossa/v0.4
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
  description: A helpful agent
spec:
  role: You are a helpful assistant.
`,
        }],
      };

    case 'ossa://template/full':
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: 'text/yaml',
          text: `apiVersion: ossa/v0.4
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
  description: A production-ready agent
  labels:
    capability: analysis,code-review
    framework: mcp
  tags: [ai, agent, mcp]

spec:
  role: >-
    You are an expert assistant that helps with analysis and code review.
    Follow best practices and be thorough.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
    maxTokens: 4096

  tools:
    - name: analyze
      description: Analyze code for quality issues
      type: mcp
      server: code-analysis-server
      inputSchema:
        type: object
        properties:
          code: { type: string }
          language: { type: string }
        required: [code]

  capabilities:
    - id: code-analysis
      description: Static code analysis
    - id: review
      description: Code review with suggestions

  autonomy:
    level: semi-autonomous
    approval_required: true
    allowed_actions: [read, analyze, suggest]
    blocked_actions: [delete, deploy]

  safety:
    content_filters: true
    pii_detection: true
    max_output_tokens: 8192

  observability:
    tracing:
      enabled: true
      exporter: otlp
    metrics:
      enabled: true
    logging:
      level: info
      format: json

  access:
    tier: tier_2_write_limited

extensions:
  mcp:
    servers:
      - name: code-analysis-server
        transport:
          type: stdio
          command: npx
          args: [code-analysis-mcp]

  a2a:
    protocol:
      type: a2a
      version: "1.0"
    endpoints:
      http: https://my-agent.example.com/a2a

token_efficiency:
  serialization_profile: compact
  budget:
    max_input_tokens: 100000
  routing:
    cascade:
      - model: claude-haiku-4-5-20251001
        max_tokens: 1000
      - model: claude-sonnet-4-20250514
        max_tokens: 4096
`,
        }],
      };

    case 'ossa://guide/mcp-ossa-a2a':
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: 'text/markdown',
          text: `# MCP → OSSA → A2A: The Agent Stack

## The Problem
Agent ecosystems have **tools** (MCP) and **communication** (A2A/Google), but no standard way to define **what an agent IS**.

## The Solution: OSSA
OSSA (Open Standard for Software Agents) is the missing contract layer:

\`\`\`
┌─────────────────────────────────────┐
│         A2A (Communication)          │
│   How agents talk to each other      │
│   Skills, Tasks, Agent Cards         │
├─────────────────────────────────────┤
│         OSSA (Contract)              │
│   What the agent IS                  │
│   Identity, Capabilities, Governance │
│   Safety, Autonomy, Deployment       │
├─────────────────────────────────────┤
│         MCP (Tools)                  │
│   What the agent CAN DO             │
│   Servers, Resources, Prompts        │
└─────────────────────────────────────┘
\`\`\`

## How It Works

1. **Define once** in OSSA manifest (YAML):
   - Identity: name, version, role, capabilities
   - Tools: MCP servers and tool definitions
   - LLM: provider, model, parameters
   - Governance: autonomy, safety, access tiers
   - Observability: tracing, metrics, logging

2. **Convert to any platform** via \`ossa_convert\`:
   - **kagent** → Kubernetes CRDs (Agent + ModelConfig)
   - **OpenAI** → Assistants API / function_calling
   - **Anthropic** → Messages API with tool_use
   - **LangChain** → Agent with StructuredTools
   - **CrewAI** → Agent with role/goal/backstory
   - **AutoGen** → ConversableAgent config
   - **agent-card** → Universal cross-platform card

3. **Discover via A2A** using generated agent-card.json:
   - Skills from OSSA capabilities
   - Endpoints from OSSA extensions.a2a
   - MCP tools from OSSA spec.tools

## Key Insight
**MCP defines tools. A2A defines communication. OSSA defines the agent.**
Without OSSA, you have tools and chat but no portable agent identity.

## Get Started
\`\`\`bash
npm install @bluefly/openstandardagents
npx ossa scaffold my-agent
npx ossa validate .agents/my-agent/manifest.ossa.yaml
npx ossa convert .agents/my-agent/manifest.ossa.yaml --target agent-card
\`\`\`

## Links
- Spec: https://openstandardagents.org
- npm: https://www.npmjs.com/package/@bluefly/openstandardagents
- MCP Server: \`npx ossa-mcp\` (this server)
`,
        }],
      };

    case 'ossa://platforms/supported':
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            platforms: [
              { id: 'kagent', name: 'kagent.dev', type: 'kubernetes', docs: 'https://kagent.dev', format: 'v1alpha2 CRD (Agent + ModelConfig)' },
              { id: 'docker', name: 'Docker', type: 'container', docs: 'https://docs.docker.com', format: 'docker-compose.yml' },
              { id: 'openai', name: 'OpenAI', type: 'llm', sdk: { npm: 'openai', pip: 'openai' }, docs: 'https://platform.openai.com/docs', format: 'Assistants / function_calling' },
              { id: 'anthropic', name: 'Anthropic', type: 'llm', sdk: { npm: '@anthropic-ai/sdk', pip: 'anthropic' }, docs: 'https://docs.anthropic.com', format: 'Messages API + tool_use' },
              { id: 'google_genai', name: 'Google Gemini', type: 'llm', sdk: { npm: '@google/generative-ai', pip: 'google-generativeai' }, docs: 'https://ai.google.dev', format: 'GenerativeAI' },
              { id: 'langchain', name: 'LangChain', type: 'framework', sdk: { npm: ['langchain', '@langchain/core'], pip: ['langchain', 'langchain-openai'] }, docs: 'https://js.langchain.com', format: 'Agent + StructuredTool' },
              { id: 'langflow', name: 'LangFlow', type: 'visual', sdk: { pip: 'langflow' }, docs: 'https://docs.langflow.org', format: 'Custom component' },
              { id: 'crewai', name: 'CrewAI', type: 'framework', sdk: { pip: 'crewai' }, docs: 'https://docs.crewai.com', format: 'Agent YAML' },
              { id: 'autogen', name: 'AutoGen', type: 'framework', sdk: { pip: 'autogen-agentchat' }, docs: 'https://microsoft.github.io/autogen', format: 'ConversableAgent' },
              { id: 'semantic-kernel', name: 'Semantic Kernel', type: 'framework', sdk: { npm: 'semantic-kernel', pip: 'semantic-kernel' }, docs: 'https://learn.microsoft.com/en-us/semantic-kernel', format: 'Agent + Plugins' },
              { id: 'llamaindex', name: 'LlamaIndex', type: 'framework', sdk: { npm: 'llamaindex', pip: 'llama-index' }, docs: 'https://docs.llamaindex.ai', format: 'Agent config' },
              { id: 'dspy', name: 'DSPy', type: 'framework', sdk: { pip: 'dspy' }, docs: 'https://dspy.ai', format: 'Module config' },
              { id: 'gitlab-duo', name: 'GitLab Duo', type: 'devops', docs: 'https://docs.gitlab.com/ee/user/gitlab_duo', format: 'Duo agent YAML' },
              { id: 'agent-card', name: 'Universal Agent Card', type: 'universal', docs: 'https://openstandardagents.org', format: 'Cross-platform JSON with all 12 adapters' },
              { id: 'claude-agent-sdk', name: 'Claude Agent SDK', type: 'agent-sdk', sdk: { npm: '@anthropic-ai/claude-agent-sdk', pip: 'claude-agent-sdk', go: 'github.com/M1n9X/claude-agent-sdk-go', rust: 'claude_agent' }, docs: 'https://docs.claude.com/en/api/agent-sdk/overview', format: 'Runnable Agent SDK app (TS/PY/Go/Rust)' },
            ],
            total: 15,
            ossa_version: 'ossa/v0.4',
          }, null, 2),
        }],
      };

    default:
      throw new Error(`Unknown resource: ${request.params.uri}`);
  }
});

// ---------------------------------------------------------------------------
// Prompts — conversation starters for LLMs using OSSA
// ---------------------------------------------------------------------------
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'create-agent',
      description: 'Create a new OSSA agent from a description of what it should do',
      arguments: [
        { name: 'description', description: 'What the agent should do', required: true },
        { name: 'name', description: 'Agent name (DNS-1123 format)', required: false },
      ],
    },
    {
      name: 'convert-for-platform',
      description: 'Convert an existing OSSA manifest to a target platform',
      arguments: [
        { name: 'path', description: 'Path to OSSA manifest', required: true },
        { name: 'platform', description: 'Target platform', required: true },
      ],
    },
    {
      name: 'explain-manifest',
      description: 'Explain what an OSSA manifest does in plain language',
      arguments: [
        { name: 'path', description: 'Path to OSSA manifest', required: true },
      ],
    },
    {
      name: 'what-is-ossa',
      description: 'Explain OSSA and how it bridges MCP and A2A',
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'create-agent':
      return {
        description: 'Create a new OSSA agent',
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Create a new OSSA agent that does the following: ${request.params.arguments?.description || 'a helpful assistant'}.

Use the ossa_scaffold tool to create the directory structure, then customize the manifest. The agent name should be: ${request.params.arguments?.name || 'auto-detect from description'}.

After scaffolding, read the manifest, customize it with appropriate tools, capabilities, and LLM config, then validate it with ossa_validate.`,
          },
        }],
      };

    case 'convert-for-platform':
      return {
        description: 'Convert manifest to target platform',
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Convert the OSSA manifest at ${request.params.arguments?.path || './manifest.ossa.yaml'} to ${request.params.arguments?.platform || 'agent-card'} format.

Use ossa_convert with the target platform. If converting to agent-card, explain the cross-platform adapters available (OpenAI, Anthropic, LangChain, CrewAI, etc.) and the SDK packages needed.`,
          },
        }],
      };

    case 'explain-manifest':
      return {
        description: 'Explain an OSSA manifest',
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Inspect the OSSA manifest at ${request.params.arguments?.path || './manifest.ossa.yaml'} using ossa_inspect and explain:
1. What this agent does (role and capabilities)
2. What tools it has access to
3. What LLM it uses
4. Its autonomy level and safety constraints
5. How it can be deployed (platforms it supports)`,
          },
        }],
      };

    case 'what-is-ossa':
      return {
        description: 'Explain OSSA',
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Explain OSSA (Open Standard for Software Agents) and how it bridges MCP and A2A.

Read the ossa://guide/mcp-ossa-a2a resource for the full explanation. Key points:
- MCP defines tools (what agents CAN DO)
- A2A defines communication (how agents TALK)
- OSSA defines the agent contract (what the agent IS)

Show the supported platforms using the ossa://platforms/supported resource.`,
          },
        }],
      };

    default:
      throw new Error(`Unknown prompt: ${request.params.name}`);
  }
});

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (!args) return errResponse('Missing arguments');

  const startMs = Date.now();
  log.info({ tool: name, args }, 'tool call');

  try {
    const result = await dispatch(name, args);
    log.info({ tool: name, durationMs: Date.now() - startMs }, 'tool complete');
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ tool: name, error: message }, 'tool failed');
    return errResponse(message);
  }
});

async function dispatch(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'ossa_validate':
      return handleValidate(args);
    case 'ossa_scaffold':
      return handleScaffold(args);
    case 'ossa_generate':
      return handleGenerate(args);
    case 'ossa_publish':
      return handlePublish(args);
    case 'ossa_list':
      return handleList(args);
    case 'ossa_inspect':
      return handleInspect(args);
    case 'ossa_convert':
      return handleConvert(args);
    case 'ossa_workspace':
      return handleWorkspace(args);
    case 'ossa_diff':
      return handleDiff(args);
    case 'ossa_migrate':
      return handleMigrate(args);
    default:
      return errResponse(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// ossa_validate
// ---------------------------------------------------------------------------
async function handleValidate(args: Record<string, unknown>) {
  const input = ValidateInput.parse(args);
  const manifestPath = resolvePath(input.path);
  const manifest = await manifestRepo.load(manifestPath);
  const result = await validationService.validate(manifest, input.platform ? { platform: input.platform } : undefined);

  // Strict mode: promote warnings to errors
  if (input.strict && result.warnings?.length) {
    const promoted = result.warnings.map((w: string) => `[strict] ${w}`);
    result.errors = [...(result.errors || []), ...promoted] as typeof result.errors;
    result.valid = !result.errors?.length;
  }

  return okResponse({
    valid: result.valid,
    errors: result.errors || [],
    warnings: result.warnings || [],
    manifest_path: manifestPath,
    platform: input.platform || null,
  });
}

// ---------------------------------------------------------------------------
// ossa_scaffold
// ---------------------------------------------------------------------------
async function handleScaffold(args: Record<string, unknown>) {
  const input = ScaffoldInput.parse(args);
  const outputDir = resolvePath(input.output_dir);
  const agentDir = path.join(outputDir, input.name);

  if (fs.existsSync(agentDir)) {
    return errResponse(`Directory already exists: ${agentDir}`);
  }

  const typeConfigs = getAgentTypeConfigs();
  const typeConfig = typeConfigs[input.type] || typeConfigs.worker;

  const manifest: OssaAgent = {
    apiVersion: getApiVersion(),
    kind: getDefaultAgentKind(),
    metadata: {
      name: input.name,
      version: input.version || getDefaultAgentVersion(),
      description: input.description || getDefaultDescriptionTemplate(input.name),
    },
    spec: {
      role: input.role || getDefaultRoleTemplate(input.name),
      llm: { provider: 'openai', model: '${LLM_MODEL:-gpt-4}' },
      tools: typeConfig.capabilityName ? [{ type: 'capability', name: typeConfig.capabilityName }] : [],
    },
  };

  // Create directory structure
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'prompts'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'tools'), { recursive: true });

  // Write manifest
  const manifestPath = path.join(agentDir, 'manifest.ossa.yaml');
  await manifestRepo.save(manifestPath, manifest);

  // Write AGENTS.md stub
  const agentsMd = `# ${input.name}\n\n${manifest.metadata?.description || ''}\n\n## Tools\n\nTBD\n\n## Usage\n\n\`\`\`bash\nossa validate .agents/${input.name}/manifest.ossa.yaml\n\`\`\`\n`;
  fs.writeFileSync(path.join(agentDir, 'AGENTS.md'), agentsMd, 'utf8');

  return okResponse({
    success: true,
    manifest_path: manifestPath,
    agent_dir: agentDir,
    files_created: ['manifest.ossa.yaml', 'AGENTS.md', 'prompts/', 'tools/'],
  });
}

// ---------------------------------------------------------------------------
// ossa_generate
// ---------------------------------------------------------------------------
async function handleGenerate(args: Record<string, unknown>) {
  const input = GenerateInput.parse(args);
  const manifestPath = resolvePath(input.path);
  const manifest = await manifestRepo.load(manifestPath);
  const result = agentCardGenerator.generate(manifest);

  if (!result.success) {
    return errResponse(
      JSON.stringify({ errors: result.errors, warnings: result.warnings }),
    );
  }

  // Optionally write to disk
  if (input.output_dir) {
    const outDir = resolvePath(input.output_dir);
    const wellKnown = path.join(outDir, '.well-known');
    fs.mkdirSync(wellKnown, { recursive: true });
    const cardPath = path.join(wellKnown, 'agent-card.json');
    fs.writeFileSync(cardPath, result.json ?? JSON.stringify(result.card, null, 2), 'utf8');
    return okResponse({ success: true, agent_card: result.card, written_to: cardPath });
  }

  return okResponse({ success: true, agent_card: result.card });
}

// ---------------------------------------------------------------------------
// ossa_publish
// ---------------------------------------------------------------------------
async function handlePublish(args: Record<string, unknown>) {
  const input = PublishInput.parse(args);
  const manifestPath = resolvePath(input.path);
  const manifest = await manifestRepo.load(manifestPath);
  const cardResult = agentCardGenerator.generate(manifest);

  const payload = {
    manifest,
    agent_card: cardResult.success ? cardResult.card : undefined,
    manifest_path: manifestPath,
  };

  // Dry run — show what would happen for both local and remote
  if (input.dry_run) {
    const registryUrl =
      input.registry_url || process.env.REGISTRY_URL || process.env.AGENT_REGISTRY_URL;
    return okResponse({
      dry_run: true,
      payload,
      local_publish: {
        registry_path: path.join(process.cwd(), '.ossa-registry'),
        agent_id: manifest.metadata?.name || 'unknown-agent',
        version: manifest.metadata?.version || '1.0.0',
      },
      remote_publish: registryUrl
        ? { registry_url: registryUrl, url: registryUrl.replace(/\/?$/, '/api/v1/agents') }
        : null,
      message: 'Payload that would be sent to local and/or remote registry',
    });
  }

  // Always publish locally via RegistryService (DI)
  let localResult: Record<string, unknown> | null = null;
  try {
    const publishRequest: PublishRequest = {
      manifest,
      version: manifest.metadata?.version,
    };
    const entry = await registryService.publish(publishRequest);
    localResult = {
      success: true,
      agent_id: entry.id,
      version: entry.version,
      manifest_url: entry.manifest_url,
      published_at: entry.published_at,
    };
  } catch (err) {
    localResult = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const registryUrl =
    input.registry_url || process.env.REGISTRY_URL || process.env.AGENT_REGISTRY_URL;

  // Remote HTTP registry via RegistryService (if configured)
  if (registryUrl) {
    const remote = await registryService.publishToRemote(registryUrl, payload);
    return okResponse({
      success: remote.success,
      status: remote.status,
      registry_url: registryUrl,
      data: remote.data,
      local_publish: localResult,
    });
  }

  // arctl CLI fallback
  const arctl = spawnSync('arctl', ['publish', manifestPath], {
    encoding: 'utf8',
    timeout: 30000,
  });
  if (arctl.status === 0) {
    return okResponse({
      success: true,
      method: 'arctl',
      stdout: arctl.stdout?.trim(),
      local_publish: localResult,
    });
  }

  // No remote configured — return local result
  if (localResult?.success) {
    return okResponse({
      success: true,
      method: 'local',
      local_publish: localResult,
      message: 'Published to local registry. Set REGISTRY_URL for remote publish.',
    });
  }

  return okResponse({
    published: false,
    message: 'No registry configured. Set REGISTRY_URL or install arctl.',
    local_publish: localResult,
    next_steps: [
      'Set REGISTRY_URL or AGENT_REGISTRY_URL environment variable',
      'Or install arctl: npm install -g @agentregistry/arctl',
      'Then: arctl publish ' + manifestPath,
    ],
  });
}

// ---------------------------------------------------------------------------
// ossa_list — workspace discovery via shared manifest scanner
// Uses src/utils/manifest-scanner.ts for consistent glob patterns and parsing.
// ---------------------------------------------------------------------------
async function handleList(args: Record<string, unknown>) {
  const input = ListInput.parse(args);
  const baseDir = resolvePath(input.directory);

  const results = await scanManifests(baseDir, {
    recursive: input.recursive,
    includeAgentsDirs: true,
    absolute: true,
  });

  const agents: Array<Record<string, unknown>> = results.map((r) =>
    r.error
      ? { name: r.name, path: r.path, error: r.error }
      : {
          name: r.name,
          version: r.version,
          path: r.path,
          kind: r.kind,
          apiVersion: r.apiVersion,
          description: r.description,
        },
  );

  if (input.format === 'json') {
    return okResponse({ count: agents.length, agents });
  }

  if (input.format === 'detailed') {
    const patterns = input.recursive
      ? ['**/*.ossa.yaml', '**/*.ossa.yml', '**/.agents/*/manifest.ossa.yaml']
      : ['*.ossa.yaml', '*.ossa.yml', '.agents/*/manifest.ossa.yaml'];
    return okResponse({
      count: agents.length,
      agents,
      scan_directory: baseDir,
      patterns_used: patterns,
    });
  }

  // summary
  const summary = agents.map(
    (a) => `${a.name}@${a.version} [${a.kind}] — ${a.path}`,
  );
  return okResponse({ count: agents.length, agents: summary });
}

// ---------------------------------------------------------------------------
// ossa_inspect — deep manifest analysis
// ---------------------------------------------------------------------------
async function handleInspect(args: Record<string, unknown>) {
  const input = InspectInput.parse(args);
  const manifestPath = resolvePath(input.path);

  // Single load — no double file read
  const manifest = await manifestRepo.load(manifestPath);
  const validation = await validationService.validate(manifest);
  const fileStat = fs.statSync(manifestPath);

  const meta = manifest.metadata;
  const spec = manifest.spec as Record<string, unknown> | undefined;
  const extensions = (manifest as Record<string, unknown>).extensions as Record<string, unknown> | undefined;

  // Version analysis with semver
  const versionStr = (meta?.version as string) || '0.0.0';
  const parsed = semver.parse(versionStr);

  // Tool analysis
  const specTools = (spec?.tools as Array<Record<string, unknown>>) || [];
  const toolSummary = specTools.map((t) => ({
    name: t.name || t.type,
    type: t.type,
  }));

  // Access tier detection
  const access = spec?.access as Record<string, unknown> | undefined;
  const autonomy = spec?.autonomy as Record<string, unknown> | undefined;

  // Deployment target detection
  const deployTargets: string[] = [];
  if (extensions) {
    if (extensions.kagent) deployTargets.push('kagent');
    if (extensions.docker) deployTargets.push('docker');
    if (extensions.kubernetes) deployTargets.push('kubernetes');
  }

  return okResponse({
    name: meta?.name,
    version: versionStr,
    version_analysis: parsed
      ? { major: parsed.major, minor: parsed.minor, patch: parsed.patch, prerelease: parsed.prerelease }
      : null,
    kind: manifest.kind,
    apiVersion: manifest.apiVersion,
    description: meta?.description,
    role: spec?.role ? String(spec.role).substring(0, 200) + (String(spec.role).length > 200 ? '...' : '') : null,
    llm: spec?.llm || null,
    tools: toolSummary,
    tool_count: specTools.length,
    access_tier: access?.tier || null,
    autonomy_level: autonomy?.level || autonomy?.humanInLoop || null,
    deploy_targets: deployTargets,
    has_extensions: !!extensions,
    extension_keys: extensions ? Object.keys(extensions) : [],
    validation: {
      valid: validation.valid,
      error_count: validation.errors?.length || 0,
      warning_count: validation.warnings?.length || 0,
    },
    file_size_bytes: fileStat.size,
    manifest_path: manifestPath,
  });
}

// ---------------------------------------------------------------------------
// ossa_convert — export to target platform format
//
// Most targets delegate to the adapter registry's toConfig() method (#442).
// a2a/agent-card and claude-agent-sdk remain inline due to their complexity
// (cross-platform card generation and SDK-specific config respectively).
// ---------------------------------------------------------------------------
async function handleConvert(args: Record<string, unknown>) {
  const input = ConvertInput.parse(args);
  const manifestPath = resolvePath(input.path);
  const manifest = await manifestRepo.load(manifestPath);
  const meta = manifest.metadata || { name: path.basename(manifestPath, '.ossa.yaml'), version: '0.0.0' };

  let converted: Record<string, unknown>;
  let filename: string;

  // a2a/agent-card is special: complex cross-platform card stays inline
  if (input.target === 'a2a' || input.target === 'agent-card') {
      // Build comprehensive cross-platform agent card
      // This is THE universal discovery format: MCP → OSSA → A2A
      let cardResult: { success: boolean; card?: unknown; errors: string[] } = { success: false, errors: [] };
      try {
        cardResult = agentCardGenerator.generate(manifest);
      } catch {
        // AgentCardGenerator may fail on some manifests — continue building the card
      }

      const tools = (manifest.spec?.tools || []) as Array<Record<string, unknown>>;
      const role = manifest.spec?.role || '';
      const llm = manifest.spec?.llm as Record<string, unknown> | undefined;
      const provider = (llm?.provider as string) || 'openai';
      const model = (llm?.model as string) || 'gpt-4';
      const description = meta.description || '';

      // Build universal tool schemas for cross-platform use
      const universalTools = tools.map((t) => ({
        name: t.name || 'unnamed',
        description: (t.description as string) || '',
        inputSchema: (t.inputSchema || t.input_schema || t.parameters || { type: 'object', properties: {} }) as Record<string, unknown>,
        ...(t.outputSchema || t.output_schema ? { outputSchema: t.outputSchema || t.output_schema } : {}),
        ...(t.type ? { type: t.type } : {}),
        ...(t.server ? { mcpServer: t.server } : {}),
      }));

      // A2A skills from tools (Google A2A agent card format)
      const a2aSkills = universalTools.map((t) => ({
        id: t.name,
        name: t.name,
        description: t.description,
        ...(t.inputSchema ? { inputModes: ['application/json'] } : {}),
        outputModes: ['application/json', 'text/plain'],
      }));

      // MCP tool format (Model Context Protocol)
      const mcpTools = universalTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));

      // OpenAI function_calling format
      const openaiTools = universalTools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      }));

      // Anthropic tool_use format
      const anthropicTools = universalTools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));

      // LangChain StructuredTool format
      const langchainTools = universalTools.map((t) => ({
        _type: 'structured_tool',
        name: t.name,
        description: t.description,
        args_schema: t.inputSchema,
      }));

      // CrewAI tool format
      const crewaiTools = universalTools.map((t) => ({
        name: t.name,
        description: t.description,
        ...(t.inputSchema ? { args_schema: t.inputSchema } : {}),
      }));

      // LangFlow component format
      const langflowComponent = {
        display_name: meta.name,
        description,
        documentation: `https://openstandardagents.org/agents/${meta.name}`,
        template: {
          system_message: { type: 'str', value: role },
          model_name: { type: 'str', value: model },
          provider: { type: 'str', value: provider },
          tools: { type: 'list', value: universalTools.map((t) => t.name) },
        },
      };

      // AutoGen agent format
      const autogenConfig = {
        name: meta.name,
        description,
        system_message: role,
        llm_config: {
          config_list: [{ model, api_type: provider === 'anthropic' ? 'anthropic' : 'openai' }],
        },
        ...(universalTools.length > 0 ? { tools: universalTools.map((t) => ({ name: t.name, description: t.description })) } : {}),
      };

      // Semantic Kernel agent format
      const semanticKernelConfig = {
        name: meta.name,
        description,
        instructions: role,
        model: { id: model, provider },
        plugins: universalTools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        })),
      };

      // kagent.dev CRD reference (not full CRD — use target: kagent for that)
      const kagentRef = {
        apiVersion: 'kagent.dev/v1alpha2',
        kind: 'Agent',
        metadata: { name: meta.name },
        spec: {
          type: 'Declarative',
          declarative: {
            modelConfig: `${meta.name}-model-config`,
            systemMessage: role,
          },
        },
      };

      // Extensions from OSSA manifest
      const extensions = (manifest as Record<string, unknown>).extensions as Record<string, unknown> | undefined;
      const a2aExt = extensions?.a2a as Record<string, unknown> | undefined;
      const mcpExt = extensions?.mcp as Record<string, unknown> | undefined;

      // Build the comprehensive agent card
      converted = {
        // --- Core identity (OSSA source of truth) ---
        name: meta.name,
        version: meta.version || '1.0.0',
        description,
        url: `https://openstandardagents.org/agents/${meta.name}`,
        ossaVersion: manifest.apiVersion || 'ossa/v0.4',
        kind: manifest.kind || 'Agent',

        // --- The OSSA contract (identity + capabilities + constraints) ---
        ossa: {
          role,
          capabilities: (manifest.spec?.capabilities || []) as unknown[],
          ...(manifest.spec?.autonomy ? { autonomy: manifest.spec.autonomy } : {}),
          ...(manifest.spec?.safety ? { safety: manifest.spec.safety } : {}),
          ...(manifest.spec?.observability ? { observability: manifest.spec.observability } : {}),
          ...((manifest.spec as Record<string, unknown>)?.access ? { access: (manifest.spec as Record<string, unknown>).access } : {}),
        },

        // --- A2A discovery (Google Agent-to-Agent protocol) ---
        capabilities: {
          streaming: true,
          pushNotifications: false,
          stateTransitionHistory: true,
        },
        skills: a2aSkills,
        defaultInputModes: ['application/json', 'text/plain'],
        defaultOutputModes: ['application/json', 'text/plain'],

        // --- MCP tools (Model Context Protocol) ---
        mcp: {
          tools: mcpTools,
          ...(mcpExt?.servers ? { servers: mcpExt.servers } : {}),
          ...(mcpExt?.resources ? { resources: mcpExt.resources } : {}),
        },

        // --- Platform adapters (use these directly in your framework) ---
        // Each adapter includes: sdk (npm/pip packages), config (ready-to-use), usage (code snippet)
        adapters: {
          openai: {
            sdk: { npm: 'openai', pip: 'openai', docs: 'https://platform.openai.com/docs/api-reference' },
            config: {
              model,
              messages: [{ role: 'system', content: role }],
              tools: openaiTools,
              tool_choice: 'auto',
            },
            usage: `import OpenAI from 'openai';\nconst client = new OpenAI();\nconst response = await client.chat.completions.create(config);`,
          },
          anthropic: {
            sdk: { npm: '@anthropic-ai/sdk', pip: 'anthropic', docs: 'https://docs.anthropic.com/en/api' },
            config: {
              model: provider === 'anthropic' ? model : 'claude-sonnet-4-20250514',
              system: role,
              tools: anthropicTools,
              max_tokens: (llm?.maxTokens as number) || 4096,
            },
            usage: `import Anthropic from '@anthropic-ai/sdk';\nconst client = new Anthropic();\nconst response = await client.messages.create(config);`,
          },
          google_genai: {
            sdk: { npm: '@google/generative-ai', pip: 'google-generativeai', docs: 'https://ai.google.dev/docs' },
            config: {
              model: 'gemini-2.0-flash',
              systemInstruction: role,
              tools: [{ functionDeclarations: openaiTools.map((t) => t.function) }],
            },
            usage: `import { GoogleGenerativeAI } from '@google/generative-ai';\nconst genAI = new GoogleGenerativeAI(apiKey);\nconst model = genAI.getGenerativeModel(config);`,
          },
          langchain: {
            sdk: {
              npm: ['langchain', '@langchain/core', '@langchain/openai', '@langchain/anthropic'],
              pip: ['langchain', 'langchain-openai', 'langchain-anthropic'],
              docs: 'https://js.langchain.com/docs/',
            },
            config: {
              _type: 'agent',
              name: meta.name,
              llm: {
                _type: provider === 'anthropic' ? 'ChatAnthropic' : 'ChatOpenAI',
                model_name: model,
              },
              system_message: role,
              tools: langchainTools,
            },
            usage: `from langchain.agents import create_tool_calling_agent\nagent = create_tool_calling_agent(llm, tools, prompt)`,
          },
          langflow: {
            sdk: { pip: 'langflow', docs: 'https://docs.langflow.org/' },
            config: langflowComponent,
            usage: 'Import as custom component in LangFlow UI or use langflow CLI',
          },
          crewai: {
            sdk: { pip: 'crewai', docs: 'https://docs.crewai.com/' },
            config: {
              agents: [{
                role: meta.name,
                goal: description,
                backstory: role,
                llm: model,
                tools: crewaiTools,
              }],
            },
            usage: `from crewai import Agent\nagent = Agent(role=config['role'], goal=config['goal'], backstory=config['backstory'])`,
          },
          autogen: {
            sdk: { pip: 'autogen-agentchat', docs: 'https://microsoft.github.io/autogen/' },
            config: autogenConfig,
            usage: `from autogen import ConversableAgent\nagent = ConversableAgent(name=config['name'], system_message=config['system_message'], llm_config=config['llm_config'])`,
          },
          semantic_kernel: {
            sdk: { npm: 'semantic-kernel', pip: 'semantic-kernel', docs: 'https://learn.microsoft.com/en-us/semantic-kernel/' },
            config: semanticKernelConfig,
            usage: `import semantic_kernel as sk\nkernel = sk.Kernel()\nkernel.add_chat_service("default", OpenAIChatCompletion(config['execution_settings']['default']['model_id']))`,
          },
          llamaindex: {
            sdk: { npm: 'llamaindex', pip: 'llama-index', docs: 'https://docs.llamaindex.ai/' },
            config: {
              name: meta.name,
              description,
              system_prompt: role,
              llm: { model, provider },
              tools: universalTools.map((t) => ({ name: t.name, description: t.description, fn_schema: t.inputSchema })),
            },
            usage: `from llama_index.agent.openai import OpenAIAgent\nagent = OpenAIAgent.from_tools(tools, system_prompt=config['system_prompt'])`,
          },
          dspy: {
            sdk: { pip: 'dspy', docs: 'https://dspy.ai/' },
            config: {
              name: meta.name,
              instructions: role,
              lm: `${provider}/${model}`,
              tools: universalTools.map((t) => t.name),
            },
            usage: `import dspy\nlm = dspy.LM('${provider}/${model}')\ndspy.configure(lm=lm)`,
          },
          kagent: {
            sdk: { docs: 'https://kagent.dev/docs' },
            config: kagentRef,
            usage: 'kubectl apply -f <converted>.kagent.yaml  # Use target: kagent for full CRD output',
          },
          gitlab_duo: {
            sdk: { docs: 'https://docs.gitlab.com/ee/user/gitlab_duo/' },
            config: {
              name: meta.name,
              description,
              system_prompt: role,
              model: provider === 'anthropic' ? model : 'claude-sonnet-4-20250514',
              tools: universalTools.map((t) => ({ name: t.name })),
            },
            usage: 'Place in .gitlab/duo/agents/ directory',
          },
          claude_agent_sdk: {
            sdk: {
              npm: '@anthropic-ai/claude-agent-sdk',
              pip: 'claude-agent-sdk',
              go: 'github.com/M1n9X/claude-agent-sdk-go',
              rust: 'claude_agent',
              docs: 'https://docs.claude.com/en/api/agent-sdk/overview',
            },
            config: {
              systemPrompt: role,
              model: provider === 'anthropic' ? model : 'claude-sonnet-4-20250514',
              allowedTools: universalTools.map((t) => t.name),
            },
            usage: `import { query } from '@anthropic-ai/claude-agent-sdk';\nconst conversation = query({ prompt, options: config });\nfor await (const msg of conversation) { /* handle */ }`,
          },
        },

        // --- A2A protocol details (if defined in OSSA extensions) ---
        ...(a2aExt ? {
          a2a: {
            ...(a2aExt.protocol ? { protocol: a2aExt.protocol } : {}),
            ...(a2aExt.endpoints ? { endpoints: a2aExt.endpoints } : {}),
            ...(a2aExt.routing ? { routing: a2aExt.routing } : {}),
            ...(a2aExt.delegation ? { delegation: a2aExt.delegation } : {}),
          },
        } : {}),

        // --- Full OSSA agent card (from generator) ---
        ...(cardResult.success && cardResult.card ? {
          _agentCard: cardResult.card as unknown as Record<string, unknown>,
        } : {}),
      };
      filename = 'agent-card.json';

  } else if (input.target === 'claude-agent-sdk') {
      // Generate Claude Agent SDK application config (TypeScript + Python)
      const sdkTools = (manifest.spec?.tools || []) as Array<Record<string, unknown>>;
      const sdkLlm = manifest.spec?.llm as Record<string, unknown> | undefined;
      const sdkModel = (typeof sdkLlm === 'string' ? sdkLlm : (sdkLlm?.model as string)) || 'claude-sonnet-4-20250514';
      const sdkRole = manifest.spec?.role || '';
      const sdkCaps = ((manifest.spec?.capabilities || []) as Array<string | Record<string, unknown>>)
        .map((c) => (typeof c === 'string' ? c : (c as Record<string, unknown>).name || ''));

      // Map capabilities to Claude Agent SDK built-in tools
      const builtInTools: string[] = [];
      const capToolMap: Record<string, string[]> = {
        'web-search': ['WebSearch', 'WebFetch'],
        'file-access': ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
        'file-read': ['Read', 'Glob', 'Grep'],
        'file-write': ['Read', 'Write', 'Edit'],
        'code-execution': ['Bash'],
        'shell': ['Bash'],
        'bash': ['Bash'],
        'code-analysis': ['Read', 'Glob', 'Grep'],
        'explore': ['Read', 'Glob', 'Grep'],
      };
      for (const cap of sdkCaps) {
        const mapped = capToolMap[cap as string];
        if (mapped) {
          for (const t of mapped) {
            if (!builtInTools.includes(t)) builtInTools.push(t);
          }
        }
      }

      // Map MCP servers from tools
      const mcpServers: Record<string, Record<string, unknown>> = {};
      const customTools: Array<Record<string, unknown>> = [];
      for (const tool of sdkTools) {
        if (tool.type === 'mcp' && tool.server) {
          const sname = String(tool.server);
          if (!mcpServers[sname]) {
            mcpServers[sname] = {
              type: (tool.transport as string) || 'stdio',
              ...(tool.command ? { command: tool.command } : {}),
              ...(tool.args ? { args: tool.args } : {}),
              ...(tool.url ? { url: tool.url } : {}),
            };
          }
        } else {
          customTools.push({
            name: tool.name || 'unnamed',
            description: (tool.description as string) || '',
            inputSchema: tool.inputSchema || tool.input_schema || tool.parameters || { type: 'object', properties: {} },
          });
        }
      }

      // Map autonomy to permission mode
      const sdkAutonomy = manifest.spec?.autonomy as Record<string, unknown> | undefined;
      let permissionMode = 'default';
      if (sdkAutonomy) {
        const level = (sdkAutonomy.level as string) || '';
        if (level === 'full' || level === 'autonomous') permissionMode = 'bypassPermissions';
        else if (level === 'supervised') permissionMode = 'acceptEdits';
        else if (level === 'planning') permissionMode = 'planMode';
      }

      // Resolve Claude model name
      let claudeModel = 'claude-sonnet-4-20250514';
      if (sdkModel.includes('opus')) claudeModel = 'claude-opus-4-20250514';
      else if (sdkModel.includes('haiku')) claudeModel = 'claude-haiku-4-5-20251001';
      else if (sdkModel.includes('sonnet')) claudeModel = 'claude-sonnet-4-20250514';
      else if (sdkModel.includes('claude')) claudeModel = sdkModel;

      converted = {
        name: meta.name,
        version: meta.version || '1.0.0',
        description: meta.description || '',
        ossaVersion: manifest.apiVersion || 'ossa/v0.4',

        // Claude Agent SDK configuration
        sdk: {
          typescript: {
            package: '@anthropic-ai/claude-agent-sdk',
            install: 'npm install @anthropic-ai/claude-agent-sdk',
            docs: 'https://docs.claude.com/en/api/agent-sdk/typescript',
          },
          python: {
            package: 'claude-agent-sdk',
            install: 'pip install claude-agent-sdk',
            docs: 'https://docs.claude.com/en/api/agent-sdk/python',
          },
          go: {
            package: 'github.com/M1n9X/claude-agent-sdk-go',
            install: 'go get github.com/M1n9X/claude-agent-sdk-go',
            docs: 'https://github.com/M1n9X/claude-agent-sdk-go',
            community: true,
          },
          rust: {
            package: 'claude_agent',
            install: 'cargo add claude_agent',
            docs: 'https://crates.io/crates/claude_agent',
            community: true,
          },
        },

        // Agent options (ready to use in SDK)
        options: {
          systemPrompt: sdkRole,
          model: claudeModel,
          permissionMode,
          ...(builtInTools.length > 0 ? { allowedTools: builtInTools } : {}),
          ...(Object.keys(mcpServers).length > 0 ? { mcpServers } : {}),
        },

        // Custom tools (need implementation)
        ...(customTools.length > 0 ? { customTools } : {}),

        // TypeScript usage
        usage: {
          typescript: `import { query } from '@anthropic-ai/claude-agent-sdk';\n\nconst conversation = query({\n  prompt: 'Your prompt here',\n  options: ${JSON.stringify({ systemPrompt: sdkRole.substring(0, 80) + '...', model: claudeModel, permissionMode }, null, 4)}\n});\n\nfor await (const message of conversation) {\n  if (message.type === 'assistant') {\n    for (const block of message.message.content) {\n      if (block.type === 'text') process.stdout.write(block.text);\n    }\n  }\n}`,
          python: `from claude_agent_sdk import query\n\nasync for message in query(\n    prompt="Your prompt here",\n    options=ClaudeAgentOptions(\n        system_prompt=${JSON.stringify(sdkRole.substring(0, 80) + '...')},\n        model="${claudeModel}",\n        permission_mode="${permissionMode}",\n    )\n):\n    if message.type == "assistant":\n        for block in message.message.content:\n            if hasattr(block, "text"):\n                print(block.text, end="")`,
        },
      };
      filename = `${meta.name}.claude-agent-sdk.json`;

  } else {
    // Delegate to adapter registry (config-only + full adapters with toConfig())
    initializeAdapters();
    const adapter = convertRegistry.getAdapter(input.target);
    if (!adapter) {
      return errResponse(`Unknown target: ${input.target}`);
    }
    try {
      const result = await adapter.toConfig(manifest);
      converted = result.config;
      filename = result.filename;
    } catch (err) {
      return errResponse(
        `toConfig() failed for target "${input.target}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Optionally write to disk
  if (input.output_dir) {
    const outDir = resolvePath(input.output_dir);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, filename);

    // Handle multi-resource YAML (kagent generates Agent + ModelConfig)
    const multiRes = converted as Record<string, unknown>;
    let content: string;
    if (multiRes._ossa_multi_resource && Array.isArray(multiRes.resources)) {
      content = (multiRes.resources as Record<string, unknown>[])
        .map((r) => yaml.dump(r, { lineWidth: 120, noRefs: true }))
        .join('---\n');
    } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      content = yaml.dump(converted, { lineWidth: 120, noRefs: true });
    } else {
      content = JSON.stringify(converted, null, 2);
    }

    fs.writeFileSync(outPath, content, 'utf8');
    return okResponse({ target: input.target, written_to: outPath, content: converted });
  }

  return okResponse({ target: input.target, filename, content: converted });
}

// ---------------------------------------------------------------------------
// ossa_workspace — init, discover, status
// ---------------------------------------------------------------------------
async function handleWorkspace(args: Record<string, unknown>) {
  const input = WorkspaceInput.parse(args);
  const dir = resolvePath(input.directory);

  switch (input.action) {
    case 'init': {
      const wsDir = path.join(dir, '.agents-workspace');
      const registryDir = path.join(wsDir, 'registry');
      if (fs.existsSync(wsDir)) {
        return okResponse({ action: 'init', status: 'already_exists', path: wsDir });
      }
      fs.mkdirSync(registryDir, { recursive: true });
      const wsName = input.name || path.basename(dir);
      const indexYaml = yaml.dump({
        workspace: wsName,
        version: '1.0.0',
        created: new Date().toISOString(),
        agents: [],
      });
      fs.writeFileSync(path.join(registryDir, 'index.yaml'), indexYaml);
      fs.writeFileSync(
        path.join(wsDir, 'README.md'),
        `# OSSA Workspace: ${wsName}\n\nGenerated by OSSA MCP Server.\n\nRun \`ossa workspace discover\` to scan for agents.\n`,
      );
      return okResponse({ action: 'init', status: 'created', path: wsDir, name: wsName });
    }

    case 'discover': {
      // Scan for all *.ossa.yaml manifests
      const patterns = ['**/*.ossa.yaml', '**/*.ossa.yml', '**/.agents/*/manifest.ossa.yaml'];
      const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/coverage/**'];
      const files = await fg(patterns, { cwd: dir, ignore: ignorePatterns, absolute: true });

      const agents: Array<{ name: string; path: string; version: string; kind: string; description: string }> = [];
      for (const f of files) {
        try {
          const raw = fs.readFileSync(f, 'utf8');
          const m = yaml.load(raw) as Record<string, unknown>;
          const meta = m?.metadata as Record<string, unknown> | undefined;
          agents.push({
            name: (meta?.name as string) || path.basename(path.dirname(f)),
            path: f,
            version: (meta?.version as string) || '0.0.0',
            kind: (m?.kind as string) || 'Agent',
            description: (meta?.description as string) || '',
          });
        } catch {
          // Skip unparseable files
        }
      }

      // Write discovery output if .agents-workspace exists
      const wsDir = path.join(dir, '.agents-workspace');
      if (fs.existsSync(wsDir)) {
        const registryDir = path.join(wsDir, 'registry');
        fs.mkdirSync(registryDir, { recursive: true });
        const index = {
          workspace: path.basename(dir),
          discovered: new Date().toISOString(),
          count: agents.length,
          agents: agents.map((a) => ({ name: a.name, version: a.version, kind: a.kind, path: a.path })),
        };
        fs.writeFileSync(path.join(registryDir, 'index.yaml'), yaml.dump(index));
      }

      return okResponse({ action: 'discover', count: agents.length, agents });
    }

    case 'status': {
      const wsDir = path.join(dir, '.agents-workspace');
      const indexPath = path.join(wsDir, 'registry', 'index.yaml');
      if (!fs.existsSync(indexPath)) {
        return okResponse({ action: 'status', initialized: false, message: 'Run ossa_workspace with action: init first' });
      }
      const indexContent = yaml.load(fs.readFileSync(indexPath, 'utf8')) as Record<string, unknown>;
      return okResponse({ action: 'status', initialized: true, workspace: indexContent });
    }
  }
}

// ---------------------------------------------------------------------------
// ossa_diff — compare two manifests (recursive deepDiff, same as CLI)
// ---------------------------------------------------------------------------

/** Recursive deep diff — same algorithm as diff.command.ts (DRY) */
function deepDiff(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  prefix = '',
): Array<{ type: 'added' | 'removed' | 'modified'; path: string; oldValue?: unknown; newValue?: unknown }> {
  const changes: Array<{ type: 'added' | 'removed' | 'modified'; path: string; oldValue?: unknown; newValue?: unknown }> = [];
  const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

  for (const key of allKeys) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    if (!(key in (obj1 || {}))) {
      changes.push({ type: 'added', path: fieldPath, newValue: val2 });
    } else if (!(key in (obj2 || {}))) {
      changes.push({ type: 'removed', path: fieldPath, oldValue: val1 });
    } else if (
      typeof val1 === 'object' && typeof val2 === 'object' &&
      val1 !== null && val2 !== null &&
      !Array.isArray(val1) && !Array.isArray(val2)
    ) {
      changes.push(...deepDiff(val1 as Record<string, unknown>, val2 as Record<string, unknown>, fieldPath));
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      changes.push({ type: 'modified', path: fieldPath, oldValue: val1, newValue: val2 });
    }
  }
  return changes;
}

/** Detect breaking changes (same rules as diff.command.ts) */
function isBreakingChange(change: { type: string; path: string }): boolean {
  if (change.type === 'removed') return true;
  if (change.path.includes('metadata.name') || change.path.includes('metadata.version')) return true;
  if (change.path.includes('spec.role')) return true;
  if (change.path.includes('apiVersion')) return true;
  return false;
}

async function handleDiff(args: Record<string, unknown>) {
  const input = DiffInput.parse(args);
  const pathA = resolvePath(input.path_a);
  const pathB = resolvePath(input.path_b);

  if (!fs.existsSync(pathA)) return errResponse(`File not found: ${pathA}`);
  if (!fs.existsSync(pathB)) return errResponse(`File not found: ${pathB}`);

  const manifestA = await manifestRepo.load(pathA);
  const manifestB = await manifestRepo.load(pathB);

  // Full recursive diff (catches ALL nested field changes)
  const allChanges = deepDiff(
    manifestA as unknown as Record<string, unknown>,
    manifestB as unknown as Record<string, unknown>,
  );
  const breakingChanges = allChanges.filter(isBreakingChange);

  return okResponse({
    path_a: pathA,
    path_b: pathB,
    name_a: manifestA.metadata?.name,
    name_b: manifestB.metadata?.name,
    total_changes: allChanges.length,
    breaking_changes: breakingChanges.map((c) => `${c.path}: ${c.type}`),
    changes: allChanges,
    compatible: breakingChanges.length === 0,
  });
}

// ---------------------------------------------------------------------------
// ossa_migrate — delegates to MigrationTransformService (DRY with CLI)
// ---------------------------------------------------------------------------
async function handleMigrate(args: Record<string, unknown>) {
  const input = MigrateInput.parse(args);
  const manifestPath = resolvePath(input.path);
  const manifest = await manifestRepo.load(manifestPath);
  const detectionResult = await versionDetectionService.detectVersion(manifest);
  const currentVersion = detectionResult.version || (manifest.apiVersion as string) || 'unknown';
  const targetVersion = input.target_version;

  if (currentVersion === targetVersion || `ossa/${currentVersion}` === targetVersion) {
    return okResponse({ migrated: false, reason: `Already at ${targetVersion}`, manifest_path: manifestPath });
  }

  // Strip 'ossa/' prefix for MigrationTransformService (expects '0.3.3', not 'ossa/v0.3.3')
  const fromVer = currentVersion.replace(/^ossa\/v?/, '');
  const toVer = targetVersion.replace(/^ossa\/v?/, '');

  // Try registered transform first (handles all version-specific logic)
  const transform = migrationTransformService.getTransform(fromVer, toVer);
  let migrated: OssaAgent;
  const migrations: string[] = [];

  if (transform) {
    migrated = migrationTransformService.applyTransform(manifest, fromVer, toVer);
    migrations.push(`${transform.description} (${fromVer} → ${toVer})`);
    if (transform.breaking) migrations.push('WARNING: This migration contains breaking changes');

    // Validate migration preserved critical fields
    const warnings = migrationTransformService.validateMigration(manifest, migrated);
    if (warnings.length) migrations.push(...warnings.map((w) => `WARN: ${w}`));
  } else {
    // Fallback: update apiVersion only (no registered transform for this pair)
    migrated = JSON.parse(JSON.stringify(manifest)) as OssaAgent;
    migrated.apiVersion = targetVersion;
    migrations.push(`apiVersion: ${currentVersion} → ${targetVersion} (no registered transform — apiVersion updated only)`);
  }

  // Write output
  if (input.output_dir) {
    const outDir = resolvePath(input.output_dir);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, path.basename(manifestPath));
    const output = yaml.dump(migrated as Record<string, unknown>, { lineWidth: 120, noRefs: true });
    fs.writeFileSync(outPath, output, 'utf8');
    return okResponse({ migrated: true, from: currentVersion, to: targetVersion, migrations, written_to: outPath });
  }

  return okResponse({ migrated: true, from: currentVersion, to: targetVersion, migrations, manifest: migrated });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Resolve path with traversal guard.
 * Absolute paths are allowed (MCP clients are user-configured and trusted).
 * Relative paths are resolved from cwd and checked for traversal escapes.
 */
function resolvePath(p: string): string {
  const s = p.trim();
  if (path.isAbsolute(s)) {
    return path.resolve(s);
  }
  // Relative path: resolve from cwd and reject if it escapes via ../
  const resolved = path.resolve(process.cwd(), s);
  const cwd = path.resolve(process.cwd());
  if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
    throw new Error(`Path traversal rejected: relative path "${p}" escapes working directory`);
  }
  return resolved;
}

function okResponse(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errResponse(message: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// Main — stdio transport
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info(
    { tools: tools.map((t) => t.name), version: pkgVersion },
    'OSSA MCP server running on stdio',
  );
}

main().catch((e) => {
  log.fatal({ error: e }, 'Fatal error');
  process.exit(1);
});
