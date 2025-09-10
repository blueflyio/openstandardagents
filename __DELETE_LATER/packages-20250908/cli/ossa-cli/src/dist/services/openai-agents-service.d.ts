import { Handoff } from '@openai/agents';
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
export declare class OSSAAgentService {
    private agents;
    private agentConfigs;
    /**
     * Create and register an agent
     */
    createAgent(config: OSSAAgentConfig): Promise<string>;
    /**
     * Run an agent with a message
     */
    runAgent(agentId: string, message: string): Promise<AgentResult>;
    /**
     * Handle handoff between agents
     */
    handoffToAgent(fromAgentId: string, toAgentId: string, context: string): Promise<AgentResult>;
    /**
     * Orchestrate multiple agents in sequence
     */
    orchestrateSequential(agentIds: string[], initialMessage: string): Promise<AgentResult[]>;
    /**
     * Orchestrate multiple agents in parallel
     */
    orchestrateParallel(agentIds: string[], message: string): Promise<AgentResult[]>;
    /**
     * Create a specialized agent with predefined tools
     */
    createCodeAgent(name: string, instructions?: string): Promise<string>;
    /**
     * Create a research agent with web search capabilities
     */
    createResearchAgent(name: string, instructions?: string): Promise<string>;
    /**
     * Create an RFP processing pipeline with specialized agents
     */
    createRFPPipeline(): Promise<{
        [key: string]: string;
    }>;
    /**
     * Process RFP with the specialized pipeline
     */
    processRFP(rfpContent: string): Promise<{
        extraction: AgentResult;
        analysis: AgentResult;
        proposal: AgentResult;
        review: AgentResult;
    }>;
    /**
     * Get agent information
     */
    getAgentInfo(agentId: string): OSSAAgentConfig | undefined;
    /**
     * List all agents
     */
    listAgents(): Array<{
        id: string;
        config: OSSAAgentConfig;
    }>;
    /**
     * Remove an agent
     */
    removeAgent(agentId: string): boolean;
}
export declare const ossaAgentService: OSSAAgentService;
