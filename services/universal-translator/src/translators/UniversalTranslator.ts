/**
 * Universal Translator
 * Routes translation requests to appropriate format-specific translators
 * Provides unified interface for translating any agent format to OAAS
 */

import { DrupalTranslator, DrupalAgentPlugin } from './DrupalTranslator.js';
import { MCPTranslator, MCPServer } from './MCPTranslator.js';
import { LangChainTranslator, LangChainImplementation } from './LangChainTranslator.js';
import { CrewAITranslator, CrewAIImplementation } from './CrewAITranslator.js';

export interface UniversalTranslatorConfig {
  projectRoot: string;
  enabledFormats?: string[];
  translationCache?: boolean;
  strictValidation?: boolean;
}

export interface TranslatableAgent {
  id: string;
  format: 'drupal' | 'mcp' | 'langchain' | 'crewai' | 'openai' | 'anthropic';
  source_path: string;
  raw_data: any;
  confidence: number;
  metadata?: any;
}

export interface TranslationResult {
  agent_id: string;
  format: string;
  oaas_spec: any;
  translation_time: number;
  validation_passed: boolean;
  errors: string[];
  warnings: string[];
}

export class UniversalTranslator {
  private drupalTranslator: DrupalTranslator;
  private mcpTranslator: MCPTranslator;
  private langchainTranslator: LangChainTranslator;
  private crewaiTranslator: CrewAITranslator;
  private translationCache: Map<string, TranslationResult> = new Map();

  constructor(private config: UniversalTranslatorConfig) {
    this.drupalTranslator = new DrupalTranslator();
    this.mcpTranslator = new MCPTranslator();
    this.langchainTranslator = new LangChainTranslator();
    this.crewaiTranslator = new CrewAITranslator();
  }

