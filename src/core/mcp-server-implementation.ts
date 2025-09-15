// OSSA MCP Server - Complete Implementation
// File: mcp-server/src/index.ts

import { Server } from '@modelcontextprotocol/server';
import { SSETransport } from '@modelcontextprotocol/transport-sse';
import express, { Application } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// OSSA Schema Definitions
// ============================================================================

interface OSSAAgent {
  id: string;
  name: string;
  type: 'voice' | 'critic' | 'monitor' | 'orchestrator';
  version: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  metadata: {
    created: string;
    updated: string;
    author: string;
    framework: string;
  };
  configuration: {
    runtime: Record<string, any>;
    resources: {
      cpu: string;
      memory: string;
      gpu?: string;
    };
    permissions: string[];
  };
  lifecycle: {
    startup: {
      command: string;
      timeout: number;
    };
    shutdown: {
      command: string;
      gracePeriod: number;
    };
    health: {
      endpoint: string;
      interval: number;
    };
  };
}

interface OSSASchema {
  version: string;
  agents: {
    types: string[];
    capabilities: string[];
    permissions: string[];
  };
  validation: {
    rules: Record<string, any>;
    strict: boolean;
  };
}

interface LifecycleEvent {
  timestamp: string;
  agentId: string;
  event: 'started' | 'stopped' | 'error' | 'health_check';
  details: Record<string, any>;
}

// ============================================================================
// Main MCP Server Implementation
// ============================================================================

export class OSSAMCPServer {
  private server: Server;
  private app: Application;
  private wss: WebSocketServer;
  private agents: Map<string, OSSAAgent> = new Map();
  private lifecycleEvents: LifecycleEvent[] = [];
  private wsClients: Set<WebSocket> = new Set();
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.env.OSSA_PROJECT_ROOT || process.cwd();
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    this.server = new Server({
      name: 'ossa-mcp-server',
      version: '1.0.0',
      capabilities: {
        tools: {
          list: true
        },
        resources: {
          list: true,
          read: true
        },
        prompts: {
          list: true
        }
      }
    });

