/**
 * Rate limit middleware for Symfony Messenger
 *
 * This middleware prevents abuse by rate limiting message processing.
 * It tracks execution counts per user and enforces limits.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

import type { MessageEnvelope, MiddlewareStack } from './ValidationMiddleware.js';
import type { AgentExecutionMessage } from '../Message/AgentExecutionMessage.js';
import type { AgentBatchMessage } from '../Message/AgentBatchMessage.js';

export interface RateLimitConfig {
  /**
   * Maximum executions per window
   */
  maxExecutions: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Whether to enforce rate limits
   */
  enabled: boolean;
}

export interface RateLimiterService {
  /**
   * Check if user is rate limited
   */
  isRateLimited(userId: string, key: string): Promise<boolean>;

  /**
   * Increment usage count
   */
  increment(userId: string, key: string, ttl: number): Promise<void>;

  /**
   * Get remaining allowance
   */
  getRemaining(userId: string, key: string, max: number): Promise<number>;
}

export interface RateLimitMiddlewareDependencies {
  rateLimiter: RateLimiterService;
  config?: RateLimitConfig;
}

export class RateLimitMiddleware {
  private readonly config: RateLimitConfig;

  constructor(deps: RateLimitMiddlewareDependencies) {
    this.config = deps.config ?? {
      maxExecutions: 100,
      windowSeconds: 3600, // 1 hour
      enabled: true,
    };
  }

  /**
   * Process message through middleware
   */
  public async handle(envelope: MessageEnvelope, stack: MiddlewareStack, rateLimiter: RateLimiterService): Promise<MessageEnvelope> {
    const message = envelope.message;

    // Skip if rate limiting is disabled
    if (!this.config.enabled) {
      return stack.next(envelope);
    }

    // Get user ID from message
    const userId = this.getUserId(message);
    if (!userId) {
      // No user ID, skip rate limiting
      return stack.next(envelope);
    }

    // Check rate limit
    const rateLimitKey = this.getRateLimitKey(message);
    const isLimited = await rateLimiter.isRateLimited(userId, rateLimitKey);

    if (isLimited) {
      const remaining = await rateLimiter.getRemaining(
        userId,
        rateLimitKey,
        this.config.maxExecutions,
      );

      throw new Error(
        `Rate limit exceeded: Maximum ${this.config.maxExecutions} executions per ${this.config.windowSeconds} seconds. ` +
        `Try again later. Remaining: ${remaining}`,
      );
    }

    // Increment usage
    await rateLimiter.increment(userId, rateLimitKey, this.config.windowSeconds);

    // Continue to next middleware
    return stack.next(envelope);
  }

  /**
   * Get user ID from message
   */
  private getUserId(message: unknown): string | undefined {
    if (this.isAgentExecutionMessage(message)) {
      return message.getUserId();
    }

    if (this.isAgentBatchMessage(message)) {
      return message.getContext().userId;
    }

    return undefined;
  }

  /**
   * Get rate limit key for message type
   */
  private getRateLimitKey(message: unknown): string {
    if (this.isAgentExecutionMessage(message)) {
      return 'agent_execution';
    }

    if (this.isAgentBatchMessage(message)) {
      return 'agent_batch_execution';
    }

    return 'unknown';
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
