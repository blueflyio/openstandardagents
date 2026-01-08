#!/usr/bin/env tsx
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import yaml from 'js-yaml';

const AGENTS_DIR = join(process.cwd(), '.gitlab/agents');
const OUTPUT_FILE = join(process.cwd(), 'website/content/docs/agents/catalog.md');

interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  capabilities: Array<{ name: string; description: string }>;
  path: string;
}

function findAgents(): Agent[] {
  const agents: Agent[] = [];
  const entries = readdirSync(AGENTS_DIR);
  
  for (const entry of entries) {
    const manifestPath = join(AGENTS_DIR, entry, 'manifest.ossa.yaml');
    try {
      const content = readFileSync(manifestPath, 'utf-8');
      // Use safeLoad to prevent arbitrary code execution (CWE-502)
      const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;
      
      if (data?.agent && typeof data.agent === 'object' && data.agent !== null) {
        const agent = data.agent as Record<string, unknown>;
        agents.push({
          id: String(agent.id || ''),
          name: String(agent.name || ''),
          role: String(agent.role || ''),
          description: agent.description ? String(agent.description) : undefined,
          capabilities: Array.isArray(agent.capabilities) ? agent.capabilities as Array<{ name: string; description: string }> : [],
          path: relative(process.cwd(), manifestPath)
        });
      }
    } catch (error) {
      // Skip if no manifest
    }
  }
  
  return agents;
}

const agents = findAgents();

let doc = `# GitLab Agents Catalog

OSSA-compliant agents for GitLab CI/CD automation.

**Total Agents**: ${agents.length}

`;

for (const agent of agents.sort((a, b) => a.name.localeCompare(b.name))) {
  doc += `## ${agent.name}\n\n`;
  doc += `**ID**: \`${agent.id}\`  \n`;
  doc += `**Role**: \`${agent.role}\`\n\n`;
  if (agent.description) doc += `${agent.description}\n\n`;
  
  if (agent.capabilities.length > 0) {
    doc += `### Capabilities\n\n`;
    for (const cap of agent.capabilities) {
      doc += `- **${cap.name}**: ${cap.description}\n`;
    }
    doc += '\n';
  }
  
  doc += `**Manifest**: [\`${agent.path}\`](https://github.com/blueflyio/openstandardagents/blob/main/${agent.path})\n\n`;
  doc += `\`\`\`bash\n# Deploy agent\nkubectl apply -f ${agent.path}\n\`\`\`\n\n`;
}

mkdirSync(join(process.cwd(), 'website/content/docs/agents'), { recursive: true });
writeFileSync(OUTPUT_FILE, doc);

console.log(`[PASS] Generated agents catalog: ${agents.length} agents`);
