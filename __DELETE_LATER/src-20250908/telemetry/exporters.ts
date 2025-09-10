/**
 * OSSA Telemetry Data Exporters
 * 
 * Comprehensive data export system supporting Prometheus, InfluxDB, and custom
 * integrations for real-time KPI monitoring and external system integration.
 */

import { EventEmitter } from 'events';
import {
  TelemetryMetric,
  TelemetryDataPoint,
  TelemetrySnapshot,
  TelemetryConfiguration,
  AgentScorecard,
  UptimeMetrics,
  TelemetryHealthCheck
} from './types.js';
import { KPICollector } from './kpi-collector.js';
import { ScorecardSystem } from './scorecard-system.js';
import { MonitoringEngine } from './monitoring-engine.js';

export interface ExportConfiguration {
  enabled: boolean;
  interval: number; // Export interval in milliseconds
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface PrometheusExporter {
  enabled: boolean;
  port: number;
  path: string;
  labels: Record<string, string>;
  customMetrics?: string[];
}

export interface InfluxDBExporter {
  enabled: boolean;
  url: string;
  database: string;
  measurement: string;
  username?: string;
  password?: string;
  retention?: string;
  precision?: 'ns' | 'ms' | 's';
}

export interface WebhookExporter {
  enabled: boolean;
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  format: 'json' | 'ndjson' | 'csv';
  authentication?: {
    type: 'bearer' | 'basic' | 'api_key';
    credentials: Record<string, string>;
  };
}

export interface ExportResult {
  success: boolean;
  exportedCount: number;
  errors: string[];
  timestamp: Date;
  duration: number;
  exporter: string;
}

export class TelemetryExportManager extends EventEmitter {
  private kpiCollector: KPICollector;
  private scorecardSystem: ScorecardSystem;
  private monitoringEngine: MonitoringEngine;
  private config: TelemetryConfiguration;
  
  private exporters: Map<string, any> = new Map();
  private exportIntervals: Map<string, NodeJS.Timer> = new Map();
  private isRunning: boolean = false;
  private exportQueue: TelemetryDataPoint[] = [];

  constructor(
    kpiCollector: KPICollector,
    scorecardSystem: ScorecardSystem,
    monitoringEngine: MonitoringEngine,
    config: TelemetryConfiguration
  ) {
    super();
    this.kpiCollector = kpiCollector;
    this.scorecardSystem = scorecardSystem;
    this.monitoringEngine = monitoringEngine;
    this.config = config;
    this.initializeExporters();
  }

  /**
   * Start the export manager
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Export Manager is already running');
    }

    console.log('[Export Manager] Starting telemetry data exporters...');
    
    // Start all enabled exporters
    for (const [name, exporter] of this.exporters) {
      if (exporter.config.enabled) {
        await this.startExporter(name, exporter);
      }
    }

    this.isRunning = true;
    console.log(`[Export Manager] Started ${this.exporters.size} exporters`);
  }

  /**
   * Stop the export manager
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[Export Manager] Stopping telemetry exporters...');
    
    // Stop all exporters
    for (const [name, interval] of this.exportIntervals) {
      clearInterval(interval);
    }
    this.exportIntervals.clear();

    // Stop individual exporters
    for (const [name, exporter] of this.exporters) {
      if (exporter.stop) {
        await exporter.stop();
      }
    }

    this.isRunning = false;
    console.log('[Export Manager] Export manager stopped');
  }

  /**
   * Export current telemetry snapshot
   */
  public async exportSnapshot(): Promise<ExportResult[]> {
    const snapshot = await this.createTelemetrySnapshot();
    const results: ExportResult[] = [];

    for (const [name, exporter] of this.exporters) {
      if (!exporter.config.enabled) continue;

      try {
        const result = await exporter.exportSnapshot(snapshot);
        results.push(result);
      } catch (error) {
        console.error(`[Export Manager] Error exporting snapshot via ${name}:`, error);
        results.push({
          success: false,
          exportedCount: 0,
          errors: [error.message],
          timestamp: new Date(),
          duration: 0,
          exporter: name
        });
      }
    }

    return results;
  }

  /**
   * Export metrics batch
   */
  public async exportMetricsBatch(metrics: TelemetryDataPoint[]): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const [name, exporter] of this.exporters) {
      if (!exporter.config.enabled) continue;

      try {
        const result = await exporter.exportMetrics(metrics);
        results.push(result);
      } catch (error) {
        console.error(`[Export Manager] Error exporting metrics via ${name}:`, error);
        results.push({
          success: false,
          exportedCount: 0,
          errors: [error.message],
          timestamp: new Date(),
          duration: 0,
          exporter: name
        });
      }
    }

