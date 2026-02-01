/**
 * LangChain Platform Adapter
 * Exports OSSA agent manifests to LangChain format (Python + TypeScript)
 *
 * SOLID: Single Responsibility - LangChain export only
 * DRY: Reuses BaseAdapter validation and helpers
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ExportFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import { LangChainConverter } from './converter.js';
import type { LangChainAgentConfig } from './types.js';

export class LangChainAdapter extends BaseAdapter {
  readonly platform = 'langchain';
  readonly displayName = 'LangChain';
  readonly description = 'LangChain agent framework (Python/TypeScript)';
  readonly supportedVersions = ['v0.3.6', 'v{{VERSION}}'];

  private converter = new LangChainConverter();

  /**
   * Export OSSA manifest to LangChain format
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Validate manifest
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      // Convert to LangChain config
      const config = this.converter.convert(manifest);
      const files: ExportFile[] = [];

      // Generate Python agent file
      const pythonCode = this.converter.generatePythonCode(manifest);
      files.push(
        this.createFile(
          `langchain/${manifest.metadata?.name || 'agent'}.py`,
          pythonCode,
          'code',
          'python'
        )
      );

      // Generate TypeScript agent file
      const tsCode = this.generateTypeScriptCode(config, manifest);
      files.push(
        this.createFile(
          `langchain/${manifest.metadata?.name || 'agent'}.ts`,
          tsCode,
          'code',
          'typescript'
        )
      );

      // Generate requirements.txt
      const requirements = this.generateRequirements(config);
      files.push(
        this.createFile('langchain/requirements.txt', requirements, 'config')
      );

      // Generate package.json
      const packageJson = this.generatePackageJson(config, manifest);
      files.push(
        this.createFile('langchain/package.json', packageJson, 'config')
      );

      // Generate README
      const readme = this.generateReadme(manifest, config);
      files.push(
        this.createFile('langchain/README.md', readme, 'documentation')
      );

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '0.1.0',
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        { duration: Date.now() - startTime }
      );
    }
  }

  /**
   * Validate manifest for LangChain compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // LangChain-specific validation
    const spec = manifest.spec;

    // Check LLM configuration
    if (spec?.llm) {
      const llm = spec.llm as any;
      const supportedProviders = [
        'openai',
        'anthropic',
        'cohere',
        'huggingface',
      ];

      if (llm.provider && !supportedProviders.includes(llm.provider)) {
        warnings.push({
          message: `LLM provider '${llm.provider}' may not be supported. Supported: ${supportedProviders.join(', ')}`,
          path: 'spec.llm.provider',
          suggestion: `Use one of: ${supportedProviders.join(', ')}`,
        });
      }

      if (!llm.model) {
        warnings.push({
          message: 'LLM model not specified, will use default',
          path: 'spec.llm.model',
          suggestion: 'Add spec.llm.model field',
        });
      }
    } else {
      warnings.push({
        message: 'No LLM configuration found, will use OpenAI GPT-4 default',
        path: 'spec.llm',
        suggestion: 'Add spec.llm configuration',
      });
    }

    // Check tools
    if (spec?.tools && Array.isArray(spec.tools)) {
      if (spec.tools.length === 0) {
        warnings.push({
          message: 'No tools defined, agent will have limited capabilities',
          path: 'spec.tools',
          suggestion: 'Add tools for agent functionality',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example LangChain-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'langchain-example-agent',
        version: '1.0.0',
        description: 'Example LangChain agent with tools and memory',
      },
      spec: {
        role: 'You are a helpful AI assistant that can search the web and analyze documents.',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
        },
        tools: [
          {
            name: 'web_search',
            description: 'Search the web for information',
            type: 'api',
          },
          {
            name: 'document_analyzer',
            description: 'Analyze documents and extract key information',
            type: 'function',
          },
        ],
        capabilities: [
          'web-search',
          'document-analysis',
          'conversational-memory',
        ],
      },
    };
  }

  /**
   * Generate TypeScript LangChain code
   */
  private generateTypeScriptCode(
    config: LangChainAgentConfig,
    manifest: OssaAgent
  ): string {
    return `/**
 * LangChain Agent: ${config.name}
 * Generated from OSSA manifest
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Tool } from '@langchain/core/tools';
import { ConversationBufferMemory } from 'langchain/memory';

// Initialize LLM
const llm = ${this.generateLLMInit(config)};

// Define tools
const tools: Tool[] = [
${config.tools
  .map(
    (tool) => `  {
    name: '${tool.name}',
    description: '${tool.description}',
    func: async (input: string) => {
      // Tool implementation
      return \`Executed ${tool.name} with: \${input}\`;
    },
  }`
  )
  .join(',\n')}
];

