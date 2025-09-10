/**
 * OSSA Telemetry Service
 * 
 * Main telemetry service orchestrating all components for real-time KPI monitoring,
 * scorecard tracking, and 99.97% uptime validation across 127 production agents.
 */

import { EventEmitter } from 'events';
import {
  TelemetryConfiguration,
  TelemetrySnapshot,
  TelemetryEvent,
  TelemetryHealthCheck,
  UptimeMetrics,
  AgentScorecard,
  TelemetryAlert,
  TelemetryDataPoint,
  KPIDefinition,
  KPICalculation
} from './types.js';
import { KPICollector } from './kpi-collector.js';
import { ScorecardSystem, ScorecardConfiguration } from './scorecard-system.js';
import { MonitoringEngine, MonitoringConfiguration } from './monitoring-engine.js';
import { TelemetryExportManager } from './exporters.js';

export interface TelemetryServiceConfiguration {
  telemetry: TelemetryConfiguration;
  scorecard: ScorecardConfiguration;
  monitoring: MonitoringConfiguration;
}

export interface TelemetryServiceStatus {
  isRunning: boolean;
  uptime: number;
  components: {
    kpiCollector: boolean;
    scorecardSystem: boolean;
    monitoringEngine: boolean;
    exportManager: boolean;
  };
  statistics: {
    totalAgents: number;
    activeAgents: number;
    totalMetrics: number;
    activeAlerts: number;
    overallUptime: number;
  };
  lastUpdate: Date;
}

export class TelemetryService extends EventEmitter {
  private config: TelemetryServiceConfiguration;
  private kpiCollector: KPICollector;
  private scorecardSystem: ScorecardSystem;
  private monitoringEngine: MonitoringEngine;
  private exportManager: TelemetryExportManager;
  
  private isRunning: boolean = false;
  private startTime?: Date;
  private healthCheckInterval?: NodeJS.Timer;
  private snapshotInterval?: NodeJS.Timer;

  constructor(config: TelemetryServiceConfiguration) {
    super();
    this.config = config;
    this.initializeComponents();
    this.setupEventHandlers();
  }

  /**
   * Start the telemetry service
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Telemetry Service is already running');
    }

    console.log('[Telemetry Service] Starting OSSA Telemetry System...');
    console.log('[Telemetry Service] Target: 99.97% uptime across 127 production agents');
    
    this.startTime = new Date();

    try {
      // Start components in order
      console.log('[Telemetry Service] Starting KPI Collector...');
      await this.kpiCollector.start();

      console.log('[Telemetry Service] Starting Scorecard System...');
      await this.scorecardSystem.start();

      console.log('[Telemetry Service] Starting Monitoring Engine...');
      await this.monitoringEngine.start();

      console.log('[Telemetry Service] Starting Export Manager...');
      await this.exportManager.start();

      // Start health check interval
      this.startHealthCheckInterval();
      
      // Start snapshot interval
      this.startSnapshotInterval();

      this.isRunning = true;
      console.log('[Telemetry Service] ✅ OSSA Telemetry System started successfully');

      // Emit service started event
      this.emit('service_started', {
        timestamp: new Date(),
        config: this.config
      });

    } catch (error) {
      console.error('[Telemetry Service] ❌ Failed to start telemetry service:', error);
      await this.stop();
      throw error;
    }
  }

  /**
   * Stop the telemetry service
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[Telemetry Service] Stopping OSSA Telemetry System...');

    try {
      // Stop intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.snapshotInterval) {
        clearInterval(this.snapshotInterval);
      }

      // Stop components in reverse order
      console.log('[Telemetry Service] Stopping Export Manager...');
      await this.exportManager.stop();

      console.log('[Telemetry Service] Stopping Monitoring Engine...');
      await this.monitoringEngine.stop();

      console.log('[Telemetry Service] Stopping Scorecard System...');
      await this.scorecardSystem.stop();

      console.log('[Telemetry Service] Stopping KPI Collector...');
      await this.kpiCollector.stop();

      this.isRunning = false;
      console.log('[Telemetry Service] ✅ OSSA Telemetry System stopped successfully');

      // Emit service stopped event
      this.emit('service_stopped', {
        timestamp: new Date(),
        uptime: this.getUptime()
      });

    } catch (error) {
      console.error('[Telemetry Service] ❌ Error stopping telemetry service:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  public getStatus(): TelemetryServiceStatus {
    const systemStats = this.scorecardSystem?.getSystemStats() || {
      totalAgents: 0,
      activeAgents: 0,
      averageSLACompliance: 0
    };
    const kpiStats = this.kpiCollector?.getSystemStats() || { totalMetrics: 0 };
    const activeAlerts = this.monitoringEngine?.getActiveAlerts() || [];

    return {
      isRunning: this.isRunning,
      uptime: this.getUptime(),
      components: {
        kpiCollector: this.kpiCollector !== undefined,
        scorecardSystem: this.scorecardSystem !== undefined,
        monitoringEngine: this.monitoringEngine !== undefined,
        exportManager: this.exportManager !== undefined
      },
      statistics: {
        totalAgents: systemStats.totalAgents,
        activeAgents: systemStats.activeAgents,
        totalMetrics: kpiStats.totalMetrics,
        activeAlerts: activeAlerts.length,
        overallUptime: systemStats.averageSLACompliance || 0
      },
      lastUpdate: new Date()
    };
  }

  /**
   * Get current telemetry snapshot
   */
  public async getSnapshot(): Promise<TelemetrySnapshot> {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    return {
      timestamp: new Date(),
      scorecards: this.scorecardSystem.getAllScorecards(),
      kpis: this.kpiCollector.getAllKPIs(),
      uptime: this.monitoringEngine.getUptimeMetrics(),
      health: this.monitoringEngine.getSystemHealth()!,
      recentAlerts: this.monitoringEngine.getAlertHistory(10)
    };
  }

