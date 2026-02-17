/**
 * LangChain Platform Adapter
 * Exports OSSA agent manifests to LangChain format (Python + TypeScript)
 *
 * SOLID: Single Responsibility - LangChain export only
 * DRY: Uses shared libraries for package.json, README, validation
 */

import * as yaml from 'yaml';
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
import {
  generatePackageJson,
  generateReadme,
} from '../base/common-file-generator.js';
import { validateLLM, validateTools } from '../base/manifest-validator.js';
import { LangChainConverter } from './converter.js';
import type { LangChainAgentConfig } from './types.js';

/** LangChain-supported LLM providers */
const LANGCHAIN_PROVIDERS = ['openai', 'anthropic', 'cohere', 'huggingface'];

export class LangChainAdapter extends BaseAdapter {
  readonly platform = 'langchain';
  readonly displayName = 'LangChain';
  readonly description = 'LangChain agent framework (Python/TypeScript)';
  readonly status = 'production' as const;
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

      // Generate package.json via shared library
      const packageJson = generatePackageJson(manifest, 'langchain', {
        dependencies:
          config.llm.provider === 'anthropic'
            ? { '@langchain/anthropic': '^0.0.1' }
            : undefined,
      });
      files.push(
        this.createFile('langchain/package.json', packageJson, 'config')
      );

      // Generate README via shared library
      const toolsList = config.tools
        .map((t) => `- **${t.name}**: ${t.description}`)
        .join('\n');
      const readme = generateReadme(manifest, 'langchain', {
        installation: `pip install -r requirements.txt\npython ${manifest.metadata?.name || 'agent'}.py\n# or\nnpm install\nnpm start`,
        usage: `python ${manifest.metadata?.name || 'agent'}.py\n# or\nnpm start`,
        additional: toolsList
          ? [{ title: 'Tools', content: toolsList }]
          : undefined,
      });
      files.push(
        this.createFile('langchain/README.md', readme, 'documentation')
      );

      // Include source OSSA manifest for provenance
      files.push(
        this.createFile(
          'langchain/agent.ossa.yaml',
          yaml.stringify(manifest),
          'config',
          'yaml'
        )
      );

      // Perfect Agent files
      files.push(...await this.generatePerfectAgentFiles(manifest, options));

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

    // LLM validation via shared library
    const llmResult = validateLLM(manifest.spec?.llm, LANGCHAIN_PROVIDERS);
    errors.push(...llmResult.errors);
    warnings.push(...llmResult.warnings);

    // Tools validation via shared library
    const toolsResult = validateTools(manifest.spec?.tools);
    errors.push(...toolsResult.errors);
    warnings.push(...toolsResult.warnings);

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
        ] as any,
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
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
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
const agent = await createToolCallingAgent({
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
}