// Create prompt template
const prompt = ChatPromptTemplate.fromMessages([
  ['system', \`${config.systemMessage}\`],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

// Initialize memory
const memory = new ConversationBufferMemory({
  memoryKey: 'chat_history',
  returnMessages: true,
});

// Create agent
const agent = await createOpenAIToolsAgent({
  llm,
  tools,
  prompt,
});

// Create agent executor
const agentExecutor = new AgentExecutor({
  agent,
  tools,
  memory,
  verbose: true,
});

// Export executor
export { agentExecutor };

// Example usage
async function main() {
  const result = await agentExecutor.invoke({
    input: 'Hello! What can you help me with?',
  });
  console.log(result.output);
}

if (require.main === module) {
  main().catch(console.error);
}
`;
  }

  /**
   * Generate LLM initialization code
   */
  private generateLLMInit(config: LangChainAgentConfig): string {
    const provider = config.llm.provider;
    const model = config.llm.model;
    const temperature = config.llm.temperature ?? 0.7;
    const maxTokens = config.llm.maxTokens ?? 2000;

    if (provider === 'anthropic') {
      return `new ChatAnthropic({
  model: '${model}',
  temperature: ${temperature},
  maxTokens: ${maxTokens},
})`;
    }

    // Default to OpenAI
    return `new ChatOpenAI({
  model: '${model}',
  temperature: ${temperature},
  maxTokens: ${maxTokens},
})`;
  }

  /**
   * Generate Python requirements.txt
   */
  private generateRequirements(config: LangChainAgentConfig): string {
    const requirements = ['langchain>=0.1.0', 'langchain-openai>=0.0.5'];

    if (config.llm.provider === 'anthropic') {
      requirements.push('langchain-anthropic>=0.0.1');
    } else if (config.llm.provider === 'cohere') {
      requirements.push('langchain-cohere>=0.0.1');
    }

    requirements.push('python-dotenv>=1.0.0');

    return requirements.join('\n') + '\n';
  }

  /**
   * Generate package.json for TypeScript version
   */
  private generatePackageJson(
    config: LangChainAgentConfig,
    manifest: OssaAgent
  ): string {
    const pkg = {
      name: manifest.metadata?.name || 'langchain-agent',
      version: manifest.metadata?.version || '1.0.0',
      description: manifest.metadata?.description || 'LangChain agent',
      type: 'module',
      scripts: {
        start: 'node --loader ts-node/esm agent.ts',
        build: 'tsc',
      },
      dependencies: {
        '@langchain/openai': '^0.0.19',
        '@langchain/core': '^0.1.0',
        '@langchain/anthropic': '^0.0.1',
        langchain: '^0.1.0',
        dotenv: '^16.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        typescript: '^5.0.0',
        'ts-node': '^10.9.0',
      },
    };

    if (config.llm.provider === 'anthropic') {
      pkg.dependencies['@langchain/anthropic'] = '^0.0.1';
    }

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Generate README.md
   */
  private generateReadme(
    manifest: OssaAgent,
    config: LangChainAgentConfig
  ): string {
    return `# ${manifest.metadata?.name || 'LangChain Agent'}

${manifest.metadata?.description || 'LangChain agent generated from OSSA manifest'}

## Description

${manifest.spec?.role || 'AI Agent'}

## Setup

### Python

\`\`\`bash
pip install -r requirements.txt
python ${manifest.metadata?.name || 'agent'}.py
\`\`\`

### TypeScript

\`\`\`bash
npm install
npm start
\`\`\`

## Configuration

- **LLM Provider**: ${config.llm.provider}
- **Model**: ${config.llm.model}
- **Temperature**: ${config.llm.temperature ?? 0.7}
- **Max Tokens**: ${config.llm.maxTokens ?? 2000}

## Tools

${config.tools.map((t) => `- **${t.name}**: ${t.description}`).join('\n')}

## Generated from OSSA

This agent was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${manifest.metadata?.license || 'MIT'}
`;
  }
}
