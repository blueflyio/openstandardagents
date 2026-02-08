/**
 * OSSA Audit Logger Service
 *
 * Comprehensive audit logging service for all agent actions.
 * Supports multiple transports: CloudWatch, S3, File, Console
 *
 * Issue: #402 - Audit Logging for All Agent Actions
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import {
  AuditEvent,
  AuditLogConfig,
  AuditQuery,
  AuditQueryResult,
  AuditMetrics,
  AuditSeverity,
  AuditCategory,
  AuditOutcome,
} from '../types/audit-logging.js';

const gzipAsync = promisify(zlib.gzip);

/**
 * Transport interface for audit log destinations
 */
export interface IAuditTransport {
  write(event: AuditEvent): Promise<void>;
  writeBatch(events: AuditEvent[]): Promise<void>;
  query?(params: AuditQuery): Promise<AuditQueryResult>;
  close?(): Promise<void>;
}

/**
 * Console transport - for development and debugging
 */
export class ConsoleAuditTransport implements IAuditTransport {
  constructor(private format: 'json' | 'pretty' = 'pretty') {}

  async write(event: AuditEvent): Promise<void> {
    if (this.format === 'json') {
      console.log(JSON.stringify(event));
    } else {
      this.prettyPrint(event);
    }
  }

  async writeBatch(events: AuditEvent[]): Promise<void> {
    for (const event of events) {
      await this.write(event);
    }
  }

  private prettyPrint(event: AuditEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const outcome = this.colorizeOutcome(event.outcome);
    const severity = this.colorizeSeverity(event.severity);

    console.log(`[${timestamp}] ${severity} ${event.category} - ${event.action}`);
    console.log(`  Agent: ${event.agent_id}`);
    console.log(`  Resource: ${event.resource}`);
    console.log(`  Outcome: ${outcome} (${event.duration_ms}ms)`);

    if (event.error) {
      console.log(`  Error: ${event.error.message}`);
    }

    if (event.metadata?.tokens_used) {
      console.log(`  Tokens: ${event.metadata.tokens_used}`);
    }
  }

  private colorizeOutcome(outcome: AuditOutcome): string {
    const colors: Record<AuditOutcome, string> = {
      [AuditOutcome.SUCCESS]: '\x1b[32m', // Green
      [AuditOutcome.FAILURE]: '\x1b[31m', // Red
      [AuditOutcome.PARTIAL_SUCCESS]: '\x1b[33m', // Yellow
      [AuditOutcome.DENIED]: '\x1b[31m', // Red
      [AuditOutcome.TIMEOUT]: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    return `${colors[outcome]}${outcome}${reset}`;
  }

  private colorizeSeverity(severity: AuditSeverity): string {
    const colors: Record<AuditSeverity, string> = {
      [AuditSeverity.DEBUG]: '\x1b[90m', // Gray
      [AuditSeverity.INFO]: '\x1b[36m', // Cyan
      [AuditSeverity.WARN]: '\x1b[33m', // Yellow
      [AuditSeverity.ERROR]: '\x1b[31m', // Red
      [AuditSeverity.CRITICAL]: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    return `${colors[severity]}${severity.toUpperCase()}${reset}`;
  }
}

/**
 * File transport - JSON Lines format with rotation
 */
export class FileAuditTransport implements IAuditTransport {
  private currentFile: string | null = null;
  private fileStream: fs.WriteStream | null = null;
  private currentDate: string = '';

  constructor(
    private directory: string,
    private filenamePattern: string = 'audit-{date}.jsonl',
    private rotation: 'daily' | 'weekly' | 'monthly' = 'daily'
  ) {
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory, { recursive: true });
    }
  }