    return results;
  }

  /**
   * Get export statistics
   */
  public getExportStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [name, exporter] of this.exporters) {
      stats[name] = {
        enabled: exporter.config.enabled,
        lastExport: exporter.lastExport || null,
        totalExports: exporter.totalExports || 0,
        totalErrors: exporter.totalErrors || 0,
        successRate: exporter.totalExports > 0 ? 
          ((exporter.totalExports - exporter.totalErrors) / exporter.totalExports) * 100 : 0
      };
    }

    return stats;
  }

  /**
   * Initialize all exporters
   */
  private initializeExporters(): void {
    // Initialize Prometheus exporter
    if (this.config.exports.prometheus) {
      this.exporters.set('prometheus', new PrometheusExporterImpl(this.config.exports.prometheus));
    }

    // Initialize InfluxDB exporter
    if (this.config.exports.influxdb) {
      this.exporters.set('influxdb', new InfluxDBExporterImpl(this.config.exports.influxdb));
    }

    // Initialize Webhook exporter
    if (this.config.exports.webhook) {
      this.exporters.set('webhook', new WebhookExporterImpl(this.config.exports.webhook));
    }

    console.log(`[Export Manager] Initialized ${this.exporters.size} exporters`);
  }

  /**
   * Start a specific exporter
   */
  private async startExporter(name: string, exporter: any): Promise<void> {
    try {
      if (exporter.start) {
        await exporter.start();
      }

      // Set up export interval
      const interval = setInterval(async () => {
        try {
          const snapshot = await this.createTelemetrySnapshot();
          await exporter.exportSnapshot(snapshot);
          exporter.totalExports = (exporter.totalExports || 0) + 1;
          exporter.lastExport = new Date();
        } catch (error) {
          console.error(`[Export Manager] Error in ${name} export cycle:`, error);
          exporter.totalErrors = (exporter.totalErrors || 0) + 1;
        }
      }, exporter.config.interval || 60000);

      this.exportIntervals.set(name, interval);
      console.log(`[Export Manager] Started ${name} exporter`);
    } catch (error) {
      console.error(`[Export Manager] Failed to start ${name} exporter:`, error);
    }
  }

  /**
   * Create a comprehensive telemetry snapshot
   */
  private async createTelemetrySnapshot(): Promise<TelemetrySnapshot> {
    const timestamp = new Date();
    
    return {
      timestamp,
      scorecards: this.scorecardSystem.getAllScorecards(),
      kpis: this.kpiCollector.getAllKPIs(),
      uptime: this.monitoringEngine.getUptimeMetrics(),
      health: this.monitoringEngine.getSystemHealth()!,
      recentAlerts: this.monitoringEngine.getAlertHistory(10)
    };
  }
}

/**
 * Prometheus Exporter Implementation
 */
class PrometheusExporterImpl {
  public config: PrometheusExporter & ExportConfiguration;
  public lastExport?: Date;
  public totalExports: number = 0;
  public totalErrors: number = 0;
  private metricsRegistry: Map<string, any> = new Map();
  private server?: any;

  constructor(config: PrometheusExporter) {
    this.config = {
      ...config,
      interval: 30000, // 30 seconds
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 5000
    };
  }

