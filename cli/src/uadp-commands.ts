/**
 * UADP (Universal Agent Discovery Protocol) Commands for OSSA CLI
 * Integrates the UADP discovery engine for agent management
 */

import { Command } from 'commander';
import chalk from 'chalk';
import UADPDiscoveryEngine, { UADPAgent, UADPDiscoveryOptions } from './uadp-discovery.js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Global discovery engine instance
let discoveryEngine: UADPDiscoveryEngine;

export function addUADPCommands(program: Command) {
  // Discovery command group
  const discovery = program
    .command('discovery')
    .description('UADP agent discovery commands')
    .action(() => {
      console.log(chalk.blue('🔍 UADP Discovery Protocol v0.1.8'));
      console.log(chalk.gray('   Use: ossa discovery --help for commands'));
    });

  // Initialize discovery engine
  discovery
    .command('init')
    .description('Initialize UADP discovery registry')
    .option('-u, --url <url>', 'Registry URL')
    .option('-i, --interval <interval>', 'Health check interval (seconds)', '10')
    .action(async (options) => {
      console.log(chalk.blue('🚀 Initializing UADP discovery engine...'));
      
      try {
        discoveryEngine = new UADPDiscoveryEngine(options.url, {
          healthCheckInterval: parseInt(options.interval),
          cacheTimeout: 300,
          maxCacheEntries: 10000,
          requestTimeout: 5000
        });

        console.log(chalk.green('✅ UADP discovery engine initialized'));
        console.log(chalk.gray('   Health checks:'), `${options.interval}s interval`);
        
        if (options.url) {
          console.log(chalk.gray('   Registry URL:'), options.url);
        }
      } catch (error) {
        console.log(chalk.red('❌ Failed to initialize:'), (error as Error).message);
      }
    });

  // Register agent
  discovery
    .command('register <path>')
    .description('Register agent with UADP')
    .option('-e, --endpoint <endpoint>', 'Agent endpoint URL')
    .option('-h, --health <health>', 'Health check endpoint')
    .option('-c, --capabilities <caps>', 'Capabilities endpoint')
    .action(async (agentPath, options) => {
      console.log(chalk.blue('📝 Registering agent with UADP...'));
      
      if (!discoveryEngine) {
        console.log(chalk.red('❌ Discovery engine not initialized. Run: ossa discovery init'));
        return;
      }

      try {
        const agentSpec = await loadAgentSpec(agentPath);
        if (!agentSpec) return;

        const agent: Omit<UADPAgent, 'id' | 'registration_time' | 'last_seen'> = {
          name: agentSpec.metadata.name,
          version: agentSpec.metadata.version || '1.0.0',
          endpoint: options.endpoint || `http://localhost:3000/api/${agentSpec.metadata.name}`,
          health_endpoint: options.health || `${options.endpoint || 'http://localhost:3000'}/health`,
          capabilities_endpoint: options.capabilities || `${options.endpoint || 'http://localhost:3000'}/capabilities`,
          status: 'healthy',
          metadata: {
            class: agentSpec.spec?.agent?.class || 'general',
            category: agentSpec.spec?.agent?.category || 'assistant',
            conformance_tier: agentSpec.metadata?.annotations?.['ossa.io/conformance-level'] as 'core' | 'governed' | 'advanced' || 'advanced',
            certification_level: 'gold'
          },
          capabilities: extractCapabilities(agentSpec),
          protocols: extractProtocols(agentSpec),
          compliance_frameworks: extractComplianceFrameworks(agentSpec),
          performance_metrics: {
            avg_response_time_ms: 150,
            uptime_percentage: 99.9,
            requests_handled: 0,
            success_rate: 1.0
          },
          framework_integrations: agentSpec.spec?.frameworks || {}
        };

        const agentId = await discoveryEngine.registerAgent(agent);
        
        console.log(chalk.green('✅ Agent registered successfully'));
        console.log(chalk.gray('   Agent ID:'), agentId);
        console.log(chalk.gray('   Name:'), agent.name);
        console.log(chalk.gray('   Endpoint:'), agent.endpoint);
        console.log(chalk.gray('   Tier:'), agent.metadata.conformance_tier);
      } catch (error) {
        console.log(chalk.red('❌ Registration failed:'), (error as Error).message);
      }
    });

  // Discover agents
  discovery
    .command('find')
    .description('Discover agents using UADP')
    .option('-c, --capabilities <caps>', 'Filter by capabilities (comma-separated)')
    .option('-p, --protocols <protocols>', 'Filter by protocols (comma-separated)')
    .option('-t, --tier <tier>', 'Filter by conformance tier (core|governed|advanced)')
    .option('-f, --frameworks <frameworks>', 'Filter by compliance frameworks')
    .option('-l, --limit <limit>', 'Maximum results', '10')
    .option('--include-inactive', 'Include inactive agents')
    .action(async (options) => {
      console.log(chalk.blue('🔍 Discovering agents...'));
      
      if (!discoveryEngine) {
        console.log(chalk.red('❌ Discovery engine not initialized. Run: ossa discovery init'));
        return;
      }

      try {
        const discoveryOptions: UADPDiscoveryOptions = {};
        
        if (options.capabilities) {
          discoveryOptions.capabilities = options.capabilities.split(',').map((s: string) => s.trim());
        }
        
        if (options.protocols) {
          discoveryOptions.protocols = options.protocols.split(',').map((s: string) => s.trim());
        }
        
        if (options.tier) {
          discoveryOptions.conformance_tier = options.tier as 'core' | 'governed' | 'advanced';
        }
        
        if (options.frameworks) {
          discoveryOptions.compliance_frameworks = options.frameworks.split(',').map((s: string) => s.trim());
        }
        
        if (options.limit) {
          discoveryOptions.max_results = parseInt(options.limit);
        }
        
        discoveryOptions.include_inactive = options.includeInactive || false;

        const results = await discoveryEngine.discoverAgents(discoveryOptions);
        
        console.log(chalk.green(`✅ Found ${results.agents.length} agents (${results.discovery_time_ms}ms)`));
        console.log('');
        
        if (results.agents.length === 0) {
          console.log(chalk.yellow('No agents match your criteria'));
          return;
        }

        results.agents.forEach((agent, index) => {
          console.log(chalk.bold(`${index + 1}. ${agent.name}`));
          console.log(chalk.gray('   ID:'), agent.id);
          console.log(chalk.gray('   Status:'), getStatusIcon(agent.status), agent.status);
          console.log(chalk.gray('   Tier:'), agent.metadata.conformance_tier);
          console.log(chalk.gray('   Capabilities:'), agent.capabilities.slice(0, 3).join(', ') + (agent.capabilities.length > 3 ? '...' : ''));
          console.log(chalk.gray('   Endpoint:'), agent.endpoint);
          console.log('');
        });
      } catch (error) {
        console.log(chalk.red('❌ Discovery failed:'), (error as Error).message);
      }
    });

  // Health check
  discovery
    .command('health [agent-id]')
    .description('Check agent health status')
    .action(async (agentId) => {
      if (!discoveryEngine) {
        console.log(chalk.red('❌ Discovery engine not initialized. Run: ossa discovery init'));
        return;
      }

      try {
        if (agentId) {
          console.log(chalk.blue(`🔍 Checking health for agent: ${agentId}`));
          const isHealthy = await discoveryEngine.healthCheckAgent(agentId);
          const agent = await discoveryEngine.getAgent(agentId);
          
          if (agent) {
            console.log(getStatusIcon(agent.status), chalk.bold(agent.name));
            console.log(chalk.gray('   Status:'), agent.status);
            console.log(chalk.gray('   Last seen:'), new Date(agent.last_seen).toLocaleString());
            console.log(chalk.gray('   Healthy:'), isHealthy ? '✅ Yes' : '❌ No');
          } else {
            console.log(chalk.red('❌ Agent not found'));
          }
        } else {
          console.log(chalk.blue('🔍 Checking health for all agents...'));
          const stats = discoveryEngine.getRegistryStats();
          
          console.log(chalk.bold('Registry Health Summary:'));
          console.log(chalk.gray('   Total agents:'), stats.total_agents);
          console.log(chalk.gray('   Healthy:'), `${stats.healthy_agents} (${Math.round(stats.healthy_agents / stats.total_agents * 100)}%)`);
          console.log(chalk.gray('   Discoveries today:'), stats.discoveries_today);
          console.log(chalk.gray('   Avg discovery time:'), `${stats.avg_discovery_time_ms.toFixed(1)}ms`);
        }
      } catch (error) {
        console.log(chalk.red('❌ Health check failed:'), (error as Error).message);
      }
    });

  // Registry stats
  discovery
    .command('stats')
    .description('Show UADP registry statistics')
    .action(() => {
      if (!discoveryEngine) {
        console.log(chalk.red('❌ Discovery engine not initialized. Run: ossa discovery init'));
        return;
      }

      try {
        const stats = discoveryEngine.getRegistryStats();
        const registry = discoveryEngine.exportRegistry();
        
        console.log(chalk.bold('🔍 UADP Registry Statistics'));
        console.log('');
        console.log(chalk.blue('Agent Metrics:'));
        console.log(chalk.gray('   Total agents:'), stats.total_agents);
        console.log(chalk.gray('   Healthy agents:'), stats.healthy_agents);
        console.log(chalk.gray('   Health percentage:'), `${Math.round(stats.healthy_agents / stats.total_agents * 100)}%`);
        console.log('');
        console.log(chalk.blue('Discovery Performance:'));
        console.log(chalk.gray('   Discoveries today:'), stats.discoveries_today);
        console.log(chalk.gray('   Avg discovery time:'), `${stats.avg_discovery_time_ms.toFixed(1)}ms`);
        console.log('');
        console.log(chalk.blue('Protocol Distribution:'));
        Object.entries(stats.protocol_distribution).forEach(([protocol, count]) => {
          console.log(chalk.gray(`   ${protocol}:`), count);
        });
        console.log('');
        console.log(chalk.blue('Registry Settings:'));
        console.log(chalk.gray('   UADP version:'), registry.discovery_metadata.uadp_version);
        console.log(chalk.gray('   Health monitoring:'), registry.discovery_metadata.health_monitoring.enabled ? '✅' : '❌');
        console.log(chalk.gray('   Cache TTL:'), `${registry.discovery_metadata.cache_settings.ttl_seconds}s`);
      } catch (error) {
        console.log(chalk.red('❌ Stats failed:'), (error as Error).message);
      }
    });

  // Export registry
  discovery
    .command('export [file]')
    .description('Export UADP registry')
    .option('-f, --format <format>', 'Export format (json|yaml)', 'json')
    .action((file, options) => {
      if (!discoveryEngine) {
        console.log(chalk.red('❌ Discovery engine not initialized. Run: ossa discovery init'));
        return;
      }

      try {
        const registry = discoveryEngine.exportRegistry();
        const filename = file || `uadp-registry-${Date.now()}.${options.format}`;
        
        let content: string;
        if (options.format === 'yaml') {
          content = yaml.dump(registry);
        } else {
          content = JSON.stringify(registry, null, 2);
        }
        
        fs.writeFileSync(filename, content);
        
        console.log(chalk.green('✅ Registry exported'));
        console.log(chalk.gray('   File:'), filename);
        console.log(chalk.gray('   Agents:'), registry.registry_stats.total_agents);
        console.log(chalk.gray('   Format:'), options.format);
      } catch (error) {
        console.log(chalk.red('❌ Export failed:'), (error as Error).message);
      }
    });
}

