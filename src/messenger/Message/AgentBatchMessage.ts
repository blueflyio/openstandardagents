/**
 * Message for batch agent execution
 *
 * This message is dispatched to execute multiple agents in parallel or sequence.
 * It supports batch processing with optional ordering and dependency management.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface AgentBatchMessageData {
  /**
   * List of agent IDs to execute
   */
  agentIds: string[];

  /**
   * Input data for each agent (indexed by agent ID)
   * If not specified, same input will be used for all agents
   */
  inputs: Record<string, Record<string, unknown>>;

  /**
   * Batch execution options
   */
  options: {
    /**
     * Execution mode: parallel or sequential
     */
    mode: 'parallel' | 'sequential';

    /**
     * Maximum parallel executions (for parallel mode)
     */
    maxParallel?: number;

    /**
     * Stop on first error
     */
    stopOnError?: boolean;

    /**
     * Aggregate results
     */
    aggregateResults?: boolean;

    /**
     * Timeout for entire batch in milliseconds
     */
    batchTimeout?: number;
  };

  /**
   * Shared context for all agents
   */
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
  };

  /**
   * Optional callback URL for batch completion
   */
  callbackUrl?: string;

  /**
   * Timestamp when message was created
   */
  timestamp: string;
}

export class AgentBatchMessage {
  constructor(
    private readonly agentIds: string[],
    private readonly inputs: Record<string, Record<string, unknown>>,
    private readonly options: AgentBatchMessageData['options'] = { mode: 'parallel' },
    private readonly context: AgentBatchMessageData['context'] = {},
    private readonly callbackUrl?: string,
  ) {
    if (agentIds.length === 0) {
      throw new Error('AgentBatchMessage requires at least one agent ID');
    }
  }

  /**
   * Get the agent IDs
   */
  public getAgentIds(): string[] {
    return this.agentIds;
  }

  /**
   * Get inputs for a specific agent
   */
  public getInputForAgent(agentId: string): Record<string, unknown> {
    return this.inputs[agentId] ?? this.inputs['*'] ?? {};
  }

  /**
   * Get all inputs
   */
  public getInputs(): Record<string, Record<string, unknown>> {
    return this.inputs;
  }

  /**
   * Get batch options
   */
  public getOptions(): AgentBatchMessageData['options'] {
    return this.options;
  }

  /**
   * Get execution context
   */
  public getContext(): AgentBatchMessageData['context'] {
    return this.context;
  }

  /**
   * Get callback URL
   */
  public getCallbackUrl(): string | undefined {
    return this.callbackUrl;
  }

  /**
   * Check if execution should be parallel
   */
  public isParallel(): boolean {
    return this.options.mode === 'parallel';
  }

  /**
   * Check if execution should stop on error
   */
  public shouldStopOnError(): boolean {
    return this.options.stopOnError ?? false;
  }

  /**
   * Get number of agents in batch
   */
  public getCount(): number {
    return this.agentIds.length;
  }

  /**
   * Serialize to JSON
   */
  public toJSON(): AgentBatchMessageData {
    return {
      agentIds: this.agentIds,
      inputs: this.inputs,
      options: this.options,
      context: this.context,
      callbackUrl: this.callbackUrl,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deserialize from JSON
   */
  public static fromJSON(data: AgentBatchMessageData): AgentBatchMessage {
    return new AgentBatchMessage(
      data.agentIds,
      data.inputs,
      data.options,
      data.context,
      data.callbackUrl,
    );
  }
}
