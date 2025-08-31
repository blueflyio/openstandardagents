/**
 * Workspace Orchestrator
 * Main orchestration engine for coordinating multiple AI agents
 */

import { AgentSelectionResult, AgentSelector, DiscoveredAgent } from './services/agentSelector';
import { QuestionAnalysis, QuestionAnalyzer } from './services/questionAnalyzer';
import { AgentResponse, ResponseSynthesis, SynthesisResult } from './services/responseSynthesis';

export interface OrchestrationRequest {
    question: string;
    context?: {
        workspace_path?: string;
        user_id?: string;
        session_id?: string;
        preferences?: any;
    };
    options?: {
        max_agents?: number;
        timeout_ms?: number;
        synthesis_strategy?: string;
        include_metadata?: boolean;
    };
}

export interface OrchestrationResponse {
    orchestration_id: string;
    question: string;
    question_analysis: QuestionAnalysis;
    agent_selection: AgentSelectionResult;
    agent_responses: AgentResponse[];
    synthesis_result: SynthesisResult;
    execution_metadata: {
        total_time_ms: number;
        question_analysis_time_ms: number;
        agent_selection_time_ms: number;
        execution_time_ms: number;
        synthesis_time_ms: number;
    };
    status: 'completed' | 'failed' | 'partial';
    errors?: string[];
    timestamp: string;
}

export class WorkspaceOrchestrator {
    private questionAnalyzer: QuestionAnalyzer;
    private agentSelector: AgentSelector;
    private responseSynthesis: ResponseSynthesis;
    private discoveredAgents: DiscoveredAgent[] = [];

    constructor() {
        this.questionAnalyzer = new QuestionAnalyzer();
        this.agentSelector = new AgentSelector();
        this.responseSynthesis = new ResponseSynthesis();
    }

    async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
        const startTime = Date.now();
        const orchestrationId = this.generateOrchestrationId();

        try {
            // Step 1: Analyze the question
            const questionAnalysisStart = Date.now();
            const questionAnalysis = await this.questionAnalyzer.analyzeQuestion(request.question);
            const questionAnalysisTime = Date.now() - questionAnalysisStart;

            // Step 2: Select appropriate agents
            const agentSelectionStart = Date.now();
            const agentSelection = await this.agentSelector.selectAgents(
                questionAnalysis,
                this.discoveredAgents
            );
            const agentSelectionTime = Date.now() - agentSelectionStart;

            // Step 3: Execute agent capabilities
            const executionStart = Date.now();
            const agentResponses = await this.executeAgentCapabilities(
                agentSelection,
                request.question,
                request.options
            );
            const executionTime = Date.now() - executionStart;

            // Step 4: Synthesize responses
            const synthesisStart = Date.now();
            const synthesisStrategy = request.options?.synthesis_strategy || 'consensus';
            const synthesisResult = await this.responseSynthesis.synthesizeResponses(
                request.question,
                agentResponses,
                synthesisStrategy
            );
            const synthesisTime = Date.now() - synthesisStart;

            const totalTime = Date.now() - startTime;

            return {
                orchestration_id: orchestrationId,
                question: request.question,
                question_analysis: questionAnalysis,
                agent_selection: agentSelection,
                agent_responses: agentResponses,
                synthesis_result: synthesisResult,
                execution_metadata: {
                    total_time_ms: totalTime,
                    question_analysis_time_ms: questionAnalysisTime,
                    agent_selection_time_ms: agentSelectionTime,
                    execution_time_ms: executionTime,
                    synthesis_time_ms: synthesisTime
                },
                status: this.determineStatus(agentResponses, synthesisResult),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const totalTime = Date.now() - startTime;

            return {
                orchestration_id: orchestrationId,
                question: request.question,
                question_analysis: {} as QuestionAnalysis,
                agent_selection: {} as AgentSelectionResult,
                agent_responses: [],
                synthesis_result: {} as SynthesisResult,
                execution_metadata: {
                    total_time_ms: totalTime,
                    question_analysis_time_ms: 0,
                    agent_selection_time_ms: 0,
                    execution_time_ms: 0,
                    synthesis_time_ms: 0
                },
                status: 'failed',
                errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
                timestamp: new Date().toISOString()
            };
        }
    }

    private async executeAgentCapabilities(
        agentSelection: AgentSelectionResult,
        question: string,
        options?: OrchestrationRequest['options']
    ): Promise<AgentResponse[]> {
        const responses: AgentResponse[] = [];
        const timeout = options?.timeout_ms || 30000;
        const maxAgents = options?.max_agents || 5;

        // Execute primary agent
        if (agentSelection.primary_agent) {
            try {
                const response = await this.executeSingleAgent(
                    agentSelection.primary_agent,
                    question,
                    timeout
                );
                responses.push(response);
            } catch (error) {
                console.error(`Primary agent ${agentSelection.primary_agent.agent_id} failed:`, error);
            }
        }

        // Execute supporting agents (limited by maxAgents)
        const supportingAgents = agentSelection.supporting_agents.slice(0, maxAgents - 1);

        for (const agent of supportingAgents) {
            try {
                const response = await this.executeSingleAgent(agent, question, timeout);
                responses.push(response);
            } catch (error) {
                console.error(`Supporting agent ${agent.agent_id} failed:`, error);
            }
        }

        return responses;
    }

