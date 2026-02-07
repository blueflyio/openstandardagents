/**
 * Message for async agent execution
 *
 * This message is dispatched to execute an OSSA agent asynchronously.
 * It contains all necessary context for agent execution including input,
 * user context, and execution options.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface AgentExecutionMessageData {
  /**
   * Unique identifier for the agent to execute
   * Can be agent name, DID, or manifest path
   */
  agentId: string;

  /**
   * Input data to pass to the agent
   */
  input: Record<string, unknown>;

  /**
   * Execution context (environment, permissions, etc.)
   */
  context: {
    /**
     * User ID who initiated the execution
     */
    userId?: string;

    /**
     * Session ID for tracking
     */
    sessionId?: string;

    /**
     * Request ID for tracing
     */
    requestId?: string;

    /**
     * Additional metadata
     */
    metadata?: Record<string, unknown>;

    /**
     * Execution timeout in milliseconds
     */
    timeout?: number;

    /**
     * Priority level (1-10, higher = more urgent)
     */
    priority?: number;
  };

  /**
   * Optional callback URL for async notification
   */
  callbackUrl?: string;

  /**
   * Timestamp when message was created
   */
  timestamp: string;
}

export class AgentExecutionMessage {
  constructor(
    private readonly agentId: string,
    private readonly input: Record<string, unknown>,
    private readonly context: AgentExecutionMessageData['context'] = {},
    private readonly callbackUrl?: string,
  ) {}

  /**
   * Get the agent ID
   */
  public getAgentId(): string {
    return this.agentId;
  }

  /**
   * Get the input data
   */
  public getInput(): Record<string, unknown> {
    return this.input;
  }

  /**
   * Get the execution context
   */
  public getContext(): AgentExecutionMessageData['context'] {
    return this.context;
  }

  /**
   * Get the user ID from context
   */
  public getUserId(): string | undefined {
    return this.context.userId;
  }

  /**
   * Get the callback URL
   */
  public getCallbackUrl(): string | undefined {
    return this.callbackUrl;
  }

  /**
   * Get the priority level
   */
  public getPriority(): number {
    return this.context.priority ?? 5;
  }

  /**
   * Serialize to JSON
   */
  public toJSON(): AgentExecutionMessageData {
    return {
      agentId: this.agentId,
      input: this.input,
      context: this.context,
      callbackUrl: this.callbackUrl,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deserialize from JSON
   */
  public static fromJSON(data: AgentExecutionMessageData): AgentExecutionMessage {
    return new AgentExecutionMessage(
      data.agentId,
      data.input,
      data.context,
      data.callbackUrl,
    );
  }
}
