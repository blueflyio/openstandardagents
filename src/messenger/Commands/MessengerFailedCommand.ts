/**
 * Drush commands for managing failed messages
 *
 * Usage:
 *   drush messenger:failed:retry [id]
 *   drush messenger:failed:show [id]
 *   drush messenger:failed:list
 *   drush messenger:failed:remove [id]
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface FailedMessage {
  id: string;
  messageClass: string;
  messageData: Record<string, unknown>;
  error: {
    message: string;
    code: string;
    stack?: string;
  };
  failedAt: string;
  retryCount: number;
}

export interface FailedMessageService {
  /**
   * Get all failed messages
   */
  list(limit?: number, offset?: number): Promise<FailedMessage[]>;

  /**
   * Get a specific failed message
   */
  get(id: string): Promise<FailedMessage | null>;

  /**
   * Retry a failed message
   */
  retry(id: string): Promise<void>;

  /**
   * Remove a failed message
   */
  remove(id: string): Promise<void>;

  /**
   * Retry all failed messages
   */
  retryAll(): Promise<number>;

  /**
   * Remove all failed messages
   */
  removeAll(): Promise<number>;
}

export class MessengerFailedCommand {
  constructor(
    private readonly failedMessageService: FailedMessageService,
    private readonly logger: {
      info(message: string, context?: Record<string, unknown>): void;
      error(message: string, error?: Error): void;
      success(message: string): void;
    }
  ) {}

  /**
   * Retry a failed message
   */
  public async retry(id?: string): Promise<void> {
    try {
      if (id) {
        // Retry single message
        await this.failedMessageService.retry(id);
        this.logger.success(`Retried message ${id}`);
      } else {
        // Retry all messages
        const count = await this.failedMessageService.retryAll();
        this.logger.success(`Retried ${count} message(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to retry message(s)', error as Error);
      throw error;
    }
  }

  /**
   * Show a failed message
   */
  public async show(id: string): Promise<void> {
    try {
      const message = await this.failedMessageService.get(id);

      if (!message) {
        this.logger.error(`Message ${id} not found`, new Error('Not found'));
        return;
      }

      // Format output
      console.log('\n=== Failed Message ===\n');
      console.log(`ID: ${message.id}`);
      console.log(`Class: ${message.messageClass}`);
      console.log(`Failed At: ${message.failedAt}`);
      console.log(`Retry Count: ${message.retryCount}`);
      console.log('\n--- Error ---\n');
      console.log(`Message: ${message.error.message}`);
      console.log(`Code: ${message.error.code}`);
      if (message.error.stack) {
        console.log('\n--- Stack Trace ---\n');
        console.log(message.error.stack);
      }
      console.log('\n--- Message Data ---\n');
      console.log(JSON.stringify(message.messageData, null, 2));
      console.log('\n');
    } catch (error) {
      this.logger.error('Failed to show message', error as Error);
      throw error;
    }
  }

  /**
   * List failed messages
   */
  public async list(limit = 50, offset = 0): Promise<void> {
    try {
      const messages = await this.failedMessageService.list(limit, offset);

      if (messages.length === 0) {
        this.logger.info('No failed messages found');
        return;
      }

      console.log('\n=== Failed Messages ===\n');
      console.log(
        `${'ID'.padEnd(40)} ${'Class'.padEnd(40)} ${'Failed At'.padEnd(25)} ${'Retries'}`
      );
      console.log('-'.repeat(120));

      for (const message of messages) {
        const id = message.id.substring(0, 37) + '...';
        const className = message.messageClass.substring(0, 37) + '...';
        console.log(
          `${id.padEnd(40)} ${className.padEnd(40)} ${message.failedAt.padEnd(25)} ${message.retryCount}`
        );
      }

      console.log(`\nShowing ${messages.length} message(s)\n`);
    } catch (error) {
      this.logger.error('Failed to list messages', error as Error);
      throw error;
    }
  }

  /**
   * Remove a failed message
   */
  public async remove(id?: string): Promise<void> {
    try {
      if (id) {
        // Remove single message
        await this.failedMessageService.remove(id);
        this.logger.success(`Removed message ${id}`);
      } else {
        // Remove all messages
        const count = await this.failedMessageService.removeAll();
        this.logger.success(`Removed ${count} message(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to remove message(s)', error as Error);
      throw error;
    }
  }
}
