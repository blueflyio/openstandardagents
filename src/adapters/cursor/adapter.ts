/**
 * Cursor Cloud Agent Platform Adapter
 * Exports OSSA agent manifests to Cursor Cloud Agent format
 *
 * Cursor Cloud Agents are AI agents that run in the Cursor IDE
 * https://cursor.com/docs/cloud-agent
 *
 * SOLID: Single Responsibility - Cursor agent generation only
 * DRY: Extends BaseExporter for orchestration, validation, and common files
 */

import { BaseExporter } from '../base/base-exporter.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportFile,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import type {
  CursorCloudAgent,
  CursorTool,
  CursorCapability,
  CursorContext,
  CursorAgentConfig,
  JSONSchema,
} from './types.js';

export class CursorAdapter extends BaseExporter {
  readonly platform = 'cursor';
  readonly displayName = 'Cursor Cloud Agent';
  readonly description =
    'Cursor Cloud Agent for AI-powered coding assistance in Cursor IDE';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Platform-specific validation for Cursor compatibility
   */
  protected platformValidate(manifest: OssaAgent): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const spec = manifest.spec;

    // Check for role/system prompt
    if (!spec?.role) {
      errors.push({
        message: 'spec.role is required for Cursor agents (system prompt)',
        path: 'spec.role',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    // Check for tools
    if (!spec?.tools || !Array.isArray(spec.tools) || spec.tools.length === 0) {
      warnings.push({
        message: 'No tools defined, agent will have limited capabilities',
        path: 'spec.tools',
        suggestion: 'Add spec.tools array with tool definitions',
      });
    }

    return { errors, warnings };
  }

  /**
   * Generate Cursor-specific files
   */
  protected async generateFiles(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportFile[]> {
    const agentName = this.getAgentName(manifest, 'cursor-agent');
    const prefix = `cursor/${agentName}`;
    const files: ExportFile[] = [];

    // Generate cursor-agent.json - Cursor agent configuration
    const cursorAgent = this.convertToCursorAgent(manifest);
    const config: CursorAgentConfig = {
      version: '1.0',
      agent: cursorAgent,
    };

    files.push(
      this.createFile(
        `${prefix}/cursor-agent.json`,
        JSON.stringify(config, null, 2),
        'config',
        'json'
      )
    );

    // Generate tool implementations
    cursorAgent.tools.forEach((tool) => {
      if (tool.implementationType === 'code') {
        files.push(
          this.createFile(
            `${prefix}/tools/${tool.name}.ts`,
            this.generateToolImplementation(tool, manifest),
            'code',
            'typescript'
          )
        );
      }
    });

    // Generate agent.ts - Main agent entry point
    files.push(
      this.createFile(
        `${prefix}/agent.ts`,
        this.generateAgentCode(manifest, cursorAgent),
        'code',
        'typescript'
      )
    );

    // Use shared generators for common files
    files.push(
      this.generatePackageJsonFile(manifest, prefix, {
        main: 'agent.js',
        scripts: {
          build: 'tsc',
          dev: 'tsx agent.ts',
          watch: 'tsx watch agent.ts',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          typescript: '^5.0.0',
          tsx: '^4.0.0',
        },
        extraKeywords: ['cursor', 'cloud-agent', 'coding-assistant'],
      })
    );

    files.push(this.generateTsConfigFile(prefix, { include: ['**/*.ts'] }));

    const toolsDesc = cursorAgent.tools
      .map((t) => `- **${t.name}**: ${t.description}`)
      .join('\n');

    files.push(
      this.generateReadmeFile(manifest, prefix, {
        installation: 'npm install\nnpm run build',
        usage: `Configure in Cursor Settings > Cloud Agents:\n\n\`\`\`json\n{\n  "cloudAgents": [\n    {\n      "name": "${agentName}",\n      "path": "./cursor/${agentName}/agent.js"\n    }\n  ]\n}\`\`\``,
        additional: toolsDesc
          ? [
              { title: 'Capabilities', content: cursorAgent.capabilities.map((c) => `- ${c.type}`).join('\n') },
              { title: 'Available Tools', content: toolsDesc },
            ]
          : undefined,
      })
    );

    return files;
  }

  /**
   * Get example Cursor-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'cursor-coding-assistant',
        version: '1.0.0',
        description: 'AI coding assistant for Cursor IDE',
      },
      spec: {
        role: 'You are an expert coding assistant that helps developers write clean, efficient code. You specialize in code generation, refactoring, and providing best practices guidance.',
        capabilities: [
          'code-generation',
          'code-review',
          'refactoring',
          'testing',
        ] as any,
        tools: [
          {
            type: 'function',
            name: 'generate_code',
            description: 'Generate code based on natural language description',
          },
          {
            type: 'function',
            name: 'refactor_code',
            description: 'Refactor existing code for better quality',
          },
        ],
      },
    };
  }

  /**
   * Convert OSSA manifest to Cursor Cloud Agent
   */
  private convertToCursorAgent(manifest: OssaAgent): CursorCloudAgent {
    const name = manifest.metadata?.name || 'cursor-agent';
    const description = manifest.metadata?.description || 'Cursor Cloud Agent';
    const prompt = manifest.spec?.role || 'AI coding assistant';

    const capabilities = this.extractCapabilities(manifest);
    const tools = this.convertTools(manifest);

    const context: CursorContext = {
      workspace: {
        includeFiles: true,
        includePatterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
        excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        maxFileSize: 1024 * 1024,
      },
      indexing: { enabled: true, depth: 3 },
      memory: { enabled: true, maxEntries: 100 },
      integrations: { git: true, lsp: true, terminal: true },
    };

    return {
      name,
      description,
      prompt,
      capabilities,
      tools,
      context,
      metadata: {
        version: manifest.metadata?.version,
        author: manifest.metadata?.author,
        tags: manifest.metadata?.tags,
      },
    };
  }

  /**
   * Extract capabilities from manifest
   */
  private extractCapabilities(manifest: OssaAgent): CursorCapability[] {
    const capabilities: CursorCapability[] = [];

    const capabilityMap: Record<string, CursorCapability['type']> = {
      'code-generation': 'code-generation',
      'code-review': 'code-review',
      refactoring: 'refactoring',
      testing: 'testing',
      documentation: 'documentation',
      debugging: 'debugging',
      terminal: 'terminal',
    };

    const ossaCaps = this.getCapabilities(manifest);

    ossaCaps.forEach((cap: string) => {
      const type = capabilityMap[cap] || 'custom';
      capabilities.push({ type });
    });

    if (capabilities.length === 0) {
      capabilities.push({ type: 'code-generation' });
    }

    return capabilities;
  }

  /**
   * Convert OSSA tools to Cursor tools
   */
  private convertTools(manifest: OssaAgent): CursorTool[] {
    const tools: CursorTool[] = [];
    const ossaTools = this.getTools(manifest);

    ossaTools.forEach((tool) => {
      const name = (tool.name as string) || 'unknown';
      const description = (tool.description as string) || `Tool: ${name}`;
      const schema = (tool.inputSchema || tool.schema || { type: 'object' }) as JSONSchema;

      tools.push({
        name,
        description,
        parameters: schema,
        implementation: `// TODO: Implement ${name}\nexport async function ${name}(params: any) {\n  throw new Error('Not implemented');\n}`,
        implementationType: 'code',
      });
    });

    return tools;
  }

  /**
   * Generate tool implementation
   */
  private generateToolImplementation(
    tool: CursorTool,
    manifest: OssaAgent
  ): string {
    const paramType = this.generateParamType(tool.parameters);

    return `/**
 * Tool Implementation: ${tool.name}
 * ${tool.description}
 * Generated from OSSA manifest
 */

${paramType}

/**
 * ${tool.description}
 */
export async function ${tool.name}(params: ${tool.name}Params): Promise<${tool.name}Result> {
  // TODO: Implement ${tool.name} logic here
  console.log('Executing ${tool.name} with params:', params);

  throw new Error('Tool ${tool.name} requires implementation');
}

/**
 * Tool result type
 */
export interface ${tool.name}Result {
  success: boolean;
  data?: unknown;
  error?: string;
}
`;
  }

  /**
   * Generate TypeScript parameter type from JSON Schema
   */
  private generateParamType(schema: JSONSchema): string {
    if (!schema.properties) {
      return `export interface Params {\n  [key: string]: unknown;\n}`;
    }

    const props = Object.entries(schema.properties)
      .map(([key, prop]) => {
        const required = schema.required?.includes(key);
        const type = this.jsonSchemaTypeToTS(prop.type);
        return `  ${key}${required ? '' : '?'}: ${type};${prop.description ? ` // ${prop.description}` : ''}`;
      })
      .join('\n');

    return `/**
 * Tool parameters
 */
export interface ${schema.title || 'Tool'}Params {
${props}
}`;
  }

  /**
   * Convert JSON Schema type to TypeScript type
   */
  private jsonSchemaTypeToTS(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      integer: 'number',
      boolean: 'boolean',
      array: 'unknown[]',
      object: 'Record<string, unknown>',
    };
    return typeMap[type] || 'unknown';
  }

  /**
   * Generate agent.ts - Main entry point
   */
  private generateAgentCode(
    manifest: OssaAgent,
    agent: CursorCloudAgent
  ): string {
    const imports = agent.tools
      .filter((t) => t.implementationType === 'code')
      .map((t) => `import { ${t.name} } from './tools/${t.name}.js';`)
      .join('\n');

    const toolRegistry = agent.tools
      .map(
        (t) =>
          `  '${t.name}': ${t.implementationType === 'code' ? t.name : `async () => { throw new Error('Not implemented'); }`},`
      )
      .join('\n');

    return `/**
 * Cursor Cloud Agent: ${agent.name}
 * ${agent.description}
 * Generated from OSSA manifest
 */

${imports}

/**
 * Agent configuration
 */
export const agentConfig = {
  name: '${agent.name}',
  description: '${agent.description}',
  prompt: \`${agent.prompt}\`,
  capabilities: ${JSON.stringify(agent.capabilities, null, 2)},
  context: ${JSON.stringify(agent.context, null, 2)},
};

/**
 * Tool registry
 */
export const tools = {
${toolRegistry}
};

/**
 * Execute agent tool
 */
export async function executeTool(name: string, params: any): Promise<any> {
  const tool = tools[name as keyof typeof tools];
  if (!tool) {
    throw new Error(\`Unknown tool: \${name}\`);
  }
  return await tool(params);
}

/**
 * Agent initialization
 */
export async function initialize(): Promise<void> {
  console.log('Cursor agent initialized:', agentConfig.name);
}
`;
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(manifest: OssaAgent): string {
    const pkg = {
      name: manifest.metadata?.name || 'cursor-agent',
      version: manifest.metadata?.version || '1.0.0',
      description:
        manifest.metadata?.description ||
        'Cursor Cloud Agent generated from OSSA',
      type: 'module',
      main: 'agent.js',
      scripts: {
        build: 'tsc',
        dev: 'tsx agent.ts',
        watch: 'tsx watch agent.ts',
      },
      dependencies: {},
      devDependencies: {
        '@types/node': '^20.0.0',
        typescript: '^5.0.0',
        tsx: '^4.0.0',
      },
      keywords: ['cursor', 'cloud-agent', 'ai', 'ossa', 'coding-assistant'],
      license: manifest.metadata?.license || 'MIT',
    };

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Generate tsconfig.json
   */
  private generateTsConfig(): string {
    const config = {
      compilerOptions: {
        target: 'ES2022',
        module: 'Node16',
        moduleResolution: 'Node16',
        outDir: '.',
        rootDir: '.',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
      },
      include: ['**/*.ts'],
      exclude: ['node_modules', '**/*.js'],
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent, agent: CursorCloudAgent): string {
    const agentName = manifest.metadata?.name || 'cursor-agent';

    return `# ${agentName}

${agent.description}

## Cursor Cloud Agent

This agent is designed for use with [Cursor IDE](https://cursor.com/), providing AI-powered coding assistance.

## Installation

1. **Install dependencies:**

\`\`\`bash
npm install
\`\`\`

2. **Build the agent:**

\`\`\`bash
npm run build
\`\`\`

3. **Configure in Cursor:**

Add to your Cursor settings (\`Settings > Cloud Agents\`):

\`\`\`json
{
  "cloudAgents": [
    {
      "name": "${agentName}",
      "path": "${process.cwd()}/cursor/${agentName}/agent.js"
    }
  ]
}
\`\`\`

## Agent Configuration

**System Prompt:**

\`\`\`
${agent.prompt}
\`\`\`

**Capabilities:**

${agent.capabilities.map((c) => `- ${c.type}`).join('\n')}

## Available Tools

${agent.tools
  .map(
    (t) => `### ${t.name}

${t.description}

**Parameters:**

\`\`\`typescript
${this.generateParamType(t.parameters)}
\`\`\`
`
  )
  .join('\n')}

## Development

\`\`\`bash
# Watch mode
npm run dev

# Build
npm run build
\`\`\`

## Generated from OSSA

This agent was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${manifest.metadata?.license || 'MIT'}
`;
  }
}
