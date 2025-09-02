#!/usr/bin/env tsx

/**
 * OSSA CLI v0.1.3 - Enhanced with UADP Discovery Protocol
 * Lightweight CLI for OSSA v0.1.3 agent management with discovery capabilities
 */

import { program } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { addUADPCommands } from './uadp-commands.js';

// Configure program
program
  .name('ossa')
  .description('OSSA v0.1.3 Agent CLI with UADP Discovery Protocol')
  .version('0.1.3');

// Create agent command
program
  .command('create <name>')
  .description('Create new OSSA v0.1.3 compliant agent')
  .option('-d, --domain <domain>', 'Agent domain', 'general')
  .option('-p, --priority <priority>', 'Priority level', 'medium')
  .option('-t, --tier <tier>', 'Conformance tier', 'advanced')
  .action((name, options) => {
    console.log(chalk.blue('🚀 Creating OSSA v0.1.3 agent:'), chalk.bold(name));
    createAgent(name, options);
  });

// Validate agent command  
program
  .command('validate [path]')
  .description('Validate OSSA agent specification')
  .option('-v, --verbose', 'Verbose output')
  .action((agentPath, options) => {
    console.log(chalk.blue('🔍 Validating OSSA agent...'));
    validateAgent(agentPath || '.', options);
  });

// List agents command
program
  .command('list')
  .description('List all OSSA agents in workspace')
  .option('-f, --format <format>', 'Output format (table|json)', 'table')
  .action((options) => {
    console.log(chalk.blue('📋 Listing OSSA agents...'));
    listAgents(options);
  });

// Upgrade agent command
program
  .command('upgrade [path]')
  .description('Upgrade agent to OSSA v0.1.3')
  .option('--dry-run', 'Show what would be upgraded')
  .action((agentPath, options) => {
    console.log(chalk.blue('⬆️ Upgrading to OSSA v0.1.3...'));
    upgradeAgent(agentPath || '.', options);
  });

// Add UADP discovery commands
addUADPCommands(program);

// Implementation functions

