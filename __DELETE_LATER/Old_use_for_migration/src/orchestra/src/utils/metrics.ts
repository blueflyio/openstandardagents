/**
 * OSSA Orchestra v0.1.8 - Metrics Collector
 * Advanced metrics collection and aggregation for orchestration monitoring
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';

export class MetricsCollector extends EventEmitter {
  private logger: Logger;
  private metrics: Map<string, MetricEntry[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private timers: Map<string, Date> = new Map();
  private isInitialized = false;

  private readonly MAX_METRIC_HISTORY = 1000;
  private readonly CLEANUP_INTERVAL_MS = 300000; // 5 minutes
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = new Logger('MetricsCollector');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing Metrics Collector');
    
    // Start cleanup routine
    this.startCleanup();
    
    this.isInitialized = true;
    this.logger.info('Metrics Collector initialized');
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
    
    this.isInitialized = false;
    this.logger.info('Metrics Collector shutdown');
  }

  // Counter operations
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.createMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    this.recordMetric(name, value, 'counter', tags);
    this.emit('metric-updated', { type: 'counter', name, value: current + value, tags });
  }

  decrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.incrementCounter(name, -value, tags);
  }

  getCounter(name: string, tags?: Record<string, string>): number {
    const key = this.createMetricKey(name, tags);
    return this.counters.get(key) || 0;
  }

  // Gauge operations
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.createMetricKey(name, tags);
    this.gauges.set(key, value);
    
    this.recordMetric(name, value, 'gauge', tags);
    this.emit('metric-updated', { type: 'gauge', name, value, tags });
  }

  getGauge(name: string, tags?: Record<string, string>): number {
    const key = this.createMetricKey(name, tags);
    return this.gauges.get(key) || 0;
  }

  // Histogram operations
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.createMetricKey(name, tags);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    
    const values = this.histograms.get(key)!;
    values.push(value);
    
    // Keep only recent values
    if (values.length > this.MAX_METRIC_HISTORY) {
      values.shift();
    }
    
    this.recordMetric(name, value, 'histogram', tags);
    this.emit('metric-updated', { type: 'histogram', name, value, tags });
  }

  getHistogramStats(name: string, tags?: Record<string, string>): HistogramStats | null {
    const key = this.createMetricKey(name, tags);
    const values = this.histograms.get(key);
    
    if (!values || values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      count: values.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99)
    };
  }

  // Timer operations
  startTimer(name: string, tags?: Record<string, string>): string {
    const timerId = this.createMetricKey(name, tags) + '_' + Date.now();
    this.timers.set(timerId, new Date());
    return timerId;
  }

  endTimer(timerId: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(timerId);
    if (!startTime) {
      this.logger.warn(`Timer not found: ${timerId}`);
      return 0;
    }
    
    const duration = Date.now() - startTime.getTime();
    this.timers.delete(timerId);
    
    // Extract metric name from timer ID
    const name = timerId.split('_')[0];
    this.recordHistogram(name, duration, tags);
    
    return duration;
  }

  // Orchestration-specific metrics
  recordExecutionStart(executionId: string, workflowId: string): void {
    this.incrementCounter('orchestra.executions.started', 1, { workflow: workflowId });
    this.startTimer(`orchestra.execution.duration_${executionId}`, { workflow: workflowId });
  }

  recordExecutionEnd(executionId: string, workflowId: string, status: string): void {
    this.incrementCounter('orchestra.executions.completed', 1, { workflow: workflowId, status });
    const duration = this.endTimer(`orchestra.execution.duration_${executionId}`, { workflow: workflowId });
    this.recordHistogram('orchestra.execution.duration', duration, { workflow: workflowId });
  }

  recordStageExecution(stageId: string, agentId: string, duration: number, success: boolean): void {
    this.incrementCounter('orchestra.stages.executed', 1, { stage: stageId, agent: agentId });
    this.recordHistogram('orchestra.stage.duration', duration, { stage: stageId, agent: agentId });
    
    if (success) {
      this.incrementCounter('orchestra.stages.success', 1, { stage: stageId, agent: agentId });
    } else {
      this.incrementCounter('orchestra.stages.failed', 1, { stage: stageId, agent: agentId });
    }
  }

  recordAgentHealth(agentId: string, status: string, score: number): void {
    this.setGauge('orchestra.agent.health_score', score, { agent: agentId });
    this.incrementCounter('orchestra.agent.health_checks', 1, { agent: agentId, status });
  }

  recordScalingEvent(agentId: string, action: string, instances: number): void {
    this.incrementCounter('orchestra.scaling.events', 1, { agent: agentId, action });
    this.setGauge('orchestra.agent.instances', instances, { agent: agentId });
  }

  recordLoadBalancerSelection(agentId: string, strategy: string, responseTime: number): void {
    this.incrementCounter('orchestra.load_balancer.selections', 1, { agent: agentId, strategy });
    this.recordHistogram('orchestra.load_balancer.response_time', responseTime, { agent: agentId });
  }

  recordComplianceViolation(workflowId: string, policy: string, severity: string): void {
    this.incrementCounter('orchestra.compliance.violations', 1, { 
      workflow: workflowId, 
      policy, 
      severity 
    });
  }

  // Aggregated metrics
  async getMetrics(): Promise<MetricsSnapshot> {
    const snapshot: MetricsSnapshot = {
      timestamp: new Date(),
      counters: this.serializeCounters(),
      gauges: this.serializeGauges(),
      histograms: this.serializeHistograms(),
      summary: this.generateSummary()
    };
    
    return snapshot;
  }

  async getMetricsByPrefix(prefix: string): Promise<MetricsSnapshot> {
    const snapshot = await this.getMetrics();
    
    // Filter metrics by prefix
    const filteredCounters = Object.fromEntries(
      Object.entries(snapshot.counters).filter(([key]) => key.startsWith(prefix))
    );
    
    const filteredGauges = Object.fromEntries(
      Object.entries(snapshot.gauges).filter(([key]) => key.startsWith(prefix))
    );
    
    const filteredHistograms = Object.fromEntries(
      Object.entries(snapshot.histograms).filter(([key]) => key.startsWith(prefix))
    );
    
    return {
      timestamp: snapshot.timestamp,
      counters: filteredCounters,
      gauges: filteredGauges,
      histograms: filteredHistograms,
      summary: this.generateSummary()
    };
  }

  // Prometheus-style metrics export
  async exportPrometheusMetrics(): Promise<string> {
    let output = '';
    
    // Export counters
    for (const [key, value] of this.counters) {
      const { name, tags } = this.parseMetricKey(key);
      const tagsStr = tags ? this.formatPrometheusTags(tags) : '';
      output += `${name}_total${tagsStr} ${value}\n`;
    }
    
    // Export gauges
    for (const [key, value] of this.gauges) {
      const { name, tags } = this.parseMetricKey(key);
      const tagsStr = tags ? this.formatPrometheusTags(tags) : '';
      output += `${name}${tagsStr} ${value}\n`;
    }
    
    // Export histogram summaries
    for (const [key, values] of this.histograms) {
      const { name, tags } = this.parseMetricKey(key);
      const stats = this.calculateHistogramStats(values);
      const tagsStr = tags ? this.formatPrometheusTags(tags) : '';
      
      output += `${name}_count${tagsStr} ${stats.count}\n`;
      output += `${name}_sum${tagsStr} ${stats.sum}\n`;
      output += `${name}_avg${tagsStr} ${stats.avg}\n`;
      output += `${name}_p95${tagsStr} ${stats.p95}\n`;
      output += `${name}_p99${tagsStr} ${stats.p99}\n`;
    }
    
    return output;
  }

  private recordMetric(name: string, value: number, type: string, tags?: Record<string, string>): void {
    const key = name;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const entries = this.metrics.get(key)!;
    entries.push({
      timestamp: new Date(),
      value,
      type,
      tags: tags || {}
    });
    
    // Keep only recent entries
    if (entries.length > this.MAX_METRIC_HISTORY) {
      entries.shift();
    }
  }

  private createMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const sortedTags = Object.keys(tags)
      .sort()
      .map(key => `${key}:${tags[key]}`)
      .join(',');
    
    return `${name}{${sortedTags}}`;
  }

  private parseMetricKey(key: string): { name: string; tags?: Record<string, string> } {
    const bracketIndex = key.indexOf('{');
    
    if (bracketIndex === -1) {
      return { name: key };
    }
    
    const name = key.substring(0, bracketIndex);
    const tagsStr = key.substring(bracketIndex + 1, key.length - 1);
    
    const tags: Record<string, string> = {};
    if (tagsStr) {
      for (const tagPair of tagsStr.split(',')) {
        const [tagKey, tagValue] = tagPair.split(':');
        tags[tagKey] = tagValue;
      }
    }
    
    return { name, tags };
  }

  private percentile(sortedValues: number[], p: number): number {
    const index = (p * (sortedValues.length - 1));
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private calculateHistogramStats(values: number[]): HistogramStats {
    if (values.length === 0) {
      return { count: 0, sum: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      count: values.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99)
    };
  }

  private serializeCounters(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.counters) {
      result[key] = value;
    }
    return result;
  }

  private serializeGauges(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.gauges) {
      result[key] = value;
    }
    return result;
  }

  private serializeHistograms(): Record<string, HistogramStats> {
    const result: Record<string, HistogramStats> = {};
    for (const [key, values] of this.histograms) {
      result[key] = this.calculateHistogramStats(values);
    }
    return result;
  }

  private generateSummary(): MetricsSummary {
    return {
      totalCounters: this.counters.size,
      totalGauges: this.gauges.size,
      totalHistograms: this.histograms.size,
      totalMetricEntries: Array.from(this.metrics.values())
        .reduce((sum, entries) => sum + entries.length, 0),
      uptime: process.uptime() * 1000, // in milliseconds
      memoryUsage: process.memoryUsage()
    };
  }

  private formatPrometheusTags(tags: Record<string, string>): string {
    const tagPairs = Object.entries(tags)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `{${tagPairs}}`;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL_MS);
    
    this.logger.debug('Started metrics cleanup routine');
  }

  private performCleanup(): void {
    // Clean up old timer entries
    const now = Date.now();
    const staleThreshold = 3600000; // 1 hour
    
    for (const [timerId, startTime] of this.timers) {
      if (now - startTime.getTime() > staleThreshold) {
        this.timers.delete(timerId);
        this.logger.debug(`Cleaned up stale timer: ${timerId}`);
      }
    }
    
    // Clean up old metric entries
    for (const [name, entries] of this.metrics) {
      const cutoff = new Date(now - staleThreshold);
      const filteredEntries = entries.filter(entry => entry.timestamp > cutoff);
      
      if (filteredEntries.length !== entries.length) {
        this.metrics.set(name, filteredEntries);
        this.logger.debug(`Cleaned up ${entries.length - filteredEntries.length} old entries for metric: ${name}`);
      }
    }
  }
}

interface MetricEntry {
  timestamp: Date;
  value: number;
  type: string;
  tags: Record<string, string>;
}

interface HistogramStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface MetricsSnapshot {
  timestamp: Date;
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, HistogramStats>;
  summary: MetricsSummary;
}

interface MetricsSummary {
  totalCounters: number;
  totalGauges: number;
  totalHistograms: number;
  totalMetricEntries: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
}