// Helper functions

async function loadAgentSpec(agentPath: string): Promise<any> {
  const agentFile = path.join(agentPath, 'agent.yml');
  
  if (!fs.existsSync(agentFile)) {
    console.log(chalk.red('❌ No agent.yml found at:'), agentPath);
    return null;
  }
  
  try {
    const content = fs.readFileSync(agentFile, 'utf8');
    return yaml.load(content);
  } catch (error) {
    console.log(chalk.red('❌ Invalid agent.yml:'), (error as Error).message);
    return null;
  }
}

function extractCapabilities(agentSpec: any): string[] {
  const capabilities = [];
  
  if (agentSpec.spec?.capabilities) {
    // Handle different capability formats
    if (Array.isArray(agentSpec.spec.capabilities)) {
      capabilities.push(...agentSpec.spec.capabilities.map((cap: any) => 
        typeof cap === 'string' ? cap : cap.name
      ));
    } else if (agentSpec.spec.capabilities.primary) {
      capabilities.push(...agentSpec.spec.capabilities.primary);
    }
  }
  
  return capabilities;
}

function extractProtocols(agentSpec: any): Array<{ name: string; version: string; required: boolean; endpoints?: Record<string, string> }> {
  const protocols = [];
  
  if (agentSpec.spec?.protocols) {
    if (Array.isArray(agentSpec.spec.protocols)) {
      protocols.push(...agentSpec.spec.protocols.map((protocol: any) => ({
        name: protocol.name || protocol,
        version: protocol.version || '1.0.0',
        required: protocol.required || false,
        endpoints: protocol.endpoints || {}
      })));
    } else if (agentSpec.spec.protocols.supported) {
      protocols.push(...agentSpec.spec.protocols.supported.map((name: string) => ({
        name,
        version: '1.0.0',
        required: name === agentSpec.spec.protocols.primary
      })));
    }
  }
  
  // Ensure OpenAPI is included (OSSA 0.1.8 requirement)
  if (!protocols.find(p => p.name === 'openapi')) {
    protocols.push({
      name: 'openapi',
      version: '3.1.0',
      required: true
    });
  }
  
  return protocols;
}

function extractComplianceFrameworks(agentSpec: any): string[] {
  const frameworks = [];
  
  if (agentSpec.spec?.compliance_frameworks) {
    frameworks.push(...agentSpec.spec.compliance_frameworks.map((framework: any) => 
      typeof framework === 'string' ? framework : framework.name
    ));
  }
  
  // Extract from annotations
  const complianceAnnotation = agentSpec.metadata?.annotations?.['ossa.io/compliance-frameworks'];
  if (complianceAnnotation) {
    frameworks.push(...complianceAnnotation.split(',').map((s: string) => s.trim()));
  }
  
  return frameworks;
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy': return '🟢';
    case 'degraded': return '🟡'; 
    case 'unhealthy': return '🔴';
    default: return '⚪';
  }
}