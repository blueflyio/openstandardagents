/**
 * LangChain Migration Service
 * Migrates LangChain agents (Python/TypeScript) to OSSA manifests
 *
 * Supports:
 * - Python LangChain (ReAct, Zero-Shot agents, chains)
 * - TypeScript LangChain (LCEL, chains)
 * - JSON/YAML configuration files
 *
 * Mapping Rules:
 * - Agent (ReAct, Zero-Shot) → kind: Agent with spec.role
 * - Chain → kind: Workflow or Task
 * - Tool → spec.tools[] (function/http/mcp)
 * - Memory → extensions.langchain.memory_type
 * - LLM Config → spec.llm
 */

import { injectable } from 'inversify';
import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { OssaAgent } from '../../types/index.js';
import { getVersionInfo } from '../../utils/version.js';

/**
 * LangChain agent component extracted from code
 */
export interface LangChainComponent {
  type: 'agent' | 'chain' | 'tool' | 'memory' | 'llm' | 'prompt';
  name?: string;
  agentType?: 'react' | 'zero-shot' | 'conversational' | 'openai-functions';
  chainType?: 'sequential' | 'llm' | 'transformation' | 'router';
  llmConfig?: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  tools?: Array<{
    name: string;
    description?: string;
    type?: 'function' | 'http' | 'mcp';
  }>;
  memory?: {
    type: string;
    config?: Record<string, unknown>;
  };
  steps?: Array<{
    name: string;
    description?: string;
  }>;
  prompt?: string;
}

/**
 * Migration report for tracking conversion quality
 */
