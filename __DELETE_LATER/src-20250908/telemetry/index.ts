/**
 * OSSA Telemetry System - Main Entry Point
 * 
 * Complete telemetry solution for real-time KPI monitoring, scorecard tracking,
 * and 99.97% uptime validation across 127 production agents.
 */

// Core Components
export { TelemetryService, TelemetryServiceConfiguration, TelemetryServiceStatus } from './telemetry-service.js';
export { KPICollector } from './kpi-collector.js';
export { ScorecardSystem, ScorecardConfiguration } from './scorecard-system.js';
export { MonitoringEngine, MonitoringConfiguration } from './monitoring-engine.js';
export { TelemetryExportManager } from './exporters.js';

// Types and Interfaces
export * from './types.js';

// Default Configuration and Factory
export { createDefaultTelemetryService, TelemetryServiceFactory } from './factory.js';

/**
 * Main factory function for creating a telemetry service with default configuration
 */
export async function createTelemetryService(
  customConfig?: Partial<TelemetryServiceConfiguration>
): Promise<TelemetryService> {
  const { TelemetryService } = await import('./telemetry-service.js');
  const defaultConfig = TelemetryService.createDefaultConfiguration();
  
  // Merge custom configuration with defaults
  const config = customConfig ? mergeConfigurations(defaultConfig, customConfig) : defaultConfig;
  
  return new TelemetryService(config);
}

/**
 * Quick setup for production environment with 127 agents
 */
export async function createProductionTelemetryService(options: {
  prometheusPort?: number;
  influxdbUrl?: string;
  webhookUrl?: string;
  slaTarget?: number;
}): Promise<TelemetryService> {
  const config = TelemetryService.createDefaultConfiguration();
  
  // Production-specific configuration
  config.monitoring.slaTarget = options.slaTarget || 99.97;
  config.scorecard.slaTarget = options.slaTarget || 99.97;
  
  // Enable exporters for production
  if (options.prometheusPort) {
    config.telemetry.exports.prometheus = {
      enabled: true,
      port: options.prometheusPort,
      path: '/metrics',
      labels: { environment: 'production' }
    };
  }
  
  if (options.influxdbUrl) {
    config.telemetry.exports.influxdb = {
      enabled: true,
      url: options.influxdbUrl,
      database: 'ossa_production',
      measurement: 'agent_metrics',
      retention: '30d'
    };
  }
  
  if (options.webhookUrl) {
    config.telemetry.exports.webhook = {
      enabled: true,
      url: options.webhookUrl,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Environment': 'production'
      },
      format: 'json'
    };
  }
  
  return new TelemetryService(config);
}

/**
 * Development setup with minimal configuration
 */
export async function createDevelopmentTelemetryService(): Promise<TelemetryService> {
  const config = TelemetryService.createDefaultConfiguration();
  
  // Development-specific configuration
  config.telemetry.system.collectionInterval = 10000; // More frequent for development
  config.scorecard.updateInterval = 30000;
  config.monitoring.checkInterval = 10000;
  
  // Enable console logging for development
  config.telemetry.exports.prometheus = {
    enabled: true,
    port: 9091,
    path: '/metrics',
    labels: { environment: 'development' }
  };
  
  return new TelemetryService(config);
}

/**
 * Merge configuration objects deeply
 */
function mergeConfigurations(
  defaultConfig: TelemetryServiceConfiguration,
  customConfig: Partial<TelemetryServiceConfiguration>
): TelemetryServiceConfiguration {
  const result = JSON.parse(JSON.stringify(defaultConfig));
  
  if (customConfig.telemetry) {
    Object.assign(result.telemetry, customConfig.telemetry);
  }
  
  if (customConfig.scorecard) {
    Object.assign(result.scorecard, customConfig.scorecard);
  }
  
  if (customConfig.monitoring) {
    Object.assign(result.monitoring, customConfig.monitoring);
  }
  
  return result;
}

/**
 * Telemetry CLI Integration Functions
 */
export class TelemetryCLI {
  private service?: TelemetryService;
  
  /**
   * Initialize telemetry service
   */
  public async init(configPath?: string): Promise<void> {
    console.log('[Telemetry CLI] Initializing OSSA Telemetry System...');
    
    let config: TelemetryServiceConfiguration;
    
    if (configPath) {
      // Load configuration from file
      const fs = await import('fs');
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
    } else {
      // Use default configuration
      config = TelemetryService.createDefaultConfiguration();
    }
    
    this.service = new TelemetryService(config);
    console.log('[Telemetry CLI] Service initialized');
  }
  
