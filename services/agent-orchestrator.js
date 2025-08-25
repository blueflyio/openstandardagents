#!/usr/bin/env node

/**
 * OpenAPI AI Agents Standard - Master Agent Orchestrator
 * Uses TDDAI for test-driven development of all agents
 */

import { spawn } from 'child_process';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Agent definitions with TDDAI integration
const AGENTS = {
  validation: {
    name: 'Validation Agent',
    port: 3001,
    status: 'operational',
    path: 'services/validation-api',
    tddai: true,
    features: [
      'dual-format-validation',
      'schema-evolution',
      'breaking-change-detection'
    ]
  },
  protocolBridge: {
    name: 'Protocol Bridge Agent',
    port: 3011,
    status: 'partial',
    path: 'services/agents/protocol-bridge',
    tddai: true,
    features: [
      'openapi-to-mcp',
      'mcp-to-openapi',
      'a2a-discovery',
      'framework-bridges'
    ]
  },
  documentation: {
    name: 'Documentation Agent',
    port: 3003,
    status: 'pending',
    path: 'services/agents/documentation',
    tddai: true,
    features: [
      'academic-paper',
      'api-docs-generation',
      'migration-guides',
      'research-artifacts'
    ]
  },
  compliance: {
    name: 'Compliance & Governance Agent',
    port: 3004,
    status: 'pending',
    path: 'services/agents/compliance',
    tddai: true,
    features: [
      'iso-42001-validation',
      'nist-ai-rmf',
      'eu-ai-act',
      'certification-system'
    ]
  },
  performance: {
    name: 'Performance Optimization Agent',
    port: 3005,
    status: 'pending',
    path: 'services/agents/performance',
    tddai: true,
    features: [
      'token-optimization',
      'latency-benchmarks',
      'scalability-testing',
      'caching-strategies'
    ]
  },
  testing: {
    name: 'Testing & Quality Agent',
    port: 3006,
    status: 'pending',
    path: 'services/agents/testing',
    tddai: true,
    features: [
      'unit-tests',
      'integration-tests',
      'ci-cd-pipeline',
      'quality-metrics'
    ]
  },
  integration: {
    name: 'Integration & Ecosystem Agent',
    port: 3007,
    status: 'pending',
    path: 'services/agents/integration',
    tddai: true,
    features: [
      'langchain-support',
      'crewai-integration',
      'autogen-compatibility',
      'sdk-development'
    ]
  },
  market: {
    name: 'Market & Business Development Agent',
    port: 3008,
    status: 'pending',
    path: 'services/agents/market',
    tddai: true,
    features: [
      'strategic-positioning',
      'partnership-development',
      'revenue-models',
      'certification-program'
    ]
  },
  research: {
    name: 'Research & Academic Agent',
    port: 3009,
    status: 'pending',
    path: 'services/agents/research',
    tddai: true,
    features: [
      'empirical-studies',
      'publication-preparation',
      'peer-review',
      'academic-engagement'
    ]
  }
};

class AgentOrchestrator {
  constructor() {
    this.agents = AGENTS;
    this.runningProcesses = new Map();
    this.tddaiProcesses = new Map();
  }

  async initializeTDDAI() {
    console.log('🔧 Initializing TDDAI for all agents...\n');
    
    for (const [key, agent] of Object.entries(this.agents)) {
      if (agent.tddai && agent.status !== 'operational') {
        await this.setupTDDAIForAgent(key, agent);
      }
    }
  }

  async setupTDDAIForAgent(key, agent) {
    console.log(`📦 Setting up TDDAI for ${agent.name}...`);
    
    const agentPath = join(__dirname, '..', agent.path);
    
    // Create agent directory if it doesn't exist
    await mkdir(agentPath, { recursive: true });
    
    // Create TDDAI configuration
    const tddaiConfig = {
      name: agent.name,
      type: 'agent',
      framework: 'openapi-ai-agents-standard',
      features: agent.features,
      testStrategy: 'behavior-driven',
      coverage: {
        target: 80,
        enforced: true
      },
      quality: {
        linting: true,
        typeChecking: true,
        securityScanning: true
      },
      deployment: {
        port: agent.port,
        healthCheck: '/health',
        metricsEndpoint: '/metrics'
      }
    };

    // Write TDDAI configuration
    const configPath = join(agentPath, '.tddai.json');
    await writeFile(configPath, JSON.stringify(tddaiConfig, null, 2));

    // Create package.json with TDDAI scripts
    const packageJson = {
      name: `@openapi-ai-agents/${key}`,
      version: '0.1.0',
      type: 'module',
      scripts: {
        'tddai:init': 'tddai init',
        'tddai:test': 'tddai test',
        'tddai:develop': 'tddai develop',
        'tddai:implement': 'tddai implement-feature',
        'test': 'tddai test',
        'start': 'node src/index.js',
        'dev': 'tddai develop --watch'
      },
      dependencies: {
        'express': '^4.18.2',
        '@modelcontextprotocol/sdk': '^1.0.0',
        'yaml': '^2.3.4',
        'ajv': '^8.12.0'
      },
      devDependencies: {
        '@bluefly/tddai': '^1.0.0',
        '@types/node': '^20.10.0'
      }
    };

    const packagePath = join(agentPath, 'package.json');
    await writeFile(packagePath, JSON.stringify(packageJson, null, 2));

    // Create test specifications for each feature
    for (const feature of agent.features) {
      await this.createFeatureSpec(agentPath, feature);
    }

    console.log(`✅ TDDAI setup complete for ${agent.name}\n`);
  }