  /**
   * Register a new agent
   */
  public registerAgent(agentId: string, agentName: string): void {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    this.scorecardSystem.registerAgent(agentId, agentName);
    console.log(`[Telemetry Service] Registered agent: ${agentName} (${agentId})`);
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(agentId: string): void {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    this.scorecardSystem.unregisterAgent(agentId);
    console.log(`[Telemetry Service] Unregistered agent: ${agentId}`);
  }

  /**
   * Record a metric
   */
  public recordMetric(dataPoint: TelemetryDataPoint): void {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    this.kpiCollector.recordMetric(dataPoint);
  }

  /**
   * Record multiple metrics
   */
  public recordMetrics(dataPoints: TelemetryDataPoint[]): void {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    this.kpiCollector.recordMetricsBatch(dataPoints);
  }

  /**
   * Get agent scorecard
   */
  public getAgentScorecard(agentId: string): AgentScorecard | undefined {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    return this.scorecardSystem.getScorecard(agentId);
  }

  /**
   * Get all agent scorecards
   */
  public getAllScorecards(): AgentScorecard[] {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    return this.scorecardSystem.getAllScorecards();
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): TelemetryAlert[] {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    return this.monitoringEngine.getActiveAlerts();
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string, comment?: string): boolean {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    return this.monitoringEngine.acknowledgeAlert(alertId, acknowledgedBy, comment);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string, resolvedBy: string, resolution?: string): boolean {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    return this.monitoringEngine.resolveAlert(alertId, resolvedBy, resolution);
  }

  /**
   * Perform 127-agent validation
   */
  public async validate127Agents(): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    console.log('[Telemetry Service] Running validation across 127 production agents...');
    const results = await this.scorecardSystem.validateAll127Agents();
    
    console.log(`[Telemetry Service] Validation completed:`);
    console.log(`  - Total agents validated: ${results.validatedAgents}/127`);
    console.log(`  - Overall compliance: ${results.overallCompliance.toFixed(2)}%`);
    console.log(`  - Issues found: ${results.issues.length}`);

    return results;
  }

