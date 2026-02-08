/**
 * Authentication middleware for Symfony Messenger
 *
 * This middleware checks user permissions before processing messages.
 * It ensures only authorized users can execute agents.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

import type { MessageEnvelope, MiddlewareStack } from './ValidationMiddleware.js';
import type { AgentExecutionMessage } from '../Message/AgentExecutionMessage.js';
import type { AgentBatchMessage } from '../Message/AgentBatchMessage.js';

export interface AuthenticationMiddlewareDependencies {
  currentUser: {
    hasPermission(permission: string): boolean;
    isAuthenticated(): boolean;
  };
}

export class AuthenticationMiddleware {
  constructor(private readonly deps: AuthenticationMiddlewareDependencies) {}

  /**
   * Process message through middleware
   */
  public async handle(envelope: MessageEnvelope, stack: MiddlewareStack): Promise<MessageEnvelope> {
    const message = envelope.message;

    // Check if message requires authentication
    if (this.requiresAuthentication(message)) {
      this.checkAuthentication(message);
    }

    // Continue to next middleware
    return stack.next(envelope);
  }

  /**
   * Check if message requires authentication
   */
  private requiresAuthentication(message: unknown): boolean {
    // All agent execution messages require authentication
    return (
      this.isAgentExecutionMessage(message) ||
      this.isAgentBatchMessage(message)
    );
  }

  /**
   * Check authentication and permissions
   */
  private checkAuthentication(message: unknown): void {
    // Get user ID from message context
    let userId: string | undefined;

    if (this.isAgentExecutionMessage(message)) {
      userId = message.getUserId();
    } else if (this.isAgentBatchMessage(message)) {
      userId = message.getContext().userId;
    }

    // If no user ID, block execution
    if (!userId) {
      throw new Error('Authentication required: No user ID provided');
    }

    // Check if user is authenticated (in Drupal context)
    if (!this.deps.currentUser.isAuthenticated()) {
      throw new Error('Authentication required: User not authenticated');
    }

    // Check execute agent permission
    if (!this.deps.currentUser.hasPermission('execute ossa agents')) {
      throw new Error('Permission denied: User does not have permission to execute agents');
    }

    // For batch messages, check batch permission
    if (this.isAgentBatchMessage(message)) {
      if (!this.deps.currentUser.hasPermission('execute ossa batch agents')) {
        throw new Error('Permission denied: User does not have permission to execute batch agents');
      }
    }
  }

  /**
   * Check if message is AgentExecutionMessage
   */
  private isAgentExecutionMessage(message: unknown): message is AgentExecutionMessage {
    return (
      typeof message === 'object' &&
      message !== null &&
      'getAgentId' in message &&
      'getUserId' in message
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
      'getContext' in message
    );
  }
}
