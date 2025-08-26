/**
 * Universal Translator
 * Routes translation requests to appropriate format-specific translators
 */

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

export interface UniversalTranslatorConfig {
  projectRoot: string;
  enabledFormats?: string[];
  translationCache?: boolean;
  strictValidation?: boolean;
}

export class UniversalTranslator {
  private translationCache: Map<string, TranslationResult> = new Map();

  constructor(private config: UniversalTranslatorConfig) {}

  /**
   * Translate any agent to OAAS format
   */
  async translateToOAAS(agent: TranslatableAgent): Promise<any> {
    const startTime = Date.now();
    
    console.log(`🔄 Translating ${agent.format} agent: ${agent.id}`);

    try {
      let oaasSpec: any;

      // Route to appropriate translator based on format
      switch (agent.format) {
        case 'drupal':
          oaasSpec = this.translateDrupalAgent(agent);
          break;
        case 'mcp':
          oaasSpec = this.translateMCPAgent(agent);
          break;
        case 'langchain':
          oaasSpec = this.translateLangChainAgent(agent);
          break;
        case 'crewai':
          oaasSpec = this.translateCrewAIAgent(agent);
          break;
        default:
          oaasSpec = this.translateGenericAgent(agent);
      }

      const translationTime = Date.now() - startTime;
      console.log(`✅ Translated ${agent.id} in ${translationTime}ms`);
      
      return oaasSpec;

    } catch (error: any) {
      console.warn(`⚠️  Failed to translate ${agent.id}:`, error.message);
      return this.createErrorSpec(agent, error.message);
    }
  }

  // Format-specific translation methods
  private translateDrupalAgent(agent: TranslatableAgent): any {
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `drupal-${agent.id}`,
        version: "1.0.0",
        description: `Drupal agent: ${agent.id}`,
        labels: { domain: "drupal", framework: "drupal" }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: "Drupal CMS operations"
        },
        capabilities: [
          {
            name: "drupal_operation",
            description: "Execute Drupal operations",
            frameworks: ["drupal"],
            compliance: ["drupal"]
          }
        ],
        frameworks: { drupal: { enabled: true } }
      }
    };
  }

  private translateMCPAgent(agent: TranslatableAgent): any {
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `mcp-${agent.id}`,
        version: "1.0.0",
        description: `MCP server: ${agent.id}`,
        labels: { domain: "mcp", framework: "mcp" }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: "Model Context Protocol operations"
        },
        capabilities: [
          {
            name: "mcp_tool",
            description: "Execute MCP tools",
            frameworks: ["mcp"],
            compliance: ["mcp-protocol"]
          }
        ],
        frameworks: { mcp: { enabled: true } }
      }
    };
  }

  private translateLangChainAgent(agent: TranslatableAgent): any {
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `langchain-${agent.id}`,
        version: "1.0.0",
        description: `LangChain agent: ${agent.id}`,
        labels: { domain: "langchain", framework: "langchain" }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: "LangChain tool operations"
        },
        capabilities: [
          {
            name: "langchain_tool",
            description: "Execute LangChain tools",
            frameworks: ["langchain"],
            compliance: ["langchain-tools"]
          }
        ],
        frameworks: { langchain: { enabled: true } }
      }
    };
  }

  private translateCrewAIAgent(agent: TranslatableAgent): any {
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `crewai-${agent.id}`,
        version: "1.0.0",
        description: `CrewAI agent: ${agent.id}`,
        labels: { domain: "crewai", framework: "crewai" }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: "CrewAI multi-agent operations"
        },
        capabilities: [
          {
            name: "crewai_agent",
            description: "Execute CrewAI agent operations",
            frameworks: ["crewai"],
            compliance: ["crewai-agents"]
          }
        ],
        frameworks: { crewai: { enabled: true } }
      }
    };
  }

  private translateGenericAgent(agent: TranslatableAgent): any {
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: agent.id,
        version: "1.0.0",
        description: `Generic agent: ${agent.id}`,
        labels: { domain: "generic", framework: "unknown" }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: "Generic agent operations"
        },
        capabilities: [
          {
            name: "generic_operation",
            description: "Execute generic operations",
            frameworks: ["unknown"],
            compliance: ["basic"]
          }
        ],
        frameworks: { unknown: { enabled: true } }
      }
    };
  }

  private createErrorSpec(agent: TranslatableAgent, error: string): any {
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `error-${agent.id}`,
        version: "1.0.0",
        description: `Translation error for: ${agent.id}`,
        labels: { domain: "error", framework: "none" }
      },
      spec: {
        agent: {
          name: agent.id,
          expertise: `Translation failed: ${error}`
        },
        capabilities: [],
        frameworks: {}
      }
    };
  }
}