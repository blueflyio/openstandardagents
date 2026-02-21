#!/usr/bin/env node

/**
 * OSSA MCP Server
 * Exposes ossa_validate, ossa_scaffold, ossa_generate, ossa_publish over MCP stdio.
 * Uses existing ValidationService, ManifestRepository, AgentCardGenerator.
 */

import 'reflect-metadata';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { container } from '../di-container.js';
import { ManifestRepository } from '../repositories/manifest.repository.js';
import { ValidationService } from '../services/validation.service.js';
import { AgentCardGenerator } from '../services/agent-card-generator.js';
import { getApiVersion } from '../utils/version.js';
import {
  getDefaultAgentVersion,
  getDefaultAgentKind,
  getDefaultRoleTemplate,
  getDefaultDescriptionTemplate,
  getDefaultOutputDir,
  getAgentTypeConfigs,
  getDefaultAgentType,
  getDNS1123Regex,
} from '../config/defaults.js';
import type { OssaAgent } from '../types/index.js';

const server = new Server(
  {
    name: 'ossa-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const manifestRepo = container.get(ManifestRepository);
const validationService = container.get(ValidationService);
const agentCardGenerator = new AgentCardGenerator();

const tools: Tool[] = [
  {
    name: 'ossa_validate',
    description:
      'Validate an OSSA agent manifest (YAML/JSON) against the OSSA schema. Returns validation result with errors and warnings.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to manifest file (.ossa.yaml, .ossa.yml, or .json)',
        },
        platform: {
          type: 'string',
          description:
            'Optional platform-specific validation (kagent, langchain, crewai, docker, kubernetes)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'ossa_scaffold',
    description:
      'Scaffold a new OSSA agent: create directory and manifest.ossa.yaml with defaults.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Agent name (DNS-1123 format, e.g. my-agent)',
        },
        output_dir: {
          type: 'string',
          description: 'Parent directory for the new agent folder',
          default: '.agents',
        },
        description: {
          type: 'string',
          description: 'Optional short description',
        },
        role: {
          type: 'string',
          description: 'Optional system prompt / role',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'ossa_generate',
    description:
      'Generate .well-known/agent-card.json from an OSSA manifest. Returns the agent card JSON.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to OSSA manifest file',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'ossa_publish',
    description:
      'Publish an OSSA agent to a registry (agentregistry/arctl). When arctl or registry API is not configured, returns instructions.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to OSSA manifest file',
        },
        registry_url: {
          type: 'string',
          description: 'Optional registry base URL',
        },
      },
      required: ['path'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (!args) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Missing arguments' }, null, 2) }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'ossa_validate': {
        const manifestPath = resolvePath(args.path as string);
        const manifest = await manifestRepo.load(manifestPath);
        const platform = args.platform as string | undefined;
        const result = await validationService.validate(manifest);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  valid: result.valid,
                  errors: result.errors,
                  warnings: result.warnings,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'ossa_scaffold': {
        const name = (args.name as string).trim();
        if (!getDNS1123Regex().test(name)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'Agent name must be DNS-1123 (lowercase alphanumeric and hyphens)',
                }),
              },
            ],
            isError: true,
          };
        }
        const outputDir = resolvePath((args.output_dir as string) || getDefaultOutputDir());
        const agentDir = path.join(outputDir, name);
        if (fs.existsSync(agentDir)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: `Directory already exists: ${agentDir}` }),
              },
            ],
            isError: true,
          };
        }
        const typeConfigs = getAgentTypeConfigs();
        const typeConfig = typeConfigs[getDefaultAgentType()] || typeConfigs.worker;
        const manifest: OssaAgent = {
          apiVersion: getApiVersion(),
          kind: getDefaultAgentKind(),
          metadata: {
            name,
            version: getDefaultAgentVersion(),
            description: (args.description as string) || getDefaultDescriptionTemplate(name),
          },
          spec: {
            role: (args.role as string) || getDefaultRoleTemplate(name),
            llm: {
              provider: 'openai',
              model: '${LLM_MODEL:-gpt-4}',
            },
            tools: typeConfig.capabilityName
              ? [{ type: 'capability', name: typeConfig.capabilityName }]
              : [],
          },
        };
        fs.mkdirSync(agentDir, { recursive: true });
        const manifestPath = path.join(agentDir, 'manifest.ossa.yaml');
        await manifestRepo.save(manifestPath, manifest);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, manifest_path: manifestPath, agent_dir: agentDir },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'ossa_generate': {
        const manifestPath = resolvePath(args.path as string);
        const manifest = await manifestRepo.load(manifestPath);
        const result = agentCardGenerator.generate(manifest);
        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { success: false, errors: result.errors, warnings: result.warnings },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: result.json ?? JSON.stringify(result.card, null, 2),
            },
          ],
        };
      }

      case 'ossa_publish': {
        const manifestPath = resolvePath(args.path as string);
        const registryUrl = (args.registry_url as string) || process.env.REGISTRY_URL || process.env.AGENT_REGISTRY_URL;
        await manifestRepo.load(manifestPath);

        if (registryUrl) {
          try {
            const manifest = await manifestRepo.load(manifestPath);
            const cardResult = agentCardGenerator.generate(manifest);
            const body = {
              manifest: manifest,
              agent_card: cardResult.success ? cardResult.card : undefined,
              manifest_path: manifestPath,
            };
            const axios = (await import('axios')).default;
            const res = await axios.post(registryUrl.replace(/\/?$/, '/api/v1/agents'), body, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 15000,
              validateStatus: () => true,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: res.status >= 200 && res.status < 300,
                      status: res.status,
                      registry_url: registryUrl,
                      data: res.data,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
              content: [
                { type: 'text', text: JSON.stringify({ error: `Registry POST failed: ${message}` }, null, 2) },
              ],
              isError: true,
            };
          }
        }

        const arctl = spawnSync('arctl', ['publish', manifestPath], {
          encoding: 'utf8',
          timeout: 30000,
        });
        if (arctl.status === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { success: true, message: 'arctl publish succeeded', stdout: arctl.stdout?.trim(), stderr: arctl.stderr?.trim() },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Publish to agentregistry: use arctl or set REGISTRY_URL/AGENT_REGISTRY_URL.',
                  manifest_path: manifestPath,
                  next_steps: [
                    'Install arctl and run: arctl publish <path>',
                    'Or set REGISTRY_URL and call this tool with registry_url to POST manifest + agent-card',
                  ],
                  arctl_tried: arctl.error ? String(arctl.error) : undefined,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            { type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) },
          ],
          isError: true,
        };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

function resolvePath(p: string): string {
  const s = p.trim();
  if (path.isAbsolute(s)) return s;
  return path.resolve(process.cwd(), s);
}

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('OSSA MCP server running on stdio\n');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