function createAgent(name: string, options: any) {
  const { domain, priority, tier } = options;
  
  // Create directory structure
  const agentDir = path.join(process.cwd(), name);
  
  if (fs.existsSync(agentDir)) {
    console.log(chalk.red('❌ Agent directory already exists'));
    return;
  }
  
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'data'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'config'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'schemas'), { recursive: true });
  
  // Create agent.yml with enhanced OSSA v0.1.3 spec
  const agentSpec = {
    ossa: '0.1.3',
    metadata: {
      name: name,
      version: '1.0.0',
      description: `OSSA v0.1.3 ${tier} tier agent for ${domain}`,
      author: 'OSSA CLI',
      license: 'Apache-2.0',
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      tags: [domain, tier, priority]
    },
    spec: {
      conformance_tier: tier,
      class: domain,
      category: 'assistant',
      capabilities: {
        primary: [`${domain}_analysis`, 'multi_framework_integration', 'compliance_monitoring'],
        secondary: ['automated_reporting', 'performance_optimization', 'knowledge_synthesis']
      },
      protocols: [
        {
          name: 'openapi',
          version: '3.1.0',
          required: true,
          extensions: ['x-ossa-advanced', 'x-enterprise-features']
        },
        {
          name: 'mcp',
          version: '2024-11-05',
          required: true,
          advanced_features: ['resource_streaming', 'progress_tracking']
        },
        {
          name: 'uadp',
          version: '0.1.3',
          required: true,
          discovery_modes: ['active', 'passive']
        }
      ],
      framework_support: {
        langchain: {
          enabled: true,
          integration_type: 'structured_tool',
          async_execution: true
        },
        crewai: {
          enabled: true,
          integration_type: 'specialist',
          role: `${domain}_expert`
        },
        openai: {
          enabled: true,
          integration_type: 'assistant',
          function_calling: true
        },
        mcp: {
          enabled: true,
          integration_type: 'protocol_bridge',
          server_mode: true,
          client_mode: true
        }
      },
      compliance_frameworks: [
        {
          name: 'ISO_42001',
          level: 'implemented',
          audit_ready: true
        },
        {
          name: 'NIST_AI_RMF',
          level: 'implemented',
          maturity_level: 3
        }
      ],
      discovery: {
        uadp_enabled: true,
        hierarchical_discovery: true,
        capability_inference: true
      },
      performance: {
        latency: {
          health_check: '<50ms',
          capabilities: '<100ms'
        },
        throughput: {
          requests_per_second: 100
        },
        availability: {
          uptime_target: 99.5
        }
      },
      security: {
        authentication: ['api_key', 'oauth2'],
        authorization: 'rbac',
        encryption: {
          at_rest: 'aes_256',
          in_transit: 'tls_1_3'
        }
      },
      endpoints: {
        health: '/health',
        capabilities: '/capabilities',
        discover: '/discover'
      }
    }
  };
  
  fs.writeFileSync(path.join(agentDir, 'agent.yml'), yaml.dump(agentSpec));
  
  // Create comprehensive OpenAPI spec
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: `${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Agent API`,
      version: '1.0.0',
      description: `OSSA v0.1.3 ${tier} tier agent for ${domain} operations`,
      'x-openapi-ai-agents-standard': {
        version: '0.1.3',
        conformance_tier: tier,
        certification_level: 'gold',
        compliance_frameworks: ['ISO_42001', 'NIST_AI_RMF'],
        enterprise_features: tier === 'advanced'
      },
      'x-agent-metadata': {
        class: domain,
        category: 'assistant',
        protocols: ['openapi', 'mcp', 'uadp'],
        capabilities: agentSpec.spec.capabilities.primary,
        domains: [domain]
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local development server'
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          description: 'OSSA v0.1.3 compliant health check',
          operationId: 'getHealth',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Agent is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                      version: { type: 'string' },
                      ossa_version: { type: 'string' },
                      uptime: { type: 'number' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/capabilities': {
        get: {
          summary: 'Get agent capabilities',
          description: 'Returns comprehensive agent capabilities per OSSA v0.1.3',
          operationId: 'getCapabilities',
          tags: ['Discovery'],
          responses: {
            '200': {
              description: 'Agent capabilities',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      agent_name: { type: 'string' },
                      conformance_tier: { type: 'string' },
                      capabilities: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      protocols: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            version: { type: 'string' },
                            required: { type: 'boolean' }
                          }
                        }
                      },
                      framework_support: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            version: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  };
  
  fs.writeFileSync(path.join(agentDir, 'openapi.yaml'), yaml.dump(openApiSpec));
  
  // Create enhanced README with UADP integration
  const readme = `# ${name} Agent

[![OSSA v0.1.3](https://img.shields.io/badge/OSSA-v0.1.3-green.svg)](https://ossa.agents)
[![UADP](https://img.shields.io/badge/UADP-Discovery-blue.svg)](https://ossa.agents)

OSSA v0.1.3 ${tier} tier agent for ${domain} operations with UADP discovery protocol support.

## Features

- 🚀 OSSA v0.1.3 compliant
- 🔍 UADP discovery protocol
- 🎯 ${tier} conformance tier
- 🔗 Multi-framework integration (LangChain, CrewAI, OpenAI, MCP)
- 🛡️ Enterprise compliance (ISO 42001, NIST AI RMF)
- 📊 Performance monitoring
- 🔐 Security controls

## Quick Start

\`\`\`bash
# Validate agent
ossa validate

# Register with UADP
ossa discovery init
ossa discovery register .

# Discover similar agents
ossa discovery find --capabilities ${domain}_analysis

# Check health
ossa discovery health
\`\`\`

## API Endpoints

- \`GET /health\` - Health check
- \`GET /capabilities\` - Agent capabilities
- \`GET /discover\` - UADP discovery

## Development

This agent supports multiple AI frameworks:

- **LangChain**: Structured tool integration
- **CrewAI**: ${domain} specialist role
- **OpenAI**: Function calling
- **MCP**: Protocol bridge mode

## Compliance

- ISO 42001 (AI Management Systems)
- NIST AI Risk Management Framework
- OSSA v0.1.3 Advanced Conformance Tier
`;
  
  fs.writeFileSync(path.join(agentDir, 'README.md'), readme);
  
  console.log(chalk.green('✅ Created OSSA v0.1.3 agent:'), chalk.bold(name));
  console.log(chalk.gray('   📁'), agentDir);
  console.log(chalk.gray('   📄 agent.yml (Enhanced OSSA v0.1.3)'));
  console.log(chalk.gray('   📄 openapi.yaml (UADP integrated)'));
  console.log(chalk.gray('   📄 README.md (Quick start guide)'));
  console.log('');
  console.log(chalk.blue('Next steps:'));
  console.log(chalk.gray('   1. ossa validate'), name);
  console.log(chalk.gray('   2. ossa discovery init'));
  console.log(chalk.gray('   3. ossa discovery register'), name);
}

