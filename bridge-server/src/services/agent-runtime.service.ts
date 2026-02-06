import { tracingService } from './tracing.service.js';
import { BridgeError, BridgeErrorCode, AgentMetadata } from '../types/index.js';

/**
 * Agent Runtime Service
 *
 * Manages OSSA agent execution lifecycle.
 * Delegates to agent-protocol for actual MCP operations.
 *
 * Separation of Duties:
 * - This service: HTTP bridge, validation, caching, timeouts
 * - agent-protocol: MCP server management, agent execution
 */
export class AgentRuntimeService {
  private registryPath: string;
  private cache: Map<string, { result: unknown; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache

  constructor() {
    this.registryPath = process.env.OSSA_REGISTRY_PATH || './agents';
  }

  /**
   * Execute an agent with the given input
   *
   * @param agentId - Agent identifier
   * @param input - Input data for agent
   * @param context - Additional context (user, session, etc.)
   * @param timeout - Execution timeout in ms
   */
  async executeAgent(
    agentId: string,
    input: Record<string, unknown>,
    context: Record<string, unknown>,
    timeout: number
  ): Promise<unknown> {
    const span = tracingService.startAgentExecutionSpan(agentId, input);
    const startTime = Date.now();

    try {
      // Check cache
      const cached = this.getFromCache(agentId, input);
      if (cached) {
        console.log(`Cache hit for agent ${agentId}`);
        const executionTime = Date.now() - startTime;
        tracingService.recordAgentResult(span, cached, executionTime);
        tracingService.endSpan(span);
        return cached;
      }

      // Execute agent via agent-protocol
      // NOTE: This is a placeholder. In production, this would call
      // the agent-protocol service via HTTP or direct import.
      const result = await this.executeAgentViaProtocol(agentId, input, context, timeout);

      // Cache result
      this.setInCache(agentId, input, result);

      const executionTime = Date.now() - startTime;
      tracingService.recordAgentResult(span, result, executionTime);
      tracingService.endSpan(span);

      return result;
    } catch (error) {
      tracingService.recordError(span, error as Error);
      tracingService.endSpan(span);

      if (error instanceof BridgeError) {
        throw error;
      }

      throw new BridgeError(
        BridgeErrorCode.AGENT_EXECUTION_FAILED,
        `Agent execution failed: ${(error as Error).message}`,
        { agentId, error }
      );
    }
  }

  /**
   * Execute agent via agent-protocol service
   *
   * This method delegates to agent-protocol for actual MCP operations.
   * Implementation depends on agent-protocol's API.
   */
  private async executeAgentViaProtocol(
    agentId: string,
    input: Record<string, unknown>,
    context: Record<string, unknown>,
    timeout: number
  ): Promise<unknown> {
    // PLACEHOLDER IMPLEMENTATION
    // In production, this would:
    // 1. Call agent-protocol HTTP API
    // 2. Or import and use agent-protocol SDK
    // 3. Handle MCP server lifecycle
    // 4. Execute agent and return result

    // For now, simulate agent execution
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new BridgeError(BridgeErrorCode.TIMEOUT, 'Agent execution timeout'));
      }, timeout);

      // Simulate async work
      setTimeout(() => {
        clearTimeout(timer);
        resolve({
          status: 'success',
          data: {
            agentId,
            input,
            context,
            message: 'Placeholder result - implement agent-protocol integration',
          },
        });
      }, 100);
    });
  }

  /**
   * List all available agents
   */
  async listAgents(): Promise<AgentMetadata[]> {
    // PLACEHOLDER IMPLEMENTATION
    // In production, this would query agent-protocol for available agents
    return [
      {
        agentId: 'example-agent',
        name: 'Example Agent',
        description: 'Placeholder agent',
        version: '0.1.0',
        capabilities: ['placeholder'],
      },
    ];
  }

  /**
   * Get agent metadata
   */
  async getAgent(agentId: string): Promise<AgentMetadata> {
    // PLACEHOLDER IMPLEMENTATION
    // In production, this would query agent-protocol for agent details
    const agents = await this.listAgents();
    const agent = agents.find((a) => a.agentId === agentId);

    if (!agent) {
      throw new BridgeError(
        BridgeErrorCode.AGENT_NOT_FOUND,
        `Agent not found: ${agentId}`
      );
    }

    return agent;
  }

  /**
   * Generate cache key from agent ID and input
   */
  private getCacheKey(agentId: string, input: Record<string, unknown>): string {
    return `${agentId}:${JSON.stringify(input)}`;
  }

  /**
   * Get result from cache if valid
   */
  private getFromCache(agentId: string, input: Record<string, unknown>): unknown | null {
    const key = this.getCacheKey(agentId, input);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * Store result in cache
   */
  private setInCache(agentId: string, input: Record<string, unknown>, result: unknown): void {
    const key = this.getCacheKey(agentId, input);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // Cleanup old cache entries (simple LRU)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const agentRuntimeService = new AgentRuntimeService();
