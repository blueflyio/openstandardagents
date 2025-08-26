/**
 * OAAS Universal Translator Service
 * Runtime translation for any agent format to OAAS without file modification
 */

import { DiscoveryEngine } from './discovery/DiscoveryEngine.js';
import { UniversalTranslator } from './translators/UniversalTranslator.js';
import { RuntimeBridge } from './bridges/RuntimeBridge.js';
import { AgentRegistry } from './registry/AgentRegistry.js';
import { OAASValidator } from './validators/OAASValidator.js';

// Import all translators
import { DrupalTranslator } from './translators/DrupalTranslator.js';
import { EnhancedDrupalTranslator } from './translators/EnhancedDrupalTranslator.js';
import { MCPTranslator } from './translators/MCPTranslator.js';
import { LangChainTranslator } from './translators/LangChainTranslator.js';
import { CrewAITranslator } from './translators/CrewAITranslator.js';

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
  format: string;
  source_path: string;
  capabilities: AgentCapability[];
  oaas_spec?: any; // Translated OAAS specification
  last_discovered: Date;
}

export class OAASService {
  private discovery: DiscoveryEngine;
  private translator: UniversalTranslator;
  private enhancedDrupalTranslator: EnhancedDrupalTranslator;
  private bridge: RuntimeBridge;
  private registry: AgentRegistry;
  private validator: OAASValidator;
  
  constructor(private config: OAASServiceConfig) {
    this.discovery = new DiscoveryEngine(config);
    this.translator = new UniversalTranslator(config);
    this.enhancedDrupalTranslator = new EnhancedDrupalTranslator();
    this.bridge = new RuntimeBridge(config);
    this.registry = new AgentRegistry(config);
    this.validator = new OAASValidator(config);
  }

  /**
   * Discover ALL agents regardless of format
   * NO FILE MODIFICATION - purely read-only operation
   */
  async discoverAgents(): Promise<DiscoveredAgent[]> {
    console.log('🔍 Discovering agents across all formats...');
    
    // Discover agents in all supported formats
    const agents = await this.discovery.discoverAll();
    
    // Translate each agent to OAAS format in memory (no file changes)
    const translatedAgents = await Promise.all(
      agents.map(async (agent) => {
        const oaasSpec = await this.translator.translateToOAAS(agent);
        return {
          ...agent,
          oaas_spec: oaasSpec,
          last_discovered: new Date()
        };
      })
    );

    // Cache in registry for performance
    await this.registry.updateAgents(translatedAgents);
    
    console.log(`✅ Discovered ${translatedAgents.length} agents`);
    return translatedAgents;
  }

  /**
   * Discover Drupal AI agent modules specifically
   * Uses enhanced Drupal translator for comprehensive analysis
   */
  async discoverDrupalAgents(): Promise<any[]> {
    console.log('🔍 Discovering Drupal AI agent ecosystem...');
    
    const modules = await this.enhancedDrupalTranslator.discoverAllDrupalAgents(this.config.projectRoot);
    const oaasAgents: any[] = [];

    for (const module of modules) {
      const moduleOaasSpecs = await this.enhancedDrupalTranslator.translateModuleToOAAS(module);
      oaasAgents.push(...moduleOaasSpecs);
    }

    console.log(`✅ Discovered ${modules.length} Drupal modules with ${oaasAgents.length} total agents`);
    return oaasAgents;
  }

  /**
   * Execute any agent capability regardless of original format
   * Runtime bridging handles format conversion
   */
  async executeCapability(
    agentId: string, 
    capabilityName: string, 
    input: any
  ): Promise<any> {
    console.log(`🚀 Executing ${agentId}.${capabilityName}...`);
    
    const agent = await this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const capability = agent.capabilities.find(c => c.name === capabilityName);
    if (!capability) {
      throw new Error(`Capability ${capabilityName} not found on agent ${agentId}`);
    }

    // Runtime bridge handles execution in original format
    return await this.bridge.executeCapability(agent, capability, input);
  }

  /**
   * Get agent in specific framework format (LangChain, CrewAI, etc.)
   * Translation happens in memory, no files changed
   */
  async getAgentForFramework(
    agentId: string, 
    framework: 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'mcp'
  ): Promise<any> {
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

// Export all components for advanced usage
export {
  DiscoveryEngine,
  UniversalTranslator,
  RuntimeBridge,
  AgentRegistry,
  OAASValidator,
  DrupalTranslator,
  EnhancedDrupalTranslator,
  MCPTranslator,
  LangChainTranslator,
  CrewAITranslator
};

// Export types
export type {
  OAASServiceConfig,
  AgentCapability,
  DiscoveredAgent
};