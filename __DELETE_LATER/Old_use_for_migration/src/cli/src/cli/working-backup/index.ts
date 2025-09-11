#!/usr/bin/env tsx

/**
 * OSSA CLI v0.1.8 - Enhanced with UADP Discovery Protocol
 * Lightweight CLI for OSSA v0.1.8 agent management with discovery capabilities
 */

import { program } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { addUADPCommands } from './uadp-commands.js';
import { createOrchestrateCommands } from './commands/orchestrate.js';
import { createStandardizeCommands } from './commands/standardize.js';
import { createAgentForgeIntegration } from './commands/agent-forge-integration.js';
import { createServicesCommand } from './commands/services.js';
import { registerApiCommands } from './commands/api.js';
import { registerOrchestrationCommands, registerGraphQLCommands } from './commands/api-orchestration.js';
import { registerMonitoringCommands, registerAdvancedCommands } from './commands/api-monitoring.js';
import { registerValidationCommands } from './commands/validate.js';
import { createAgentManagementCommands } from './commands/agent-management.js';
import { createWorkspaceManagementCommands } from './commands/workspace-management.js';
import { generateCommand } from './src/commands/generate.js';
import { createOpenAIAgentCommandsTS } from './commands/openai-agents-ts.js';
// Migration tools
import { createMigrationCommands } from './src/commands/migrate.js';
import { createSchemaMigrationCommands } from './src/commands/schema-migration.js';
import { createLegacyConverterCommands } from './src/commands/legacy-converter.js';
import { createMigrationValidatorCommands } from './src/commands/migration-validator.js';
import { createAdvancedMigrationCommands } from './src/commands/advanced-migration.js';

// New comprehensive command modules
import { createAgentManagementCommands as createEnhancedAgentCommands } from './src/commands/agent-management.js';
import { createOrchestrationCommands } from './src/commands/orchestration.js';
import { createMonitoringCommands } from './src/commands/monitoring.js';
import { createComplianceCommands } from './src/commands/compliance.js';
import { createDiscoveryCommands } from './src/commands/discovery.js';
import { createApiIntegrationCommands } from './src/commands/api-integration.js';

// Configure program
program
  .name('ossa')
  .description('OSSA v0.1.8 Complete Agent & Workspace Management CLI')
  .version('0.1.8')
  .option('-v, --verbose', 'Verbose output')
  .option('--json', 'JSON output format');

