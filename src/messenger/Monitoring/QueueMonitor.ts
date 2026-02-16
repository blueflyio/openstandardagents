/**
 * Queue monitor for tracking queue depth and health
 *
 * This service monitors queue depth, dead letter queues,
 * and provides alerts for unhealthy conditions.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface QueueStatus {
  transport: string;
  queueName: string;
  depth: number;
  processing: number;
  failed: number;
  deadLetter: number;
  lastProcessed?: string;
  healthy: boolean;
  alerts: string[];
}

export interface QueueThresholds {
  maxDepth: number;
  maxDeadLetter: number;
  maxProcessingTime: number;
  minThroughput: number;
}

export interface QueueStatusService {
  /**
   * Get queue depth for transport
   */
  getQueueDepth(transport: string): Promise<number>;

  /**
   * Get processing count
   */
  getProcessingCount(transport: string): Promise<number>;

  /**
   * Get failed message count
   */
  getFailedCount(transport: string): Promise<number>;

  /**
   * Get dead letter queue count
   */
  getDeadLetterCount(transport: string): Promise<number>;

  /**
   * Get last processed timestamp
   */
  getLastProcessed(transport: string): Promise<string | undefined>;
}

export class QueueMonitor {
  private readonly thresholds: QueueThresholds;

  constructor(
    private readonly queueStatus: QueueStatusService,
    private readonly logger: {
      warning(message: string, context?: Record<string, unknown>): void;
      error(message: string, context?: Record<string, unknown>): void;
      info(message: string, context?: Record<string, unknown>): void;
    },
    thresholds?: Partial<QueueThresholds>
  ) {
    this.thresholds = {
      maxDepth: thresholds?.maxDepth ?? 1000,
      maxDeadLetter: thresholds?.maxDeadLetter ?? 100,
      maxProcessingTime: thresholds?.maxProcessingTime ?? 5000,
      minThroughput: thresholds?.minThroughput ?? 1,
    };
  }

  /**
   * Check queue status and health
   */
  public async checkQueue(
    transport: string,
    queueName: string
  ): Promise<QueueStatus> {
    const depth = await this.queueStatus.getQueueDepth(transport);
    const processing = await this.queueStatus.getProcessingCount(transport);
    const failed = await this.queueStatus.getFailedCount(transport);
    const deadLetter = await this.queueStatus.getDeadLetterCount(transport);
    const lastProcessed = await this.queueStatus.getLastProcessed(transport);

    const alerts: string[] = [];
    let healthy = true;

    // Check queue depth
    if (depth > this.thresholds.maxDepth) {
      alerts.push(
        `Queue depth ${depth} exceeds threshold ${this.thresholds.maxDepth}`
      );
      healthy = false;
      this.logger.warning('Queue depth threshold exceeded', {
        transport,
        depth,
        threshold: this.thresholds.maxDepth,
      });
    }

    // Check dead letter queue
    if (deadLetter > this.thresholds.maxDeadLetter) {
      alerts.push(
        `Dead letter count ${deadLetter} exceeds threshold ${this.thresholds.maxDeadLetter}`
      );
      healthy = false;
      this.logger.error('Dead letter threshold exceeded', {
        transport,
        deadLetter,
        threshold: this.thresholds.maxDeadLetter,
      });
    }

    // Check stale processing (no activity in last 5 minutes)
    if (lastProcessed) {
      const lastProcessedDate = new Date(lastProcessed);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      if (lastProcessedDate < fiveMinutesAgo && depth > 0) {
        alerts.push(
          'No messages processed in last 5 minutes but queue has messages'
        );
        healthy = false;
        this.logger.warning('Stale queue detected', {
          transport,
          lastProcessed,
          depth,
        });
      }
    }

    // Check if too many messages are stuck processing
    if (processing > 50) {
      alerts.push(`High processing count: ${processing} messages`);
      this.logger.warning('High processing count', {
        transport,
        processing,
      });
    }

    const status: QueueStatus = {
      transport,
      queueName,
      depth,
      processing,
      failed,
      deadLetter,
      lastProcessed,
      healthy,
      alerts,
    };

    if (!healthy) {
      this.logger.error('Unhealthy queue detected', {
        transport,
        alerts: alerts.join(', '),
      });
    }

    return status;
  }

  /**
   * Monitor all transports
   */
  public async monitorAll(
    transports: Array<{ name: string; queueName: string }>
  ): Promise<QueueStatus[]> {
    const statuses: QueueStatus[] = [];

    for (const transport of transports) {
      try {
        const status = await this.checkQueue(
          transport.name,
          transport.queueName
        );
        statuses.push(status);
      } catch (error) {
        this.logger.error(`Failed to check queue ${transport.name}`, {
          error: (error as Error).message,
        });
      }
    }

    // Log summary
    const unhealthyCount = statuses.filter((s) => !s.healthy).length;
    if (unhealthyCount > 0) {
      this.logger.warning('Queue health check summary', {
        total: statuses.length,
        unhealthy: unhealthyCount,
      });
    } else {
      this.logger.info('All queues healthy', {
        total: statuses.length,
      });
    }

    return statuses;
  }

  /**
   * Get queue health percentage
   */
  public calculateHealthPercentage(status: QueueStatus): number {
    if (status.healthy) {
      return 100;
    }

    // Deduct points for each issue
    let health = 100;

    // Queue depth penalty (up to 40 points)
    if (status.depth > this.thresholds.maxDepth) {
      const penalty = Math.min(
        40,
        ((status.depth - this.thresholds.maxDepth) / this.thresholds.maxDepth) *
          40
      );
      health -= penalty;
    }

    // Dead letter penalty (up to 30 points)
    if (status.deadLetter > this.thresholds.maxDeadLetter) {
      const penalty = Math.min(
        30,
        ((status.deadLetter - this.thresholds.maxDeadLetter) /
          this.thresholds.maxDeadLetter) *
          30
      );
      health -= penalty;
    }

    // Stale processing penalty (20 points)
    if (status.alerts.some((a) => a.includes('No messages processed'))) {
      health -= 20;
    }

    // High processing penalty (10 points)
    if (status.processing > 50) {
      health -= 10;
    }

    return Math.max(0, Math.round(health));
  }
}
