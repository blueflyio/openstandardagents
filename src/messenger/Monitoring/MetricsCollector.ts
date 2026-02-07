/**
 * Metrics collector for messenger monitoring
 *
 * This service collects and tracks metrics for message processing
 * including counts, timing, failures, and queue depth.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 */

export interface MetricsData {
  /**
   * Total messages processed
   */
  totalProcessed: number;

  /**
   * Total messages failed
   */
  totalFailed: number;

  /**
   * Total messages currently processing
   */
  currentlyProcessing: number;

  /**
   * Average processing time in milliseconds
   */
  avgProcessingTime: number;

  /**
   * Success rate (0-1)
   */
  successRate: number;

  /**
   * Messages per minute
   */
  throughput: number;

  /**
   * Current queue depth
   */
  queueDepth: number;

  /**
   * Dead letter queue count
   */
  deadLetterCount: number;

  /**
   * Last updated timestamp
   */
  lastUpdated: string;
}

export interface MetricUpdate {
  messageType: string;
  transport: string;
  status: 'success' | 'failed';
  duration: number;
  timestamp: string;
}

export interface MetricsStorage {
  /**
   * Store a metric update
   */
  store(update: MetricUpdate): Promise<void>;

  /**
   * Get current metrics
   */
  getMetrics(transport?: string): Promise<MetricsData>;

  /**
   * Get metrics by message type
   */
  getMetricsByType(messageType: string): Promise<MetricsData>;

  /**
   * Get time-series data
   */
  getTimeSeries(
    transport: string,
    startTime: Date,
    endTime: Date,
    interval: 'minute' | 'hour' | 'day',
  ): Promise<Array<{ timestamp: string; value: number }>>;
}

export class MetricsCollector {
  constructor(
    private readonly storage: MetricsStorage,
    private readonly logger: {
      debug(message: string, context?: Record<string, unknown>): void;
      error(message: string, error: Error): void;
    },
  ) {}

  /**
   * Record message processing
   */
  public async recordProcessing(
    messageType: string,
    transport: string,
    startTime: Date,
    success: boolean,
  ): Promise<void> {
    try {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const update: MetricUpdate = {
        messageType,
        transport,
        status: success ? 'success' : 'failed',
        duration,
        timestamp: endTime.toISOString(),
      };

      await this.storage.store(update);

      this.logger.debug('Recorded metric', {
        messageType,
        transport,
        status: update.status,
        duration,
      });
    } catch (error) {
      this.logger.error('Failed to record metric', error as Error);
    }
  }

  /**
   * Get current metrics for a transport
   */
  public async getMetrics(transport?: string): Promise<MetricsData> {
    return this.storage.getMetrics(transport);
  }

  /**
   * Get metrics by message type
   */
  public async getMetricsByType(messageType: string): Promise<MetricsData> {
    return this.storage.getMetricsByType(messageType);
  }

  /**
   * Get time-series data
   */
  public async getTimeSeries(
    transport: string,
    startTime: Date,
    endTime: Date,
    interval: 'minute' | 'hour' | 'day' = 'hour',
  ): Promise<Array<{ timestamp: string; value: number }>> {
    return this.storage.getTimeSeries(transport, startTime, endTime, interval);
  }

  /**
   * Calculate health score (0-100)
   */
  public calculateHealthScore(metrics: MetricsData): number {
    // Factors:
    // - Success rate (40%)
    // - Throughput vs capacity (30%)
    // - Queue depth (20%)
    // - Processing time (10%)

    const successScore = metrics.successRate * 40;

    // Assume capacity of 100 msg/min
    const throughputScore = Math.min(metrics.throughput / 100, 1) * 30;

    // Penalize high queue depth (over 100 is bad)
    const queueScore = Math.max(0, 1 - metrics.queueDepth / 100) * 20;

    // Penalize slow processing (over 5000ms is bad)
    const timeScore = Math.max(0, 1 - metrics.avgProcessingTime / 5000) * 10;

    return Math.round(successScore + throughputScore + queueScore + timeScore);
  }
}
