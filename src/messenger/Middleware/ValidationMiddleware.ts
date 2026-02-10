/**
 * Validation middleware for Symfony Messenger
 *
 * This middleware validates message data before processing.
 * It ensures messages contain valid data and required fields.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

import type { AgentExecutionMessage } from '../Message/AgentExecutionMessage.js';
import type { AgentBatchMessage } from '../Message/AgentBatchMessage.js';

export interface MessageEnvelope {
  message: unknown;
  stamps: Record<string, unknown>;
}

export interface MiddlewareStack {
  next(envelope: MessageEnvelope): Promise<MessageEnvelope>;
}

export class ValidationMiddleware {
  /**
   * Process message through middleware
   */
  public async handle(
    envelope: MessageEnvelope,
    stack: MiddlewareStack
  ): Promise<MessageEnvelope> {
    const message = envelope.message;

    // Validate AgentExecutionMessage
    if (this.isAgentExecutionMessage(message)) {
      this.validateAgentExecutionMessage(message);
    }

    // Validate AgentBatchMessage
    if (this.isAgentBatchMessage(message)) {
      this.validateAgentBatchMessage(message);
    }

    // Continue to next middleware
    return stack.next(envelope);
  }

  /**
   * Check if message is AgentExecutionMessage
   */
  private isAgentExecutionMessage(
    message: unknown
  ): message is AgentExecutionMessage {
    return (
      typeof message === 'object' &&
      message !== null &&
      'getAgentId' in message &&
      'getInput' in message
    );
  }

  /**
   * Check if message is AgentBatchMessage
   */
  private isAgentBatchMessage(message: unknown): message is AgentBatchMessage {
    return (
      typeof message === 'object' &&
      message !== null &&
      'getAgentIds' in message &&
      'getInputs' in message
    );
  }

  /**
   * Validate AgentExecutionMessage
   */
  private validateAgentExecutionMessage(message: AgentExecutionMessage): void {
    const agentId = message.getAgentId();
    const input = message.getInput();

    if (!agentId || typeof agentId !== 'string' || agentId.trim() === '') {
      throw new Error(
        'AgentExecutionMessage: agentId must be a non-empty string'
      );
    }

    if (!input || typeof input !== 'object') {
      throw new Error('AgentExecutionMessage: input must be an object');
    }

    const context = message.getContext();
    if (
      context.timeout &&
      (typeof context.timeout !== 'number' || context.timeout < 0)
    ) {
      throw new Error(
        'AgentExecutionMessage: timeout must be a positive number'
      );
    }

    if (
      context.priority &&
      (typeof context.priority !== 'number' ||
        context.priority < 1 ||
        context.priority > 10)
    ) {
      throw new Error(
        'AgentExecutionMessage: priority must be between 1 and 10'
      );
    }
  }

  /**
   * Validate AgentBatchMessage
   */
  private validateAgentBatchMessage(message: AgentBatchMessage): void {
    const agentIds = message.getAgentIds();
    const inputs = message.getInputs();

    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      throw new Error('AgentBatchMessage: agentIds must be a non-empty array');
    }

    for (const agentId of agentIds) {
      if (!agentId || typeof agentId !== 'string' || agentId.trim() === '') {
        throw new Error(
          'AgentBatchMessage: all agentIds must be non-empty strings'
        );
      }
    }

    if (!inputs || typeof inputs !== 'object') {
      throw new Error('AgentBatchMessage: inputs must be an object');
    }

    const options = message.getOptions();
    if (options.mode !== 'parallel' && options.mode !== 'sequential') {
      throw new Error(
        'AgentBatchMessage: mode must be "parallel" or "sequential"'
      );
    }

    if (
      options.maxParallel &&
      (typeof options.maxParallel !== 'number' || options.maxParallel < 1)
    ) {
      throw new Error(
        'AgentBatchMessage: maxParallel must be a positive number'
      );
    }
  }
}
