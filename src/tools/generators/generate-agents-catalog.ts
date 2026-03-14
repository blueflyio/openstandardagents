#!/usr/bin/env tsx
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join, relative } from 'path';
import yaml from 'js-yaml';

import {
  GITLAB_AGENTS_DIR,
  GITLAB_MANIFEST_NAME,
} from '../../utils/constants.js';

const AGENTS_DIR = join(process.cwd(), GITLAB_AGENTS_DIR);
const OUTPUT_DIR = join(process.cwd(), 'website/content/docs/agents');
const OUTPUT_FILE = join(OUTPUT_DIR, 'catalog.md');

interface Capability {
  name: string;
  description?: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  capabilities: Capability[];
  path: string;
}

function readManifest(manifestPath: string): Agent | null {
  try {
    const content = readFileSync(manifestPath, 'utf8');
    const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as any;
    const agent = data?.agent;

    if (!agent?.id || !agent?.name || !agent?.role) {
      return null;
    }

    return {
      id: String(agent.id),
      name: String(agent.name),
      role: String(agent.role),
      description:
        typeof agent.description === 'string' ? agent.description : undefined,
      capabilities: Array.isArray(agent.capabilities)
        ? agent.capabilities
            .filter((capability: any) => capability?.name)
            .map((capability: any) => ({
              name: String(capability.name),
              description:
                typeof capability.description === 'string'
                  ? capability.description
                  : undefined,
            }))
        : [],
      path: relative(process.cwd(), manifestPath),
    };
  } catch {
    return null;
  }
}

function findAgents(): Agent[] {
  if (!existsSync(AGENTS_DIR)) {
    return [];
  }

  return readdirSync(AGENTS_DIR)
    .map((entry) => join(AGENTS_DIR, entry))
    .filter((entryPath) => statSync(entryPath).isDirectory())
    .map((entryPath) => readManifest(join(entryPath, GITLAB_MANIFEST_NAME)))
    .filter((agent): agent is Agent => agent !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function renderCatalog(agents: Agent[]): string {
  let doc = [
    '# GitLab Agents Catalog',
    '',
    'OSSA-compliant agents for GitLab CI/CD automation.',
    '',
    `**Total Agents**: ${agents.length}`,
  ].join('\n');

  if (agents.length === 0) {
    return `${doc}\n\nNo GitLab agent manifests are currently published under \`.gitlab/agents\`.\n`;
  }

  for (const agent of agents) {
    doc += `\n\n## ${agent.name}\n\n`;
    doc += `**ID**: \`${agent.id}\`  \n`;
    doc += `**Role**: \`${agent.role}\`\n\n`;

    if (agent.description) {
      doc += `${agent.description}\n\n`;
    }

    if (agent.capabilities.length > 0) {
      doc += '### Capabilities\n\n';
      for (const capability of agent.capabilities) {
        doc += `- **${capability.name}**`;
        if (capability.description) {
          doc += `: ${capability.description}`;
        }
        doc += '\n';
      }
      doc += '\n';
    }

    doc += `**Manifest**: [\`${agent.path}\`](https://github.com/blueflyio/openstandardagents/blob/main/${agent.path})\n\n`;
    doc += '```bash\n';
    doc += `# Deploy agent\nkubectl apply -f ${agent.path}\n`;
    doc += '```\n';
  }

  return `${doc}\n`;
}

const agents = findAgents();
mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, renderCatalog(agents));
console.log(`✅ Generated agents catalog: ${agents.length} agents`);
