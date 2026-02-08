/**
 * Message handler for agent execution
 *
 * This handler processes AgentExecutionMessage messages and executes
 * OSSA agents asynchronously. It integrates with the agent runtime,
 * handles errors, stores results, and triggers events.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

import type { AgentExecutionMessage } from '../Message/AgentExecutionMessage.js';
import type { OssaAgent } from '../../types/index.js';

export interface AgentExecutionResult {
  success: boolean;
  output?: unknown;
  error?: {
    message: string;
    code: string;
    stack?: string;
  };
  metadata: {
    agentId: string;
    startTime: string;
    endTime: string;
    duration: number;
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
  };
}

export interface AgentExecutionHandlerDependencies {
  /**
   * Agent runtime for executing OSSA agents
   */
  agentRuntime: {
    loadAgent(agentId: string): Promise<OssaAgent>;
    executeAgent(agent: OssaAgent, input: Record<string, unknown>): Promise<unknown>;
  };

  /**
   * Result storage for persisting execution results
   */
  resultStorage: {
    store(messageId: string, result: AgentExecutionResult): Promise<void>;
  };

  /**
   * Event dispatcher for triggering events
   */
  eventDispatcher: {
    dispatch(eventName: string, data: unknown): Promise<void>;
  };

  /**
   * Logger for execution tracking
   */
  logger: {
    info(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    debug(message: string, context?: Record<string, unknown>): void;
  };

  /**
   * Optional callback handler for async notifications
   */
  callbackHandler?: {
    notify(url: string, result: AgentExecutionResult): Promise<void>;
  };
}

export class AgentExecutionHandler {
  constructor(private readonly deps: AgentExecutionHandlerDependencies) {}

  /**
   * Handle agent execution message
   */
  public async handle(message: AgentExecutionMessage): Promise<void> {
    const startTime = new Date().toISOString();
    const agentId = message.getAgentId();
    const input = message.getInput();
    const context = message.getContext();

    this.deps.logger.info('Starting agent execution', {
      agentId,
      userId: context.userId,
      sessionId: context.sessionId,
      requestId: context.requestId,
    });

    try {
      // Load agent manifest
      const agent = await this.deps.agentRuntime.loadAgent(agentId);

      this.deps.logger.debug('Agent loaded successfully', {
        agentId,
        agentName: agent.metadata?.name,
      });

      // Execute agent
      const output = await this.deps.agentRuntime.executeAgent(agent, input);

      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      // Build success result
      const result: AgentExecutionResult = {
        success: true,
        output,
        metadata: {
          agentId,
          startTime,
          endTime,
          duration,
        },
      };

      // Store result
      await this.deps.resultStorage.store(context.requestId ?? agentId, result);

      // Dispatch success event
      await this.deps.eventDispatcher.dispatch('agent.execution.success', {
        agentId,
        result,
        context,
      });

      // Send callback if specified
      const callbackUrl = message.getCallbackUrl();
      if (callbackUrl && this.deps.callbackHandler) {
        await this.deps.callbackHandler.notify(callbackUrl, result);
      }

      this.deps.logger.info('Agent execution completed successfully', {
        agentId,
        duration,
        hasOutput: !!output,
      });
    } catch (error) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      const errorResult: AgentExecutionResult = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_FAILED',
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          agentId,
          startTime,
          endTime,
          duration,
        },
      };

      // Store error result
      try {
        await this.deps.resultStorage.store(context.requestId ?? agentId, errorResult);
      } catch (storageError) {
        this.deps.logger.error('Failed to store error result', storageError as Error, {
          agentId,
        });
      }

      // Dispatch failure event
      try {
        await this.deps.eventDispatcher.dispatch('agent.execution.failure', {
          agentId,
          error: errorResult.error,
          context,
        });
      } catch (eventError) {
        this.deps.logger.error('Failed to dispatch failure event', eventError as Error, {
          agentId,
        });
      }

      // Send callback with error if specified
      const callbackUrl = message.getCallbackUrl();
      if (callbackUrl && this.deps.callbackHandler) {
        try {
          await this.deps.callbackHandler.notify(callbackUrl || '', errorResult);
        } catch (callbackError) {
          this.deps.logger.error('Failed to send error callback', callbackError as Error, {
            agentId,
          });
        }
      }

      this.deps.logger.error('Agent execution failed', error as Error, {
        agentId,
        duration,
      });

      // Re-throw to mark message as failed (will trigger retry)
      throw error;
    }
  }
}