  /**
   * Translate any agent to OAAS format
   * Main entry point for translation operations
   */
  async translateToOAAS(agent: TranslatableAgent): Promise<TranslationResult> {
    const startTime = Date.now();
    
    // Check cache first
    if (this.config.translationCache && this.translationCache.has(agent.id)) {
      console.log(`📦 Using cached translation for ${agent.id}`);
      return this.translationCache.get(agent.id)!;
    }

    console.log(`🔄 Translating ${agent.format} agent: ${agent.id}`);

    try {
      let oaasSpec: any;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Route to appropriate translator based on format
      switch (agent.format) {
        case 'drupal':
          oaasSpec = await this.translateDrupalAgent(agent);
          break;
        
        case 'mcp':
          oaasSpec = await this.translateMCPAgent(agent);
          break;
        
        case 'langchain':
          oaasSpec = await this.translateLangChainAgent(agent);
          break;
        
        case 'crewai':
          oaasSpec = await this.translateCrewAIAgent(agent);
          break;
        
        case 'openai':
          oaasSpec = await this.translateOpenAIAgent(agent);
          warnings.push('OpenAI agent translation is experimental');
          break;
        
        case 'anthropic':
          oaasSpec = await this.translateAnthropicAgent(agent);
          warnings.push('Anthropic agent translation is experimental');
          break;
        
        default:
          throw new Error(`Unsupported agent format: ${agent.format}`);
      }

      // Validate translation if strict validation is enabled
      let validationPassed = true;
      if (this.config.strictValidation) {
        const validationResult = this.validateOAASSpec(oaasSpec);
        validationPassed = validationResult.valid;
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);
      }

      const translationTime = Date.now() - startTime;
      
      const result: TranslationResult = {
        agent_id: agent.id,
        format: agent.format,
        oaas_spec: oaasSpec,
        translation_time: translationTime,
        validation_passed: validationPassed,
        errors,
        warnings
      };

      // Cache successful translations
      if (this.config.translationCache && validationPassed) {
        this.translationCache.set(agent.id, result);
      }

      console.log(`✅ Translated ${agent.id} in ${translationTime}ms`);
      return result;

    } catch (error) {
      const translationTime = Date.now() - startTime;
      
      const result: TranslationResult = {
        agent_id: agent.id,
        format: agent.format,
        oaas_spec: null,
        translation_time: translationTime,
        validation_passed: false,
        errors: [error.message],
        warnings: []
      };

      console.warn(`⚠️  Failed to translate ${agent.id}:`, error.message);
      return result;
    }
  }

  /**
   * Batch translate multiple agents
   */
  async translateMultiple(agents: TranslatableAgent[]): Promise<TranslationResult[]> {
    console.log(`🔄 Batch translating ${agents.length} agents...`);
    
    const results = await Promise.allSettled(
      agents.map(agent => this.translateToOAAS(agent))
    );

    const translations: TranslationResult[] = [];
    let successCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        translations.push(result.value);
        if (result.value.validation_passed) {
          successCount++;
        }
      } else {
        translations.push({
          agent_id: agents[index].id,
          format: agents[index].format,
          oaas_spec: null,
          translation_time: 0,
          validation_passed: false,
          errors: [result.reason.message],
          warnings: []
        });
      }
    });

    console.log(`✅ Batch translation complete: ${successCount}/${agents.length} successful`);
    return translations;
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(): any {
    const cacheStats = {
      cached_translations: this.translationCache.size,
      cache_enabled: this.config.translationCache
    };

    return {
      enabled_formats: this.config.enabledFormats || ['drupal', 'mcp', 'langchain', 'crewai'],
      strict_validation: this.config.strictValidation,
      cache: cacheStats
    };
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.translationCache.clear();
    console.log('🗑️  Translation cache cleared');
  }

  // Format-specific translation methods

  private async translateDrupalAgent(agent: TranslatableAgent): Promise<any> {
    const plugin = agent.raw_data as DrupalAgentPlugin;
    return await this.drupalTranslator.translateToOAAS(plugin);
  }

  private async translateMCPAgent(agent: TranslatableAgent): Promise<any> {
    const server = agent.raw_data as MCPServer;
    return await this.mcpTranslator.translateToOAAS(server);
  }

  private async translateLangChainAgent(agent: TranslatableAgent): Promise<any> {
    const implementation = agent.raw_data as LangChainImplementation;
    return await this.langchainTranslator.translateToOAAS(implementation);
  }

  private async translateCrewAIAgent(agent: TranslatableAgent): Promise<any> {
    const implementation = agent.raw_data as CrewAIImplementation;
    return await this.crewaiTranslator.translateToOAAS(implementation);
  }

  private async translateOpenAIAgent(agent: TranslatableAgent): Promise<any> {
    // Basic OpenAI agent translation
    const agentData = agent.raw_data;
    
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `openai-${agent.id}`,
        version: "1.0.0",
        created: new Date().toISOString().split('T')[0],
        description: `OpenAI agent: ${agent.id}`,
        annotations: {
          "oaas/compliance-level": "bronze",
          "oaas/framework-support": "openai,mcp",
          "openai/agent-id": agent.id,
          "openai/experimental": "true"
        },
        labels: {
          domain: "openai",
          category: "assistant",
          framework: "openai"
        }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: "OpenAI Assistant capabilities"
        },
        capabilities: [
          {
            name: 'chat',
            description: 'Chat completion capability',
            input_schema: { type: 'object', properties: { message: { type: 'string' } } },
            output_schema: { type: 'object', properties: { response: { type: 'string' } } },
            frameworks: ['openai'],
            compliance: ['openai-api']
          },
          {
            name: 'function_calling',
            description: 'Function calling capability',
            input_schema: { type: 'object', properties: { function_call: { type: 'object' } } },
            output_schema: { type: 'object', properties: { result: { type: 'object' } } },
            frameworks: ['openai'],
            compliance: ['openai-functions']
          }
        ],
        protocols: {
          supported: ['openai', 'mcp'],
          primary: 'openai'
        },
        frameworks: {
          openai: {
            enabled: true,
            assistant_id: agentData.assistant_id || agent.id
          }
        }
      }
    };
  }

  private async translateAnthropicAgent(agent: TranslatableAgent): Promise<any> {
    // Basic Anthropic agent translation
    const agentData = agent.raw_data;
    
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `anthropic-${agent.id}`,
        version: "1.0.0",
        created: new Date().toISOString().split('T')[0],
        description: `Anthropic agent: ${agent.id}`,
        annotations: {
          "oaas/compliance-level": "bronze",
          "oaas/framework-support": "anthropic,mcp",
          "anthropic/agent-id": agent.id,
          "anthropic/experimental": "true"
        },
        labels: {
          domain: "anthropic",
          category: "claude",
          framework: "anthropic"
        }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: "Anthropic Claude capabilities"
        },
        capabilities: [
          {
            name: 'tool_use',
            description: 'Tool use capability',
            input_schema: { type: 'object', properties: { tools: { type: 'array' } } },
            output_schema: { type: 'object', properties: { result: { type: 'object' } } },
            frameworks: ['anthropic'],
            compliance: ['anthropic-tools']
          },
          {
            name: 'function_calling',
            description: 'Function calling capability',
            input_schema: { type: 'object', properties: { function: { type: 'object' } } },
            output_schema: { type: 'object', properties: { response: { type: 'object' } } },
            frameworks: ['anthropic'],
            compliance: ['anthropic-functions']
          }
        ],
        protocols: {
          supported: ['anthropic', 'mcp'],
          primary: 'anthropic'
        },
        frameworks: {
          anthropic: {
            enabled: true,
            model: agentData.model || 'claude-3-sonnet-20240229'
          }
        }
      }
    };
  }

  /**
   * Validate OAAS specification
   */
  private validateOAASSpec(spec: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!spec) {
      errors.push('OAAS spec is null or undefined');
      return { valid: false, errors, warnings };
    }

    if (!spec.apiVersion) {
      errors.push('Missing required field: apiVersion');
    }

    if (!spec.kind) {
      errors.push('Missing required field: kind');
    }

    if (!spec.metadata) {
      errors.push('Missing required field: metadata');
    } else {
      if (!spec.metadata.name) {
        errors.push('Missing required metadata field: name');
      }
      if (!spec.metadata.version) {
        errors.push('Missing required metadata field: version');
      }
    }

    if (!spec.spec) {
      errors.push('Missing required field: spec');
    } else {
      if (!spec.spec.agent) {
        errors.push('Missing required spec field: agent');
      }
      if (!spec.spec.capabilities || !Array.isArray(spec.spec.capabilities)) {
        warnings.push('No capabilities defined or capabilities is not an array');
      }
    }

    // Validate name format
    if (spec.metadata?.name && !/^[a-z0-9-]+$/.test(spec.metadata.name)) {
      warnings.push('Agent name should follow kebab-case format (lowercase, hyphens only)');
    }

    // Validate version format
    if (spec.metadata?.version && !/^\d+\.\d+\.\d+$/.test(spec.metadata.version)) {
      warnings.push('Version should follow semantic versioning format (x.y.z)');
    }

    // Validate capabilities structure
    if (spec.spec?.capabilities) {
      spec.spec.capabilities.forEach((capability: any, index: number) => {
        if (!capability.name) {
          errors.push(`Capability ${index}: Missing required field 'name'`);
        }
        if (!capability.description) {
          warnings.push(`Capability ${index}: Missing recommended field 'description'`);
        }
        if (!capability.frameworks || !Array.isArray(capability.frameworks)) {
          warnings.push(`Capability ${index}: Missing or invalid 'frameworks' field`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create translatable agent from discovery result
   */
  static createTranslatableAgent(discoveryResult: any): TranslatableAgent {
    return {
      id: discoveryResult.id,
      format: discoveryResult.format,
      source_path: discoveryResult.source_path,
      raw_data: discoveryResult.raw_data || discoveryResult.metadata,
      confidence: discoveryResult.confidence || 1.0,
      metadata: discoveryResult.metadata
    };
  }
}