  /**
   * Force export current data
   */
  public async forceExport(): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Telemetry Service is not running');
    }

    console.log('[Telemetry Service] Forcing data export...');
    const results = await this.exportManager.exportSnapshot();
    
    console.log(`[Telemetry Service] Export completed:`);
    results.forEach(result => {
      console.log(`  - ${result.exporter}: ${result.success ? '✅' : '❌'} (${result.exportedCount} items)`);
    });

    return results;
  }

  /**
   * Get comprehensive health report
   */
  public getHealthReport(): {
    service: TelemetryServiceStatus;
    system: TelemetryHealthCheck | undefined;
    uptime: UptimeMetrics;
    agents: {
      total: number;
      healthy: number;
      warning: number;
      critical: number;
      offline: number;
    };
    alerts: {
      active: number;
      critical: number;
      warning: number;
    };
    exporters: Record<string, any>;
  } {
    const serviceStatus = this.getStatus();
    const systemHealth = this.monitoringEngine?.getSystemHealth();
    const uptimeMetrics = this.monitoringEngine?.getUptimeMetrics();
    const systemStats = this.scorecardSystem?.getSystemStats();
    const activeAlerts = this.monitoringEngine?.getActiveAlerts() || [];
    const exportStats = this.exportManager?.getExportStats() || {};

    return {
      service: serviceStatus,
      system: systemHealth,
      uptime: uptimeMetrics || {
        overallUptime: 0,
        slaTarget: 99.97,
        periodStart: new Date(),
        totalDowntime: 0,
        incidentCount: 0,
        mttr: 0,
        mtbf: 0
      },
      agents: systemStats ? {
        total: systemStats.totalAgents,
        healthy: systemStats.healthyAgents,
        warning: systemStats.warningAgents,
        critical: systemStats.criticalAgents,
        offline: systemStats.offlineAgents
      } : {
        total: 0, healthy: 0, warning: 0, critical: 0, offline: 0
      },
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warning: activeAlerts.filter(a => a.severity === 'warning').length
      },
      exporters: exportStats
    };
  }

  /**
   * Initialize all components
   */
  private initializeComponents(): void {
    console.log('[Telemetry Service] Initializing components...');

    // Initialize KPI Collector
    this.kpiCollector = new KPICollector(this.config.telemetry);

    // Initialize Scorecard System
    this.scorecardSystem = new ScorecardSystem(
      this.kpiCollector,
      this.config.scorecard,
      this.config.telemetry
    );

    // Initialize Monitoring Engine
    this.monitoringEngine = new MonitoringEngine(
      this.kpiCollector,
      this.scorecardSystem,
      this.config.monitoring,
      this.config.telemetry
    );

    // Initialize Export Manager
    this.exportManager = new TelemetryExportManager(
      this.kpiCollector,
      this.scorecardSystem,
      this.monitoringEngine,
      this.config.telemetry
    );

    console.log('[Telemetry Service] Components initialized');
  }

  /**
   * Setup event handlers between components
   */
  private setupEventHandlers(): void {
    // Forward events from components
    this.kpiCollector.on('telemetry_event', (event: TelemetryEvent) => {
      this.emit('telemetry_event', event);
    });

    this.scorecardSystem.on('telemetry_event', (event: TelemetryEvent) => {
      this.emit('telemetry_event', event);
    });

    this.monitoringEngine.on('telemetry_event', (event: TelemetryEvent) => {
      this.emit('telemetry_event', event);
    });

    // Handle critical system events
    this.monitoringEngine.on('alert_triggered', (alert: TelemetryAlert) => {
      if (alert.severity === 'emergency' || alert.severity === 'critical') {
        console.warn(`[Telemetry Service] 🚨 ${alert.severity.toUpperCase()} ALERT: ${alert.title}`);
      }
    });

    console.log('[Telemetry Service] Event handlers setup complete');
  }

  /**
   * Start health check interval
   */
  private startHealthCheckInterval(): void {
    this.healthCheckInterval = setInterval(() => {
      try {
        const status = this.getStatus();
        this.emit('health_check', status);
        
        // Log periodic status
        if (status.statistics.totalAgents > 0) {
          console.log(`[Telemetry Service] Status: ${status.statistics.activeAgents}/${status.statistics.totalAgents} agents active, ${status.statistics.overallUptime.toFixed(2)}% uptime`);
        }
      } catch (error) {
        console.error('[Telemetry Service] Health check error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start snapshot interval
   */
  private startSnapshotInterval(): void {
    this.snapshotInterval = setInterval(async () => {
      try {
        const snapshot = await this.getSnapshot();
        this.emit('snapshot', snapshot);
      } catch (error) {
        console.error('[Telemetry Service] Snapshot error:', error);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Get service uptime in seconds
   */
  private getUptime(): number {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Create default configuration
   */
  public static createDefaultConfiguration(): TelemetryServiceConfiguration {
    const defaultKPIs: KPIDefinition[] = [
      {
        id: 'agent_availability',
        name: 'Agent Availability',
        description: 'Percentage of time agents are available and responsive',
        target: 99.97,
        critical: 99.0,
        warning: 99.5,
        unit: '%',
        calculation: KPICalculation.UPTIME,
        updateInterval: 30000,
        tags: ['sla', 'availability']
      },
      {
        id: 'system_response_time',
        name: 'System Response Time',
        description: 'Average response time across all agents',
        target: 100,
        critical: 1000,
        warning: 500,
        unit: 'ms',
        calculation: KPICalculation.AVG,
        updateInterval: 30000,
        tags: ['performance']
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        description: 'Percentage of requests that result in errors',
        target: 0.1,
        critical: 5.0,
        warning: 1.0,
        unit: '%',
        calculation: KPICalculation.RATE,
        updateInterval: 60000,
        tags: ['reliability']
      }
    ];

    return {
      telemetry: {
        system: {
          enabled: true,
          collectionInterval: 30000,
          retentionDays: 30,
          maxMetricsPerAgent: 10000
        },
        kpis: defaultKPIs,
        alerts: {
          enabled: true,
          channels: [],
          rules: []
        },
        exports: {
          prometheus: {
            enabled: false,
            port: 9090,
            path: '/metrics'
          },
          influxdb: {
            enabled: false,
            url: 'http://localhost:8086',
            database: 'ossa_telemetry',
            measurement: 'metrics'
          },
          webhook: {
            enabled: false,
            url: 'http://localhost:8080/webhook',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            format: 'json'
          }
        }
      },
      scorecard: {
        weights: {
          availability: 0.4,
          performance: 0.3,
          reliability: 0.2,
          compliance: 0.1
        },
        validationRules: [],
        slaTarget: 99.97,
        updateInterval: 60000,
        alertThresholds: {
          critical: 70,
          warning: 85
        }
      },
      monitoring: {
        slaTarget: 99.97,
        checkInterval: 30000,
        alertingEnabled: true,
        incidentManagement: true,
        breachThresholds: {
          availability: 99.0,
          performance: 80,
          reliability: 85
        },
        escalationRules: {
          criticalAfter: 15,
          emergencyAfter: 60
        }
      }
    };
  }
}