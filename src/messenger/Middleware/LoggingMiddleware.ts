/**
 * Logging middleware for Symfony Messenger
 *
 * This middleware logs message processing, timing, and any errors.
 * It provides detailed insights into message lifecycle.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

import type { MessageEnvelope, MiddlewareStack } from './ValidationMiddleware.js';

export interface LoggingMiddlewareDependencies {
  logger: {
    info(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    debug(message: string, context?: Record<string, unknown>): void;
  };
}

export class LoggingMiddleware {
  constructor(private readonly deps: LoggingMiddlewareDependencies) {}

  /**
   * Process message through middleware
   */
  public async handle(envelope: MessageEnvelope, stack: MiddlewareStack): Promise<MessageEnvelope> {
    const messageType = this.getMessageType(envelope.message);
    const startTime = Date.now();

    this.deps.logger.debug('Processing message', {
      messageType,
      stamps: Object.keys(envelope.stamps),
    });

    try {
      const result = await stack.next(envelope);
      const duration = Date.now() - startTime;

      this.deps.logger.info('Message processed successfully', {
        messageType,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.deps.logger.error('Message processing failed', error as Error, {
        messageType,
        duration,
      });

      throw error;
    }
  }

  /**
   * Get message type name
   */
  private getMessageType(message: unknown): string {
    if (!message || typeof message !== 'object') {
      return 'unknown';
    }

    // Try to get constructor name
    if ('constructor' in message && message.constructor && 'name' in message.constructor) {
      return message.constructor.name as string;
    }

    return 'unknown';
  }
}
