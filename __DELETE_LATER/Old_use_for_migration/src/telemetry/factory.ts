/**
 * OSSA Telemetry Service Factory
 * 
 * Factory functions for creating and configuring telemetry services
 * for different environments and use cases.
 */

import { TelemetryService, TelemetryServiceConfiguration } from './telemetry-service.js';
import { KPIDefinition, KPICalculation } from './types.js';

export interface TelemetryEnvironment {
  name: string;
  description: string;
  slaTarget: number;
  agentCount: number;
  monitoringInterval: number;
  retentionDays: number;
}

export const TELEMETRY_ENVIRONMENTS: Record<string, TelemetryEnvironment> = {
  production: {
    name: 'Production',
    description: '127 production agents with 99.97% uptime SLA',
    slaTarget: 99.97,
    agentCount: 127,
    monitoringInterval: 30000,
    retentionDays: 90
  },
  staging: {
    name: 'Staging',
    description: 'Pre-production environment for testing',
    slaTarget: 99.5,
    agentCount: 50,
    monitoringInterval: 60000,
    retentionDays: 30
  },
  development: {
    name: 'Development',
    description: 'Development environment with relaxed monitoring',
    slaTarget: 95.0,
    agentCount: 10,
    monitoringInterval: 10000,
    retentionDays: 7
  },
  testing: {
    name: 'Testing',
    description: 'Testing environment for validation',
    slaTarget: 90.0,
    agentCount: 5,
    monitoringInterval: 5000,
    retentionDays: 1
  }
};

export class TelemetryServiceFactory {
  /**
   * Create telemetry service for specific environment
   */
  public static create(environmentName: string, customConfig?: Partial<TelemetryServiceConfiguration>): TelemetryService {
    const environment = TELEMETRY_ENVIRONMENTS[environmentName];
    if (!environment) {
      throw new Error(`Unknown environment: ${environmentName}. Available: ${Object.keys(TELEMETRY_ENVIRONMENTS).join(', ')}`);
    }

    const baseConfig = this.createConfigurationForEnvironment(environment);
    const finalConfig = customConfig ? this.mergeConfigurations(baseConfig, customConfig) : baseConfig;
    
    return new TelemetryService(finalConfig);
  }

  /**
   * Create production telemetry service with 127 agents
   */
  public static createProduction(exportConfig?: {
    prometheus?: { port: number; path?: string };
    influxdb?: { url: string; database?: string };
    webhook?: { url: string; headers?: Record<string, string> };
  }): TelemetryService {
    const config = this.createConfigurationForEnvironment(TELEMETRY_ENVIRONMENTS.production);
    
    if (exportConfig) {
      if (exportConfig.prometheus) {
        config.telemetry.exports.prometheus = {
          enabled: true,
          port: exportConfig.prometheus.port,
          path: exportConfig.prometheus.path || '/metrics',
          labels: { environment: 'production' }
        };
      }
      
      if (exportConfig.influxdb) {
        config.telemetry.exports.influxdb = {
          enabled: true,
          url: exportConfig.influxdb.url,
          database: exportConfig.influxdb.database || 'ossa_production',
          measurement: 'agent_metrics',
          retention: '90d'
        };
      }
      
      if (exportConfig.webhook) {
        config.telemetry.exports.webhook = {
          enabled: true,
          url: exportConfig.webhook.url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...exportConfig.webhook.headers
          },
          format: 'json'
        };
      }
    }
    