function validateAgent(agentPath: string, options: any) {
  const agentFile = path.join(agentPath, 'agent.yml');
  const openApiFile = path.join(agentPath, 'openapi.yaml');
  
  if (!fs.existsSync(agentFile)) {
    console.log(chalk.red('❌ No agent.yml found'));
    return;
  }
  
  try {
    const agent = yaml.load(fs.readFileSync(agentFile, 'utf8')) as any;
    
    // Enhanced OSSA v0.1.3 validation
    let valid = true;
    const issues = [];
    const warnings = [];
    
    // Version check
    if (!agent.ossa || agent.ossa !== '0.1.3') {
      issues.push('❌ Missing or invalid OSSA version (expected: 0.1.3)');
      valid = false;
    }
    
    // Metadata validation
    if (!agent.metadata?.name) {
      issues.push('❌ Missing agent name');
      valid = false;
    }
    
    if (!agent.spec?.conformance_tier) {
      issues.push('❌ Missing conformance tier');
      valid = false;
    } else if (!['core', 'governed', 'advanced'].includes(agent.spec.conformance_tier)) {
      issues.push('❌ Invalid conformance tier (must be: core, governed, or advanced)');
      valid = false;
    }
    
    // Protocol validation
    if (!agent.spec?.protocols || !Array.isArray(agent.spec.protocols)) {
      issues.push('❌ Missing protocols specification');
      valid = false;
    } else {
      const hasOpenAPI = agent.spec.protocols.some((p: any) => p.name === 'openapi');
      if (!hasOpenAPI) {
        issues.push('❌ Missing OpenAPI protocol (required by OSSA v0.1.3)');
        valid = false;
      }
      
      const hasUADP = agent.spec.protocols.some((p: any) => p.name === 'uadp');
      if (!hasUADP) {
        warnings.push('⚠️  UADP protocol not specified (recommended for discovery)');
      }
    }
    
    // Capabilities validation
    if (!agent.spec?.capabilities) {
      issues.push('❌ Missing capabilities specification');
      valid = false;
    }
    
    // Compliance frameworks (for governed/advanced tiers)
    if (['governed', 'advanced'].includes(agent.spec?.conformance_tier)) {
      if (!agent.spec?.compliance_frameworks || agent.spec.compliance_frameworks.length === 0) {
        warnings.push('⚠️  No compliance frameworks specified (recommended for governed/advanced tiers)');
      }
    }
    
    // OpenAPI file check
    if (!fs.existsSync(openApiFile)) {
      warnings.push('⚠️  Missing openapi.yaml');
    } else {
      try {
        const openApiSpec = yaml.load(fs.readFileSync(openApiFile, 'utf8')) as any;
        if (!openApiSpec.info?.['x-openapi-ai-agents-standard']) {
          warnings.push('⚠️  OpenAPI missing OSSA extensions');
        }
      } catch (e) {
        warnings.push('⚠️  Invalid openapi.yaml');
      }
    }
    
    // Results
    if (valid && issues.length === 0) {
      console.log(chalk.green('✅ OSSA v0.1.3 agent is valid'));
      console.log(chalk.gray('   Agent:'), agent.metadata.name);
      console.log(chalk.gray('   Version:'), agent.metadata.version || '1.0.0');
      console.log(chalk.gray('   Tier:'), agent.spec.conformance_tier);
      console.log(chalk.gray('   Protocols:'), agent.spec.protocols?.map((p: any) => p.name).join(', ') || 'none');
      
      if (agent.spec.capabilities?.primary) {
        console.log(chalk.gray('   Capabilities:'), agent.spec.capabilities.primary.slice(0, 3).join(', ') + (agent.spec.capabilities.primary.length > 3 ? '...' : ''));
      }
    } else {
      console.log(chalk.red('❌ Agent validation failed:'));
      issues.forEach(issue => console.log('   ' + issue));
    }
    
    if (warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      warnings.forEach(warning => console.log('   ' + warning));
    }
    
    if (options.verbose) {
      console.log('\n' + chalk.blue('Detailed Analysis:'));
      console.log(JSON.stringify(agent, null, 2));
    }
    
  } catch (error) {
    console.log(chalk.red('❌ Invalid YAML:'), (error as Error).message);
  }
}

