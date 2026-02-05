#!/usr/bin/env tsx
/**
 * Generate CLI documentation from command source files
 *
 * Usage: npm run docs:cli:generate
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';

interface CommandInfo {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
  options: Array<{ flag: string; description: string; default?: string }>;
  examples: string[];
  apiEndpoint?: string;
}

const CLI_DIR = join(process.cwd(), 'src/cli/commands');
const OUTPUT_DIR = join(process.cwd(), 'website/content/docs/cli-reference');

// Command metadata (extracted from source or defined here)
const COMMANDS: Record<string, CommandInfo> = {
  validate: {
    name: 'validate',
    description: 'Validate OSSA agent manifests against the schema',
    arguments: [
      {
        name: 'path',
        description: 'Path to agent manifest file or directory',
        required: true,
      },
    ],
    options: [
      {
        flag: '--version <version>',
        description: 'Specify OSSA version',
        default: 'latest',
      },
      { flag: '--strict', description: 'Enable strict validation mode' },
      {
        flag: '--format <format>',
        description: 'Output format: json, yaml, table',
        default: 'table',
      },
      { flag: '--verbose', description: 'Show detailed validation errors' },
    ],
    examples: [
      'ossa validate agent.ossa.yaml',
      'ossa validate ./agents/',
      'ossa validate agent.ossa.yaml --strict',
      'ossa validate agent.ossa.yaml --format json',
    ],
    apiEndpoint: 'POST /api/v1/validate',
  },
  generate: {
    name: 'generate',
    description: 'Generate OSSA agent manifests from templates',
    arguments: [
      {
        name: 'type',
        description: 'Agent type: worker, orchestrator, compliance, chat',
        required: true,
      },
    ],
    options: [
      { flag: '--name <name>', description: 'Agent name', default: 'My Agent' },
      { flag: '--id <id>', description: 'Agent ID (DNS-1123 format)' },
      {
        flag: '--output <path>',
        description: 'Output file path',
        default: 'agent.ossa.yaml',
      },
      { flag: '--interactive', description: 'Interactive mode with prompts' },
    ],
    examples: [
      'ossa generate worker --name "Data Processor"',
      'ossa generate orchestrator --id my-orchestrator',
      'ossa generate compliance --interactive',
      'ossa generate chat --output chat-agent.yaml',
    ],
    apiEndpoint: 'POST /api/v1/agents/generate',
  },
  migrate: {
    name: 'migrate',
    description: 'Migrate agent manifests between OSSA versions',
    arguments: [
      { name: 'source', description: 'Source manifest file', required: true },
    ],
    options: [
      { flag: '--from <version>', description: 'Source OSSA version' },
      {
        flag: '--to <version>',
        description: 'Target OSSA version',
        default: 'latest',
      },
      { flag: '--output <path>', description: 'Output file path' },
      { flag: '--dry-run', description: 'Show changes without writing' },
    ],
    examples: [
      'ossa migrate agent.yaml --from 0.2.4 --to 0.2.5',
      'ossa migrate agent.yaml --dry-run',
      'ossa migrate agent.yaml --output migrated-agent.yaml',
    ],
    apiEndpoint: 'POST /api/v1/migrate',
  },
  run: {
    name: 'run',
    description: 'Run an OSSA agent locally',
    arguments: [
      {
        name: 'manifest',
        description: 'Path to agent manifest',
        required: true,
      },
    ],
    options: [
      { flag: '--env <file>', description: 'Environment variables file' },
      { flag: '--port <port>', description: 'Port to run on', default: '3000' },
      { flag: '--watch', description: 'Watch for changes and reload' },
      { flag: '--debug', description: 'Enable debug logging' },
    ],
    examples: [
      'ossa run agent.ossa.yaml',
      'ossa run agent.ossa.yaml --port 8080',
      'ossa run agent.ossa.yaml --watch --debug',
      'ossa run agent.ossa.yaml --env .env.local',
    ],
    apiEndpoint: 'POST /api/v1/agents/{id}/execute',
  },
  init: {
    name: 'init',
    description: 'Initialize a new OSSA project',
    arguments: [],
    options: [
      { flag: '--name <name>', description: 'Project name' },
      {
        flag: '--template <template>',
        description: 'Project template: minimal, full, enterprise',
      },
      { flag: '--typescript', description: 'Use TypeScript' },
      { flag: '--git', description: 'Initialize git repository' },
    ],
    examples: [
      'ossa init',
      'ossa init --name my-agent-project',
      'ossa init --template enterprise --typescript',
      'ossa init --git',
    ],
  },
  setup: {
    name: 'setup',
    description: 'Set up OSSA development environment',
    arguments: [],
    options: [
      { flag: '--gitlab', description: 'Configure GitLab integration' },
      { flag: '--kubernetes', description: 'Configure Kubernetes deployment' },
      { flag: '--registry <url>', description: 'Configure agent registry' },
      { flag: '--interactive', description: 'Interactive setup wizard' },
    ],
    examples: [
      'ossa setup --interactive',
      'ossa setup --gitlab',
      'ossa setup --kubernetes',
      'ossa setup --registry https://registry.ossa.dev',
    ],
  },
  export: {
    name: 'export',
    description: 'Export agent manifest to different formats',
    arguments: [
      {
        name: 'manifest',
        description: 'Path to agent manifest',
        required: true,
      },
    ],
    options: [
      {
        flag: '--format <format>',
        description: 'Export format: json, yaml, openapi, k8s',
        default: 'json',
      },
      { flag: '--output <path>', description: 'Output file path' },
      { flag: '--pretty', description: 'Pretty print output' },
    ],
    examples: [
      'ossa export agent.ossa.yaml --format json',
      'ossa export agent.ossa.yaml --format k8s --output deployment.yaml',
      'ossa export agent.ossa.yaml --format openapi --pretty',
    ],
  },
  import: {
    name: 'import',
    description: 'Import agents from other frameworks',
    arguments: [
      { name: 'source', description: 'Source file or URL', required: true },
    ],
    options: [
      {
        flag: '--from <framework>',
        description: 'Source framework: langchain, crewai, openai, mcp',
      },
      {
        flag: '--output <path>',
        description: 'Output file path',
        default: 'agent.ossa.yaml',
      },
      { flag: '--validate', description: 'Validate after import' },
    ],
    examples: [
      'ossa import langchain-agent.py --from langchain',
      'ossa import crew.yaml --from crewai --validate',
      'ossa import https://example.com/agent.json --from openai',
    ],
  },
  schema: {
    name: 'schema',
    description: 'View and manage OSSA schemas',
    arguments: [],
    options: [
      {
        flag: '--version <version>',
        description: 'Schema version',
        default: 'latest',
      },
      {
        flag: '--format <format>',
        description: 'Output format: json, yaml',
        default: 'yaml',
      },
      {
        flag: '--field <field>',
        description: 'Show specific field documentation',
      },
      { flag: '--list', description: 'List available schema versions' },
    ],
    examples: [
      'ossa schema',
      'ossa schema --version 0.2.5',
      'ossa schema --field agent.id',
      'ossa schema --list',
    ],
  },
  'gitlab-agent': {
    name: 'gitlab-agent',
    description: 'Manage GitLab agent integration',
    arguments: [],
    options: [
      { flag: '--configure', description: 'Configure GitLab agent' },
      { flag: '--deploy', description: 'Deploy agent to GitLab' },
      { flag: '--status', description: 'Check agent status' },
      { flag: '--logs', description: 'View agent logs' },
    ],
    examples: [
      'ossa gitlab-agent --configure',
      'ossa gitlab-agent --deploy',
      'ossa gitlab-agent --status',
      'ossa gitlab-agent --logs',
    ],
  },
  agents: {
    name: 'agents',
    description: 'Manage OSSA agents',
    arguments: [
      {
        name: 'action',
        description: 'Action: list, get, create, update, delete',
        required: true,
      },
    ],
    options: [
      { flag: '--id <id>', description: 'Agent ID' },
      { flag: '--role <role>', description: 'Filter by role' },
      { flag: '--status <status>', description: 'Filter by status' },
      {
        flag: '--format <format>',
        description: 'Output format: json, yaml, table',
        default: 'table',
      },
    ],
    examples: [
      'ossa agents list',
      'ossa agents list --role worker',
      'ossa agents get --id my-agent',
      'ossa agents create agent.ossa.yaml',
      'ossa agents delete --id my-agent',
    ],
    apiEndpoint: 'GET /api/v1/agents',
  },
};

function generateCommandDoc(cmd: CommandInfo): string {
  let doc = `# ossa ${cmd.name}\n\n`;
  doc += `**Purpose**: ${cmd.description}\n\n`;

  // Synopsis
  doc += '## Synopsis\n\n';
  doc += '```bash\n';
  doc += `ossa ${cmd.name}`;
  if (cmd.arguments.length > 0) {
    for (const arg of cmd.arguments) {
      doc += arg.required ? ` <${arg.name}>` : ` [${arg.name}]`;
    }
  }
  doc += ' [options]\n';
  doc += '```\n\n';

  // Description
  doc += '## Description\n\n';
  doc += `${cmd.description}\n\n`;

  // Arguments
  if (cmd.arguments.length > 0) {
    doc += '## Arguments\n\n';
    for (const arg of cmd.arguments) {
      const required = arg.required ? ' (required)' : ' (optional)';
      doc += `- \`<${arg.name}>\`${required} - ${arg.description}\n`;
    }
    doc += '\n';
  }

  // Options
  if (cmd.options.length > 0) {
    doc += '## Options\n\n';
    for (const opt of cmd.options) {
      doc += `- \`${opt.flag}\` - ${opt.description}`;
      if (opt.default) {
        doc += ` (default: ${opt.default})`;
      }
      doc += '\n';
    }
    doc += '\n';
  }

  // Examples
  if (cmd.examples.length > 0) {
    doc += '## Examples\n\n';
    for (const example of cmd.examples) {
      doc += '```bash\n';
      doc += example + '\n';
      doc += '```\n\n';
    }
  }

  // API endpoint connection
  if (cmd.apiEndpoint) {
    doc += '## API Endpoint Connection\n\n';
    doc += `This command uses the following API endpoint:\n`;
    doc += `- \`${cmd.apiEndpoint}\` - [API Reference](../api-reference/index.md)\n\n`;
  }

  // Exit codes
  doc += '## Exit Codes\n\n';
  doc += '- `0` - Success\n';
  doc += '- `1` - General error\n';
  doc += '- `2` - Invalid arguments\n';
  doc += '- `3` - File not found\n\n';

  // Related commands
  doc += '## Related Commands\n\n';
  const relatedCommands = Object.keys(COMMANDS)
    .filter((c) => c !== cmd.name)
    .slice(0, 3);
  for (const related of relatedCommands) {
    doc += `- [ossa ${related}](./ossa-${related}.md)\n`;
  }
  doc += '\n';

  // Related documentation
  doc += '## Related Documentation\n\n';
  doc += '- [API Reference](../api-reference/index.md)\n';
  doc += '- [Schema Reference](../schema-reference/index.md)\n';
  doc += '- [Getting Started](../getting-started/index.md)\n';

  return doc;
}

function main() {
  console.log('🚀 Generating CLI documentation...\n');

  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(
    `📁 Processing ${Object.keys(COMMANDS).length} CLI commands...\n`
  );

  // Generate documentation for each command
  for (const [name, cmd] of Object.entries(COMMANDS)) {
    const docContent = generateCommandDoc(cmd);
    const outputFile = join(OUTPUT_DIR, `ossa-${name}.md`);

    writeFileSync(outputFile, docContent);
    console.log(`✅ Generated: ossa-${name}.md`);
  }

  // Generate index
  const indexContent = `# CLI Reference

The OSSA CLI provides commands for managing AI agents throughout their lifecycle.

## Installation

\`\`\`bash
npm install -g @bluefly/openstandardagents
\`\`\`

## Quick Start

\`\`\`bash
# Validate an agent manifest
ossa validate agent.ossa.yaml

# Generate a new agent
ossa generate worker --name "My Agent"

# Run an agent locally
ossa run agent.ossa.yaml
\`\`\`

## Commands

${Object.entries(COMMANDS)
  .map(([name, cmd]) => {
    return `### [ossa ${name}](./ossa-${name}.md)\n\n${cmd.description}\n`;
  })
  .join('\n')}

## Global Options

- \`--help\` - Show help for any command
- \`--version\` - Show OSSA CLI version
- \`--config <path>\` - Path to config file
- \`--verbose\` - Enable verbose logging
- \`--quiet\` - Suppress output

## Configuration

The OSSA CLI can be configured via:

1. **Config file**: \`.ossarc.json\` or \`.ossarc.yaml\`
2. **Environment variables**: \`OSSA_*\`
3. **Command-line flags**

Example \`.ossarc.json\`:

\`\`\`json
{
  "registry": "https://registry.ossa.dev",
  "defaultVersion": "0.2.5-RC",
  "validation": {
    "strict": true
  }
}
\`\`\`

## Environment Variables

- \`OSSA_REGISTRY\` - Agent registry URL
- \`OSSA_API_KEY\` - API authentication key
- \`OSSA_VERSION\` - Default OSSA version
- \`OSSA_DEBUG\` - Enable debug mode

## Related Documentation

- [API Reference](../api-reference/index.md)
- [Schema Reference](../schema-reference/index.md)
- [Getting Started](../getting-started/index.md)
- [Guides](../guides/index.md)
`;

  writeFileSync(join(OUTPUT_DIR, 'index.md'), indexContent);
  console.log(`✅ Generated: index.md`);

  console.log(`\n✨ CLI documentation generated successfully!`);
  console.log(`📂 Output: ${OUTPUT_DIR}`);
}

main();
