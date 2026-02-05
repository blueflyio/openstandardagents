/**
 * NPM Package Converter
 * Converts OSSA agent manifests to NPM package format
 */

import type { OssaAgent } from '../base/adapter.interface.js';
import type { NPMPackageConfig, AgentExportMetadata } from './types.js';

export class NPMConverter {
  /**
   * Convert OSSA manifest to NPM package config
   */
  convert(manifest: OssaAgent): NPMPackageConfig {
    const metadata = manifest.metadata || {
      name: 'unknown-agent',
      version: '1.0.0',
    };
    const spec = manifest.spec || {};
    const annotations = metadata.annotations || {};

    // Sanitize npm package name
    const npmName = this.sanitizePackageName(metadata.name);

    // Get repository from annotations if not in metadata
    const repository = (annotations['repository'] as string) || undefined;

    return {
      name: `@ossa/${npmName}`,
      version: metadata.version || '1.0.0',
      description: metadata.description || `OSSA agent: ${metadata.name}`,
      main: 'index.js',
      types: 'index.d.ts',
      keywords: [
        'ossa',
        'agent',
        'ai',
        ...(metadata.labels ? Object.values(metadata.labels) : []),
      ],
      license: metadata.license || 'MIT',
      repository,
      author: metadata.author as string | undefined,
      homepage: `https://openstandardagents.org/agents/${npmName}`,
      bugs: repository ? `${repository}/issues` : undefined,
      files: [
        'index.js',
        'index.d.ts',
        'agent.ossa.yaml',
        'README.md',
        'LICENSE',
      ],
      peerDependencies: {
        '@bluefly/openstandardagents': '^0.4.1',
      },
      dependencies: {},
      ossaMetadata: {
        apiVersion: manifest.apiVersion || 'ossa/v0.4.1',
        kind: manifest.kind || 'Agent',
        originalName: metadata.name,
      },
    };
  }

  /**
   * Extract agent metadata for export
   */
  extractMetadata(manifest: OssaAgent): AgentExportMetadata {
    const metadata = manifest.metadata || {
      name: 'unknown-agent',
      version: '1.0.0',
    };
    const spec = manifest.spec || {};

    // Extract capabilities - handle both string array and Capability object array
    const capabilities = Array.isArray((spec as any).capabilities)
      ? ((spec as any).capabilities as any[]).map((c: any) =>
          typeof c === 'string' ? c : c.name || c.id || 'unknown'
        )
      : undefined;

    return {
      name: metadata.name,
      version: metadata.version || '1.0.0',
      description: metadata.description || '',
      role: ((spec as any).role as string) || '',
      capabilities,
      tools: (spec as any).tools as any,
      llm: (spec as any).llm as any,
    };
  }