  /**
   * Start the telemetry service
   */
  public async start(): Promise<void> {
    if (!this.service) {
      throw new Error('Telemetry service not initialized. Run init() first.');
    }
    
    await this.service.start();
  }
  
  /**
   * Stop the telemetry service
   */
  public async stop(): Promise<void> {
    if (this.service) {
      await this.service.stop();
    }
  }
  
  /**
   * Get service status
   */
  public getStatus(): TelemetryServiceStatus | null {
    return this.service ? this.service.getStatus() : null;
  }
  
  /**
   * Register agents from configuration
   */
  public async registerAgents(agents: Array<{ id: string; name: string }>): Promise<void> {
    if (!this.service) {
      throw new Error('Telemetry service not initialized');
    }
    
    console.log(`[Telemetry CLI] Registering ${agents.length} agents...`);
    
    for (const agent of agents) {
      this.service.registerAgent(agent.id, agent.name);
    }
    
    console.log(`[Telemetry CLI] Successfully registered ${agents.length} agents`);
  }
  
  /**
   * Register the standard 127 production agents
   */
  public async register127ProductionAgents(): Promise<void> {
    const agents = this.generate127AgentConfig();
    await this.registerAgents(agents);
  }
  
  /**
   * Perform validation across all agents
   */
  public async validate(): Promise<any> {
    if (!this.service) {
      throw new Error('Telemetry service not initialized');
    }
    
    return await this.service.validate127Agents();
  }
  
  /**
   * Force data export
   */
  public async export(): Promise<any> {
    if (!this.service) {
      throw new Error('Telemetry service not initialized');
    }
    
    return await this.service.forceExport();
  }
  
  /**
   * Get comprehensive health report
   */
  public getHealthReport(): any {
    if (!this.service) {
      throw new Error('Telemetry service not initialized');
    }
    
    return this.service.getHealthReport();
  }
  
  /**
   * Simulate metric data for testing
   */
  public async simulate(duration: number = 60000): Promise<void> {
    if (!this.service) {
      throw new Error('Telemetry service not initialized');
    }
    
    console.log(`[Telemetry CLI] Starting metric simulation for ${duration / 1000} seconds...`);
    
    const agents = this.generate127AgentConfig();
    const startTime = Date.now();
    
    const simulationInterval = setInterval(() => {
      // Generate random metrics for each agent
      const metrics: TelemetryDataPoint[] = [];
      
      agents.forEach(agent => {
        // Simulate various metrics
        metrics.push(
          {
            metricId: 'response_time',
            value: Math.random() * 200 + 50, // 50-250ms
            timestamp: new Date(),
            agentId: agent.id
          },
          {
            metricId: 'throughput',
            value: Math.random() * 100 + 10, // 10-110 req/s
            timestamp: new Date(),
            agentId: agent.id
          },
          {
            metricId: 'error_count',
            value: Math.random() < 0.95 ? 0 : Math.floor(Math.random() * 5), // 5% chance of errors
            timestamp: new Date(),
            agentId: agent.id
          },
          {
            metricId: 'uptime_percentage',
            value: Math.random() < 0.99 ? 100 : Math.random() * 10 + 90, // 1% chance of downtime
            timestamp: new Date(),
            agentId: agent.id
          }
        );
      });
      
      this.service!.recordMetrics(metrics);
      
      // Check if simulation should end
      if (Date.now() - startTime >= duration) {
        clearInterval(simulationInterval);
        console.log('[Telemetry CLI] Simulation completed');
      }
    }, 5000); // Every 5 seconds
  }
  
  /**
   * Generate configuration for 127 production agents
   */
  private generate127AgentConfig(): Array<{ id: string; name: string }> {
    const agents = [];
    
    // Generate 127 agents with realistic names
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ca-central-1'];
    const services = ['api', 'auth', 'data', 'ml', 'compute', 'storage', 'gateway'];
    const environments = ['prod', 'staging'];
    
    for (let i = 1; i <= 127; i++) {
      const region = regions[i % regions.length];
      const service = services[i % services.length];
      const env = environments[i % environments.length];
      const instance = String(i).padStart(3, '0');
      
      agents.push({
        id: `agent-${region}-${service}-${env}-${instance}`,
        name: `${service.toUpperCase()} Agent ${instance} (${region} ${env})`
      });
    }
    
    return agents;
  }
}

/**
 * Global telemetry CLI instance
 */
export const telemetryCLI = new TelemetryCLI();

/**
 * Version information
 */
export const VERSION = '0.1.8';
export const TELEMETRY_SYSTEM_NAME = 'OSSA Telemetry System';
export const TARGET_UPTIME = 99.97;
export const PRODUCTION_AGENT_COUNT = 127;