  private getFilePath(): string {
    const now = new Date();
    let dateStr: string;

    switch (this.rotation) {
      case 'daily':
        dateStr = now.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekNum = this.getWeekNumber(now);
        dateStr = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        break;
      case 'monthly':
        dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      default:
        dateStr = now.toISOString().split('T')[0];
    }

    if (dateStr !== this.currentDate) {
      this.closeStream();
      this.currentDate = dateStr;
    }

    return path.join(this.directory, this.filenamePattern.replace('{date}', dateStr));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getStream(): fs.WriteStream {
    const filePath = this.getFilePath();

    if (!this.fileStream || this.currentFile !== filePath) {
      this.closeStream();
      this.currentFile = filePath;
      this.fileStream = fs.createWriteStream(filePath, { flags: 'a' });
    }

    return this.fileStream;
  }

  private closeStream(): void {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }

  async write(event: AuditEvent): Promise<void> {
    const stream = this.getStream();
    const line = JSON.stringify(event) + '\n';
    stream.write(line);
  }

  async writeBatch(events: AuditEvent[]): Promise<void> {
    const stream = this.getStream();
    for (const event of events) {
      const line = JSON.stringify(event) + '\n';
      stream.write(line);
    }
  }

  async query(params: AuditQuery): Promise<AuditQueryResult> {
    const files = this.getFilesInRange(params.start_time, params.end_time);
    const events: AuditEvent[] = [];
    const startTime = Date.now();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const event: AuditEvent = JSON.parse(line);
          if (this.matchesQuery(event, params)) {
            events.push(event);
          }
        } catch (error) {
          // Skip invalid lines
          continue;
        }
      }
    }

    // Apply sorting
    this.sortEvents(events, params.sort_by || 'timestamp', params.sort_order || 'desc');

    // Apply pagination
    const limit = params.limit || 100;
    const offset = params.offset || 0;
    const paginatedEvents = events.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total_count: events.length,
      query_time_ms: Date.now() - startTime,
    };
  }

  private getFilesInRange(startTime: string, endTime: string): string[] {
    const files: string[] = [];
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!fs.existsSync(this.directory)) {
      return files;
    }

    const allFiles = fs.readdirSync(this.directory);

    for (const file of allFiles) {
      if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
        continue;
      }

      const filePath = path.join(this.directory, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime >= start && stats.mtime <= end) {
        files.push(filePath);
      }
    }

    return files.sort();
  }

  private matchesQuery(event: AuditEvent, query: AuditQuery): boolean {
    // Time range
    const eventTime = new Date(event.timestamp);
    const startTime = new Date(query.start_time);
    const endTime = new Date(query.end_time);

    if (eventTime < startTime || eventTime > endTime) {
      return false;
    }

    // Field filters
    if (query.agent_id && event.agent_id !== query.agent_id) return false;
    if (query.user_id && event.user_id !== query.user_id) return false;
    if (query.action && event.action !== query.action) return false;
    if (query.category && event.category !== query.category) return false;
    if (query.severity && event.severity !== query.severity) return false;
    if (query.outcome && event.outcome !== query.outcome) return false;
    if (query.resource_type && event.resource_type !== query.resource_type) return false;
    if (query.project && event.project !== query.project) return false;

    // Search term
    if (query.search_term) {
      const searchLower = query.search_term.toLowerCase();
      const eventStr = JSON.stringify(event).toLowerCase();
      if (!eventStr.includes(searchLower)) return false;
    }

    return true;
  }

  private sortEvents(
    events: AuditEvent[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): void {
    events.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'duration_ms':
          comparison = a.duration_ms - b.duration_ms;
          break;
        case 'severity':
          const severityOrder = {
            [AuditSeverity.DEBUG]: 0,
            [AuditSeverity.INFO]: 1,
            [AuditSeverity.WARN]: 2,
            [AuditSeverity.ERROR]: 3,
            [AuditSeverity.CRITICAL]: 4,
          };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  async close(): Promise<void> {
    this.closeStream();
  }
}

/**
 * S3 transport - batch writes with compression
 * Note: Requires AWS SDK to be installed separately
 */
export class S3AuditTransport implements IAuditTransport {
  private batch: AuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(
    private bucket: string,
    private prefix: string = 'audit-logs',
    private region: string = 'us-east-1',
    private batchSize: number = 100,
    private batchTimeoutMs: number = 30000,
    private compress: boolean = true
  ) {
    // Note: In production, initialize AWS SDK S3 client here
    console.warn('S3AuditTransport: AWS SDK integration required for production use');
  }

  async write(event: AuditEvent): Promise<void> {
    this.batch.push(event);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchTimeoutMs);
    }
  }

  async writeBatch(events: AuditEvent[]): Promise<void> {
    this.batch.push(...events);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const eventsToWrite = [...this.batch];
    this.batch = [];

    try {
      await this.writeToS3(eventsToWrite);
    } catch (error) {
      console.error('Failed to write audit logs to S3:', error);
      // Re-add events to batch for retry
      this.batch.unshift(...eventsToWrite);
    }
  }

  private async writeToS3(events: AuditEvent[]): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');

    // S3 key: prefix/YYYY/MM/DD/HH/audit-{timestamp}.json(.gz)
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const key = `${this.prefix}/${year}/${month}/${day}/${hour}/audit-${timestamp}.json${this.compress ? '.gz' : ''}`;

    // Convert events to JSON Lines format
    const jsonLines = events.map(e => JSON.stringify(e)).join('\n');
    let data = Buffer.from(jsonLines, 'utf-8');

    // Compress if enabled
    if (this.compress) {
      data = await gzipAsync(data);
    }

    // In production, use AWS SDK to upload
    console.log(`S3AuditTransport: Would upload ${events.length} events to s3://${this.bucket}/${key}`);

    // Example AWS SDK call (requires @aws-sdk/client-s3):
    // const s3Client = new S3Client({ region: this.region });
    // await s3Client.send(
    //   new PutObjectCommand({
    //     Bucket: this.bucket,
    //     Key: key,
    //     Body: data,
    //     ContentType: this.compress ? 'application/gzip' : 'application/json',
    //     ServerSideEncryption: 'AES256',
    //   })
    // );
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