    return new TelemetryService(config);
  }

  /**
   * Create development telemetry service
   */
  public static createDevelopment(): TelemetryService {
    const config = this.createConfigurationForEnvironment(TELEMETRY_ENVIRONMENTS.development);
    
    // Enable local Prometheus for development
    config.telemetry.exports.prometheus = {
      enabled: true,
      port: 9091,
      path: '/metrics',
      labels: { environment: 'development' }
    };
    
    return new TelemetryService(config);
  }

  /**
   * Create testing telemetry service
   */
  public static createTesting(): TelemetryService {
    return new TelemetryService(this.createConfigurationForEnvironment(TELEMETRY_ENVIRONMENTS.testing));
  }

  /**
   * Create configuration for specific environment
   */
  private static createConfigurationForEnvironment(environment: TelemetryEnvironment): TelemetryServiceConfiguration {
    return {
      telemetry: {
        system: {
          enabled: true,
          collectionInterval: environment.monitoringInterval,
          retentionDays: environment.retentionDays,
          maxMetricsPerAgent: Math.max(1000, environment.agentCount * 100)
        },
        kpis: this.createEnvironmentKPIs(environment),
        alerts: {
          enabled: true,
          channels: [],
          rules: this.createDefaultAlertRules(environment)
        },
        exports: {
          prometheus: { enabled: false, port: 9090, path: '/metrics' },
          influxdb: { enabled: false, url: '', database: '', measurement: 'metrics' },
          webhook: { enabled: false, url: '', method: 'POST', headers: {}, format: 'json' }
        }
      },
      scorecard: {
        weights: {
          availability: 0.4,
          performance: 0.3,
          reliability: 0.2,
          compliance: 0.1
        },
        validationRules: this.createValidationRules(environment),
        slaTarget: environment.slaTarget,
        updateInterval: environment.monitoringInterval,
        alertThresholds: {
          critical: environment.slaTarget * 0.8,
          warning: environment.slaTarget * 0.9
        }
      },
      monitoring: {
        slaTarget: environment.slaTarget,
        checkInterval: environment.monitoringInterval,
        alertingEnabled: true,
        incidentManagement: environment.name === 'Production',
        breachThresholds: {
          availability: environment.slaTarget * 0.95,
          performance: 80,
          reliability: 85
        },
        escalationRules: {
          criticalAfter: environment.name === 'Production' ? 5 : 15,
          emergencyAfter: environment.name === 'Production' ? 15 : 60
        }
      }
    };
  }

  /**
   * Create KPIs for specific environment
   */
  private static createEnvironmentKPIs(environment: TelemetryEnvironment): KPIDefinition[] {
    const baseKPIs: KPIDefinition[] = [
      {
        id: 'agent_availability',
        name: 'Agent Availability',
        description: 'Percentage of time agents are available and responsive',
        target: environment.slaTarget,
        critical: environment.slaTarget * 0.95,
        warning: environment.slaTarget * 0.98,
        unit: '%',
        calculation: KPICalculation.UPTIME,
        updateInterval: environment.monitoringInterval,
        tags: ['sla', 'availability']
      },
      {
        id: 'system_response_time',
        name: 'System Response Time',
        description: 'Average response time across all agents',
        target: environment.name === 'Production' ? 100 : 200,
        critical: environment.name === 'Production' ? 1000 : 2000,
        warning: environment.name === 'Production' ? 500 : 1000,
        unit: 'ms',
        calculation: KPICalculation.PERCENTILE_95,
        updateInterval: environment.monitoringInterval,
        tags: ['performance', 'latency']
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        description: 'Percentage of requests that result in errors',
        target: 0.1,
        critical: environment.name === 'Production' ? 2.0 : 5.0,
        warning: environment.name === 'Production' ? 0.5 : 2.0,
        unit: '%',
        calculation: KPICalculation.RATE,
        updateInterval: environment.monitoringInterval * 2,
        tags: ['reliability', 'errors']
      },
      {
        id: 'throughput',
        name: 'System Throughput',
        description: 'Total requests per second across all agents',
        target: environment.agentCount * 10,
        critical: environment.agentCount * 2,
        warning: environment.agentCount * 5,
        unit: 'req/s',
        calculation: KPICalculation.SUM,
        updateInterval: environment.monitoringInterval,
        tags: ['performance', 'throughput']
      }
    ];

    // Add environment-specific KPIs
    if (environment.name === 'Production') {
      baseKPIs.push({
        id: 'sla_compliance',
        name: 'SLA Compliance',
        description: '99.97% uptime SLA compliance tracking',
        target: 100,
        critical: 95,
        warning: 98,
        unit: '%',
        calculation: KPICalculation.AVG,
        updateInterval: environment.monitoringInterval,
        tags: ['sla', 'compliance', 'production']
      });
    }

    return baseKPIs;
  }

  /**
   * Create default alert rules for environment
   */
  private static createDefaultAlertRules(environment: TelemetryEnvironment): any[] {
    return [
      {
        id: 'availability_critical',
        name: 'Critical Availability Alert',
        kpiId: 'agent_availability',
        condition: {
          operator: 'lt',
          threshold: environment.slaTarget * 0.95,
          duration: 5
        },
        severity: 'critical',
        channels: ['email', 'slack'],
        enabled: true,
        cooldown: 15
      },
      {
        id: 'response_time_warning',
        name: 'Response Time Warning',
        kpiId: 'system_response_time',
        condition: {
          operator: 'gt',
          threshold: environment.name === 'Production' ? 500 : 1000,
          duration: 10
        },
        severity: 'warning',
        channels: ['slack'],
        enabled: true,
        cooldown: 30
      },
      {
        id: 'error_rate_critical',
        name: 'Error Rate Critical',
        kpiId: 'error_rate',
        condition: {
          operator: 'gt',
          threshold: environment.name === 'Production' ? 2.0 : 5.0,
          duration: 5
        },
        severity: 'critical',
        channels: ['email', 'slack', 'pagerduty'],
        enabled: true,
        cooldown: 10
      }
    ];
  }

  /**
   * Create validation rules for environment
   */
  private static createValidationRules(environment: TelemetryEnvironment): any[] {
    const rules = [
      {
        id: 'availability_validation',
        name: 'Availability Validation',
        description: 'Verify agent meets availability requirements',
        weight: 0.4,
        validator: function(scorecard: any, metrics: any[]) {
          const availability = scorecard.metrics.availability;
          if (availability >= environment.slaTarget) {
            return { score: 100, status: 'pass', details: 'Meets SLA requirements' };
          } else if (availability >= environment.slaTarget * 0.95) {
            return { score: 80, status: 'warning', details: 'Below SLA target but within tolerance' };
          } else {
            return { score: 0, status: 'fail', details: 'Critical availability issues' };
          }
        }
      },
      {
        id: 'performance_validation',
        name: 'Performance Validation',
        description: 'Verify agent performance metrics',
        weight: 0.3,
        validator: function(scorecard: any, metrics: any[]) {
          const performance = scorecard.metrics.performance;
          const threshold = environment.name === 'Production' ? 90 : 80;
          
          if (performance >= threshold) {
            return { score: 100, status: 'pass', details: 'Excellent performance' };
          } else if (performance >= threshold * 0.8) {
            return { score: 70, status: 'warning', details: 'Performance below expectations' };
          } else {
            return { score: 0, status: 'fail', details: 'Poor performance' };
          }
        }
      }
    ];

    // Add production-specific validation rules
    if (environment.name === 'Production') {
      rules.push({
        id: 'production_compliance',
        name: 'Production Compliance',
        description: 'Verify production-specific compliance requirements',
        weight: 0.2,
        validator: function(scorecard: any, metrics: any[]) {
          // Production agents must have been stable for at least 24 hours
          const uptime = scorecard.metrics.availability;
          const reliability = scorecard.metrics.reliability;
          
          if (uptime >= 99.97 && reliability >= 95) {
            return { score: 100, status: 'pass', details: 'Production ready' };
          } else {
            return { score: 0, status: 'fail', details: 'Not meeting production standards' };
          }
        }
      });
    }

    return rules;
  }

  /**
   * Merge configurations
   */
  private static mergeConfigurations(
    base: TelemetryServiceConfiguration,
    custom: Partial<TelemetryServiceConfiguration>
  ): TelemetryServiceConfiguration {
    const result = JSON.parse(JSON.stringify(base));
    
    if (custom.telemetry) {
      if (custom.telemetry.system) {
        Object.assign(result.telemetry.system, custom.telemetry.system);
      }
      if (custom.telemetry.kpis) {
        result.telemetry.kpis = custom.telemetry.kpis;
      }
      if (custom.telemetry.alerts) {
        Object.assign(result.telemetry.alerts, custom.telemetry.alerts);
      }
      if (custom.telemetry.exports) {
        Object.assign(result.telemetry.exports, custom.telemetry.exports);
      }
    }
    
    if (custom.scorecard) {
      Object.assign(result.scorecard, custom.scorecard);
    }
    
    if (custom.monitoring) {
      Object.assign(result.monitoring, custom.monitoring);
    }
    
    return result;
  }
}

/**
 * Default factory function
 */
export function createDefaultTelemetryService(): TelemetryService {
  return TelemetryServiceFactory.createDevelopment();
}