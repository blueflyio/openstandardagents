/**
 * Message handler for batch agent execution
 *
 * This handler processes AgentBatchMessage messages and executes
 * multiple OSSA agents either in parallel or sequentially.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

import type { AgentBatchMessage } from '../Message/AgentBatchMessage.js';
import type { AgentExecutionResult } from './AgentExecutionHandler.js';
import type { OssaAgent } from '../../types/index.js';

export interface BatchExecutionResult {
  success: boolean;
  results: Record<string, AgentExecutionResult>;
  metadata: {
    totalAgents: number;
    successCount: number;
    failureCount: number;
    startTime: string;
    endTime: string;
    duration: number;
  };
}

export interface AgentBatchHandlerDependencies {
  /**
   * Agent runtime for executing OSSA agents
   */
  agentRuntime: {
    loadAgent(agentId: string): Promise<OssaAgent>;
    executeAgent(agent: OssaAgent, input: Record<string, unknown>): Promise<unknown>;
  };

  /**
   * Result storage for persisting batch results
   */
  resultStorage: {
    store(batchId: string, result: BatchExecutionResult): Promise<void>;
  };

  /**
   * Event dispatcher for triggering events
   */
  eventDispatcher: {
    dispatch(eventName: string, data: unknown): Promise<void>;
  };

  /**
   * Logger for batch tracking
   */
  logger: {
    info(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    debug(message: string, context?: Record<string, unknown>): void;
  };

  /**
   * Optional callback handler for batch notifications
   */
  callbackHandler?: {
    notify(url: string, result: BatchExecutionResult): Promise<void>;
  };
}

export class AgentBatchHandler {
  constructor(private readonly deps: AgentBatchHandlerDependencies) {}

  /**
   * Handle batch execution message
   */
  public async handle(message: AgentBatchMessage): Promise<void> {
    const startTime = new Date().toISOString();
    const agentIds = message.getAgentIds();
    const context = message.getContext();

    this.deps.logger.info('Starting batch agent execution', {
      agentCount: agentIds.length,
      mode: message.getOptions().mode,
      userId: context.userId,
      sessionId: context.sessionId,
    });

    try {
      let results: Record<string, AgentExecutionResult>;

      if (message.isParallel()) {
        results = await this.executeParallel(message);
      } else {
        results = await this.executeSequential(message);
      }

      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      // Count successes and failures
      const successCount = Object.values(results).filter((r) => r.success).length;
      const failureCount = agentIds.length - successCount;

      const batchResult: BatchExecutionResult = {
        success: failureCount === 0,
        results,
        metadata: {
          totalAgents: agentIds.length,
          successCount,
          failureCount,
          startTime,
          endTime,
          duration,
        },
      };

      // Store batch result
      const batchId = context.requestId ?? `batch-${Date.now()}`;
      await this.deps.resultStorage.store(batchId, batchResult);

      // Dispatch completion event
      await this.deps.eventDispatcher.dispatch('agent.batch.complete', {
        batchResult,
        context,
      });

      // Send callback if specified
      const callbackUrl = message.getCallbackUrl();
      if (callbackUrl && this.deps.callbackHandler) {
        await this.deps.callbackHandler.notify(callbackUrl, batchResult);
      }

      this.deps.logger.info('Batch execution completed', {
        totalAgents: agentIds.length,
        successCount,
        failureCount,
        duration,
      });

      // Throw if any failures and stopOnError is true
      if (failureCount > 0 && message.shouldStopOnError()) {
        throw new Error(`Batch execution failed: ${failureCount} agent(s) failed`);
      }
    } catch (error) {
      this.deps.logger.error('Batch execution failed', error as Error, {
        agentCount: agentIds.length,
      });
      throw error;
    }
  }

  /**
   * Execute agents in parallel
   */
  private async executeParallel(
    message: AgentBatchMessage,
  ): Promise<Record<string, AgentExecutionResult>> {
    const agentIds = message.getAgentIds();
    const maxParallel = message.getOptions().maxParallel ?? agentIds.length;

    this.deps.logger.debug('Executing agents in parallel', {
      total: agentIds.length,
      maxParallel,
    });

    const results: Record<string, AgentExecutionResult> = {};

    // Execute in chunks
    for (let i = 0; i < agentIds.length; i += maxParallel) {
      const chunk = agentIds.slice(i, i + maxParallel);
      const chunkPromises = chunk.map((agentId) =>
        this.executeSingleAgent(agentId, message.getInputForAgent(agentId)),
      );

      const chunkResults = await Promise.allSettled(chunkPromises);

      chunk.forEach((agentId, index) => {
        const result = chunkResults[index];
        if (result.status === 'fulfilled') {
          results[agentId] = result.value;
        } else {
          results[agentId] = {
            success: false,
            error: {
              message: result.reason?.message ?? 'Unknown error',
              code: 'EXECUTION_FAILED',
            },
            metadata: {
              agentId,
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              duration: 0,
            },
          };
        }
      });
    }

    return results;
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequential(
    message: AgentBatchMessage,
  ): Promise<Record<string, AgentExecutionResult>> {
    const agentIds = message.getAgentIds();
    const results: Record<string, AgentExecutionResult> = {};

    this.deps.logger.debug('Executing agents sequentially', {
      total: agentIds.length,
    });

    for (const agentId of agentIds) {
      try {
        const result = await this.executeSingleAgent(
          agentId,
          message.getInputForAgent(agentId),
        );
        results[agentId] = result;

        // Stop on error if requested
        if (!result.success && message.shouldStopOnError()) {
          this.deps.logger.info('Stopping batch execution due to error', { agentId });
          break;
        }
      } catch (error) {
        results[agentId] = {
          success: false,
          error: {
            message: error instanceof Error ? error.message : String(error),
            code: 'EXECUTION_FAILED',
          },
          metadata: {
            agentId,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 0,
          },
        };

        // Stop on error if requested
        if (message.shouldStopOnError()) {
          this.deps.logger.info('Stopping batch execution due to error', { agentId });
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single agent
   */
  private async executeSingleAgent(
    agentId: string,
    input: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    const startTime = new Date().toISOString();

    try {
      const agent = await this.deps.agentRuntime.loadAgent(agentId);
      const output = await this.deps.agentRuntime.executeAgent(agent, input);

      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      return {
        success: true,
        output,
        metadata: {
          agentId,
          startTime,
          endTime,
          duration,
        },
      };
    } catch (error) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      return {
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
    }
  }
}