  async createFeatureSpec(agentPath, feature) {
    const specDir = join(agentPath, 'specs');
    await mkdir(specDir, { recursive: true });

    const spec = `
# Feature: ${feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

## User Story
As a developer using the OpenAPI AI Agents Standard
I want ${feature.replace(/-/g, ' ')}
So that I can achieve interoperability and compliance

## Acceptance Criteria
- [ ] Feature is fully implemented
- [ ] All tests pass
- [ ] Documentation is complete
- [ ] Performance metrics are met
- [ ] Security scanning passes

## Test Scenarios

### Scenario 1: Basic functionality
Given the agent is operational
When I invoke the ${feature} endpoint
Then I should receive a valid response
And the response should conform to the OpenAPI spec

### Scenario 2: Error handling
Given the agent is operational
When I send invalid data to ${feature}
Then I should receive an appropriate error response
And the error should include helpful debugging information

### Scenario 3: Performance
Given the agent is under load
When multiple requests are sent to ${feature}
Then response time should be < 100ms
And throughput should exceed 100 req/s
`;

    const specPath = join(specDir, `${feature}.spec.md`);
    await writeFile(specPath, spec);
  }

  async deployAgent(key) {
    const agent = this.agents[key];
    console.log(`🚀 Deploying ${agent.name}...`);

    if (agent.status === 'operational') {
      console.log(`✅ ${agent.name} is already operational`);
      return;
    }

    // First, run TDDAI to generate the implementation
    await this.runTDDAI(key, agent);

    // Then start the agent
    await this.startAgent(key, agent);
  }