/**
 * CloudWatch transport - for AWS CloudWatch Logs
 * Note: Requires AWS SDK to be installed separately
 */
export class CloudWatchAuditTransport implements IAuditTransport {
  private batch: AuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private sequenceToken: string | undefined = undefined;

  constructor(
    private logGroup: string,
    private logStreamPrefix: string = 'audit',
    private region: string = 'us-east-1',
    private batchSize: number = 100,
    private batchTimeoutMs: number = 10000
  ) {
    console.warn('CloudWatchAuditTransport: AWS SDK integration required for production use');
  }

  async write(event: AuditEvent): Promise<void> {
    this.batch.push(event);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchTimeoutMs);
    }
  }

  async writeBatch(events: AuditEvent[]): Promise<void> {
    this.batch.push(...events);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const eventsToWrite = [...this.batch];
    this.batch = [];

    try {
      await this.writeToCloudWatch(eventsToWrite);
    } catch (error) {
      console.error('Failed to write audit logs to CloudWatch:', error);
      this.batch.unshift(...eventsToWrite);
    }
  }

  private async writeToCloudWatch(events: AuditEvent[]): Promise<void> {
    const logStreamName = `${this.logStreamPrefix}-${new Date().toISOString().split('T')[0]}`;

    console.log(
      `CloudWatchAuditTransport: Would write ${events.length} events to ${this.logGroup}/${logStreamName}`
    );

    // Example AWS SDK call (requires @aws-sdk/client-cloudwatch-logs):
    // const cwlClient = new CloudWatchLogsClient({ region: this.region });
    // const logEvents = events.map(event => ({
    //   message: JSON.stringify(event),
    //   timestamp: new Date(event.timestamp).getTime(),
    // }));
    //
    // const response = await cwlClient.send(
    //   new PutLogEventsCommand({
    //     logGroupName: this.logGroup,
    //     logStreamName: logStreamName,
    //     logEvents: logEvents,
    //     sequenceToken: this.sequenceToken,
    //   })
    // );
    //
    // this.sequenceToken = response.nextSequenceToken;
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

/**
 * GitLab Audit Events transport - for GitLab-native audit logging
 */
export class GitLabAuditEventsTransport implements IAuditTransport {
  private batch: AuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(
    private gitlabUrl: string,
    private gitlabToken: string,
    private projectId: string,
    private batchSize: number = 100,
    private batchTimeoutMs: number = 5000
  ) {}

  async write(event: AuditEvent): Promise<void> {
    this.batch.push(event);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchTimeoutMs);
    }
  }

  async writeBatch(events: AuditEvent[]): Promise<void> {
    this.batch.push(...events);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const eventsToWrite = [...this.batch];
    this.batch = [];

    try {
      await this.writeToGitLab(eventsToWrite);
    } catch (error) {
      console.error('Failed to write audit logs to GitLab:', error);
      // Re-add events to batch for retry
      this.batch.unshift(...eventsToWrite);
    }
  }

  private async writeToGitLab(events: AuditEvent[]): Promise<void> {
    // GitLab Audit Events API endpoint
    const endpoint = `${this.gitlabUrl}/api/v4/projects/${this.projectId}/audit_events`;

    // Send each event (GitLab doesn't support batch create)
    for (const event of events) {
      const auditEvent = {
        author_id: -1, // System
        entity_id: this.projectId,
        entity_type: 'Project',
        details: {
          custom_message: `${event.category}: ${event.action}`,
          agent_id: event.agent_id,
          action: event.action,
          resource: event.resource,
          outcome: event.outcome,
          duration_ms: event.duration_ms,
          timestamp: event.timestamp,
          metadata: event.metadata,
          error: event.error,
        },
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'PRIVATE-TOKEN': this.gitlabToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(auditEvent),
        });

        if (!response.ok) {
          console.error(
            `Failed to write event ${event.event_id} to GitLab: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error(`Error writing event ${event.event_id} to GitLab:`, error);
      }
    }

    console.log(`GitLabAuditEventsTransport: Wrote ${events.length} events to GitLab`);
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

/**
 * Main Audit Logger Service
 */
export class AuditLoggerService {
  private transports: IAuditTransport[] = [];
  private config: AuditLogConfig;
  private eventBuffer: AuditEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: AuditLogConfig) {
    this.config = config;
    this.initializeTransports();
  }

  private initializeTransports(): void {
    if (!this.config.enabled) {
      return;
    }

    // Console transport
    if (this.config.transports.console?.enabled) {
      this.transports.push(
        new ConsoleAuditTransport(this.config.transports.console.format || 'pretty')
      );
    }

    // File transport
    if (this.config.transports.file?.enabled) {
      this.transports.push(
        new FileAuditTransport(
          this.config.transports.file.directory,
          this.config.transports.file.filename_pattern,
          this.config.transports.file.rotation
        )
      );
    }

    // S3 transport
    if (this.config.transports.s3?.enabled) {
      this.transports.push(
        new S3AuditTransport(
          this.config.transports.s3.bucket,
          this.config.transports.s3.prefix,
          this.config.transports.s3.region,
          this.config.performance?.batch_size,
          this.config.performance?.batch_timeout_ms,
          this.config.transports.s3.compression
        )
      );
    }

    // CloudWatch transport
    if (this.config.transports.cloudwatch?.enabled) {
      this.transports.push(
        new CloudWatchAuditTransport(
          this.config.transports.cloudwatch.log_group,
          this.config.transports.cloudwatch.log_stream_prefix,
          this.config.transports.cloudwatch.region,
          this.config.performance?.batch_size,
          this.config.performance?.batch_timeout_ms
        )
      );
    }

    // GitLab Audit Events transport
    if ((this.config.transports as any).gitlab_audit_events?.enabled) {
      const gitlabConfig = (this.config.transports as any).gitlab_audit_events;
      this.transports.push(
        new GitLabAuditEventsTransport(
          gitlabConfig.gitlab_url,
          gitlabConfig.gitlab_token,
          gitlabConfig.project_id,
          this.config.performance?.batch_size,
          this.config.performance?.batch_timeout_ms
        )
      );
    }
  }

  /**
   * Log an audit event
   */
  async log(event: Partial<AuditEvent>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Build complete event
    const fullEvent: AuditEvent = {
      timestamp: event.timestamp || new Date().toISOString(),
      trace_id: event.trace_id || randomUUID(),
      event_id: event.event_id || randomUUID(),
      agent_id: event.agent_id || 'unknown',
      action: event.action || 'unknown_action',
      category: event.category || AuditCategory.AGENT_ACTION,
      severity: event.severity || AuditSeverity.INFO,
      resource: event.resource || '',
      resource_type: event.resource_type || 'unknown',
      outcome: event.outcome || AuditOutcome.SUCCESS,
      duration_ms: event.duration_ms || 0,
      ...event,
    };

    // Apply filters
    if (!this.shouldLog(fullEvent)) {
      return;
    }

    // Sanitize data
    const sanitizedEvent = this.sanitizeEvent(fullEvent);

    // Buffer or write immediately
    if (this.config.performance?.async_logging) {
      this.bufferEvent(sanitizedEvent);
    } else {
      await this.writeEvent(sanitizedEvent);
    }
  }

  /**
   * Check if event should be logged based on filters
   */
  private shouldLog(event: AuditEvent): boolean {
    // Severity filter
    const severityOrder = {
      [AuditSeverity.DEBUG]: 0,
      [AuditSeverity.INFO]: 1,
      [AuditSeverity.WARN]: 2,
      [AuditSeverity.ERROR]: 3,
      [AuditSeverity.CRITICAL]: 4,
    };

    if (severityOrder[event.severity] < severityOrder[this.config.min_severity]) {
      return false;
    }

    // Category filters
    if (this.config.filters?.include_categories) {
      if (!this.config.filters.include_categories.includes(event.category)) {
        return false;
      }
    }

    if (this.config.filters?.exclude_categories) {
      if (this.config.filters.exclude_categories.includes(event.category)) {
        return false;
      }
    }

    // Agent filters
    if (this.config.filters?.include_agents) {
      if (!this.config.filters.include_agents.includes(event.agent_id)) {
        return false;
      }
    }

    if (this.config.filters?.exclude_agents) {
      if (this.config.filters.exclude_agents.includes(event.agent_id)) {
        return false;
      }
    }

    // Action filters
    if (this.config.filters?.include_actions) {
      if (!this.config.filters.include_actions.includes(event.action)) {
        return false;
      }
    }

    if (this.config.filters?.exclude_actions) {
      if (this.config.filters.exclude_actions.includes(event.action)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize sensitive data from event
   */
  private sanitizeEvent(event: AuditEvent): AuditEvent {
    if (!this.config.sanitization?.enabled) {
      return event;
    }

    const sanitized = { ...event };

    // Redact PII fields
    if (this.config.sanitization.pii_fields && sanitized.input) {
      sanitized.input = this.redactFields(
        sanitized.input,
        this.config.sanitization.pii_fields
      );
    }

    if (this.config.sanitization.pii_fields && sanitized.output) {
      sanitized.output = this.redactFields(
        sanitized.output,
        this.config.sanitization.pii_fields
      );
    }

    // Truncate large payloads
    if (this.config.sanitization.max_input_size && sanitized.input) {
      const inputStr = JSON.stringify(sanitized.input);
      if (inputStr.length > this.config.sanitization.max_input_size) {
        sanitized.input = {
          _truncated: true,
          _original_size: inputStr.length,
          _preview: inputStr.substring(0, this.config.sanitization.max_input_size),
        };
      }
    }

    if (this.config.sanitization.max_output_size && sanitized.output) {
      const outputStr = JSON.stringify(sanitized.output);
      if (outputStr.length > this.config.sanitization.max_output_size) {
        sanitized.output = {
          _truncated: true,
          _original_size: outputStr.length,
          _preview: outputStr.substring(0, this.config.sanitization.max_output_size),
        };
      }
    }

    return sanitized;
  }

  private redactFields(
    obj: Record<string, unknown>,
    fieldsToRedact: string[]
  ): Record<string, unknown> {
    const redacted = { ...obj };

    for (const field of fieldsToRedact) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  /**
   * Buffer event for async logging
   */
  private bufferEvent(event: AuditEvent): void {
    this.eventBuffer.push(event);

    const bufferSize = this.config.performance?.buffer_size || 1000;
    const batchSize = this.config.performance?.batch_size || 100;

    if (this.eventBuffer.length >= batchSize) {
      this.flushBuffer();
    } else if (!this.flushTimer) {
      const timeout = this.config.performance?.batch_timeout_ms || 5000;
      this.flushTimer = setTimeout(() => this.flushBuffer(), timeout);
    }

    // Prevent memory overflow
    if (this.eventBuffer.length > bufferSize) {
      console.warn(`Audit buffer overflow: dropping ${this.eventBuffer.length - bufferSize} events`);
      this.eventBuffer = this.eventBuffer.slice(-bufferSize);
    }
  }

  /**
   * Flush buffered events
   */
  private async flushBuffer(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.eventBuffer.length === 0) {
      return;
    }

    const eventsToWrite = [...this.eventBuffer];
    this.eventBuffer = [];

    await Promise.all(
      this.transports.map(transport => transport.writeBatch(eventsToWrite))
    );
  }

  /**
   * Write event immediately to all transports
   */
  private async writeEvent(event: AuditEvent): Promise<void> {
    await Promise.all(this.transports.map(transport => transport.write(event)));
  }

  /**
   * Query audit logs
   */
  async query(params: AuditQuery): Promise<AuditQueryResult> {
    // Use the first transport that supports querying
    for (const transport of this.transports) {
      if (transport.query) {
        return transport.query(params);
      }
    }

    throw new Error('No transport supports querying');
  }

  /**
   * Close all transports and flush buffers
   */
  async close(): Promise<void> {
    await this.flushBuffer();
    await Promise.all(
      this.transports.map(transport => (transport.close ? transport.close() : Promise.resolve()))
    );
  }
}
