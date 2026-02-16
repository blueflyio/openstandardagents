/**
 * Drush command to consume messenger messages
 *
 * Usage: drush messenger:consume agent_async --limit=10
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface MessengerConsumeCommandOptions {
  /**
   * Transport name to consume from
   */
  transport: string;

  /**
   * Maximum number of messages to process (0 = unlimited)
   */
  limit?: number;

  /**
   * Time limit in seconds (0 = unlimited)
   */
  timeLimit?: number;

  /**
   * Memory limit in MB
   */
  memoryLimit?: number;

  /**
   * Sleep time in milliseconds between checks
   */
  sleep?: number;
}

export interface MessengerWorkerService {
  /**
   * Start consuming messages from transport
   */
  consume(options: MessengerConsumeCommandOptions): Promise<void>;

  /**
   * Stop worker gracefully
   */
  stop(): Promise<void>;
}

export class MessengerConsumeCommand {
  constructor(
    private readonly worker: MessengerWorkerService,
    private readonly logger: {
      info(message: string, context?: Record<string, unknown>): void;
      error(message: string, error?: Error): void;
    }
  ) {}

  /**
   * Execute command
   */
  public async execute(options: MessengerConsumeCommandOptions): Promise<void> {
    this.logger.info('Starting message consumer', {
      transport: options.transport,
      limit: options.limit ?? 'unlimited',
      timeLimit: options.timeLimit ?? 'unlimited',
    });

    try {
      // Handle graceful shutdown
      this.setupSignalHandlers();

      // Start consuming
      await this.worker.consume(options);

      this.logger.info('Message consumer stopped');
    } catch (error) {
      this.logger.error('Message consumer failed', error as Error);
      throw error;
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const shutdown = async () => {
      this.logger.info('Received shutdown signal, stopping worker...');
      await this.worker.stop();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}
