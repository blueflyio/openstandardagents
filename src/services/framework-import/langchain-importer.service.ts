/**
 * LangChain Importer Service
 * 
 * Imports LangChain agents and converts them to OSSA manifests.
 * SOLID: Single Responsibility - LangChain import only
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import type { OssaAgent } from '../../types/index.js';

const LangChainConfigSchema = z.object({
  agent_type: z.string().optional(),
  llm: z.object({
    model_name: z.string(),
    temperature: z.number().optional(),
    max_tokens: z.number().optional(),
  }).optional(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    func: z.string().optional(),
  })).optional(),
  memory: z.object({
    type: z.string(),
    config: z.record(z.unknown()).optional(),
  }).optional(),
});

export type LangChainConfig = z.infer<typeof LangChainConfigSchema>;

export class LangChainImporterService {
  /**
   * Import LangChain agent from Python file
   * CRUD: Read operation (reads and converts)
   */
  async importFromPythonFile(filePath: string): Promise<OssaAgent> {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const pythonCode = readFileSync(filePath, 'utf-8');
    return this.importFromPythonCode(pythonCode);
  }

  /**
   * Import LangChain agent from Python code
   */
  async importFromPythonCode(code: string): Promise<OssaAgent> {
    // Parse Python code to extract agent configuration
    const config = this.parsePythonCode(code);

    // Convert to OSSA manifest
    return this.convertToOSSA(config);
  }

  /**
   * Import LangChain agent from config file (JSON/YAML)
   */
  async importFromConfig(filePath: string): Promise<OssaAgent> {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    const config = filePath.endsWith('.json')
      ? JSON.parse(content)
      : this.parseYAML(content);

    const validated = LangChainConfigSchema.parse(config);
    return this.convertToOSSA(validated);
  }

  /**
   * Parse Python code to extract configuration
   */
  private parsePythonCode(code: string): LangChainConfig {
    const config: Partial<LangChainConfig> = {};

    // Extract LLM model
    const llmMatch = code.match(/ChatOpenAI\([\s\S]*?model_name\s*=\s*["']([^"']+)["']/);
    if (llmMatch) {
      config.llm = {
        model_name: llmMatch[1],
      };

      // Extract temperature
      const tempMatch = code.match(/temperature\s*=\s*([0-9.]+)/);
      if (tempMatch) {
        config.llm.temperature = parseFloat(tempMatch[1]);
      }
    }

    // Extract agent type
    const agentTypeMatch = code.match(/AgentType\.([A-Z_]+)/);
    if (agentTypeMatch) {
      config.agent_type = agentTypeMatch[1].toLowerCase().replace(/_/g, '-');
    }

    // Extract tools
    const toolMatches = code.matchAll(/Tool\([\s\S]*?name\s*=\s*["']([^"']+)["'][\s\S]*?description\s*=\s*["']([^"']+)["']/g);
    const tools: Array<{ name: string; description: string }> = [];
    for (const match of toolMatches) {
      tools.push({
        name: match[1],
        description: match[2],
      });
    }
    if (tools.length > 0) {
      config.tools = tools;
    }

    return LangChainConfigSchema.parse(config);
  }

  /**
   * Parse YAML content
   */
  private parseYAML(content: string): unknown {
    const { parse } = require('yaml');
    return parse(content);
  }

  /**
   * Convert LangChain config to OSSA manifest
   */
  private convertToOSSA(config: LangChainConfig): OssaAgent {
    // Determine provider from model name
    const modelName = config.llm?.model_name || 'gpt-3.5-turbo';
    let provider = 'openai';
    if (modelName.includes('claude') || modelName.includes('anthropic')) provider = 'anthropic';
    if (modelName.includes('gemini') || modelName.includes('google')) provider = 'google';

    return {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'langchain-agent',
        version: '1.0.0',
        description: 'Imported from LangChain',
        labels: {
          framework: 'langchain',
          imported: 'true',
        },
      },
      spec: {
        role: 'You are a helpful AI assistant.',
        llm: {
          provider,
          model: modelName,
          temperature: config.llm?.temperature,
        },
        tools: config.tools?.map(tool => ({
          name: tool.name,
          description: tool.description,
        })),
      },
      extensions: {
        langchain: {
          agent_type: config.agent_type || 'zero-shot-react-description',
          memory: config.memory,
        },
      },
    } as OssaAgent;
  }
}
