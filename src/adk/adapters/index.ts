/**
 * ADK Adapters for OSSA Framework
 * Bridges OSSA components with ADK patterns
 */

import { AgentManifest } from '../../types/index.js';
import { ADKAgent, OSSAToADKMapper } from '../agents/index.js';
import { OSSALlmAgent } from '../agents/llm-agent.js';
import { OSSAWorkflowAgent } from '../agents/workflow-agent.js';
import { OSSACustomAgent } from '../agents/custom-agent.js';
import { sessionManager, ADKSession } from '../state/index.js';
import { toolRegistry } from '../tools/index.js';
import { orchestrationEngine, OrchestrationPattern } from '../orchestration/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

/**
 * Main ADK Adapter for OSSA
 */
export class OSSAADKAdapter {
  private agents: Map<string, ADKAgent> = new Map();
  private sessions: Map<string, ADKSession> = new Map();

  /**
   * Load OSSA agent and convert to ADK
   */
  async loadAgent(agentPath: string): Promise<ADKAgent> {
    // Read OSSA manifest
    const manifestPath = path.join(agentPath, 'agent.yml');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = yaml.parse(manifestContent) as AgentManifest;
    
    // Convert to ADK agent
    const adkConfig = OSSAToADKMapper.mapAgent(manifest);
    
    // Create appropriate agent instance
    let agent: ADKAgent;
    switch (adkConfig.type) {
      case 'LlmAgent':
        agent = new OSSALlmAgent(adkConfig.config, adkConfig.ossaType);
        break;
      
      case 'WorkflowAgent':
        agent = new OSSAWorkflowAgent(
          { ...adkConfig.config, workflow_type: 'sequential' },
          adkConfig.ossaType
        );
        break;
      
      case 'CustomAgent':
        agent = new OSSACustomAgent(
          { ...adkConfig.config, custom_type: adkConfig.ossaType || 'generic' },
          adkConfig.ossaType
        );
        break;
      
      default:
        agent = new OSSACustomAgent(
          { ...adkConfig.config, custom_type: 'generic' },
          adkConfig.ossaType
        );
    }
    
    // Register agent
    this.agents.set(manifest.metadata.name, agent);
    
    // Register tools for agent capabilities
    if (manifest.spec.capabilities) {
      const tools = toolRegistry.getToolsForCapabilities(manifest.spec.capabilities);
      // TODO: Attach tools to agent
    }
    
    // Register agent as tool for orchestration
    if (manifest.spec.type === 'worker' || manifest.spec.type === 'critic') {
      toolRegistry.registerAgentTool(agent, 'explicit');
    }
    
    return agent;
  }

  /**
   * Load all agents from .agents directory
   */
  async loadAllAgents(baseDir: string = '.agents'): Promise<void> {
    if (!fs.existsSync(baseDir)) {
      console.warn(`Agents directory not found: ${baseDir}`);
      return;
    }
    
    const agentDirs = fs.readdirSync(baseDir)
      .filter(dir => fs.statSync(path.join(baseDir, dir)).isDirectory());
    
    for (const agentDir of agentDirs) {
      try {
        await this.loadAgent(path.join(baseDir, agentDir));
        console.log(`Loaded ADK agent: ${agentDir}`);
      } catch (error) {
        console.error(`Failed to load agent ${agentDir}:`, error);
      }
    }
  }

  /**
   * Execute an agent with ADK patterns
   */
  async executeAgent(
    agentName: string,
    input: any,
    sessionId?: string
  ): Promise<any> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    
    // Get or create session
    let session: ADKSession;
    if (sessionId && this.sessions.has(sessionId)) {
      session = this.sessions.get(sessionId)!;
    } else {
      session = sessionManager.createSession(sessionId);
      this.sessions.set(session.id, session);
    }
    
    // Execute agent based on type
    if (agent instanceof OSSALlmAgent) {
      return agent.invoke(input, session);
    } else if (agent instanceof OSSAWorkflowAgent) {
      return agent.invoke(input, session);
    } else if (agent instanceof OSSACustomAgent) {
      return agent.invoke(input, session);
    } else {
      throw new Error(`Unknown agent type for: ${agentName}`);
    }
  }

  /**
   * Execute orchestration pattern
   */
  async executeOrchestration(
    pattern: OrchestrationPattern,
    agentNames: string[],
    input?: any,
    options?: any
  ): Promise<any> {
    // Get agents
    const agents: ADKAgent[] = [];
    for (const name of agentNames) {
      const agent = this.agents.get(name);
      if (!agent) {
        throw new Error(`Agent not found: ${name}`);
      }
      agents.push(agent);
    }
    
    // Create session for orchestration
    const session = sessionManager.createSession();
    this.sessions.set(session.id, session);
    
    // Execute orchestration
    return orchestrationEngine.execute({
      pattern,
      agents,
      session,
      options: { ...options, initialInput: input }
    });
  }

  /**
   * Get agent information
   */
  getAgentInfo(agentName: string): any {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return null;
    }
    
    return {
      name: agent.config.name,
      type: agent.type,
      ossaType: agent.ossaType,
      description: agent.config.description,
      output_key: agent.config.output_key
    };
  }

  /**
   * List all loaded agents
   */
  listAgents(): any[] {
    const agentList: any[] = [];
    
    for (const [name, agent] of this.agents) {
      agentList.push({
        name,
        type: agent.type,
        ossaType: agent.ossaType,
        description: agent.config.description
      });
    }
    
    return agentList;
  }

  /**
   * Get session state
   */
  getSessionState(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    return sessionManager.exportSession(sessionId);
  }

  /**
   * Clean up old sessions
   */
  cleanupSessions(olderThanMinutes: number = 60): number {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    return sessionManager.cleanupSessions(cutoff);
  }
}

/**
 * MCP-ADK Bridge
 * Allows MCP servers to use ADK agents
 */
export class MCPADKBridge {
  private adapter: OSSAADKAdapter;

  constructor(adapter: OSSAADKAdapter) {
    this.adapter = adapter;
  }

  /**
   * Create MCP tool from ADK agent
   */
  createMCPTool(agentName: string): any {
    const agentInfo = this.adapter.getAgentInfo(agentName);
    if (!agentInfo) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    
    return {
      name: `adk_agent_${agentName}`,
      description: agentInfo.description || `Execute ADK agent: ${agentName}`,
      inputSchema: {
        type: 'object',
        properties: {
          input: {
            type: 'object',
            description: 'Input data for the agent'
          },
          sessionId: {
            type: 'string',
            description: 'Optional session ID for state persistence'
          }
        },
        required: ['input']
      },
      handler: async (args: any) => {
        return this.adapter.executeAgent(agentName, args.input, args.sessionId);
      }
    };
  }

  /**
   * Create MCP orchestration tool
   */
  createMCPOrchestrationTool(pattern: OrchestrationPattern): any {
    return {
      name: `adk_orchestrate_${pattern}`,
      description: `Execute ADK ${pattern} orchestration pattern`,
      inputSchema: {
        type: 'object',
        properties: {
          agents: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of agent names to orchestrate'
          },
          input: {
            type: 'object',
            description: 'Input data for the orchestration'
          },
          options: {
            type: 'object',
            description: 'Orchestration options'
          }
        },
        required: ['agents']
      },
      handler: async (args: any) => {
        return this.adapter.executeOrchestration(
          pattern,
          args.agents,
          args.input,
          args.options
        );
      }
    };
  }
}

// Export singleton instances
export const adkAdapter = new OSSAADKAdapter();
export const mcpBridge = new MCPADKBridge(adkAdapter);