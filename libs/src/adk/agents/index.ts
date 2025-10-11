/**
 * ADK Agent Type Mappings for OSSA
 * Converts OSSA agent types to ADK categories
 */

import { AgentManifest } from '../../types/index.js';

export interface ADKAgentConfig {
  name: string;
  description?: string;
  model?: string;
  instruction: string;
  tools?: any[];
  output_key?: string;
  sub_agents?: ADKAgent[];
}

export interface ADKAgent {
  type: 'LlmAgent' | 'WorkflowAgent' | 'CustomAgent';
  config: ADKAgentConfig;
  ossaType?: string;
}

/**
 * Maps OSSA agent types to ADK categories
 */
export class OSSAToADKMapper {
  /**
   * Convert OSSA agent manifest to ADK agent
   */
  static mapAgent(manifest: AgentManifest): ADKAgent {
    const ossaType = manifest.spec.type;

    switch (ossaType) {
      case 'worker':
        return this.createLlmAgent(manifest);

      case 'orchestrator':
        return this.createWorkflowAgent(manifest);

      case 'critic':
      case 'monitor':
        return this.createLlmAgent(manifest);

      case 'governor':
        return this.createCustomAgent(manifest);

      default:
        return this.createCustomAgent(manifest);
    }
  }

  /**
   * Create ADK LlmAgent from OSSA manifest
   */
  private static createLlmAgent(manifest: AgentManifest): ADKAgent {
    return {
      type: 'LlmAgent',
      ossaType: manifest.spec.type,
      config: {
        name: manifest.metadata.name,
        description: manifest.metadata.description,
        model: manifest.spec.configuration?.model || 'gemini-2.0-flash',
        instruction: this.generateInstruction(manifest),
        tools: this.mapTools(manifest),
        output_key: `${manifest.metadata.name}_output`
      }
    };
  }

  /**
   * Create ADK WorkflowAgent from OSSA manifest
   */
  private static createWorkflowAgent(manifest: AgentManifest): ADKAgent {
    return {
      type: 'WorkflowAgent',
      ossaType: manifest.spec.type,
      config: {
        name: manifest.metadata.name,
        description: manifest.metadata.description,
        instruction: this.generateWorkflowInstruction(manifest),
        sub_agents: this.mapSubAgents(manifest),
        output_key: `${manifest.metadata.name}_result`
      }
    };
  }

  /**
   * Create ADK CustomAgent from OSSA manifest
   */
  private static createCustomAgent(manifest: AgentManifest): ADKAgent {
    return {
      type: 'CustomAgent',
      ossaType: manifest.spec.type,
      config: {
        name: manifest.metadata.name,
        description: manifest.metadata.description,
        instruction: this.generateCustomInstruction(manifest),
        tools: this.mapTools(manifest)
      }
    };
  }

  /**
   * Generate instruction from OSSA capabilities
   */
  private static generateInstruction(manifest: AgentManifest): string {
    const capabilities = manifest.spec.capabilities || [];
    const description = manifest.metadata.description || '';

    return `${description}

Capabilities: ${capabilities.join(', ')}

Execute tasks related to your capabilities and return structured results.`;
  }

  /**
   * Generate workflow instruction
   */
  private static generateWorkflowInstruction(manifest: AgentManifest): string {
    return `Orchestrate workflow for ${manifest.metadata.name}.
    
Coordinate sub-agents to achieve the desired outcome.
Ensure proper sequencing and state management.`;
  }

  /**
   * Generate custom instruction
   */
  private static generateCustomInstruction(manifest: AgentManifest): string {
    return `Custom agent: ${manifest.metadata.name}.
    
${manifest.metadata.description || ''}

Specialized functionality as per OSSA specification.`;
  }

  /**
   * Map OSSA tools to ADK tools
   */
  private static mapTools(manifest: AgentManifest): any[] {
    // TODO: Implement tool mapping based on capabilities
    return [];
  }

  /**
   * Map sub-agents for orchestrators
   */
  private static mapSubAgents(manifest: AgentManifest): ADKAgent[] {
    // TODO: Implement sub-agent mapping from dependencies
    return [];
  }
}

export * from './llm-agent.js';
export * from './workflow-agent.js';
export * from './custom-agent.js';