    private async executeSingleAgent(
        agent: any,
        question: string,
        timeout: number
    ): Promise<AgentResponse> {
        const startTime = Date.now();

        // Simulate agent execution - in real implementation, this would call actual agent APIs
        const mockResponse = await this.simulateAgentExecution(agent, question, timeout);

        const executionTime = Date.now() - startTime;

        return {
            agent_id: agent.agent_id,
            agent_name: agent.name,
            capability_used: agent.capabilities[0] || 'general',
            response: mockResponse,
            confidence: agent.overall_score,
            execution_time_ms: executionTime,
            timestamp: new Date().toISOString(),
            metadata: {
                selection_reasoning: agent.reasoning,
                performance_score: agent.performance_score
            }
        };
    }

    private async simulateAgentExecution(
        agent: any,
        question: string,
        timeout: number
    ): Promise<any> {
        // Simulate different response patterns based on agent type
        const agentId = agent.agent_id;

        if (agentId.includes('tddai')) {
            return `TDD Expert Response: For the question "${question}", I recommend following Test-Driven Development principles. Start with writing failing tests, then implement the minimal code to make them pass, and finally refactor. This approach ensures code quality and maintainability.`;
        } else if (agentId.includes('token')) {
            return `Token Optimization Response: To optimize tokens for "${question}", consider using context compression, result caching, and pattern recognition. These strategies can reduce token usage by 35-45% while maintaining response quality.`;
        } else if (agentId.includes('drupal')) {
            return `Drupal Expert Response: For Drupal-related questions like "${question}", I recommend using Drupal's core APIs, following coding standards, and leveraging the module system. Consider using dependency injection and configuration management for enterprise applications.`;
        } else if (agentId.includes('rfp')) {
            return `RFP Processing Response: For government RFP processing related to "${question}", ensure compliance with federal procurement standards, maintain detailed audit trails, and follow security requirements. Consider using automated compliance checking tools.`;
        } else {
            return `General Agent Response: I can help with "${question}". Based on my capabilities, I recommend analyzing the requirements, considering best practices, and implementing a solution that meets your specific needs.`;
        }
    }

    private determineStatus(
        agentResponses: AgentResponse[],
        synthesisResult: SynthesisResult
    ): OrchestrationResponse['status'] {
        if (agentResponses.length === 0) {
            return 'failed';
        } else if (agentResponses.length < 2 && synthesisResult.confidence < 0.6) {
            return 'partial';
        } else {
            return 'completed';
        }
    }

    private generateOrchestrationId(): string {
        return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public methods for managing discovered agents
    async discoverAgents(workspacePath: string): Promise<DiscoveredAgent[]> {
        // In a real implementation, this would scan the workspace for .agents directories
        // For now, we'll return mock agents
        this.discoveredAgents = [
            {
                id: 'tddai-expert',
                name: 'TDD Expert Agent',
                version: '1.0.0',
                format: 'oaas',
                source_path: 'examples/.agents/tddai-expert',
                capabilities: [
                    {
                        name: 'test_generation',
                        description: 'Generate comprehensive test suites',
                        frameworks: ['mcp', 'openai', 'langchain']
                    },
                    {
                        name: 'code_analysis',
                        description: 'Analyze code quality and patterns',
                        frameworks: ['mcp', 'openai']
                    }
                ],
                confidence: 0.95,
                last_discovered: new Date()
            },
            {
                id: 'token-optimizer',
                name: 'Token Optimizer Agent',
                version: '1.0.0',
                format: 'oaas',
                source_path: 'examples/.agents/token-optimizer',
                capabilities: [
                    {
                        name: 'llm_optimization',
                        description: 'Optimize token usage across LLM providers',
                        frameworks: ['mcp', 'openai', 'anthropic']
                    }
                ],
                confidence: 0.9,
                last_discovered: new Date()
            }
        ];

        return this.discoveredAgents;
    }

    getDiscoveredAgents(): DiscoveredAgent[] {
        return this.discoveredAgents;
    }

    updateAgentPerformance(agentId: string, performanceScore: number): void {
        this.agentSelector.updateAgentPerformance(agentId, performanceScore);
    }

    updateAgentAvailability(agentId: string, status: 'online' | 'offline' | 'busy'): void {
        this.agentSelector.updateAgentAvailability(agentId, status);
    }

    getOrchestrationStats(): any {
        return {
            total_agents: this.discoveredAgents.length,
            agent_stats: this.agentSelector.getAgentStats(),
            last_discovery: this.discoveredAgents.length > 0
                ? Math.max(...this.discoveredAgents.map(a => a.last_discovered.getTime()))
                : null
        };
    }
}
