/**
 * @openapi-ai-agents/oaas - Universal AI Agent Services
 * Runtime translation for any agent format to OAAS without file modification
 */

import { DiscoveryEngine } from './discovery/DiscoveryEngine.js';
import { UniversalTranslator } from './translators/UniversalTranslator.js';
import { RuntimeBridge } from './bridges/RuntimeBridge.js';
import { AgentRegistry } from './registry/AgentRegistry.js';
import { OAASValidator } from './validators/OAASValidator.js';

export interface OAASServiceConfig {
  projectRoot: string;
  runtimeTranslation?: boolean;
  cacheEnabled?: boolean;
  validationStrict?: boolean;
  discoveryPaths?: string[];
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  input_schema?: any;
  output_schema?: any;
  frameworks: string[];
  originalFormat: 'drupal' | 'mcp' | 'langchain' | 'crewai' | 'openai' | 'anthropic';
}

export interface DiscoveredAgent {
  id: string;
  name: string;
  version: string;
  format: 'drupal' | 'mcp' | 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'unknown';
  source_path: string;
  capabilities: AgentCapability[];
  metadata?: any;
  confidence: number;
  oaas_spec?: any;
  last_discovered: Date;
}

export class OAASService {
  private discovery: DiscoveryEngine;
  private translator: UniversalTranslator;
  private bridge: RuntimeBridge;
  private registry: AgentRegistry;
  private validator: OAASValidator;
  
  constructor(private config: OAASServiceConfig) {
    this.discovery = new DiscoveryEngine(config);
    this.translator = new UniversalTranslator(config);
    this.bridge = new RuntimeBridge(config);
    this.registry = new AgentRegistry(config);
    this.validator = new OAASValidator({ strict: config.validationStrict || false });
  }

  /**
   * Discover ALL agents regardless of format
   * NO FILE MODIFICATION - purely read-only operation
   */
  async discoverAgents(): Promise<DiscoveredAgent[]> {
    
    
    const agents = await this.discovery.discoverAll();
    const translatedAgents = await Promise.all(
      agents.map(async (agent) => {
        if (agent.format === 'unknown') {
          return {
            ...agent,
            version: '1.0.0',
            capabilities: [],
            oaas_spec: null,
            last_discovered: new Date()
          };
        }
        
        const translatableAgent = {
          ...agent,
          format: agent.format as 'drupal' | 'mcp' | 'langchain' | 'crewai' | 'openai' | 'anthropic',
          raw_data: agent.metadata
        };
        const oaasSpec = await this.translator.translateToOAAS(translatableAgent);
        return {
          ...agent,
          version: '1.0.0',
          capabilities: [],
          oaas_spec: oaasSpec,
          last_discovered: new Date()
        };
      })
    );

    const discoveredAgents: DiscoveredAgent[] = translatedAgents;
    await this.registry.updateAgents(discoveredAgents);
    
    
    return discoveredAgents;
  }

  /**
   * Execute any agent capability regardless of original format
   */
  async executeCapability(agentId: string, capabilityName: string, input: any): Promise<any> {
    
    
    const agent = await this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const capability = agent.capabilities.find(c => c.name === capabilityName);
    if (!capability) {
      throw new Error(`Capability ${capabilityName} not found on agent ${agentId}`);
    }

    return await this.bridge.executeCapability(agent, capability, input);
  }

  /**
   * Get agent in specific framework format
   */
  async getAgentForFramework(agentId: string, framework: 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'mcp'): Promise<any> {
    const agent = await this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return await this.bridge.translateForFramework(agent, framework);
  }

  /**
   * Validate OAAS compliance for discovered agents
   */
  async validateAgents(): Promise<any> {
    const agents = await this.registry.getAllAgents();
    return await this.validator.validateMultiple(agents);
  }

  /**
   * Get comprehensive agent registry
   */
  async getAgentRegistry(): Promise<DiscoveredAgent[]> {
    return await this.registry.getAllAgents();
  }
}

// Export all components
export {
  DiscoveryEngine,
  UniversalTranslator,
  RuntimeBridge,
  AgentRegistry,
  OAASValidator
};

// Export communication components
export { AgentCommunicationBridge } from './communication/AgentCommunicationBridge.js';
export { ProtocolAdapterFactory, MCPProtocolAdapter, LangChainProtocolAdapter, CrewAIProtocolAdapter, OpenAIProtocolAdapter, AnthropicProtocolAdapter } from './communication/ProtocolAdapters.js';
export { DirectMessagingSystem } from './messaging/DirectMessagingSystem.js';