function listAgents(options: any) {
  // Enhanced agent scanning with OSSA v0.1.3 detection
  const agents: any[] = [];
  
  function scanDir(dir: string, depth = 0) {
    if (depth > 3) return;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const agentFile = path.join(itemPath, 'agent.yml');
        
        if (fs.existsSync(agentFile)) {
          try {
            const agent = yaml.load(fs.readFileSync(agentFile, 'utf8')) as any;
            if (agent.ossa === '0.1.3') {
              agents.push({
                name: agent.metadata?.name || item,
                version: agent.metadata?.version || '1.0.0',
                path: path.relative(process.cwd(), itemPath),
                tier: agent.spec?.conformance_tier || 'unknown',
                domain: agent.spec?.class || agent.metadata?.tags?.[0] || 'general',
                protocols: agent.spec?.protocols?.map((p: any) => p.name).join(', ') || 'none',
                hasOpenAPI: fs.existsSync(path.join(itemPath, 'openapi.yaml')),
                uadpEnabled: agent.spec?.discovery?.uadp_enabled || false
              });
            }
          } catch (e) {
            // Skip invalid agents
          }
        }
        
        if (fs.statSync(itemPath).isDirectory()) {
          scanDir(itemPath, depth + 1);
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }
  
  scanDir(process.cwd());
  
  if (agents.length === 0) {
    console.log(chalk.yellow('No OSSA v0.1.3 agents found'));
    console.log(chalk.gray('Use: ossa create <name> to create your first agent'));
    return;
  }
  
  if (options.format === 'json') {
    console.log(JSON.stringify(agents, null, 2));
  } else {
    console.log(chalk.bold('OSSA v0.1.3 Agents:'));
    console.log('');
    
    agents.forEach((agent, index) => {
      const uadpIcon = agent.uadpEnabled ? '🔍' : '⚪';
      const openApiIcon = agent.hasOpenAPI ? '📋' : '❌';
      
      console.log(`${index + 1}. ${chalk.blue(agent.name)} ${chalk.gray('v' + agent.version)}`);
      console.log(`   ${chalk.gray('Path:')} ${agent.path}`);
      console.log(`   ${chalk.gray('Tier:')} ${getTierIcon(agent.tier)} ${agent.tier}`);
      console.log(`   ${chalk.gray('Domain:')} ${agent.domain}`);
      console.log(`   ${chalk.gray('Protocols:')} ${agent.protocols}`);
      console.log(`   ${chalk.gray('Features:')} ${openApiIcon} OpenAPI ${uadpIcon} UADP`);
      console.log('');
    });
    
    console.log(chalk.gray(`Total: ${agents.length} agents`));
    console.log(chalk.gray('Legend: 📋 OpenAPI spec, 🔍 UADP enabled'));
  }
}

function upgradeAgent(agentPath: string, options: any) {
  console.log(chalk.yellow('⚠️  Agent upgrade functionality'));
  console.log(chalk.gray('   Current version supports OSSA v0.1.3 creation'));
  console.log(chalk.gray('   For upgrades, recreate with: ossa create <name>'));
  
  if (options.dryRun) {
    console.log(chalk.blue('\nDry run mode - would upgrade:'));
    console.log(chalk.gray('   - Update ossa version to 0.1.3'));
    console.log(chalk.gray('   - Add UADP discovery support'));
    console.log(chalk.gray('   - Enhance OpenAPI extensions'));
    console.log(chalk.gray('   - Add compliance frameworks'));
  }
}

function getTierIcon(tier: string): string {
  switch (tier) {
    case 'advanced': return '🏆';
    case 'governed': return '🛡️';
    case 'core': return '⚙️';
    default: return '❓';
  }
}

// Parse and execute
program.parse();