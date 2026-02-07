/**
 * Event subscriber for failed messages
 *
 * This subscriber listens for message failure events and handles
 * logging, notification, and storage of failed messages.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface WorkerMessageFailedEvent {
  message: unknown;
  error: Error;
  envelope: {
    messageId: string;
    stamps: Record<string, unknown>;
  };
  willRetry: boolean;
  retryCount: number;
}

export interface FailedMessageSubscriberDependencies {
  logger: {
    error(message: string, error: Error, context?: Record<string, unknown>): void;
    warning(message: string, context?: Record<string, unknown>): void;
  };

  failedJobStorage: {
    store(
      messageId: string,
      message: unknown,
      error: Error,
      retryCount: number,
    ): Promise<void>;
  };

  notifier: {
    notifyFailure(message: unknown, error: Error, retryCount: number): Promise<void>;
  };
}

export class FailedMessageSubscriber {
  constructor(private readonly deps: FailedMessageSubscriberDependencies) {}

  /**
   * Handle message failed event
   */
  public async onMessageFailed(event: WorkerMessageFailedEvent): Promise<void> {
    const { message, error, envelope, willRetry, retryCount } = event;

    // Log the failure
    if (willRetry) {
      this.deps.logger.warning('Message failed, will retry', {
        messageId: envelope.messageId,
        retryCount,
        error: error.message,
      });
    } else {
      this.deps.logger.error('Message permanently failed', error, {
        messageId: envelope.messageId,
        retryCount,
      });
    }

    // Store in failed_jobs table (even for retries, for tracking)
    try {
      await this.deps.failedJobStorage.store(envelope.messageId, message, error, retryCount);
    } catch (storageError) {
      this.deps.logger.error('Failed to store failed message', storageError as Error, {
        messageId: envelope.messageId,
      });
    }

    // Send notification only for permanent failures
    if (!willRetry) {
      try {
        await this.deps.notifier.notifyFailure(message, error, retryCount);
      } catch (notificationError) {
        this.deps.logger.error('Failed to send failure notification', notificationError as Error, {
          messageId: envelope.messageId,
        });
      }
    }
  }

  /**
   * Get subscribed events
   */
  public static getSubscribedEvents(): Record<string, string> {
    return {
      'messenger.message_failed': 'onMessageFailed',
    };
  }
}