  /**
   * Generate package.json content
   */
  generatePackageJson(config: NPMPackageConfig): string {
    const pkg = {
      name: config.name,
      version: config.version,
      description: config.description,
      main: config.main,
      types: config.types,
      keywords: config.keywords,
      author: config.author,
      license: config.license,
      repository: config.repository
        ? {
            type: 'git',
            url: config.repository,
          }
        : undefined,
      bugs: config.bugs
        ? {
            url: config.bugs,
          }
        : undefined,
      homepage: config.homepage,
      files: config.files,
      peerDependencies: config.peerDependencies,
      dependencies:
        Object.keys(config.dependencies || {}).length > 0
          ? config.dependencies
          : undefined,
      publishConfig: {
        access: 'public',
      },
      ossa: config.ossaMetadata,
    };

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Generate index.js entry point
   */
  generateEntryPoint(
    manifest: OssaAgent,
    metadata: AgentExportMetadata
  ): string {
    return `/**
 * ${metadata.name} - OSSA Agent Package
 * Version: ${metadata.version}
 *
 * ${metadata.description}
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load the OSSA agent manifest
 */
export function loadManifest() {
  const manifestPath = join(__dirname, 'agent.ossa.yaml');
  const manifestContent = readFileSync(manifestPath, 'utf-8');
  return manifestContent;
}

/**
 * Get agent metadata
 */
export const metadata = {
  name: '${metadata.name}',
  version: '${metadata.version}',
  description: '${metadata.description}',
  role: \`${metadata.role.replace(/`/g, '\\`')}\`,
  ${metadata.capabilities ? `capabilities: ${JSON.stringify(metadata.capabilities)},` : ''}
  ${metadata.tools ? `tools: ${JSON.stringify(metadata.tools, null, 2)},` : ''}
  ${metadata.llm ? `llm: ${JSON.stringify(metadata.llm, null, 2)},` : ''}
};

/**
 * Agent configuration
 */
export const agent = {
  ...metadata,
  manifest: loadManifest,
};

/**
 * Default export
 */
export default agent;
`;
  }

  /**
   * Generate index.d.ts TypeScript types
   */
  generateTypes(metadata: AgentExportMetadata): string {
    return `/**
 * Type definitions for ${metadata.name}
 */

/**
 * Agent metadata
 */
export interface AgentMetadata {
  name: string;
  version: string;
  description: string;
  role: string;
  ${metadata.capabilities ? 'capabilities: string[];' : ''}
  ${metadata.tools ? 'tools: Tool[];' : ''}
  ${metadata.llm ? 'llm: LLMConfig;' : ''}
}

${
  metadata.tools
    ? `
/**
 * Agent tool definition
 */
export interface Tool {
  name: string;
  description: string;
  type?: string;
}
`
    : ''
}

${
  metadata.llm
    ? `
/**
 * LLM configuration
 */
export interface LLMConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
`
    : ''
}

/**
 * Agent configuration
 */
export interface Agent extends AgentMetadata {
  manifest: () => string;
}

/**
 * Load the OSSA agent manifest
 */
export function loadManifest(): string;

/**
 * Agent metadata
 */
export const metadata: AgentMetadata;

/**
 * Agent configuration
 */
export const agent: Agent;

/**
 * Default export
 */
export default agent;
`;
  }

  /**
   * Generate README.md
   */
  generateReadme(manifest: OssaAgent, metadata: AgentExportMetadata): string {
    const npmName = this.sanitizePackageName(metadata.name);

    return `# ${metadata.name}

${metadata.description}

## Installation

\`\`\`bash
npm install @ossa/${npmName}
\`\`\`

## Usage

### Load Agent Manifest

\`\`\`javascript
import agent from '@ossa/${npmName}';

// Get agent metadata
console.log(agent.metadata);

// Load OSSA manifest YAML
const manifestYaml = agent.manifest();
console.log(manifestYaml);
\`\`\`

### About This Package

This package contains an OSSA agent specification. It does not execute agents.

To use this specification:
\`\`\`javascript
import agent from '@ossa/${npmName}';
import yaml from 'yaml';

// Get the OSSA manifest as YAML string
const yamlString = agent.manifest();

// Parse if needed
const manifest = yaml.parse(yamlString);

// Access metadata
console.log(agent.metadata.name);
console.log(agent.metadata.role);
\`\`\`

Use this specification with any OSSA-compatible runtime or export to other formats using the OSSA CLI.

## Agent Details

- **Version**: ${metadata.version}
- **Role**: ${metadata.role}
${metadata.capabilities ? `- **Capabilities**: ${metadata.capabilities.join(', ')}` : ''}

${
  metadata.tools && metadata.tools.length > 0
    ? `
## Tools

${metadata.tools.map((t) => `- **${t.name}**: ${t.description}`).join('\n')}
`
    : ''
}

${
  metadata.llm
    ? `
## LLM Configuration

- **Provider**: ${metadata.llm.provider || 'default'}
- **Model**: ${metadata.llm.model || 'default'}
- **Temperature**: ${metadata.llm.temperature ?? 'default'}
- **Max Tokens**: ${metadata.llm.maxTokens ?? 'default'}
`
    : ''
}

## Generated from OSSA

This package was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '0.4.1'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${metadata.description ? `${manifest.metadata?.license || 'MIT'}` : 'MIT'}

## Links

- [OSSA Specification](https://openstandardagents.org)
- [Agent Registry](https://openstandardagents.org/agents)
- [Documentation](https://docs.openstandardagents.org)

---

Generated by [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)
`;
  }

  /**
   * Generate .npmignore
   */
  generateNpmIgnore(): string {
    return `# Development files
*.ts
!*.d.ts
tsconfig.json
.eslintrc.json
.prettierrc

# Test files
tests/
*.test.js
*.spec.js

# Build artifacts
dist/
build/
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore
.gitattributes

# CI
.github/
.gitlab-ci.yml

# Misc
*.log
node_modules/
`;
  }

  /**
   * Sanitize package name for npm
   * - Must be lowercase
   * - No spaces or special characters
   * - Use hyphens for separation
   */
  private sanitizePackageName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
