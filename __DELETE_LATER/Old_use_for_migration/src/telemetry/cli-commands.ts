/**
 * OSSA Telemetry CLI Commands
 * 
 * Command-line interface for managing the telemetry system,
 * monitoring agents, and validating 99.97% uptime SLA.
 */

import { TelemetryService } from './telemetry-service.js';
import { TelemetryServiceFactory } from './factory.js';
import { TelemetryCLI } from './index.js';

export interface CLIOptions {
  environment?: string;
  config?: string;
  port?: number;
  agents?: number;
  duration?: number;
  format?: 'json' | 'table' | 'yaml';
  output?: string;
  quiet?: boolean;
  verbose?: boolean;
}

export class TelemetryCLICommands {
  private cli: TelemetryCLI;
  
  constructor() {
    this.cli = new TelemetryCLI();
  }

  /**
   * Initialize telemetry system
   */
  public async init(options: CLIOptions = {}): Promise<void> {
    try {
      if (options.config) {
        await this.cli.init(options.config);
      } else {
        await this.cli.init();
      }
      
      if (!options.quiet) {
        console.log('✅ Telemetry system initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize telemetry system:', error.message);
      process.exit(1);
    }
  }

  /**
   * Start telemetry service
   */
  public async start(options: CLIOptions = {}): Promise<void> {
    try {
      if (!this.cli.getStatus()) {
        await this.init(options);
      }
      
      await this.cli.start();
      
      if (!options.quiet) {
        console.log('✅ Telemetry service started');
        
        if (options.verbose) {
          const status = this.cli.getStatus();
          console.log(`📊 Service Status:`);
          console.log(`   Uptime: ${status?.uptime}s`);
          console.log(`   Agents: ${status?.statistics.activeAgents}/${status?.statistics.totalAgents}`);
          console.log(`   Metrics: ${status?.statistics.totalMetrics}`);
          console.log(`   Alerts: ${status?.statistics.activeAlerts}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to start telemetry service:', error.message);
      process.exit(1);
    }
  }

  /**
   * Stop telemetry service
   */
  public async stop(options: CLIOptions = {}): Promise<void> {
    try {
      await this.cli.stop();
      
      if (!options.quiet) {
        console.log('✅ Telemetry service stopped');
      }
    } catch (error) {
      console.error('❌ Failed to stop telemetry service:', error.message);
      process.exit(1);
    }
  }

  /**
   * Get service status
   */
  public async status(options: CLIOptions = {}): Promise<void> {
    try {
      const status = this.cli.getStatus();
      
      if (!status) {
        console.log('❌ Telemetry service is not running');
        return;
      }

      if (options.format === 'json') {
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log('📊 OSSA Telemetry System Status\n');
        console.log(`Status: ${status.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        console.log(`Uptime: ${this.formatUptime(status.uptime)}`);
        console.log(`Overall System Uptime: ${status.statistics.overallUptime.toFixed(2)}%`);
        
        console.log('\n📈 Statistics:');
        console.log(`   Total Agents: ${status.statistics.totalAgents}`);
        console.log(`   Active Agents: ${status.statistics.activeAgents}`);
        console.log(`   Total Metrics: ${status.statistics.totalMetrics}`);
        console.log(`   Active Alerts: ${status.statistics.activeAlerts}`);
        
        console.log('\n⚙️  Components:');
        console.log(`   KPI Collector: ${status.components.kpiCollector ? '✅' : '❌'}`);
        console.log(`   Scorecard System: ${status.components.scorecardSystem ? '✅' : '❌'}`);
        console.log(`   Monitoring Engine: ${status.components.monitoringEngine ? '✅' : '❌'}`);
        console.log(`   Export Manager: ${status.components.exportManager ? '✅' : '❌'}`);
        
        console.log(`\nLast Updated: ${status.lastUpdate.toISOString()}`);
      }
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      process.exit(1);
    }
  }

  /**
   * Register agents
   */
  public async register(options: CLIOptions = {}): Promise<void> {
    try {
      if (!this.cli.getStatus()?.isRunning) {
        console.error('❌ Telemetry service is not running. Start it first with: ossa telemetry start');
        process.exit(1);
      }

      if (options.agents === 127) {
        await this.cli.register127ProductionAgents();
        if (!options.quiet) {
          console.log('✅ Registered 127 production agents');
        }
      } else {
        // Register custom number of agents for testing
        const agentCount = options.agents || 10;
        const agents = this.generateTestAgents(agentCount);
        await this.cli.registerAgents(agents);
        
        if (!options.quiet) {
          console.log(`✅ Registered ${agentCount} test agents`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to register agents:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run validation across all agents
   */
  public async validate(options: CLIOptions = {}): Promise<void> {
    try {
      if (!this.cli.getStatus()?.isRunning) {
        console.error('❌ Telemetry service is not running. Start it first with: ossa telemetry start');
        process.exit(1);
      }

      if (!options.quiet) {
        console.log('🔍 Running validation across all agents...');
      }

      const results = await this.cli.validate();

      if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log('\n📋 Agent Validation Results\n');
        console.log(`Total Agents: ${results.totalAgents}`);
        console.log(`Validated: ${results.validatedAgents}`);
        console.log(`Overall Compliance: ${results.overallCompliance.toFixed(2)}%`);
        console.log(`Issues Found: ${results.issues.length}`);
        
        if (results.issues.length > 0 && options.verbose) {
          console.log('\n⚠️  Issues:');
          results.issues.forEach((issue: any, index: number) => {
            const severity = this.getSeverityEmoji(issue.severity);
            console.log(`   ${index + 1}. ${severity} ${issue.agentName}: ${issue.issue}`);
          });
        }
        
        // SLA Status
        const slaStatus = results.overallCompliance >= 99.97 ? '✅ PASSING' : '❌ FAILING';
        console.log(`\n🎯 SLA Status (99.97% target): ${slaStatus}`);
      }
    } catch (error) {
      console.error('❌ Failed to run validation:', error.message);
      process.exit(1);
    }
  }

  /**
   * Export telemetry data
   */
  public async export(options: CLIOptions = {}): Promise<void> {
    try {
      if (!this.cli.getStatus()?.isRunning) {
        console.error('❌ Telemetry service is not running. Start it first with: ossa telemetry start');
        process.exit(1);
      }

      if (!options.quiet) {
        console.log('📤 Exporting telemetry data...');
      }

      const results = await this.cli.export();

      if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log('\n📤 Export Results\n');
        results.forEach((result: any) => {
          const status = result.success ? '✅' : '❌';
          console.log(`   ${result.exporter}: ${status} (${result.exportedCount} items, ${result.duration}ms)`);
          
          if (!result.success && result.errors.length > 0 && options.verbose) {
            result.errors.forEach((error: string) => {
              console.log(`      Error: ${error}`);
            });
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to export data:', error.message);
      process.exit(1);
    }
  }

  /**
   * Get health report
   */
  public async health(options: CLIOptions = {}): Promise<void> {
    try {
      if (!this.cli.getStatus()?.isRunning) {
        console.error('❌ Telemetry service is not running. Start it first with: ossa telemetry start');
        process.exit(1);
      }

      const health = this.cli.getHealthReport();

      if (options.format === 'json') {
        console.log(JSON.stringify(health, null, 2));
      } else {
        console.log('🏥 OSSA Telemetry Health Report\n');
        
        // System Health
        const systemStatus = health.system?.status || 'unknown';
        const statusEmoji = systemStatus === 'healthy' ? '🟢' : systemStatus === 'degraded' ? '🟡' : '🔴';
        console.log(`System Status: ${statusEmoji} ${systemStatus.toUpperCase()}`);
        console.log(`Current Uptime: ${health.uptime.overallUptime.toFixed(2)}%`);
        console.log(`SLA Target: ${health.uptime.slaTarget}%`);
        
        // Agent Summary
        console.log('\n🤖 Agent Summary:');
        console.log(`   Total: ${health.agents.total}`);
        console.log(`   Healthy: 🟢 ${health.agents.healthy}`);
        console.log(`   Warning: 🟡 ${health.agents.warning}`);
        console.log(`   Critical: 🔴 ${health.agents.critical}`);
        console.log(`   Offline: ⚫ ${health.agents.offline}`);
        
        // Alert Summary
        console.log('\n🚨 Alert Summary:');
        console.log(`   Active: ${health.alerts.active}`);
        console.log(`   Critical: 🔴 ${health.alerts.critical}`);
        console.log(`   Warning: 🟡 ${health.alerts.warning}`);
        
        // Uptime Metrics
        console.log('\n📊 Uptime Metrics:');
        console.log(`   Total Downtime: ${health.uptime.totalDowntime} minutes`);
        console.log(`   Incident Count: ${health.uptime.incidentCount}`);
        console.log(`   MTTR: ${health.uptime.mttr.toFixed(1)} minutes`);
        console.log(`   MTBF: ${health.uptime.mtbf.toFixed(1)} hours`);
        
        // Export Status
        if (Object.keys(health.exporters).length > 0) {
          console.log('\n📤 Export Status:');
          Object.entries(health.exporters).forEach(([name, stats]: [string, any]) => {
            const status = stats.enabled ? (stats.successRate > 90 ? '✅' : '⚠️') : '⚫';
            console.log(`   ${name}: ${status} (${stats.successRate.toFixed(1)}% success rate)`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to get health report:', error.message);
      process.exit(1);
    }
  }

  /**
   * Simulate metric data for testing
   */
  public async simulate(options: CLIOptions = {}): Promise<void> {
    try {
      if (!this.cli.getStatus()?.isRunning) {
        console.error('❌ Telemetry service is not running. Start it first with: ossa telemetry start');
        process.exit(1);
      }

      const duration = (options.duration || 60) * 1000; // Convert to milliseconds
      
      if (!options.quiet) {
        console.log(`🎭 Starting metric simulation for ${duration / 1000} seconds...`);
      }

      await this.cli.simulate(duration);
      
      if (!options.quiet) {
        console.log('✅ Simulation completed');
      }
    } catch (error) {
      console.error('❌ Failed to run simulation:', error.message);
      process.exit(1);
    }
  }

  /**
   * Show telemetry dashboard in terminal
   */
  public async dashboard(options: CLIOptions = {}): Promise<void> {
    console.log('📺 OSSA Telemetry Dashboard\n');
    console.log('Press Ctrl+C to exit\n');

    const updateDashboard = async () => {
      try {
        // Clear screen
        process.stdout.write('\x1Bc');
        
        console.log('📺 OSSA Telemetry Dashboard - ' + new Date().toLocaleString());
        console.log('=' .repeat(60) + '\n');

        const health = this.cli.getHealthReport();
        
        // System Status
        const systemStatus = health.system?.status || 'unknown';
        const statusEmoji = systemStatus === 'healthy' ? '🟢' : systemStatus === 'degraded' ? '🟡' : '🔴';
        console.log(`System: ${statusEmoji} ${systemStatus.toUpperCase()} | Uptime: ${health.uptime.overallUptime.toFixed(2)}%`);
        
        // Agent Status Bar
        const total = health.agents.total;
        if (total > 0) {
          const healthyPct = (health.agents.healthy / total) * 100;
          const warningPct = (health.agents.warning / total) * 100;
          const criticalPct = (health.agents.critical / total) * 100;
          
          console.log(`\nAgents: ${total} total`);
          console.log(`Healthy:  ${'█'.repeat(Math.floor(healthyPct / 5))} ${health.agents.healthy}`);
          console.log(`Warning:  ${'█'.repeat(Math.floor(warningPct / 5))} ${health.agents.warning}`);
          console.log(`Critical: ${'█'.repeat(Math.floor(criticalPct / 5))} ${health.agents.critical}`);
        }
        
        // Alerts
        if (health.alerts.active > 0) {
          console.log(`\n🚨 Active Alerts: ${health.alerts.active}`);
          if (health.alerts.critical > 0) {
            console.log(`   🔴 Critical: ${health.alerts.critical}`);
          }
          if (health.alerts.warning > 0) {
            console.log(`   🟡 Warning: ${health.alerts.warning}`);
          }
        }
        
        // SLA Compliance
        const slaCompliant = health.uptime.overallUptime >= 99.97;
        console.log(`\n🎯 SLA Compliance: ${slaCompliant ? '✅' : '❌'} ${health.uptime.overallUptime.toFixed(4)}% / 99.97%`);
        
        console.log(`\nLast Update: ${new Date().toLocaleTimeString()}`);
        
      } catch (error) {
        console.error('Error updating dashboard:', error.message);
      }
    };

    // Update dashboard every 5 seconds
    const dashboardInterval = setInterval(updateDashboard, 5000);
    await updateDashboard(); // Initial update

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(dashboardInterval);
      console.log('\n\n👋 Dashboard closed');
      process.exit(0);
    });
  }

  /**
   * Generate test agents
   */
  private generateTestAgents(count: number): Array<{ id: string; name: string }> {
    const agents = [];
    for (let i = 1; i <= count; i++) {
      agents.push({
        id: `test-agent-${i.toString().padStart(3, '0')}`,
        name: `Test Agent ${i}`
      });
    }
    return agents;
  }

  /**
   * Format uptime duration
   */
  private formatUptime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }
}

/**
 * Global CLI commands instance
 */
export const telemetryCommands = new TelemetryCLICommands();