  public async start(): Promise<void> {
    // Start Prometheus metrics server
    const express = await import('express');
    const app = express.default();

    app.get(this.config.path, (req, res) => {
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(this.generatePrometheusMetrics());
    });

    this.server = app.listen(this.config.port, () => {
      console.log(`[Prometheus Exporter] Metrics server listening on port ${this.config.port}`);
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
  }

  public async exportSnapshot(snapshot: TelemetrySnapshot): Promise<ExportResult> {
    const startTime = Date.now();
    let exportedCount = 0;
    const errors: string[] = [];

    try {
      // Update metrics registry with snapshot data
      this.updateMetricsFromSnapshot(snapshot);
      exportedCount = this.metricsRegistry.size;
      
      return {
        success: true,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'prometheus'
      };
    } catch (error) {
      errors.push(error.message);
      return {
        success: false,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'prometheus'
      };
    }
  }

  public async exportMetrics(metrics: TelemetryDataPoint[]): Promise<ExportResult> {
    const startTime = Date.now();
    let exportedCount = 0;
    const errors: string[] = [];

    try {
      for (const metric of metrics) {
        this.addMetricToRegistry(metric);
        exportedCount++;
      }

      return {
        success: true,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'prometheus'
      };
    } catch (error) {
      errors.push(error.message);
      return {
        success: false,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'prometheus'
      };
    }
  }

  private updateMetricsFromSnapshot(snapshot: TelemetrySnapshot): void {
    // Update system health metrics
    this.metricsRegistry.set('ossa_system_health', {
      value: snapshot.health.status === 'healthy' ? 1 : 0,
      labels: { status: snapshot.health.status },
      help: 'OSSA system health status (1=healthy, 0=degraded/unhealthy)'
    });

    // Update uptime metrics
    this.metricsRegistry.set('ossa_uptime_percentage', {
      value: snapshot.uptime.overallUptime,
      labels: {},
      help: 'Overall system uptime percentage'
    });

    // Update agent metrics
    for (const scorecard of snapshot.scorecards) {
      const labels = { agent_id: scorecard.agentId, agent_name: scorecard.agentName };
      
      this.metricsRegistry.set(`ossa_agent_health_score_${scorecard.agentId}`, {
        value: scorecard.healthScore,
        labels,
        help: 'Agent health score (0-100)'
      });

      this.metricsRegistry.set(`ossa_agent_availability_${scorecard.agentId}`, {
        value: scorecard.metrics.availability,
        labels,
        help: 'Agent availability score'
      });
    }

    // Update KPIs
    for (const [kpiId, value] of Object.entries(snapshot.kpis)) {
      this.metricsRegistry.set(`ossa_kpi_${kpiId}`, {
        value,
        labels: { kpi: kpiId },
        help: `OSSA KPI: ${kpiId}`
      });
    }
  }

  private addMetricToRegistry(metric: TelemetryDataPoint): void {
    const key = `ossa_metric_${metric.metricId}${metric.agentId ? '_' + metric.agentId : ''}`;
    this.metricsRegistry.set(key, {
      value: metric.value,
      labels: { 
        metric_id: metric.metricId,
        ...(metric.agentId && { agent_id: metric.agentId }),
        ...(metric.labels || {})
      },
      help: `OSSA metric: ${metric.metricId}`
    });
  }

  private generatePrometheusMetrics(): string {
    const lines: string[] = [];

    for (const [name, metric] of this.metricsRegistry) {
      // Add help comment
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} gauge`);
      
      // Add metric line with labels
      const labelPairs = Object.entries(metric.labels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      
      const labelString = labelPairs ? `{${labelPairs}}` : '';
      lines.push(`${name}${labelString} ${metric.value} ${Date.now()}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * InfluxDB Exporter Implementation
 */
class InfluxDBExporterImpl {
  public config: InfluxDBExporter & ExportConfiguration;
  public lastExport?: Date;
  public totalExports: number = 0;
  public totalErrors: number = 0;

  constructor(config: InfluxDBExporter) {
    this.config = {
      ...config,
      interval: 60000, // 1 minute
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 5000,
      precision: config.precision || 'ms'
    };
  }

  public async exportSnapshot(snapshot: TelemetrySnapshot): Promise<ExportResult> {
    const startTime = Date.now();
    let exportedCount = 0;
    const errors: string[] = [];

    try {
      const points = this.convertSnapshotToInfluxPoints(snapshot);
      await this.writePoints(points);
      exportedCount = points.length;

      return {
        success: true,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'influxdb'
      };
    } catch (error) {
      errors.push(error.message);
      return {
        success: false,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'influxdb'
      };
    }
  }

  public async exportMetrics(metrics: TelemetryDataPoint[]): Promise<ExportResult> {
    const startTime = Date.now();
    let exportedCount = 0;
    const errors: string[] = [];

    try {
      const points = metrics.map(m => this.convertMetricToInfluxPoint(m));
      await this.writePoints(points);
      exportedCount = points.length;

      return {
        success: true,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'influxdb'
      };
    } catch (error) {
      errors.push(error.message);
      return {
        success: false,
        exportedCount,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'influxdb'
      };
    }
  }

  private convertSnapshotToInfluxPoints(snapshot: TelemetrySnapshot): string[] {
    const points: string[] = [];
    const timestamp = this.formatTimestamp(snapshot.timestamp);

    // System health point
    points.push(
      `${this.config.measurement},type=system_health value=${snapshot.health.status === 'healthy' ? 1 : 0} ${timestamp}`
    );

    // Uptime point
    points.push(
      `${this.config.measurement},type=uptime value=${snapshot.uptime.overallUptime} ${timestamp}`
    );

    // Agent scorecard points
    for (const scorecard of snapshot.scorecards) {
      const tags = `type=agent_scorecard,agent_id=${scorecard.agentId},agent_name=${scorecard.agentName.replace(' ', '_')}`;
      points.push(`${this.config.measurement},${tags} health_score=${scorecard.healthScore},availability=${scorecard.metrics.availability},performance=${scorecard.metrics.performance} ${timestamp}`);
    }

    // KPI points
    for (const [kpiId, value] of Object.entries(snapshot.kpis)) {
      points.push(`${this.config.measurement},type=kpi,kpi_id=${kpiId} value=${value} ${timestamp}`);
    }

    return points;
  }

  private convertMetricToInfluxPoint(metric: TelemetryDataPoint): string {
    const tags = [`type=metric`, `metric_id=${metric.metricId}`];
    if (metric.agentId) {
      tags.push(`agent_id=${metric.agentId}`);
    }
    
    // Add labels as tags
    if (metric.labels) {
      for (const [key, value] of Object.entries(metric.labels)) {
        tags.push(`${key}=${value}`);
      }
    }

    const tagString = tags.join(',');
    const timestamp = this.formatTimestamp(metric.timestamp);

    return `${this.config.measurement},${tagString} value=${metric.value} ${timestamp}`;
  }

  private formatTimestamp(date: Date): string {
    switch (this.config.precision) {
      case 'ns':
        return (date.getTime() * 1000000).toString();
      case 's':
        return Math.floor(date.getTime() / 1000).toString();
      case 'ms':
      default:
        return date.getTime().toString();
    }
  }

  private async writePoints(points: string[]): Promise<void> {
    if (points.length === 0) return;

    const body = points.join('\n');
    const url = `${this.config.url}/write?db=${this.config.database}&precision=${this.config.precision}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream'
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    // Use native fetch or axios for HTTP request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`InfluxDB write failed: ${response.status} ${response.statusText}`);
    }
  }
}

/**
 * Webhook Exporter Implementation
 */
class WebhookExporterImpl {
  public config: WebhookExporter & ExportConfiguration;
  public lastExport?: Date;
  public totalExports: number = 0;
  public totalErrors: number = 0;

  constructor(config: WebhookExporter) {
    this.config = {
      ...config,
      interval: 60000, // 1 minute
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000
    };
  }

  public async exportSnapshot(snapshot: TelemetrySnapshot): Promise<ExportResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      await this.sendWebhook(snapshot);

      return {
        success: true,
        exportedCount: 1,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'webhook'
      };
    } catch (error) {
      errors.push(error.message);
      return {
        success: false,
        exportedCount: 0,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'webhook'
      };
    }
  }

  public async exportMetrics(metrics: TelemetryDataPoint[]): Promise<ExportResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      await this.sendWebhook({ metrics, timestamp: new Date() });

      return {
        success: true,
        exportedCount: metrics.length,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'webhook'
      };
    } catch (error) {
      errors.push(error.message);
      return {
        success: false,
        exportedCount: 0,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        exporter: 'webhook'
      };
    }
  }

  private async sendWebhook(data: any): Promise<void> {
    const headers = { ...this.config.headers };

    // Add authentication headers
    if (this.config.authentication) {
      switch (this.config.authentication.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.authentication.credentials.token}`;
          break;
        case 'basic':
          const auth = Buffer.from(
            `${this.config.authentication.credentials.username}:${this.config.authentication.credentials.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
          break;
        case 'api_key':
          headers[this.config.authentication.credentials.header || 'X-API-Key'] = 
            this.config.authentication.credentials.key;
          break;
      }
    }

    // Format data based on config
    let body: string;
    switch (this.config.format) {
      case 'ndjson':
        body = JSON.stringify(data) + '\n';
        headers['Content-Type'] = 'application/x-ndjson';
        break;
      case 'csv':
        body = this.formatAsCSV(data);
        headers['Content-Type'] = 'text/csv';
        break;
      case 'json':
      default:
        body = JSON.stringify(data, null, 2);
        headers['Content-Type'] = 'application/json';
        break;
    }

    const response = await fetch(this.config.url, {
      method: this.config.method,
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private formatAsCSV(data: any): string {
    // Simple CSV formatting - would need enhancement for complex data
    if (data.metrics && Array.isArray(data.metrics)) {
      const headers = 'timestamp,metricId,value,agentId,labels\n';
      const rows = data.metrics.map((m: TelemetryDataPoint) => 
        `${m.timestamp.toISOString()},${m.metricId},${m.value},${m.agentId || ''},${JSON.stringify(m.labels || {})}`
      ).join('\n');
      return headers + rows;
    }
    
    return JSON.stringify(data);
  }
}