  async runTDDAI(key, agent) {
    console.log(`🧪 Running TDDAI for ${agent.name}...`);
    
    const agentPath = join(__dirname, '..', agent.path);
    
    return new Promise((resolve, reject) => {
      const tddaiProcess = spawn('npx', ['tddai', 'implement-feature', '--all'], {
        cwd: agentPath,
        env: { ...process.env, TDDAI_AUTO_MODE: 'true' }
      });

      tddaiProcess.stdout.on('data', (data) => {
        console.log(`[TDDAI ${agent.name}]: ${data.toString().trim()}`);
      });

      tddaiProcess.stderr.on('data', (data) => {
        console.error(`[TDDAI ERROR ${agent.name}]: ${data.toString().trim()}`);
      });

      tddaiProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ TDDAI implementation complete for ${agent.name}`);
          resolve();
        } else {
          reject(new Error(`TDDAI failed for ${agent.name} with code ${code}`));
        }
      });

      this.tddaiProcesses.set(key, tddaiProcess);
    });
  }

  async startAgent(key, agent) {
    const agentPath = join(__dirname, '..', agent.path);
    
    console.log(`▶️  Starting ${agent.name} on port ${agent.port}...`);

    const agentProcess = spawn('npm', ['start'], {
      cwd: agentPath,
      env: { ...process.env, PORT: agent.port }
    });

    agentProcess.stdout.on('data', (data) => {
      console.log(`[${agent.name}]: ${data.toString().trim()}`);
    });

    agentProcess.stderr.on('data', (data) => {
      console.error(`[${agent.name} ERROR]: ${data.toString().trim()}`);
    });

    this.runningProcesses.set(key, agentProcess);
    
    // Wait for agent to be ready
    await this.waitForAgent(agent);
    
    console.log(`✅ ${agent.name} is running on port ${agent.port}\n`);
  }

  async waitForAgent(agent, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://localhost:${agent.port}/health`);
        if (response.ok) {
          return true;
        }
      } catch (e) {
        // Agent not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`${agent.name} failed to start`);
  }

  async orchestratePattern(pattern) {
    console.log(`\n🔄 Executing orchestration pattern: ${pattern}\n`);

    switch (pattern) {
      case 'diagnostic-first':
        await this.deployAgent('validation');
        await this.deployAgent('protocolBridge');
        await this.deployAgent('documentation');
        break;

      case 'parallel-validation':
        await Promise.all([
          this.deployAgent('validation'),
          this.deployAgent('compliance'),
          this.deployAgent('performance'),
          this.deployAgent('testing')
        ]);
        break;

      case 'hierarchical':
        await this.deployAgent('market');
        await Promise.all([
          this.deployAgent('integration'),
          this.deployAgent('research')
        ]);
        await Promise.all([
          this.deployAgent('protocolBridge'),
          this.deployAgent('documentation'),
          this.deployAgent('compliance')
        ]);
        break;

      case 'full-deployment':
        // Deploy all agents
        for (const key of Object.keys(this.agents)) {
          await this.deployAgent(key);
        }
        break;

      default:
        throw new Error(`Unknown orchestration pattern: ${pattern}`);
    }
  }

  async runIntegrationTests() {
    console.log('\n🧪 Running integration tests across all agents...\n');

    const tests = [
      {
        name: 'Protocol Bridge Test',
        endpoint: `http://localhost:${this.agents.protocolBridge.port}/convert/openapi-to-mcp`,
        method: 'POST',
        body: {
          openapi: {
            openapi: '3.1.0',
            paths: {
              '/test': {
                get: { operationId: 'test' }
              }
            }
          }
        }
      },
      {
        name: 'Validation Test',
        endpoint: `http://localhost:${this.agents.validation.port}/api/v1/validate/dual-format`,
        method: 'POST',
        body: {
          agentYml: 'apiVersion: v1\nkind: Agent',
          openApiYaml: 'openapi: 3.1.0'
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const response = await fetch(test.endpoint, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.body)
        });
        
        const success = response.ok;
        results.push({
          test: test.name,
          success,
          status: response.status
        });
        
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${response.status}`);
      } catch (error) {
        results.push({
          test: test.name,
          success: false,
          error: error.message
        });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    return results;
  }

  async generateReport() {
    console.log('\n📊 Generating deployment report...\n');

    const report = {
      timestamp: new Date().toISOString(),
      agents: {},
      orchestrationPatterns: [
        'diagnostic-first',
        'parallel-validation', 
        'hierarchical',
        'adaptive'
      ],
      complianceFrameworks: [
        'ISO 42001:2023',
        'NIST AI RMF 1.0',
        'EU AI Act'
      ],
      certificationLevels: ['Bronze', 'Silver', 'Gold']
    };

    for (const [key, agent] of Object.entries(this.agents)) {
      report.agents[key] = {
        name: agent.name,
        port: agent.port,
        status: agent.status,
        features: agent.features,
        tddai: agent.tddai,
        running: this.runningProcesses.has(key)
      };
    }

    const reportPath = join(__dirname, '..', 'deployment-report.json');
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`Report saved to: ${reportPath}`);
    return report;
  }

  async shutdown() {
    console.log('\n🛑 Shutting down all agents...\n');

    for (const [key, process] of this.runningProcesses.entries()) {
      console.log(`Stopping ${this.agents[key].name}...`);
      process.kill('SIGTERM');
    }

    for (const [key, process] of this.tddaiProcesses.entries()) {
      console.log(`Stopping TDDAI for ${this.agents[key].name}...`);
      process.kill('SIGTERM');
    }

    this.runningProcesses.clear();
    this.tddaiProcesses.clear();
    
    console.log('✅ All agents stopped\n');
  }
}

// Main execution
async function main() {
  console.log('🎯 OpenAPI AI Agents Standard - Full Deployment with TDDAI\n');
  console.log('=' . repeat(60));

  const orchestrator = new AgentOrchestrator();

  try {
    // Initialize TDDAI for all agents
    await orchestrator.initializeTDDAI();

    // Deploy using full deployment pattern
    await orchestrator.orchestratePattern('full-deployment');

    // Run integration tests
    const testResults = await orchestrator.runIntegrationTests();

    // Generate deployment report
    const report = await orchestrator.generateReport();

    console.log('\n' + '=' . repeat(60));
    console.log('✅ DEPLOYMENT COMPLETE');
    console.log('=' . repeat(60));
    console.log('\nAgent Status:');
    for (const [key, agent] of Object.entries(report.agents)) {
      const icon = agent.running ? '🟢' : '🔴';
      console.log(`${icon} ${agent.name}: Port ${agent.port}`);
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Review deployment report: deployment-report.json');
    console.log('2. Access agent dashboards at their respective ports');
    console.log('3. Run: npm run test:integration for full test suite');
    console.log('4. Start implementing remaining features with TDDAI');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    await orchestrator.shutdown();
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nReceived SIGINT, shutting down gracefully...');
    await orchestrator.shutdown();
    process.exit(0);
  });
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { AgentOrchestrator, AGENTS };