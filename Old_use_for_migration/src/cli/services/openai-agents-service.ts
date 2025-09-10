import { Agent, run, Handoff } from '@openai/agents';
import { z } from 'zod';

export interface OSSAAgentConfig {
  name: string;
  instructions: string;
  model?: string;
  tools?: any[];
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResult {
  finalOutput: string;
  handoff?: Handoff;
  steps?: any[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class OSSAAgentService {
  private agents: Map<string, Agent> = new Map();
  private agentConfigs: Map<string, OSSAAgentConfig> = new Map();

  /**
   * Create and register an agent
   */
  async createAgent(config: OSSAAgentConfig): Promise<string> {
    const agentId = `agent-${config.name}-${Date.now()}`;
    
    const agent = new Agent({
      name: config.name,
      instructions: config.instructions,
      model: config.model || 'gpt-4o',
      tools: config.tools || []
    });

    this.agents.set(agentId, agent);
    this.agentConfigs.set(agentId, config);

    return agentId;
  }

  /**
   * Run an agent with a message
   */
  async runAgent(agentId: string, message: string): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const result = await run(agent, message);
    
    return {
      finalOutput: result.finalOutput || 'No output',
      handoff: undefined,
      steps: [],
      usage: undefined
    };
  }

  /**
   * Handle handoff between agents
   */
  async handoffToAgent(fromAgentId: string, toAgentId: string, context: string): Promise<AgentResult> {
    const toAgent = this.agents.get(toAgentId);
    if (!toAgent) {
      throw new Error(`Target agent ${toAgentId} not found`);
    }

    const handoffMessage = `Handoff from ${fromAgentId}: ${context}`;
    return this.runAgent(toAgentId, handoffMessage);
  }

  /**
   * Orchestrate multiple agents in sequence
   */
  async orchestrateSequential(agentIds: string[], initialMessage: string): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    let currentMessage = initialMessage;

    for (const agentId of agentIds) {
      const result = await this.runAgent(agentId, currentMessage);
      results.push(result);
      
      // Use output as input for next agent
      currentMessage = `Previous output: ${result.finalOutput}\n\nPlease continue processing.`;
    }

    return results;
  }

  /**
   * Orchestrate multiple agents in parallel
   */
  async orchestrateParallel(agentIds: string[], message: string): Promise<AgentResult[]> {
    const promises = agentIds.map(agentId => this.runAgent(agentId, message));
    return Promise.all(promises);
  }

  /**
   * Create a specialized agent with predefined tools
   */
  async createCodeAgent(name: string, instructions?: string): Promise<string> {
    const codeTools = [
      {
        type: 'function',
        function: {
          name: 'execute_code',
          description: 'Execute code in a sandboxed environment',
          parameters: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The code to execute'
              },
              language: {
                type: 'string',
                enum: ['python', 'javascript', 'typescript', 'bash'],
                description: 'Programming language'
              }
            },
            required: ['code', 'language']
          }
        }
      }
    ];

    return this.createAgent({
      name,
      instructions: instructions || 'You are a code execution assistant. Help users run and debug code.',
      model: 'gpt-4o',
      tools: codeTools
    });
  }

  /**
   * Create a research agent with web search capabilities
   */
  async createResearchAgent(name: string, instructions?: string): Promise<string> {
    const searchTools = [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for information',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              max_results: {
                type: 'number',
                description: 'Maximum number of results',
                default: 5
              }
            },
            required: ['query']
          }
        }
      }
    ];

    return this.createAgent({
      name,
      instructions: instructions || 'You are a research assistant. Help users find and analyze information.',
      model: 'gpt-4o-mini',
      tools: searchTools
    });
  }

  /**
   * Create an RFP processing pipeline with specialized agents
   */
  async createRFPPipeline(): Promise<{ [key: string]: string }> {
    const agents = {
      extractor: await this.createAgent({
        name: 'RFP Extractor',
        instructions: 'Extract key requirements, deadlines, and criteria from RFP documents.',
        model: 'gpt-4o'
      }),
      analyzer: await this.createAgent({
        name: 'Compliance Analyzer',
        instructions: 'Analyze RFP requirements for compliance and feasibility.',
        model: 'gpt-4o'
      }),
      writer: await this.createAgent({
        name: 'Proposal Writer',
        instructions: 'Generate compelling proposal responses based on analyzed requirements.',
        model: 'gpt-4o'
      }),
      reviewer: await this.createAgent({
        name: 'Quality Reviewer',
        instructions: 'Review proposals for quality, completeness, and compliance.',
        model: 'gpt-4o-mini'
      })
    };

    return agents;
  }

  /**
   * Process RFP with the specialized pipeline
   */
  async processRFP(rfpContent: string): Promise<{
    extraction: AgentResult;
    analysis: AgentResult;
    proposal: AgentResult;
    review: AgentResult;
  }> {
    const pipeline = await this.createRFPPipeline();

    const extraction = await this.runAgent(pipeline.extractor, rfpContent);
    const analysis = await this.runAgent(pipeline.analyzer, extraction.finalOutput);
    const proposal = await this.runAgent(pipeline.writer, analysis.finalOutput);
    const review = await this.runAgent(pipeline.reviewer, proposal.finalOutput);

    return {
      extraction,
      analysis,
      proposal,
      review
    };
  }

  /**
   * Get agent information
   */
  getAgentInfo(agentId: string): OSSAAgentConfig | undefined {
    return this.agentConfigs.get(agentId);
  }

  /**
   * List all agents
   */
  listAgents(): Array<{ id: string; config: OSSAAgentConfig }> {
    const agents: Array<{ id: string; config: OSSAAgentConfig }> = [];
    
    for (const [id, config] of this.agentConfigs.entries()) {
      agents.push({ id, config });
    }
    
    return agents;
  }

  /**
   * Remove an agent
   */
  removeAgent(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    this.agentConfigs.delete(agentId);
    return removed;
  }
}

// Create singleton instance
export const ossaAgentService = new OSSAAgentService();