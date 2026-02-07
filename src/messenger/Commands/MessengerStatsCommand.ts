/**
 * Drush command to show messenger statistics
 *
 * Usage: drush messenger:stats [transport]
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface TransportStats {
  name: string;
  messageCount: number;
  failedCount: number;
  processingCount: number;
  avgProcessingTime: number;
  successRate: number;
  lastProcessedAt?: string;
}

export interface MessengerStatsService {
  /**
   * Get stats for a specific transport
   */
  getTransportStats(transport: string): Promise<TransportStats>;

  /**
   * Get stats for all transports
   */
  getAllStats(): Promise<TransportStats[]>;

  /**
   * Get message count by type
   */
  getMessageCountByType(): Promise<Record<string, number>>;

  /**
   * Get recent activity
   */
  getRecentActivity(limit?: number): Promise<Array<{
    messageType: string;
    status: 'success' | 'failed';
    timestamp: string;
    duration: number;
  }>>;
}

export class MessengerStatsCommand {
  constructor(
    private readonly statsService: MessengerStatsService,
    private readonly logger: {
      info(message: string): void;
      error(message: string, error?: Error): void;
    },
  ) {}

  /**
   * Execute command
   */
  public async execute(transport?: string): Promise<void> {
    try {
      if (transport) {
        await this.showTransportStats(transport);
      } else {
        await this.showAllStats();
      }
    } catch (error) {
      this.logger.error('Failed to get stats', error as Error);
      throw error;
    }
  }

  /**
   * Show stats for a specific transport
   */
  private async showTransportStats(transport: string): Promise<void> {
    const stats = await this.statsService.getTransportStats(transport);

    console.log(`\n=== Transport Stats: ${transport} ===\n`);
    console.log(`Message Count: ${stats.messageCount}`);
    console.log(`Failed Count: ${stats.failedCount}`);
    console.log(`Processing Count: ${stats.processingCount}`);
    console.log(`Avg Processing Time: ${stats.avgProcessingTime}ms`);
    console.log(`Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);
    if (stats.lastProcessedAt) {
      console.log(`Last Processed: ${stats.lastProcessedAt}`);
    }
    console.log('');
  }

  /**
   * Show stats for all transports
   */
  private async showAllStats(): Promise<void> {
    const allStats = await this.statsService.getAllStats();
    const messageTypes = await this.statsService.getMessageCountByType();
    const recentActivity = await this.statsService.getRecentActivity(10);

    // Transport stats
    console.log('\n=== Transport Stats ===\n');
    console.log(
      `${'Transport'.padEnd(20)} ${'Messages'.padEnd(12)} ${'Failed'.padEnd(12)} ${'Avg Time'.padEnd(12)} ${'Success Rate'}`,
    );
    console.log('-'.repeat(80));

    for (const stats of allStats) {
      const successRate = `${(stats.successRate * 100).toFixed(1)}%`;
      console.log(
        `${stats.name.padEnd(20)} ${String(stats.messageCount).padEnd(12)} ${String(stats.failedCount).padEnd(12)} ${String(stats.avgProcessingTime).padEnd(12)} ${successRate}`,
      );
    }

    // Message types
    console.log('\n=== Message Types ===\n');
    for (const [type, count] of Object.entries(messageTypes)) {
      console.log(`${type}: ${count}`);
    }

    // Recent activity
    console.log('\n=== Recent Activity (Last 10) ===\n');
    console.log(
      `${'Message Type'.padEnd(40)} ${'Status'.padEnd(12)} ${'Duration'.padEnd(12)} ${'Timestamp'}`,
    );
    console.log('-'.repeat(100));

    for (const activity of recentActivity) {
      const messageType = activity.messageType.substring(0, 37) + '...';
      console.log(
        `${messageType.padEnd(40)} ${activity.status.padEnd(12)} ${String(activity.duration).padEnd(12)} ${activity.timestamp}`,
      );
    }

    console.log('');
  }
}