    this.wss = new WebSocketServer({ noServer: true });
    this.initializeServer();
    this.loadAgents();
  }

  private async loadAgents() {
    try {
      const agentsPath = path.join(this.projectRoot, '.agents');
      const agentDirs = await fs.readdir(agentsPath);
      
      for (const dir of agentDirs) {
        const manifestPath = path.join(agentsPath, dir, 'manifest.json');
        try {
          const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
          this.agents.set(manifest.name, {
            ...manifest,
            id: manifest.name,
            status: 'inactive'
          });
        } catch (err) {
          console.error(`Failed to load agent ${dir}:`, err);
        }
      }
    } catch (err) {
      console.log('No agents directory found, starting with empty registry');
    }
  }

  private initializeServer() {
    // Register all tool handlers
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'ossa_generate_agent',
          description: 'Generate a new OSSA-compliant agent with full scaffolding',
          inputSchema: {
            type: 'object',
            properties: {
              name: { 
                type: 'string',
                description: 'Name of the agent (alphanumeric and hyphens only)'
              },
              type: { 
                type: 'string', 
                enum: ['voice', 'critic', 'monitor', 'orchestrator'],
                description: 'Type of agent to generate'
              },
              capabilities: { 
                type: 'array',
                items: { type: 'string' },
                description: 'List of capabilities like: audio, network, file-access'
              },
              description: {
                type: 'string',
                description: 'Human-readable description of the agent\'s purpose'
              }
            },
            required: ['name', 'type']
          }
        },
        {
          name: 'ossa_validate',
          description: 'Validate agent manifests against OSSA schema',
          inputSchema: {
            type: 'object',
            properties: {
              path: { 
                type: 'string',
                description: 'Path to validate (relative to project root)'
              },
              strict: { 
                type: 'boolean', 
                default: false,
                description: 'Enable strict validation mode'
              }
            },
            required: ['path']
          }
        },
        {
          name: 'ossa_test_compliance',
          description: 'Run comprehensive OSSA compliance tests',
          inputSchema: {
            type: 'object',
            properties: {
              agentId: { 
                type: 'string',
                description: 'ID of the agent to test'
              },
              testSuite: { 
                type: 'string',
                enum: ['basic', 'full', 'security', 'performance'],
                description: 'Test suite to run'
              }
            },
            required: ['agentId']
          }
        },
        {
          name: 'ossa_introspect',
          description: 'Introspect OSSA agents, types, specs, and schemas',
          inputSchema: {
            type: 'object',
            properties: {
              target: { 
                type: 'string',
                enum: ['agents', 'types', 'specs', 'schemas', 'capabilities'],
                description: 'What to introspect'
              },
              filter: { 
                type: 'object',
                description: 'Optional filter criteria'
              }
            },
            required: ['target']
          }
        },
        {
          name: 'ossa_lifecycle',
          description: 'Manage agent lifecycle (start, stop, restart, status)',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['start', 'stop', 'restart', 'status', 'logs'],
                description: 'Lifecycle action to perform'
              },
              agentId: { 
                type: 'string',
                description: 'ID of the agent'
              }
            },
            required: ['action', 'agentId']
          }
        },
        {
          name: 'ossa_schema_evolve',
          description: 'Evolve OSSA schema using Apple-style versioning',
          inputSchema: {
            type: 'object',
            properties: {
              newVersion: {
                type: 'string',
                description: 'New schema version (e.g., 1.1.0)'
              },
              changes: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of changes in the new version'
              },
              breaking: {
                type: 'boolean',
                default: false,
                description: 'Whether this includes breaking changes'
              }
            },
            required: ['newVersion']
          }
        },
        {
          name: 'ossa_gitlab_ci',
          description: 'Configure GitLab CI/CD for OSSA project',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['init', 'update', 'add-job', 'validate'],
                description: 'CI/CD action to perform'
              },
              config: {
                type: 'object',
                description: 'Configuration parameters'
              }
            },
            required: ['action']
          }
        },
        {
          name: 'ossa_project_init',
          description: 'Initialize a new OSSA project with full structure',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Project name'
              },
              template: {
                type: 'string',
                enum: ['basic', 'advanced', 'enterprise'],
                default: 'basic',
                description: 'Project template to use'
              },
              features: {
                type: 'array',
                items: { type: 'string' },
                description: 'Additional features to enable'
              }
            },
            required: ['name']
          }
        }
      ]
    }));

    // Tool execution handler
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ossa_generate_agent':
            return await this.generateAgent(args);
          
          case 'ossa_validate':
            return await this.validateAgent(args);
          
          case 'ossa_test_compliance':
            return await this.testCompliance(args);
          
          case 'ossa_introspect':
            return await this.introspect(args);
          
          case 'ossa_lifecycle':
            return await this.manageLifecycle(args);
          
          case 'ossa_schema_evolve':
            return await this.evolveSchema(args);
          
          case 'ossa_gitlab_ci':
            return await this.configureGitLabCI(args);
          
          case 'ossa_project_init':
            return await this.initializeProject(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler('resources/list', async () => ({
      resources: [
        {
          uri: 'ossa://docs',
          name: 'OSSA Documentation',
          mimeType: 'text/markdown',
          description: 'Complete OSSA framework documentation'
        },
        {
          uri: 'ossa://schemas',
          name: 'OSSA Schemas',
          mimeType: 'application/json',
          description: 'Current OSSA schema definitions'
        },
        {
          uri: 'ossa://agents',
          name: 'Registered Agents',
          mimeType: 'application/json',
          description: 'All registered OSSA agents'
        },
        {
          uri: 'ossa://lifecycle',
          name: 'Lifecycle Events',
          mimeType: 'application/json',
          description: 'Recent lifecycle events'
        }
      ]
    }));

    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case 'ossa://docs':
          return {
            contents: await this.getDocumentation()
          };
        
        case 'ossa://schemas':
          return {
            contents: JSON.stringify(await this.getSchemas(), null, 2)
          };
        
        case 'ossa://agents':
          return {
            contents: JSON.stringify(Array.from(this.agents.values()), null, 2)
          };
        
        case 'ossa://lifecycle':
          return {
            contents: JSON.stringify(this.lifecycleEvents, null, 2)
          };
        
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // Prompt templates
    this.server.setRequestHandler('prompts/list', async () => ({
      prompts: [
        {
          name: 'create_voice_agent',
          description: 'Create a new voice assistant agent',
          arguments: [
            { name: 'name', description: 'Agent name', required: true },
            { name: 'capabilities', description: 'Comma-separated capabilities', required: false }
          ]
        },
        {
          name: 'validate_project',
          description: 'Validate entire OSSA project structure',
          arguments: []
        },
        {
          name: 'setup_cicd',
          description: 'Set up complete CI/CD pipeline',
          arguments: [
            { name: 'platform', description: 'CI/CD platform (gitlab/github)', required: true }
          ]
        }
      ]
    }));

    this.server.setRequestHandler('prompts/get', async (request) => {
      const { name, arguments: args } = request.params;
      
      const templates = {
        create_voice_agent: `Generate a voice assistant agent named "${args.name}" with capabilities: ${args.capabilities || 'audio,network'}. Include full implementation with voice processing, command handling, and response generation.`,
        validate_project: `Validate all agents in the current OSSA project against the schema. Check for: manifest validity, required fields, capability declarations, and lifecycle configurations.`,
        setup_cicd: `Set up a complete CI/CD pipeline for ${args.platform} including: schema validation, agent testing, compliance checks, build stages, and deployment configuration.`
      };
      
      return {
        prompt: templates[name] || 'Template not found'
      };
    });
  }

  // ============================================================================
  // Tool Implementation Methods
  // ============================================================================

  private async generateAgent(args: any) {
    const { name, type, capabilities = [], description = '' } = args;
    
    // Validate agent name
    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error('Agent name must be alphanumeric with hyphens only');
    }

    const agentPath = path.join(this.projectRoot, '.agents', name);
    
    // Create agent directory
    await fs.mkdir(agentPath, { recursive: true });
    await fs.mkdir(path.join(agentPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(agentPath, 'tests'), { recursive: true });
    await fs.mkdir(path.join(agentPath, 'config'), { recursive: true });

    // Generate manifest
    const manifest: OSSAAgent = {
      id: name,
      name,
      type,
      version: '0.1.0',
      capabilities,
      status: 'inactive',
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        author: 'Claude Desktop',
        framework: 'OSSA 1.0'
      },
      configuration: {
        runtime: this.getDefaultRuntimeConfig(type),
        resources: this.getDefaultResources(type),
        permissions: this.getPermissionsFromCapabilities(capabilities)
      },
      lifecycle: {
        startup: {
          command: `node ./src/index.js`,
          timeout: 30
        },
        shutdown: {
          command: `node ./src/shutdown.js`,
          gracePeriod: 10
        },
        health: {
          endpoint: `/health/${name}`,
          interval: 60
        }
      }
    };

    // Write manifest
    await fs.writeFile(
      path.join(agentPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Generate source code
    await this.generateAgentCode(name, type, agentPath, description);

    // Generate tests
    await this.generateAgentTests(name, type, agentPath);

    // Generate configuration
    await this.generateAgentConfig(name, type, agentPath);

    // Generate package.json
    await this.generatePackageJson(name, type, agentPath);

    // Add to GitLab CI if exists
    await this.addAgentToCI(name, type);

    // Register agent
    this.agents.set(name, manifest);

    // Broadcast lifecycle event
    this.broadcastLifecycleEvent({
      timestamp: new Date().toISOString(),
      agentId: name,
      event: 'started',
      details: { action: 'created', type, capabilities }
    });

    return {
      success: true,
      message: `Agent '${name}' created successfully`,
      path: agentPath,
      manifest,
      files: [
        'manifest.json',
        'src/index.js',
        'src/shutdown.js',
        'tests/unit.test.js',
        'config/default.json',
        'package.json'
      ]
    };
  }

  private async generateAgentCode(name: string, type: string, agentPath: string, description: string) {
    const templates = {
      voice: this.getVoiceAgentTemplate,
      critic: this.getCriticAgentTemplate,
      monitor: this.getMonitorAgentTemplate,
      orchestrator: this.getOrchestratorAgentTemplate
    };

    const mainCode = templates[type](name, description);
    const shutdownCode = this.getShutdownTemplate(name);

    await fs.writeFile(path.join(agentPath, 'src', 'index.js'), mainCode);
    await fs.writeFile(path.join(agentPath, 'src', 'shutdown.js'), shutdownCode);
  }

  private getVoiceAgentTemplate(name: string, description: string): string {
    return `/**
 * OSSA Voice Agent: ${name}
 * ${description || 'Voice processing agent for audio input/output'}
 * 
 * @framework OSSA 1.0
 * @type voice
 */

const { VoiceAgent } = require('@ossa/core');
const { WhisperEngine } = require('@ossa/voice');
const express = require('express');

class ${this.toPascalCase(name)}Agent extends VoiceAgent {
  constructor() {
    super({
      name: '${name}',
      engine: new WhisperEngine({
        model: 'whisper-1',
        language: 'en',
        temperature: 0.0
      })
    });
    
    this.commands = new Map();
    this.initializeCommands();
    this.setupHealthEndpoint();
  }
  
  initializeCommands() {
    // Register voice commands
    this.registerCommand('hello', this.handleHello.bind(this));
    this.registerCommand('help', this.handleHelp.bind(this));
    this.registerCommand('status', this.handleStatus.bind(this));
  }
  
  async onVoiceInput(audioBuffer) {
    try {
      // Transcribe audio to text
      const transcript = await this.engine.transcribe(audioBuffer);
      console.log(\`Transcribed: \${transcript}\`);
      
      // Process the command
      const response = await this.processCommand(transcript);
      
      // Convert response to speech
      const audioResponse = await this.engine.synthesize(response.text);
      
      return {
        transcript,
        response: response.text,
        audio: audioResponse,
        action: response.action || 'continue'
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      return {
        error: error.message,
        action: 'retry'
      };
    }
  }
  
  async processCommand(text) {
    const normalized = text.toLowerCase().trim();
    
    // Check for registered commands
    for (const [keyword, handler] of this.commands) {
      if (normalized.includes(keyword)) {
        return await handler(text);
      }
    }
    
    // Default response
    return {
      text: "I didn't understand that command. Say 'help' for available commands.",
      action: 'continue'
    };
  }
  
  registerCommand(keyword, handler) {
    this.commands.set(keyword.toLowerCase(), handler);
  }
  
  async handleHello(text) {
    return {
      text: \`Hello! I'm \${this.name}, your voice assistant. How can I help you today?\`,
      action: 'continue'
    };
  }
  
  async handleHelp(text) {
    const commands = Array.from(this.commands.keys()).join(', ');
    return {
      text: \`Available commands: \${commands}. Just say any of these words and I'll help you.\`,
      action: 'continue'
    };
  }
  
  async handleStatus(text) {
    return {
      text: \`System status: All systems operational. Voice recognition active.\`,
      action: 'continue'
    };
  }
  
  setupHealthEndpoint() {
    const app = express();
    app.get(\`/health/\${this.name}\`, (req, res) => {
      res.json({
        status: 'healthy',
        agent: this.name,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });
    
    const port = process.env.HEALTH_PORT || 3001;
    app.listen(port, () => {
      console.log(\`Health endpoint available at http://localhost:\${port}/health/\${this.name}\`);
    });
  }
}

// Create and start the agent
const agent = new ${this.toPascalCase(name)}Agent();
agent.start();

// Export for testing
module.exports = agent;
`;
  }

  private getCriticAgentTemplate(name: string, description: string): string {
    return `/**
 * OSSA Critic Agent: ${name}
 * ${description || 'Critical evaluation and feedback agent'}
 * 
 * @framework OSSA 1.0
 * @type critic
 */

const { CriticAgent } = require('@ossa/core');
const express = require('express');

class ${this.toPascalCase(name)}Agent extends CriticAgent {
  constructor() {
    super({
      name: '${name}',
      evaluationCriteria: [
        'accuracy',
        'completeness',
        'clarity',
        'performance'
      ],
      thresholds: {
        pass: 0.7,
        excellent: 0.9
      }
    });
    
    this.setupHealthEndpoint();
  }
  
  async evaluate(input) {
    const startTime = Date.now();
    
    try {
      // Perform multi-criteria evaluation
      const scores = await this.performEvaluation(input);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(scores);
      
      // Generate feedback
      const feedback = this.generateFeedback(scores, overallScore);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(scores);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        input: input.id || 'unknown',
        scores,
        overallScore,
        feedback,
        recommendations,
        duration,
        status: this.getStatus(overallScore)
      };
    } catch (error) {
      console.error('Evaluation error:', error);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  async performEvaluation(input) {
    const scores = {};
    
    for (const criterion of this.evaluationCriteria) {
      scores[criterion] = await this.evaluateCriterion(input, criterion);
    }
    
    return scores;
  }
  
  async evaluateCriterion(input, criterion) {
    // Implement specific evaluation logic for each criterion
    switch (criterion) {
      case 'accuracy':
        return this.evaluateAccuracy(input);
      case 'completeness':
        return this.evaluateCompleteness(input);
      case 'clarity':
        return this.evaluateClarity(input);
      case 'performance':
        return this.evaluatePerformance(input);
      default:
        return 0.5; // Neutral score for unknown criteria
    }
  }
  
  evaluateAccuracy(input) {
    // Implement accuracy evaluation
    // This is a placeholder - implement actual logic
    return 0.85;
  }
  
  evaluateCompleteness(input) {
    // Check if all required fields are present
    const requiredFields = ['data', 'metadata', 'timestamp'];
    const presentFields = requiredFields.filter(field => input[field]);
    return presentFields.length / requiredFields.length;
  }
  
  evaluateClarity(input) {
    // Evaluate clarity of the input
    // This is a placeholder - implement actual logic
    return 0.75;
  }
  
  evaluatePerformance(input) {
    // Evaluate performance metrics
    // This is a placeholder - implement actual logic
    return 0.9;
  }
  
  calculateOverallScore(scores) {
    const values = Object.values(scores);
    return values.reduce((sum, score) => sum + score, 0) / values.length;
  }
  
  generateFeedback(scores, overallScore) {
    const status = this.getStatus(overallScore);
    let feedback = \`Overall evaluation: \${status}. \`;
    
    // Add specific feedback for low-scoring criteria
    for (const [criterion, score] of Object.entries(scores)) {
      if (score < this.thresholds.pass) {
        feedback += \`\${criterion} needs improvement (score: \${score.toFixed(2)}). \`;
      }
    }
    
    return feedback;
  }
  
  generateRecommendations(scores) {
    const recommendations = [];
    
    for (const [criterion, score] of Object.entries(scores)) {
      if (score < this.thresholds.pass) {
        recommendations.push({
          criterion,
          score,
          recommendation: this.getRecommendation(criterion)
        });
      }
    }
    
    return recommendations;
  }
  
  getRecommendation(criterion) {
    const recommendations = {
      accuracy: 'Review and validate data sources for improved accuracy',
      completeness: 'Ensure all required fields are populated',
      clarity: 'Simplify and clarify the presentation of information',
      performance: 'Optimize processing and reduce latency'
    };
    
    return recommendations[criterion] || 'General improvement needed';
  }
  
  getStatus(score) {
    if (score >= this.thresholds.excellent) return 'EXCELLENT';
    if (score >= this.thresholds.pass) return 'PASS';
    return 'NEEDS_IMPROVEMENT';
  }
  
  setupHealthEndpoint() {
    const app = express();
    app.get(\`/health/\${this.name}\`, (req, res) => {
      res.json({
        status: 'healthy',
        agent: this.name,
        type: 'critic',
        uptime: process.uptime(),
        evaluations: this.evaluationCount || 0
      });
    });
    
    const port = process.env.HEALTH_PORT || 3002;
    app.listen(port, () => {
      console.log(\`Health endpoint available at http://localhost:\${port}/health/\${this.name}\`);
    });
  }
}

// Create and start the agent
const agent = new ${this.toPascalCase(name)}Agent();
agent.start();

module.exports = agent;
`;
  }

  private getMonitorAgentTemplate(name: string, description: string): string {
    return `/**
 * OSSA Monitor Agent: ${name}
 * ${description || 'System monitoring and metrics collection agent'}
 * 
 * @framework OSSA 1.0
 * @type monitor
 */

const { MonitorAgent } = require('@ossa/core');
const express = require('express');
const os = require('os');

class ${this.toPascalCase(name)}Agent extends MonitorAgent {
  constructor() {
    super({
      name: '${name}',
      metrics: ['cpu', 'memory', 'disk', 'network', 'latency'],
      interval: 5000, // Collect metrics every 5 seconds
      bufferSize: 100 // Keep last 100 readings
    });
    
    this.metricsBuffer = [];
    this.alerts = [];
    this.thresholds = {
      cpu: 80,
      memory: 90,
      disk: 95
    };
    
    this.setupHealthEndpoint();
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      this.collect();
    }, this.interval);
    
    console.log(\`Monitoring started with \${this.interval}ms interval\`);
  }
  
  async collect() {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        cpu: this.getCPUUsage(),
        memory: this.getMemoryUsage(),
        disk: await this.getDiskUsage(),
        network: this.getNetworkStats(),
        uptime: os.uptime()
      },
      process: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      },
      custom: await this.collectCustomMetrics()
    };
    
    // Add to buffer
    this.metricsBuffer.push(metrics);
    if (this.metricsBuffer.length > this.bufferSize) {
      this.metricsBuffer.shift();
    }
    
    // Check thresholds and generate alerts
    this.checkThresholds(metrics);
    
    // Emit metrics event
    this.emit('metrics', metrics);
    
    return metrics;
  }
  
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return {
      usage,
      cores: cpus.length,
      model: cpus[0].model
    };
  }
  
  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = (used / total) * 100;
    
    return {
      total,
      free,
      used,
      percentage: percentage.toFixed(2)
    };
  }
  
  async getDiskUsage() {
    // Placeholder for disk usage
    // In production, use a library like 'diskusage'
    return {
      total: 1000000000000, // 1TB
      free: 500000000000,   // 500GB
      used: 500000000000,   // 500GB
      percentage: 50
    };
  }
  
  getNetworkStats() {
    const interfaces = os.networkInterfaces();
    const stats = [];
    
    for (const [name, nets] of Object.entries(interfaces)) {
      for (const net of nets) {
        if (net.family === 'IPv4' && !net.internal) {
          stats.push({
            interface: name,
            address: net.address,
            netmask: net.netmask
          });
        }
      }
    }
    
    return stats;
  }
  
  async collectCustomMetrics() {
    // Override this method to collect custom metrics
    return {
      activeConnections: 0,
      requestsPerSecond: 0,
      averageResponseTime: 0
    };
  }
  
  checkThresholds(metrics) {
    const cpu = metrics.system.cpu.usage;
    const memory = parseFloat(metrics.system.memory.percentage);
    const disk = metrics.system.disk.percentage;
    
    if (cpu > this.thresholds.cpu) {
      this.generateAlert('CPU', cpu, this.thresholds.cpu);
    }
    
    if (memory > this.thresholds.memory) {
      this.generateAlert('Memory', memory, this.thresholds.memory);
    }
    
    if (disk > this.thresholds.disk) {
      this.generateAlert('Disk', disk, this.thresholds.disk);
    }
  }
  
  generateAlert(metric, value, threshold) {
    const alert = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      threshold,
      severity: this.getSeverity(value, threshold),
      message: \`\${metric} usage (\${value}%) exceeds threshold (\${threshold}%)\`
    };
    
    this.alerts.push(alert);
    this.emit('alert', alert);
    console.warn(\`ALERT: \${alert.message}\`);
  }
  
  getSeverity(value, threshold) {
    const excess = value - threshold;
    if (excess > 15) return 'CRITICAL';
    if (excess > 10) return 'HIGH';
    if (excess > 5) return 'MEDIUM';
    return 'LOW';
  }
  
  getMetricsSummary() {
    if (this.metricsBuffer.length === 0) {
      return { message: 'No metrics collected yet' };
    }
    
    const latest = this.metricsBuffer[this.metricsBuffer.length - 1];
    const averages = this.calculateAverages();
    
    return {
      latest,
      averages,
      bufferSize: this.metricsBuffer.length,
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
  }
  
  calculateAverages() {
    const totals = {
      cpu: 0,
      memory: 0,
      disk: 0
    };
    
    this.metricsBuffer.forEach(metric => {
      totals.cpu += metric.system.cpu.usage;
      totals.memory += parseFloat(metric.system.memory.percentage);
      totals.disk += metric.system.disk.percentage;
    });
    
    const count = this.metricsBuffer.length;
    
    return {
      cpu: (totals.cpu / count).toFixed(2),
      memory: (totals.memory / count).toFixed(2),
      disk: (totals.disk / count).toFixed(2)
    };
  }
  
  setupHealthEndpoint() {
    const app = express();
    
    app.get(\`/health/\${this.name}\`, (req, res) => {
      res.json({
        status: 'healthy',
        agent: this.name,
        type: 'monitor',
        uptime: process.uptime(),
        metricsCollected: this.metricsBuffer.length,
        activeAlerts: this.alerts.filter(a => 
          Date.now() - new Date(a.timestamp).getTime() < 300000
        ).length
      });
    });
    
    app.get(\`/metrics/\${this.name}\`, (req, res) => {
      res.json(this.getMetricsSummary());
    });
    
    const port = process.env.HEALTH_PORT || 3003;
    app.listen(port, () => {
      console.log(\`Health endpoint available at http://localhost:\${port}/health/\${this.name}\`);
      console.log(\`Metrics endpoint available at http://localhost:\${port}/metrics/\${this.name}\`);
    });
  }
}

// Create and start the agent
const agent = new ${this.toPascalCase(name)}Agent();
agent.start();

module.exports = agent;
`;
  }

  private getOrchestratorAgentTemplate(name: string, description: string): string {
    return `/**
 * OSSA Orchestrator Agent: ${name}
 * ${description || 'Multi-agent orchestration and coordination'}
 * 
 * @framework OSSA 1.0
 * @type orchestrator
 */

const { OrchestratorAgent } = require('@ossa/core');
const express = require('express');
const { EventEmitter } = require('events');

class ${this.toPascalCase(name)}Agent extends OrchestratorAgent {
  constructor() {
    super({
      name: '${name}',
      maxAgents: 10,
      schedulingAlgorithm: 'round-robin',
      timeout: 300000 // 5 minutes default timeout
    });
    
    this.agents = new Map();
    this.taskQueue = [];
    this.activeTask