export interface MigrationReport {
  sourceFile: string;
  sourceFormat: 'python' | 'typescript' | 'json' | 'yaml';
  targetManifest: string;
  components: {
    detected: LangChainComponent[];
    mapped: Array<{
      source: string;
      target: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
    unmapped: string[];
  };
  warnings: string[];
  recommendations: string[];
  confidence: number;
  timestamp: string;
}

@injectable()
export class LangChainMigrationService {
  /**
   * Migrate LangChain code/config to OSSA manifest
   */
  async migrate(
    sourcePath: string,
    outputPath?: string
  ): Promise<{ manifest: OssaAgent; report: MigrationReport }> {
    const ext = path.extname(sourcePath).toLowerCase();
    const content = await fs.readFile(sourcePath, 'utf-8');

    let components: LangChainComponent[];
    let sourceFormat: 'python' | 'typescript' | 'json' | 'yaml';

    // Parse based on file extension
    if (ext === '.py') {
      components = this.parsePython(content);
      sourceFormat = 'python';
    } else if (ext === '.ts' || ext === '.js') {
      components = this.parseTypeScript(content);
      sourceFormat = 'typescript';
    } else if (ext === '.json') {
      components = this.parseJSON(content);
      sourceFormat = 'json';
    } else if (ext === '.yaml' || ext === '.yml') {
      components = this.parseYAML(content);
      sourceFormat = 'yaml';
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // Generate OSSA manifest from components
    const manifest = this.generateManifest(components, sourcePath);

    // Generate migration report
    const report = this.generateReport(
      sourcePath,
      sourceFormat,
      components,
      manifest,
      outputPath
    );

    return { manifest, report };
  }

  /**
   * Parse Python LangChain code
   */
  private parsePython(code: string): LangChainComponent[] {
    const components: LangChainComponent[] = [];

    // Detect agent type
    const agentPatterns = [
      {
        pattern: /initialize_agent\s*\([^)]*agent\s*=\s*AgentType\.(\w+)/i,
        prefix: '',
      },
      { pattern: /create_(\w+)_agent\s*\(/i, prefix: '' },
      {
        pattern: /from\s+langchain\.agents\s+import\s+(\w+Agent)/i,
        prefix: '',
      },
    ];

    for (const { pattern, prefix } of agentPatterns) {
      const match = code.match(pattern);
      if (match) {
        const agentTypeRaw = match[1].toLowerCase().replace('_', '-');
        let agentType: LangChainComponent['agentType'] = 'zero-shot';

        if (agentTypeRaw.includes('react')) agentType = 'react';
        else if (agentTypeRaw.includes('conversational'))
          agentType = 'conversational';
        else if (agentTypeRaw.includes('openai'))
          agentType = 'openai-functions';

        components.push({
          type: 'agent',
          agentType,
          name: this.extractAgentName(code, agentType),
        });
        break;
      }
    }

    // Detect chain type
    const chainPatterns = [
      /(\w+Chain)\s*\(/g,
      /from\s+langchain\.chains\s+import\s+(\w+)/g,
    ];

    for (const pattern of chainPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        const chainName = match[1];
        let chainType: LangChainComponent['chainType'] = 'llm';

        if (chainName.toLowerCase().includes('sequential'))
          chainType = 'sequential';
        else if (chainName.toLowerCase().includes('transform'))
          chainType = 'transformation';
        else if (chainName.toLowerCase().includes('router'))
          chainType = 'router';

        components.push({
          type: 'chain',
          chainType,
          name: chainName,
        });
      }
    }

    // Extract LLM configuration
    const llmPatterns = [
      /ChatOpenAI\s*\([^)]*model[_name]*\s*=\s*["']([^"']+)["']/i,
      /ChatAnthropic\s*\([^)]*model[_name]*\s*=\s*["']([^"']+)["']/i,
      /OpenAI\s*\([^)]*model[_name]*\s*=\s*["']([^"']+)["']/i,
    ];

    for (const pattern of llmPatterns) {
      const match = code.match(pattern);
      if (match) {
        const model = match[1];
        let provider = 'openai';

        if (code.includes('ChatAnthropic')) provider = 'anthropic';

        // Extract temperature
        const tempMatch = code.match(/temperature\s*=\s*([\d.]+)/i);
        const temperature = tempMatch ? parseFloat(tempMatch[1]) : undefined;

        // Extract max_tokens
        const maxTokensMatch = code.match(/max_tokens\s*=\s*(\d+)/i);
        const maxTokens = maxTokensMatch
          ? parseInt(maxTokensMatch[1], 10)
          : undefined;

        components.push({
          type: 'llm',
          llmConfig: {
            provider,
            model,
            temperature,
            maxTokens,
          },
        });
        break;
      }
    }

    // Extract tools
    const toolMatches = code.matchAll(/@tool\s+def\s+(\w+)\s*\([^)]*\):/g);
    const tools: Array<{
      name: string;
      description?: string;
      type?: 'function' | 'http' | 'mcp';
    }> = [];

    for (const match of toolMatches) {
      const toolName = match[1];
      // Try to extract docstring
      const docPattern = new RegExp(
        `def\\s+${toolName}[^:]*:\\s*["']{3}([^"']+)["']{3}`,
        's'
      );
      const docMatch = code.match(docPattern);

      tools.push({
        name: toolName,
        description: docMatch ? docMatch[1].trim() : undefined,
        type: 'function',
      });
    }

    // Also check for Tool() instantiation
    const toolInstMatches = code.matchAll(
      /Tool\s*\(\s*name\s*=\s*["']([^"']+)["']/g
    );
    for (const match of toolInstMatches) {
      if (!tools.find((t) => t.name === match[1])) {
        tools.push({
          name: match[1],
          type: 'function',
        });
      }
    }

    if (tools.length > 0) {
      components.push({
        type: 'tool',
        tools,
      });
    }

    // Extract memory configuration
    const memoryPatterns = [
      /ConversationBufferMemory\s*\(/i,
      /ConversationBufferWindowMemory\s*\(/i,
      /ConversationSummaryMemory\s*\(/i,
      /VectorStoreRetrieverMemory\s*\(/i,
    ];

    for (const pattern of memoryPatterns) {
      if (pattern.test(code)) {
        const memoryType =
          pattern.source.match(/(\w+Memory)/i)?.[1] ||
          'ConversationBufferMemory';
        components.push({
          type: 'memory',
          memory: {
            type: memoryType,
          },
        });
        break;
      }
    }

    return components;
  }

  /**
   * Parse TypeScript LangChain code
   */
  private parseTypeScript(code: string): LangChainComponent[] {
    const components: LangChainComponent[] = [];

    // Detect agent type
    const agentPatterns = [
      /initializeAgentExecutorWithOptions\s*\(/i,
      /createReactAgent\s*\(/i,
      /createOpenAIFunctionsAgent\s*\(/i,
    ];

    for (const pattern of agentPatterns) {
      if (pattern.test(code)) {
        let agentType: LangChainComponent['agentType'] = 'zero-shot';

        if (pattern.source.includes('React')) agentType = 'react';
        else if (pattern.source.includes('OpenAI'))
          agentType = 'openai-functions';

        components.push({
          type: 'agent',
          agentType,
          name: this.extractAgentName(code, agentType),
        });
        break;
      }
    }

    // Detect chains
    const chainPatterns = [
      /new\s+(\w+Chain)\s*\(/g,
      /RunnableSequence\.from\s*\(/gi,
    ];

    for (const pattern of chainPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        const chainName = match[1] || 'RunnableSequence';
        let chainType: LangChainComponent['chainType'] = 'sequential';

        if (chainName.toLowerCase().includes('llm')) chainType = 'llm';

        components.push({
          type: 'chain',
          chainType,
          name: chainName,
        });
      }
    }

    // Extract LLM config
    const llmPatterns = [
      /new\s+ChatOpenAI\s*\(\s*\{[^}]*model:\s*["']([^"']+)["']/i,
      /new\s+ChatAnthropic\s*\(\s*\{[^}]*model:\s*["']([^"']+)["']/i,
    ];

    for (const pattern of llmPatterns) {
      const match = code.match(pattern);
      if (match) {
        const model = match[1];
        let provider = 'openai';

        if (code.includes('ChatAnthropic')) provider = 'anthropic';

        const tempMatch = code.match(/temperature:\s*([\d.]+)/i);
        const temperature = tempMatch ? parseFloat(tempMatch[1]) : undefined;

        const maxTokensMatch = code.match(/maxTokens:\s*(\d+)/i);
        const maxTokens = maxTokensMatch
          ? parseInt(maxTokensMatch[1], 10)
          : undefined;

        components.push({
          type: 'llm',
          llmConfig: {
            provider,
            model,
            temperature,
            maxTokens,
          },
        });
        break;
      }
    }

    // Extract tools (DynamicStructuredTool, DynamicTool)
    const toolMatches = code.matchAll(
      /new\s+Dynamic(?:Structured)?Tool\s*\(\s*\{[^}]*name:\s*["']([^"']+)["']/g
    );
    const tools: Array<{
      name: string;
      description?: string;
      type?: 'function' | 'http' | 'mcp';
    }> = [];

    for (const match of toolMatches) {
      tools.push({
        name: match[1],
        type: 'function',
      });
    }

    if (tools.length > 0) {
      components.push({
        type: 'tool',
        tools,
      });
    }

    // Extract memory
    const memoryPatterns = [
      /new\s+BufferMemory\s*\(/i,
      /new\s+BufferWindowMemory\s*\(/i,
      /new\s+ConversationSummaryMemory\s*\(/i,
    ];

    for (const pattern of memoryPatterns) {
      if (pattern.test(code)) {
        const memoryType =
          pattern.source.match(/(\w+Memory)/i)?.[1] || 'BufferMemory';
        components.push({
          type: 'memory',
          memory: {
            type: memoryType,
          },
        });
        break;
      }
    }

    return components;
  }

  /**
   * Parse JSON configuration
   */
  private parseJSON(content: string): LangChainComponent[] {
    const config = JSON.parse(content);
    return this.parseConfigObject(config);
  }

  /**
   * Parse YAML configuration
   */
  private parseYAML(content: string): LangChainComponent[] {
    const config = yaml.load(content) as Record<string, unknown>;
    return this.parseConfigObject(config);
  }

  /**
   * Parse configuration object (from JSON/YAML)
   */
  private parseConfigObject(
    config: Record<string, unknown>
  ): LangChainComponent[] {
    const components: LangChainComponent[] = [];

    // Extract agent
    if (config.agent) {
      const agent = config.agent as Record<string, unknown>;
      components.push({
        type: 'agent',
        agentType: (agent.type as string)?.toLowerCase().includes('react')
          ? 'react'
          : 'zero-shot',
        name: agent.name as string,
      });
    }

    // Extract chain
    if (config.chain) {
      const chain = config.chain as Record<string, unknown>;
      components.push({
        type: 'chain',
        chainType: (chain.type as string)?.toLowerCase().includes('sequential')
          ? 'sequential'
          : 'llm',
        name: chain.name as string,
      });
    }

    // Extract LLM
    if (config.llm) {
      const llm = config.llm as Record<string, unknown>;
      components.push({
        type: 'llm',
        llmConfig: {
          provider: llm.provider as string,
          model: llm.model as string,
          temperature: llm.temperature as number,
          maxTokens: (llm.max_tokens as number) || (llm.maxTokens as number),
        },
      });
    }

    // Extract tools
    if (config.tools && Array.isArray(config.tools)) {
      const tools = config.tools.map((t: unknown) => {
        const tool = t as Record<string, unknown>;
        return {
          name: tool.name as string,
          description: tool.description as string,
          type: (tool.type as 'function' | 'http' | 'mcp') || 'function',
        };
      });
      components.push({
        type: 'tool',
        tools,
      });
    }

    // Extract memory
    if (config.memory) {
      const memory = config.memory as Record<string, unknown>;
      components.push({
        type: 'memory',
        memory: {
          type: memory.type as string,
          config: memory.config as Record<string, unknown>,
        },
      });
    }

    return components;
  }

  /**
   * Generate OSSA manifest from LangChain components
   */
  private generateManifest(
    components: LangChainComponent[],
    sourcePath: string
  ): OssaAgent {
    const versionInfo = getVersionInfo();
    const agentComponent = components.find((c) => c.type === 'agent');
    const chainComponent = components.find((c) => c.type === 'chain');
    const llmComponent = components.find((c) => c.type === 'llm');
    const toolComponent = components.find((c) => c.type === 'tool');
    const memoryComponent = components.find((c) => c.type === 'memory');

    // Determine kind and role
    let kind: 'Agent' | 'Workflow' | 'Task' = 'Agent';
    let role = 'AI Assistant';

    if (agentComponent) {
      kind = 'Agent';
      role = this.mapAgentTypeToRole(agentComponent.agentType || 'zero-shot');
    } else if (chainComponent) {
      kind = chainComponent.chainType === 'sequential' ? 'Workflow' : 'Task';
      role = this.mapChainTypeToRole(chainComponent.chainType || 'llm');
    }

    // Generate name from source file
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const name = baseName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

    const manifest: OssaAgent = {
      apiVersion: `ossa/v${versionInfo.version}`,
      kind,
      metadata: {
        name,
        version: '0.1.0',
        description: `Migrated from LangChain ${agentComponent?.agentType || chainComponent?.chainType || 'agent'}`,
        labels: {
          'ossa-version': `v${versionInfo.version}`,
          'migration-source': 'langchain',
        },
        annotations: {
          'ossa.io/migration': 'langchain-to-ossa',
          'ossa.io/migrated-date': new Date().toISOString().split('T')[0],
          'ossa.io/source-file': sourcePath,
        },
      },
      spec: {
        role,
      },
    };

    // Add LLM configuration
    if (llmComponent?.llmConfig) {
      const spec = manifest.spec as Record<string, unknown>;
      spec.llm = {
        provider: llmComponent.llmConfig.provider || 'openai',
        model: llmComponent.llmConfig.model || 'gpt-4',
        temperature: llmComponent.llmConfig.temperature,
        maxTokens: llmComponent.llmConfig.maxTokens,
      };
    }

    // Add tools
    if (toolComponent?.tools && toolComponent.tools.length > 0) {
      const spec = manifest.spec as Record<string, unknown>;
      spec.tools = toolComponent.tools.map((tool) => ({
        type: tool.type || 'function',
        name: tool.name,
        description: tool.description,
      }));
    }

    // Add memory as extension
    if (memoryComponent?.memory) {
      const spec = manifest.spec as Record<string, unknown>;
      if (!spec.extensions) {
        spec.extensions = {};
      }
      (spec.extensions as Record<string, unknown>).langchain = {
        memory_type: memoryComponent.memory.type,
        memory_config: memoryComponent.memory.config,
      };
    }

    // Add autonomy
    const spec = manifest.spec as Record<string, unknown>;
    spec.autonomy = {
      level: agentComponent?.agentType === 'react' ? 'autonomous' : 'assisted',
    };

    return manifest;
  }

  /**
   * Generate migration report
   */
  private generateReport(
    sourcePath: string,
    sourceFormat: 'python' | 'typescript' | 'json' | 'yaml',
    components: LangChainComponent[],
    manifest: OssaAgent,
    outputPath?: string
  ): MigrationReport {
    const mapped: Array<{
      source: string;
      target: string;
      confidence: 'high' | 'medium' | 'low';
    }> = [];
    const unmapped: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Map agent/chain
    const agentComp = components.find((c) => c.type === 'agent');
    const chainComp = components.find((c) => c.type === 'chain');

    if (agentComp) {
      mapped.push({
        source: `LangChain ${agentComp.agentType} Agent`,
        target: `OSSA Agent (kind: ${manifest.kind})`,
        confidence: 'high',
      });
    } else if (chainComp) {
      mapped.push({
        source: `LangChain ${chainComp.chainType} Chain`,
        target: `OSSA ${manifest.kind}`,
        confidence: 'high',
      });
    }

    // Map LLM
    const llmComp = components.find((c) => c.type === 'llm');
    if (llmComp) {
      mapped.push({
        source: `LLM: ${llmComp.llmConfig?.provider}/${llmComp.llmConfig?.model}`,
        target: 'spec.llm configuration',
        confidence: 'high',
      });
    }

    // Map tools
    const toolComp = components.find((c) => c.type === 'tool');
    if (toolComp?.tools) {
      toolComp.tools.forEach((tool) => {
        mapped.push({
          source: `Tool: ${tool.name}`,
          target: 'spec.tools[] entry',
          confidence: 'high',
        });
      });
    }

    // Map memory
    const memoryComp = components.find((c) => c.type === 'memory');
    if (memoryComp) {
      mapped.push({
        source: `Memory: ${memoryComp.memory?.type}`,
        target: 'extensions.langchain.memory_type',
        confidence: 'medium',
      });
      warnings.push(
        'Memory configuration requires manual verification and implementation'
      );
    }

    // Check for unmapped features
    if (components.some((c) => c.type === 'prompt')) {
      unmapped.push('Custom prompt templates (add to spec.role description)');
    }

    // Add recommendations
    if (toolComp?.tools && toolComp.tools.length > 0) {
      recommendations.push(
        'Review tool implementations and add proper schemas'
      );
      recommendations.push(
        'Consider implementing tools as MCP servers for better reusability'
      );
    }

    if (!llmComp) {
      warnings.push('No LLM configuration detected - using default values');
      recommendations.push('Add LLM configuration to spec.llm');
    }

    recommendations.push(
      'Validate generated manifest with: ossa validate <output-file>'
    );
    recommendations.push(
      'Test the migrated agent in a development environment'
    );

    // Calculate confidence score
    const totalMappings = mapped.length + unmapped.length;
    const highConfidence = mapped.filter((m) => m.confidence === 'high').length;
    const mediumConfidence = mapped.filter(
      (m) => m.confidence === 'medium'
    ).length;

    const confidence =
      totalMappings > 0
        ? Math.round(
            ((highConfidence * 1.0 + mediumConfidence * 0.7) / totalMappings) *
              100
          )
        : 0;

    return {
      sourceFile: sourcePath,
      sourceFormat,
      targetManifest: outputPath || 'generated-manifest.ossa.yaml',
      components: {
        detected: components,
        mapped,
        unmapped,
      },
      warnings,
      recommendations,
      confidence,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Map LangChain agent type to OSSA role
   */
  private mapAgentTypeToRole(agentType: string): string {
    const roleMap: Record<string, string> = {
      react:
        'Reasoning and Action (ReAct) Agent - uses chain-of-thought reasoning to decide which tools to use',
      'zero-shot':
        'Zero-Shot Agent - selects tools based on their descriptions without prior examples',
      conversational:
        'Conversational Agent - maintains conversation history and context across interactions',
      'openai-functions':
        'OpenAI Functions Agent - uses OpenAI function calling to select and use tools',
    };

    return roleMap[agentType] || 'AI Assistant Agent';
  }

  /**
   * Map LangChain chain type to OSSA role
   */
  private mapChainTypeToRole(chainType: string): string {
    const roleMap: Record<string, string> = {
      sequential: 'Sequential chain processor - executes steps in order',
      llm: 'LLM chain processor - processes input through language model',
      transformation: 'Data transformation chain - transforms input to output',
      router: 'Router chain - routes to different chains based on input',
    };

    return roleMap[chainType] || 'Chain processor';
  }

  /**
   * Extract agent name from code context
   */
  private extractAgentName(code: string, agentType?: string): string {
    // Try to find a comment or docstring near agent initialization
    const patterns = [
      /"""([^"]+)"""\s*\n[^=]*(?:agent|chain)\s*=/i,
      /\/\*\*\s*([^*]+)\*\/\s*\n[^=]*(?:agent|chain)\s*=/i,
      /#\s*([^\n]+)\s*\n[^=]*(?:agent|chain)\s*=/i,
    ];

    for (const pattern of patterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1].trim().split('\n')[0].trim();
      }
    }

    return agentType ? `${agentType} Agent` : 'Migrated Agent';
  }
}