// Create agent command
program
  .command('create <name>')
  .description('Create new OSSA v0.1.8 compliant agent')
  .option('-d, --domain <domain>', 'Agent domain', 'general')
  .option('-p, --priority <priority>', 'Priority level', 'medium')
  .option('-t, --tier <tier>', 'Conformance tier', 'advanced')
  .action((name, options) => {
    console.log(chalk.blue('🚀 Creating OSSA v0.1.8 agent:'), chalk.bold(name));
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
  .description('Upgrade agent to OSSA v0.1.8')
  .option('--dry-run', 'Show what would be upgraded')
  .action((agentPath, options) => {
    console.log(chalk.blue('⬆️ Upgrading to OSSA v0.1.8...'));
    upgradeAgent(agentPath || '.', options);
  });

// Add UADP discovery commands
addUADPCommands(program);

// Add orchestration commands
program.addCommand(createOrchestrateCommands());

// Add standardization commands  
program.addCommand(createStandardizeCommands());

// Add services management commands
program.addCommand(createServicesCommand());

// Add agent-forge integration
program.addCommand(createAgentForgeIntegration());

// Add comprehensive agent management commands
program.addCommand(createAgentManagementCommands());

// Add workspace management commands  
program.addCommand(createWorkspaceManagementCommands());

// Add OpenAPI Generator commands
program.addCommand(generateCommand);

// Add OpenAI agents commands
program.addCommand(createOpenAIAgentCommandsTS());

// Add migration tools
program.addCommand(createMigrationCommands());
program.addCommand(createSchemaMigrationCommands());
program.addCommand(createLegacyConverterCommands());
program.addCommand(createMigrationValidatorCommands());
program.addCommand(createAdvancedMigrationCommands()); // Advanced migration tools

// Add comprehensive new command modules
program.addCommand(createEnhancedAgentCommands()); // Enhanced agent management
program.addCommand(createOrchestrationCommands()); // Agent orchestration
program.addCommand(createMonitoringCommands()); // Monitoring and observability
program.addCommand(createComplianceCommands()); // Compliance and audit
program.addCommand(createDiscoveryCommands()); // UADP discovery
program.addCommand(createApiIntegrationCommands()); // API gateway and integrations
// Implementation functions

function createAgent(name: string, options: any) {
  const { domain, priority, tier } = options;
  
  // Validate agent name
  const nameValidation = validateAgentName(name);
  if (!nameValidation.valid) {
    console.log(chalk.red('❌ Invalid agent name:'));
    nameValidation.errors.forEach(error => console.log(chalk.red(`   - ${error}`)));
    return;
  }
  
  // Create directory structure
  const agentDir = path.join(process.cwd(), name);
  
  if (fs.existsSync(agentDir)) {
    console.log(chalk.red('❌ Agent directory already exists'));
    return;
  }
  
  // Create standard OSSA agent directory structure
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'behaviors'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'config'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'data'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'handlers'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'integrations'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'training-modules'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, '_roadmap'), { recursive: true });
  
  // Create agent.yml with enhanced OSSA v0.1.8 spec
  const agentSpec = {
    ossa: '0.1.8',
    metadata: {
      name: name,
      version: '1.0.0',
      description: `OSSA v0.1.8 ${tier} tier agent for ${domain}`,
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
          version: '0.1.8',
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
      description: `OSSA v0.1.8 ${tier} tier agent for ${domain} operations`,
      'x-openapi-ai-agents-standard': {
        version: '0.1.8',
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
          description: 'OSSA v0.1.8 compliant health check',
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
          description: 'Returns comprehensive agent capabilities per OSSA v0.1.8',
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
  
  // Create versioned roadmap files
  createAgentRoadmaps(agentDir, name, agentSpec.metadata.version, domain, tier);
  
  // Create enhanced README with UADP integration
  const readme = `# ${name} Agent

[![OSSA v0.1.8](https://img.shields.io/badge/OSSA-v0.1.8-green.svg)](https://ossa.agents)
[![UADP](https://img.shields.io/badge/UADP-Discovery-blue.svg)](https://ossa.agents)

OSSA v0.1.8 ${tier} tier agent for ${domain} operations with UADP discovery protocol support.

## Features

- 🚀 OSSA v0.1.8 compliant
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
- OSSA v0.1.8 Advanced Conformance Tier
`;
  
  fs.writeFileSync(path.join(agentDir, 'README.md'), readme);
  
  console.log(chalk.green('✅ Created OSSA v0.1.8 agent:'), chalk.bold(name));
  console.log(chalk.gray('   📁'), agentDir);
  console.log(chalk.gray('   📁 behaviors/        (Agent behavior definitions)'));
  console.log(chalk.gray('   📁 config/           (Configuration files)'));
  console.log(chalk.gray('   📁 data/             (Agent data and state)'));
  console.log(chalk.gray('   📁 handlers/         (Event and message handlers)'));
  console.log(chalk.gray('   📁 integrations/     (Framework integrations)'));
  console.log(chalk.gray('   📁 schemas/          (Data validation schemas)'));
  console.log(chalk.gray('   📁 training-modules/ (Training and learning modules)'));
  console.log(chalk.gray('   📁 _roadmap/         (Versioned roadmap files)'));
  console.log(chalk.gray('   📄 agent.yml         (Enhanced OSSA v0.1.8 spec)'));
  console.log(chalk.gray('   📄 openapi.yaml      (UADP integrated API spec)'));
  console.log(chalk.gray('   📄 README.md         (Quick start guide)'));
  console.log('');
  console.log(chalk.blue('Next steps:'));
  console.log(chalk.gray('   1. ossa validate'), name);
  console.log(chalk.gray('   2. ossa discovery init'));
  console.log(chalk.gray('   3. ossa discovery register'), name);
}

function validateAgent(agentPath: string, options: any) {
  const agentFile = path.join(agentPath, 'agent.yml');
  const openApiFile = path.join(agentPath, 'openapi.yaml');
  
  // Check required files
  if (!fs.existsSync(agentFile)) {
    console.log(chalk.red('❌ No agent.yml found'));
    return;
  }
  
  // Check required directories
  const requiredDirs = ['behaviors', 'config', 'data', 'handlers', 'integrations', 'schemas', 'training-modules', '_roadmap'];
  const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(agentPath, dir)));
  
  if (missingDirs.length > 0) {
    console.log(chalk.red('❌ Missing required directories:'));
    missingDirs.forEach(dir => {
      console.log(chalk.red(`   - ${dir}/`));
    });
    return;
  }
  
  // Check roadmap structure
  const roadmapDir = path.join(agentPath, '_roadmap');
  const roadmapMetaFile = path.join(roadmapDir, 'roadmap_meta.json');
  let roadmapValid = true;
  let roadmapWarnings: string[] = [];
  
  if (!fs.existsSync(roadmapMetaFile)) {
    roadmapWarnings.push('Missing roadmap_meta.json in _roadmap/');
    roadmapValid = false;
  } else {
    try {
      const roadmapMeta = JSON.parse(fs.readFileSync(roadmapMetaFile, 'utf8'));
      if (!roadmapMeta.roadmap_files || roadmapMeta.roadmap_files.length === 0) {
        roadmapWarnings.push('No roadmap files specified in roadmap_meta.json');
      } else {
        // Check if roadmap files exist
        const missingRoadmapFiles = roadmapMeta.roadmap_files.filter((file: string) => 
          !fs.existsSync(path.join(roadmapDir, file))
        );
        if (missingRoadmapFiles.length > 0) {
          roadmapWarnings.push(`Missing roadmap files: ${missingRoadmapFiles.join(', ')}`);
        }
      }
    } catch (e) {
      roadmapWarnings.push('Invalid roadmap_meta.json format');
    }
  }
  
  try {
    const agent = yaml.load(fs.readFileSync(agentFile, 'utf8')) as any;
    
    // Enhanced OSSA v0.1.8 validation
    let valid = true;
    const issues = [];
    const warnings = [];
    
    // Version check
    if (!agent.ossa || agent.ossa !== '0.1.8') {
      issues.push('❌ Missing or invalid OSSA version (expected: 0.1.8)');
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
        issues.push('❌ Missing OpenAPI protocol (required by OSSA v0.1.8)');
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
      console.log(chalk.green('✅ OSSA v0.1.8 agent is valid'));
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
    
    if (warnings.length > 0 || roadmapWarnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      warnings.forEach(warning => console.log('   ' + warning));
      roadmapWarnings.forEach(warning => console.log('   ⚠️  Roadmap: ' + warning));
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
  // Enhanced agent scanning with OSSA v0.1.8 detection
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
            if (agent.ossa === '0.1.8') {
              // Check for standard directory structure
              const requiredDirs = ['behaviors', 'config', 'data', 'handlers', 'integrations', 'schemas', 'training-modules', '_roadmap'];
              const existingDirs = requiredDirs.filter(dir => fs.existsSync(path.join(itemPath, dir)));
              const structureComplete = existingDirs.length === requiredDirs.length;
              
              // Check roadmap status
              const roadmapDir = path.join(itemPath, '_roadmap');
              const roadmapMetaFile = path.join(roadmapDir, 'roadmap_meta.json');
              let roadmapStatus = 'none';
              let roadmapVersions = 0;
              
              if (fs.existsSync(roadmapMetaFile)) {
                try {
                  const roadmapMeta = JSON.parse(fs.readFileSync(roadmapMetaFile, 'utf8'));
                  roadmapVersions = roadmapMeta.roadmap_files?.length || 0;
                  roadmapStatus = roadmapVersions >= 3 ? 'complete' : roadmapVersions > 0 ? 'partial' : 'meta-only';
                } catch (e) {
                  roadmapStatus = 'invalid';
                }
              }
              
              agents.push({
                name: agent.metadata?.name || item,
                version: agent.metadata?.version || '1.0.0',
                path: path.relative(process.cwd(), itemPath),
                tier: agent.spec?.conformance_tier || 'unknown',
                domain: agent.spec?.class || agent.metadata?.tags?.[0] || 'general',
                protocols: agent.spec?.protocols?.map((p: any) => p.name).join(', ') || 'none',
                hasOpenAPI: fs.existsSync(path.join(itemPath, 'openapi.yaml')),
                uadpEnabled: agent.spec?.discovery?.uadp_enabled || false,
                structureComplete,
                missingDirs: requiredDirs.filter(dir => !fs.existsSync(path.join(itemPath, dir))),
                roadmapStatus,
                roadmapVersions
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
    console.log(chalk.yellow('No OSSA v0.1.8 agents found'));
    console.log(chalk.gray('Use: ossa create <name> to create your first agent'));
    return;
  }
  
  if (options.format === 'json') {
    console.log(JSON.stringify(agents, null, 2));
  } else {
    console.log(chalk.bold('OSSA v0.1.8 Agents:'));
    console.log('');
    
    agents.forEach((agent, index) => {
      const uadpIcon = agent.uadpEnabled ? '🔍' : '⚪';
      const openApiIcon = agent.hasOpenAPI ? '📋' : '❌';
      const structureIcon = agent.structureComplete ? '📁' : '⚠️';
      const roadmapIcon = getRoadmapIcon(agent.roadmapStatus);
      
      console.log(`${index + 1}. ${chalk.blue(agent.name)} ${chalk.gray('v' + agent.version)}`);
      console.log(`   ${chalk.gray('Path:')} ${agent.path}`);
      console.log(`   ${chalk.gray('Tier:')} ${getTierIcon(agent.tier)} ${agent.tier}`);
      console.log(`   ${chalk.gray('Domain:')} ${agent.domain}`);
      console.log(`   ${chalk.gray('Protocols:')} ${agent.protocols}`);
      console.log(`   ${chalk.gray('Features:')} ${openApiIcon} OpenAPI ${uadpIcon} UADP ${structureIcon} Structure ${roadmapIcon} Roadmap`);
      
      if (!agent.structureComplete && agent.missingDirs && agent.missingDirs.length > 0) {
        console.log(`   ${chalk.yellow('Missing dirs:')} ${agent.missingDirs.join(', ')}`);
      }
      
      if (agent.roadmapStatus && agent.roadmapStatus !== 'complete') {
        const roadmapStatusText = agent.roadmapStatus === 'none' ? 'No roadmap' : 
                                 agent.roadmapStatus === 'partial' ? `Partial roadmap (${agent.roadmapVersions}/3)` :
                                 agent.roadmapStatus === 'meta-only' ? 'Metadata only' : 'Invalid roadmap';
        console.log(`   ${chalk.yellow('Roadmap:')} ${roadmapStatusText}`);
      }
      console.log('');
    });
    
    console.log(chalk.gray(`Total: ${agents.length} agents`));
    console.log(chalk.gray('Legend: 📋 OpenAPI spec, 🔍 UADP enabled, 📁 Complete structure, 🗺️ Roadmap complete'));
  }
}

function upgradeAgent(agentPath: string, options: any) {
  console.log(chalk.yellow('⚠️  Agent upgrade functionality'));
  console.log(chalk.gray('   Current version supports OSSA v0.1.8 creation'));
  console.log(chalk.gray('   For upgrades, recreate with: ossa create <name>'));
  
  if (options.dryRun) {
    console.log(chalk.blue('\nDry run mode - would upgrade:'));
    console.log(chalk.gray('   - Update ossa version to 0.1.8'));
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

function getRoadmapIcon(roadmapStatus: string): string {
  switch (roadmapStatus) {
    case 'complete': return '🗺️';
    case 'partial': return '🔄';
    case 'meta-only': return '📝';
    case 'invalid': return '❗';
    case 'none':
    default: return '❌';
  }
}
function validateAgentName(name: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for empty or null name
  if (!name || name.trim().length === 0) {
    errors.push('Agent name cannot be empty');
    return { valid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  // Check minimum length
  if (trimmedName.length < 3) {
    errors.push('Agent name must be at least 3 characters long');
  }
  
  // Check maximum length
  if (trimmedName.length > 50) {
    errors.push('Agent name must be no more than 50 characters long');
  }
  
  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validCharPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  if (!validCharPattern.test(trimmedName)) {
    errors.push('Agent name must start with a letter and contain only letters, numbers, hyphens, and underscores');
  }
  
  // Check for reserved names
  const reservedNames = [
    'admin', 'api', 'app', 'assets', 'auth', 'config', 'data', 'docs', 'health',
    'help', 'home', 'index', 'lib', 'logs', 'main', 'public', 'src', 'static',
    'system', 'temp', 'test', 'tmp', 'user', 'www', 'root', 'bin', 'dev', 
    'etc', 'opt', 'var', 'usr', 'proc', 'sys', 'agents', 'behaviors', 
    'config', 'data', 'handlers', 'integrations', 'schemas', 'training-modules'
  ];
  
  if (reservedNames.includes(trimmedName.toLowerCase())) {
    errors.push(`"${trimmedName}" is a reserved name and cannot be used`);
  }
  
  // Check for common naming conventions
  const hasConsecutiveSpecialChars = /[-_]{2,}/.test(trimmedName);
  if (hasConsecutiveSpecialChars) {
    errors.push('Agent name cannot have consecutive hyphens or underscores');
  }
  
  // Check for ending with special characters
  if (trimmedName.endsWith('-') || trimmedName.endsWith('_')) {
    errors.push('Agent name cannot end with hyphens or underscores');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function createAgentRoadmaps(agentDir: string, name: string, currentVersion: string, domain: string, tier: string) {
  const roadmapDir = path.join(agentDir, '_roadmap');
  
  // Parse version and generate next versions (patch increments)
  const versionParts = currentVersion.split('.');
  const major = parseInt(versionParts[0]) || 1;
  const minor = parseInt(versionParts[1]) || 0; 
  const patch = parseInt(versionParts[2]) || 0;
  
  const versions = [
    `${major}.${minor}.${patch}`,         // current
    `${major}.${minor}.${patch + 1}`,     // +1 patch
    `${major}.${minor}.${patch + 2}`      // +2 patch
  ];
  
  versions.forEach((version, index) => {
    const roadmapContent = createRoadmapContent(name, version, domain, tier, index);
    const filename = `${name.toLowerCase()}_${version}.dita`;
    fs.writeFileSync(path.join(roadmapDir, filename), roadmapContent);
  });
  
  // Create JSON roadmap metadata
  const roadmapMeta = {
    agent: name,
    domain: domain,
    tier: tier,
    versions: versions,
    created: new Date().toISOString(),
    ossa_version: '0.1.8',
    roadmap_files: versions.map(v => `${name.toLowerCase()}_${v}.dita`)
  };
  
  fs.writeFileSync(path.join(roadmapDir, 'roadmap_meta.json'), JSON.stringify(roadmapMeta, null, 2));
}

function createRoadmapContent(name: string, version: string, domain: string, tier: string, versionIndex: number): string {
  const isCurrentVersion = versionIndex === 0;
  const phase = isCurrentVersion ? 'Implementation' : versionIndex === 1 ? 'Enhancement' : 'Advanced Features';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="${name.toLowerCase()}_${version.replace(/\./g, '_')}" xml:lang="en-US">
  <title>${name} Agent v${version} - ${phase} Roadmap</title>
  <shortdesc>Development roadmap for ${name} agent focusing on ${domain} capabilities at ${tier} tier</shortdesc>
  
  <body>
    <section id="overview">
      <title>Overview</title>
      <p>This roadmap outlines the development plan for ${name} agent version ${version}, 
         designed to provide ${domain} capabilities with ${tier} tier conformance to OSSA v0.1.8.</p>
      
      <dl>
        <dlentry>
          <dt>Agent Name</dt>
          <dd>${name}</dd>
        </dlentry>
        <dlentry>
          <dt>Version</dt>
          <dd>${version}</dd>
        </dlentry>
        <dlentry>
          <dt>Domain</dt>
          <dd>${domain}</dd>
        </dlentry>
        <dlentry>
          <dt>Conformance Tier</dt>
          <dd>${tier}</dd>
        </dlentry>
        <dlentry>
          <dt>OSSA Compliance</dt>
          <dd>v0.1.8</dd>
        </dlentry>
      </dl>
    </section>
    
    <section id="milestones">
      <title>${phase} Milestones</title>
      ${generateMilestones(name, version, domain, tier, versionIndex)}
    </section>
    
    <section id="capabilities">
      <title>Target Capabilities</title>
      ${generateCapabilities(domain, tier, versionIndex)}
    </section>
    
    <section id="dependencies">
      <title>Dependencies</title>
      ${generateDependencies(tier, versionIndex)}
    </section>
    
    <section id="success_criteria">
      <title>Success Criteria</title>
      ${generateSuccessCriteria(domain, tier, versionIndex)}
    </section>
  </body>
</topic>`;
}

function generateMilestones(name: string, version: string, domain: string, tier: string, versionIndex: number): string {
  const milestones = [
    // Current version milestones
    [
      '<li>Core agent structure implementation</li>',
      '<li>Basic OSSA v0.1.8 compliance</li>',
      '<li>Essential directory structure setup</li>',
      '<li>Agent manifest and OpenAPI specification</li>',
      '<li>Initial testing and validation</li>'
    ],
    // +1 version milestones  
    [
      '<li>Enhanced behavior definitions</li>',
      '<li>Advanced handler implementations</li>',
      '<li>Framework integration improvements</li>',
      '<li>Performance optimization</li>',
      '<li>Extended validation and testing</li>'
    ],
    // +2 version milestones
    [
      '<li>Advanced training module integration</li>',
      '<li>Cross-agent coordination capabilities</li>',
      '<li>Enterprise-grade security features</li>',
      '<li>Full compliance framework integration</li>',
      '<li>Production deployment readiness</li>'
    ]
  ];
  
  return `<ul>\n      ${milestones[versionIndex].join('\n      ')}\n    </ul>`;
}

function generateCapabilities(domain: string, tier: string, versionIndex: number): string {
  const baseCapabilities = `<li>${domain}_analysis</li>\n      <li>multi_framework_integration</li>\n      <li>compliance_monitoring</li>`;
  
  const enhancedCapabilities = [
    baseCapabilities,
    baseCapabilities + `\n      <li>performance_optimization</li>\n      <li>advanced_${domain}_processing</li>`,
    baseCapabilities + `\n      <li>enterprise_integration</li>\n      <li>advanced_security</li>\n      <li>cross_agent_coordination</li>`
  ];
  
  return `<ul>\n      ${enhancedCapabilities[versionIndex]}\n    </ul>`;
}

function generateDependencies(tier: string, versionIndex: number): string {
  const baseDeps = '<li>OSSA v0.1.8 framework</li>\n      <li>Node.js runtime environment</li>';
  
  const dependencies = [
    baseDeps,
    baseDeps + '\n      <li>Enhanced validation libraries</li>\n      <li>Performance monitoring tools</li>',
    baseDeps + '\n      <li>Enterprise security frameworks</li>\n      <li>Advanced orchestration systems</li>'
  ];
  
  return `<ul>\n      ${dependencies[versionIndex]}\n    </ul>`;
}

function generateSuccessCriteria(domain: string, tier: string, versionIndex: number): string {
  const criteria = [
    '<li>Pass all OSSA v0.1.8 validation tests</li>\n      <li>Complete directory structure compliance</li>\n      <li>Functional OpenAPI specification</li>',
    '<li>Performance benchmarks met</li>\n      <li>Enhanced framework integration working</li>\n      <li>Advanced validation passing</li>',
    '<li>Enterprise deployment ready</li>\n      <li>Full security compliance achieved</li>\n      <li>Production monitoring operational</li>'
  ];
  
  return `<ul>\n      ${criteria[versionIndex]}\n    </ul>`;
}

// Add serve command for Docker container
program
  .command('serve')
  .description('Start OSSA gateway server')
  .option('--port <port>', 'Server port', '3000')
  .option('--host <host>', 'Server host', '0.0.0.0')
  .action(async (options) => {
    const express = (await import('express')).default;
    const { WorkspaceAuditor } = await import('./services/workspace-auditor.js');
    const app = express();
    const port = parseInt(options.port);
    const host = options.host;
    
    // Initialize workspace auditor
    const auditor = new WorkspaceAuditor('/Users/flux423/Sites/LLM');
    auditor.startAuditing(60000); // Audit every minute
    
    // Health check endpoint
    app.get('/health', (req: any, res: any) => {
      const auditStatus = auditor.getHealthStatus();
      res.json({
        status: 'ok',
        version: '0.1.8',
        service: 'ossa-gateway',
        timestamp: new Date().toISOString(),
        audit: auditStatus,
        services: [
          { name: 'gateway', status: 'running', port: 3000 },
          { name: 'discovery', status: 'available', port: 3011 },
          { name: 'coordination', status: 'available', port: 3010 },
          { name: 'orchestration', status: 'available', port: 3012 },
          { name: 'monitoring', status: 'available', port: 3013 }
        ]
      });
    });

    // Root endpoint
    app.get('/', (req: any, res: any) => {
      res.json({
        name: 'OSSA Gateway',
        version: '0.1.8',
        description: 'Open Standards for Scalable Agents - Gateway Service',
        endpoints: [
          { path: '/health', method: 'GET', description: 'Health check' },
          { path: '/api/v1/*', method: 'ALL', description: 'API Gateway routes' }
        ]
      });
    });

    // Audit status endpoint
    app.get('/audit', (req: any, res: any) => {
      const report = auditor.getLastReport();
      res.json(report || { message: 'No audit report available yet' });
    });
    
    // API gateway routes placeholder
    app.use('/api/v1', (req: any, res: any) => {
      res.json({
        message: 'OSSA API Gateway',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    app.listen(port, host, () => {
      console.log(chalk.green(`🚀 OSSA Gateway server running on ${host}:${port}`));
      console.log(chalk.gray(`   Health check: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/health`));
      console.log(chalk.gray(`   API Gateway: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/v1`));
    });
  });

// Register API-first command modules
try {
  registerApiCommands(program);
  registerOrchestrationCommands(program);
  registerGraphQLCommands(program);
  registerMonitoringCommands(program);
  registerAdvancedCommands(program);
  registerValidationCommands(program);
} catch (error) {
  console.error(chalk.red('Error registering API commands:'), error);
}

// Parse and execute
program.parse();