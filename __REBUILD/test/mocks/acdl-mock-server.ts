/**
 * ACDL Mock Server Configuration
 * Uses agent spawning commands to simulate ACDL endpoints
 * Version: v0.1.9-alpha.1
 */

import express, { Express, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface AgentSpawnOptions {
  type: 'development' | 'validation' | 'orchestration' | 'review' | 'implementation';
  phase: 'planning' | 'implementation' | 'review' | 'deployment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  flags?: string[];
}

export class ACDLMockServer {
  private app: Express;
  private port: number;
  private agentRegistry: Map<string, any>;
  private cliPath: string;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.agentRegistry = new Map();
    this.cliPath = path.resolve(__dirname, '../../dist/cli/commands/agents.js');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeMockAgents();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS for testing
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[MOCK] ${req.method} ${req.path}`);
      next();
    });
  }

  private async spawnAgent(options: AgentSpawnOptions): Promise<any> {
    const { type, phase, priority, flags = [] } = options;
    
    // Build command
    const flagString = flags.join(' ');
    const command = `node ${this.cliPath} spawn --type ${type} --phase ${phase} --priority ${priority} ${flagString}`;
    
    console.log(`[SPAWN] Executing: ${command}`);
    
    try {
      // In mock mode, we simulate the response
      // In real mode, this would execute the actual CLI command
      if (process.env.MOCK_MODE !== 'false') {
        return this.generateMockAgentResponse(options);
      }
      
      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        console.error(`[SPAWN ERROR] ${stderr}`);
      }
      return JSON.parse(stdout);
    } catch (error) {
      console.error(`[SPAWN FAILED]`, error);
      return this.generateMockAgentResponse(options);
    }
  }

  private generateMockAgentResponse(options: AgentSpawnOptions): any {
    const agentId = `${options.type}-${Date.now()}-v1.0.0`;
    return {
      agentId,
      status: 'spawned',
      type: options.type,
      phase: options.phase,
      priority: options.priority,
      endpoint: `http://localhost:${3100 + Math.floor(Math.random() * 100)}`,
      capabilities: this.getCapabilitiesForType(options.type)
    };
  }

  private getCapabilitiesForType(type: string): any {
    const capabilityMap: Record<string, any> = {
      development: {
        domains: ['api-design', 'implementation', 'testing'],
        operations: ['design', 'implement', 'test']
      },
      validation: {
        domains: ['validation', 'security', 'compliance'],
        operations: ['validate', 'audit', 'certify']
      },
      orchestration: {
        domains: ['orchestration', 'coordination'],
        operations: ['plan', 'coordinate', 'execute']
      },
      review: {
        domains: ['quality', 'security', 'performance'],
        operations: ['review', 'analyze', 'report']
      },
      implementation: {
        domains: ['coding', 'testing', 'documentation'],
        operations: ['code', 'test', 'document']
      }
    };
    
    return capabilityMap[type] || { domains: ['general'], operations: ['process'] };
  }

  private initializeMockAgents(): void {
    // Pre-populate with mock agents for each type
    const agentTypes = [
      'orchestrator', 'worker', 'critic', 'judge',
      'trainer', 'governor', 'monitor', 'integrator'
    ];

    agentTypes.forEach(type => {
      for (let i = 1; i <= 3; i++) {
        const agentId = `${type}-mock-v${i}.0.0`;
        this.agentRegistry.set(agentId, {
          agentId,
          agentType: type,
          agentSubType: `${type}.default`,
          version: `${i}.0.0`,
          capabilities: {
            domains: this.getDomainsForType(type),
            operations: this.getOperationsForType(type)
          },
          protocols: {
            supported: [
              {
                name: 'rest',
                version: '1.0',
                endpoint: `http://localhost:${3000 + i}/${type}`
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 100 * i,
              concurrentRequests: 10 * i
            },
            latency: {
              p50: 25 * i,
              p95: 75 * i,
              p99: 150 * i
            }
          },
          status: 'available'
        });
      }
    });

    // Add specialized worker subtypes
    const workerSubtypes = ['api', 'docs', 'test', 'data', 'devops'];
    workerSubtypes.forEach(subtype => {
      const agentId = `worker-${subtype}-v2.0.0`;
      this.agentRegistry.set(agentId, {
        agentId,
        agentType: 'worker',
        agentSubType: `worker.${subtype}`,
        version: '2.0.0',
        capabilities: {
          domains: this.getDomainsForSubtype(subtype),
          operations: this.getOperationsForSubtype(subtype),
          specializations: {
            [subtype]: {
              versions: ['1.0', '2.0'],
              features: ['validate', 'generate', 'transform']
            }
          }
        },
        protocols: {
          supported: [
            {
              name: 'rest',
              version: '1.0',
              endpoint: `http://localhost:3002/worker/${subtype}`
            }
          ]
        },
        performance: {
          throughput: { requestsPerSecond: 200 },
          latency: { p50: 25, p95: 75, p99: 150 }
        },
        status: 'available'
      });
    });
  }

  private getDomainsForType(type: string): string[] {
    const domainMap: Record<string, string[]> = {
      orchestrator: ['orchestration', 'planning', 'coordination'],
      worker: ['execution', 'processing', 'implementation'],
      critic: ['review', 'quality', 'security', 'performance'],
      judge: ['evaluation', 'decision', 'comparison'],
      trainer: ['learning', 'synthesis', 'improvement'],
      governor: ['governance', 'compliance', 'policy'],
      monitor: ['monitoring', 'telemetry', 'alerting'],
      integrator: ['integration', 'bridging', 'protocol-translation']
    };
    return domainMap[type] || ['general'];
  }

  private getOperationsForType(type: string): any[] {
    const operationMap: Record<string, any[]> = {
      orchestrator: [
        { name: 'plan', description: 'Create execution plan' },
        { name: 'coordinate', description: 'Coordinate agents' }
      ],
      worker: [
        { name: 'execute', description: 'Execute task' },
        { name: 'process', description: 'Process data' }
      ],
      critic: [
        { name: 'review', description: 'Review output' },
        { name: 'analyze', description: 'Analyze quality' }
      ],
      judge: [
        { name: 'evaluate', description: 'Evaluate options' },
        { name: 'decide', description: 'Make decision' }
      ],
      trainer: [
        { name: 'synthesize', description: 'Synthesize feedback' },
        { name: 'train', description: 'Train models' }
      ],
      governor: [
        { name: 'enforce', description: 'Enforce policies' },
        { name: 'audit', description: 'Audit compliance' }
      ],
      monitor: [
        { name: 'track', description: 'Track metrics' },
        { name: 'alert', description: 'Send alerts' }
      ],
      integrator: [
        { name: 'bridge', description: 'Bridge protocols' },
        { name: 'translate', description: 'Translate formats' }
      ]
    };
    return operationMap[type] || [{ name: 'process', description: 'Process request' }];
  }

  private getDomainsForSubtype(subtype: string): string[] {
    const domainMap: Record<string, string[]> = {
      api: ['api-design', 'validation', 'documentation'],
      docs: ['documentation', 'markdown', 'generation'],
      test: ['testing', 'validation', 'coverage'],
      data: ['data', 'transformation', 'processing'],
      devops: ['deployment', 'infrastructure', 'automation']
    };
    return domainMap[subtype] || ['general'];
  }

  private getOperationsForSubtype(subtype: string): any[] {
    const operationMap: Record<string, any[]> = {
      api: [
        { name: 'validate', description: 'Validate API spec' },
        { name: 'generate', description: 'Generate API code' }
      ],
      docs: [
        { name: 'generate-docs', description: 'Generate documentation' },
        { name: 'format', description: 'Format markdown' }
      ],
      test: [
        { name: 'create-tests', description: 'Create test suite' },
        { name: 'run-tests', description: 'Execute tests' }
      ],
      data: [
        { name: 'transform', description: 'Transform data' },
        { name: 'validate', description: 'Validate data' }
      ],
      devops: [
        { name: 'deploy', description: 'Deploy application' },
        { name: 'configure', description: 'Configure infrastructure' }
      ]
    };
    return operationMap[subtype] || [{ name: 'process', description: 'Process request' }];
  }

  private setupRoutes(): void {
    // ACDL Registration endpoint
    this.app.post('/api/v1/acdl/register', async (req: Request, res: Response) => {
      const manifest = req.body;
      
      // Validate required fields
      if (!manifest.agentId || !manifest.agentType || !manifest.version) {
        return res.status(400).json({
          status: 'rejected',
          validationResults: [
            {
              check: manifest.agentId ? 'agentType' : 'agentId',
              passed: false,
              message: 'Required field missing'
            }
          ]
        });
      }

      // Check for duplicate registration
      if (this.agentRegistry.has(manifest.agentId)) {
        return res.status(409).json({
          status: 'rejected',
          message: 'Agent already registered'
        });
      }

      // Store the agent
      this.agentRegistry.set(manifest.agentId, manifest);

      // Spawn actual agent if TDD flag is set
      if (manifest.metadata?.tdd || manifest.metadata?.apiFirst) {
        const spawnOptions: AgentSpawnOptions = {
          type: 'development',
          phase: 'implementation',
          priority: manifest.metadata?.priority || 'medium',
          flags: []
        };

        if (manifest.metadata?.tdd) spawnOptions.flags!.push('--tdd');
        if (manifest.metadata?.apiFirst) spawnOptions.flags!.push('--api-first');
        if (manifest.metadata?.ossa) spawnOptions.flags!.push('--ossa');

        const spawnResult = await this.spawnAgent(spawnOptions);
        console.log(`[SPAWNED] Agent ${spawnResult.agentId} for ${manifest.agentId}`);
      }

      res.status(201).json({
        registrationId: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'registered',
        validationResults: [
          {
            check: 'schema',
            passed: true,
            message: 'Schema validation passed'
          },
          {
            check: 'capabilities',
            passed: true,
            message: 'Capabilities validated'
          }
        ],
        registeredAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
      });
    });

    // ACDL Discovery endpoint
    this.app.post('/api/v1/acdl/discover', async (req: Request, res: Response) => {
      const query = req.body;
      const matches: any[] = [];

      // Filter agents based on query
      this.agentRegistry.forEach(agent => {
        let score = 0;
        let matchCount = 0;
        let totalChecks = 0;

        // Check domains
        if (query.domains && Array.isArray(query.domains)) {
          totalChecks++;
          const hasAllDomains = query.domains.every((d: string) =>
            agent.capabilities?.domains?.includes(d)
          );
          if (hasAllDomains) {
            score += 0.3;
            matchCount++;
          }
        }

        // Check agent type
        if (query.agentType) {
          totalChecks++;
          if (agent.agentType === query.agentType) {
            score += 0.2;
            matchCount++;
          }
        }

        // Check protocols
        if (query.protocols && Array.isArray(query.protocols)) {
          totalChecks++;
          const supportedProtocols = agent.protocols?.supported?.map((p: any) => p.name) || [];
          const hasAllProtocols = query.protocols.every((p: string) =>
            supportedProtocols.includes(p)
          );
          if (hasAllProtocols) {
            score += 0.2;
            matchCount++;
          }
        }

        // Check performance
        if (query.performance) {
          totalChecks++;
          let perfMatch = true;
          
          if (query.performance.minThroughput &&
              agent.performance?.throughput?.requestsPerSecond < query.performance.minThroughput) {
            perfMatch = false;
          }
          
          if (query.performance.maxLatencyP99 &&
              agent.performance?.latency?.p99 > query.performance.maxLatencyP99) {
            perfMatch = false;
          }
          
          if (perfMatch) {
            score += 0.3;
            matchCount++;
          }
        }

        // Calculate final score
        if (totalChecks > 0) {
          score = matchCount / totalChecks;
        }

        if (score > 0) {
          matches.push({
            agentId: agent.agentId,
            score,
            manifest: agent
          });
        }
      });

      // Sort by score
      matches.sort((a, b) => b.score - a.score);

      res.json({
        agents: matches,
        totalFound: matches.length,
        queryTime: Math.floor(Math.random() * 50) + 10 // Mock query time
      });
    });

    // ACDL Match endpoint
    this.app.post('/api/v1/acdl/match', async (req: Request, res: Response) => {
      const matchRequest = req.body;
      const matches: any[] = [];
      const ensemble: any[] = [];

      // Check workload before matching
      const workloadCommand = `node ${this.cliPath} workload`;
      console.log(`[WORKLOAD] Checking agent workload`);

      // Find matching agents
      this.agentRegistry.forEach(agent => {
        let compatibility = 0;
        const reasons: string[] = [];
        const warnings: string[] = [];

        // Check capability match
        if (matchRequest.requirements?.capabilities?.domains) {
          const requiredDomains = matchRequest.requirements.capabilities.domains;
          const agentDomains = agent.capabilities?.domains || [];
          
          const matchingDomains = requiredDomains.filter((d: string) => agentDomains.includes(d));
          if (matchingDomains.length > 0) {
            compatibility += 0.3 * (matchingDomains.length / requiredDomains.length);
            reasons.push(`Supports ${matchingDomains.join(', ')} domains`);
          } else {
            warnings.push('No matching domains');
          }
        }

        // Check performance requirements
        if (matchRequest.requirements?.performance) {
          const perf = matchRequest.requirements.performance;
          const agentPerf = agent.performance;
          
          if (agentPerf) {
            let perfScore = 1;
            
            if (perf.throughput?.requestsPerSecond &&
                agentPerf.throughput?.requestsPerSecond < perf.throughput.requestsPerSecond) {
              perfScore *= 0.5;
              warnings.push('Lower throughput than required');
            }
            
            if (perf.latency?.p99 &&
                agentPerf.latency?.p99 > perf.latency.p99) {
              perfScore *= 0.5;
              warnings.push('Higher latency than required');
            }
            
            compatibility += 0.3 * perfScore;
            if (perfScore === 1) {
              reasons.push('Meets performance requirements');
            }
          }
        }

        // Check protocol support
        if (matchRequest.requirements?.protocols) {
          const requiredProtocols = matchRequest.requirements.protocols;
          const supportedProtocols = agent.protocols?.supported?.map((p: any) => p.name) || [];
          
          const hasRequired = requiredProtocols.every((p: string) => supportedProtocols.includes(p));
          if (hasRequired) {
            compatibility += 0.2;
            reasons.push(`Supports required ${requiredProtocols.join(', ')} protocol${requiredProtocols.length > 1 ? 's' : ''}`);
          }
        }

        // Check constraints
        if (matchRequest.requirements?.constraints) {
          const constraints = matchRequest.requirements.constraints;
          
          if (constraints.budget) {
            // Mock budget check
            compatibility += 0.1;
            reasons.push('Within budget constraints');
          }
          
          if (constraints.deadline) {
            // Mock deadline check
            compatibility += 0.1;
            reasons.push('Can meet deadline');
          }
        }

        if (compatibility > 0) {
          matches.push({
            agentId: agent.agentId,
            compatibility,
            reasons,
            warnings
          });
        }
      });

      // Sort by compatibility
      matches.sort((a, b) => b.compatibility - a.compatibility);

      // Build ensemble recommendation for complex tasks
      if (matchRequest.requirements?.capabilities?.domains?.length > 2) {
        const domains = matchRequest.requirements.capabilities.domains;
        domains.forEach((domain: string) => {
          const agentForDomain = matches.find(m => {
            const agent = this.agentRegistry.get(m.agentId);
            return agent?.capabilities?.domains?.includes(domain);
          });
          
          if (agentForDomain) {
            ensemble.push({
              agentId: agentForDomain.agentId,
              role: domain
            });
          }
        });
      }

      // Spawn agents for high-priority matches
      if (matchRequest.requirements?.constraints?.priority === 'critical') {
        const spawnOptions: AgentSpawnOptions = {
          type: 'validation',
          phase: 'review',
          priority: 'critical',
          flags: ['--ossa']
        };
        
        const spawnResult = await this.spawnAgent(spawnOptions);
        console.log(`[CRITICAL] Spawned validation agent ${spawnResult.agentId}`);
      }

      res.json({
        matches: matches.slice(0, 10), // Top 10 matches
        recommendation: {
          primaryAgent: matches[0]?.agentId || null,
          alternativeAgents: matches.slice(1, 4).map(m => m.agentId),
          ensemble: ensemble.length > 0 ? ensemble : undefined
        }
      });
    });

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        registeredAgents: this.agentRegistry.size,
        timestamp: new Date().toISOString()
      });
    });

    // Workload endpoint (using CLI command)
    this.app.get('/api/v1/acdl/workload', async (req: Request, res: Response) => {
      try {
        const command = `node ${this.cliPath} workload`;
        const { stdout } = await execAsync(command);
        res.json(JSON.parse(stdout));
      } catch (error) {
        // Return mock workload
        res.json({
          activeAgents: this.agentRegistry.size,
          queuedTasks: Math.floor(Math.random() * 10),
          completedTasks: Math.floor(Math.random() * 100),
          averageResponseTime: Math.floor(Math.random() * 500) + 100
        });
      }
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`[MOCK SERVER] ACDL Mock Server running on port ${this.port}`);
      console.log(`[MOCK SERVER] Registered ${this.agentRegistry.size} mock agents`);
      console.log(`[MOCK SERVER] CLI path: ${this.cliPath}`);
      console.log(`[MOCK SERVER] Mode: ${process.env.MOCK_MODE !== 'false' ? 'MOCK' : 'REAL'}`);
    });
  }

  public stop(): void {
    console.log(`[MOCK SERVER] Shutting down...`);
  }
}

// Start mock server if run directly
if (require.main === module) {
  const port = parseInt(process.env.MOCK_PORT || '3001', 10);
  const mockServer = new ACDLMockServer(port);
  mockServer.start();
}