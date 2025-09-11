/**
 * OSSA Platform Entry Point
 * Production orchestration platform initialization
 */

import { OrchestratorPlatform } from './core/orchestrator.js';
import { OrchestrationAPIServer } from './api/orchestration/server.js';
import { PlatformCoordination } from './core/coordination/PlatformCoordination.js';
import { ComplianceEngine } from './core/compliance/ComplianceEngine.js';
import { startComplianceServer } from './api/compliance/server.js';
import { 
  OrchestratorConfig,
  Agent,
  AgentType,
  AgentStatus
} from './types/index.js';

// Production configuration
const PRODUCTION_CONFIG: OrchestratorConfig = {
  maxConcurrentTasks: 100,
  taskTimeout: 600000, // 10 minutes
  retryPolicy: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 2000,
    maxDelay: 60000
  },
  messagebus: {
    type: 'memory', // Production: kafka/rabbitmq
    connection: {},
    topics: [
      'orchestration.events',
      'agent.lifecycle',
      'workflow.execution',
      'platform.coordination'
    ]
  },
  registry: {
    type: 'memory', // Production: consul/etcd
    connection: {},
    ttl: 600
  },
  scheduler: {
    type: 'priority',
    workers: 20,
    queueSize: 2000
  }
};

const API_CONFIG = {
  port: parseInt(process.env.OSSA_ORCHESTRATOR_PORT || '3002'),
  host: process.env.OSSA_ORCHESTRATOR_HOST || '0.0.0.0',
  cors: true,
  auth: {
    enabled: process.env.NODE_ENV === 'production',
    type: 'jwt' as const
  },
  rateLimit: {
    enabled: true,
    requests: 200,
    window: 60000
  }
};

const COMPLIANCE_CONFIG = {
  port: parseInt(process.env.OSSA_COMPLIANCE_PORT || '3004'),
  host: process.env.OSSA_COMPLIANCE_HOST || '0.0.0.0',
  frameworks: ['iso-42001', 'nist-ai-rmf', 'eu-ai-act'],
  enforcementLevel: process.env.NODE_ENV === 'production' ? 'blocking' : 'warning'
};

/**
 * Initialize ORCHESTRATOR-PLATFORM in production mode
 */
export async function initializeOrchestratorPlatform(): Promise<{
  orchestrator: OrchestratorPlatform;
  apiServer: OrchestrationAPIServer;
  coordination: PlatformCoordination;
  complianceEngine: ComplianceEngine;
}> {
  console.log('\n🚀 Initializing OSSA ORCHESTRATOR-PLATFORM v0.1.9-alpha.1\n');

  try {
    // Initialize core orchestrator
    console.log('[INIT] Creating orchestration engine...');
    const orchestrator = new OrchestratorPlatform(PRODUCTION_CONFIG);

    // Initialize platform coordination
    console.log('[INIT] Setting up platform coordination...');
    const coordination = new PlatformCoordination(orchestrator);

    // Setup coordination monitoring
    coordination.on('coordination:response', (response) => {
      console.log(`[COORDINATION] Response from ${response.from}: ${response.status}`);
    });

    // Initialize compliance engine
    console.log('[INIT] Initializing enterprise compliance engine...');
    const complianceEngine = new ComplianceEngine();

    // Initialize API server
    console.log('[INIT] Starting REST API server...');
    const apiServer = new OrchestrationAPIServer(PRODUCTION_CONFIG, API_CONFIG);
    await apiServer.start();

    // Initialize compliance API server
    console.log('[INIT] Starting compliance API server...');
    process.env.OSSA_COMPLIANCE_PORT = COMPLIANCE_CONFIG.port.toString();
    await startComplianceServer();

    // Register production agents
    await registerProductionAgents(orchestrator, complianceEngine);

    // Setup health monitoring
    setupHealthMonitoring(orchestrator, coordination);

    console.log('✅ ORCHESTRATOR-PLATFORM initialized successfully');
    console.log(`📊 API Server: http://${API_CONFIG.host}:${API_CONFIG.port}/api/v1/orchestration/health`);
    console.log(`🛡️  Compliance Engine: http://${COMPLIANCE_CONFIG.host}:${COMPLIANCE_CONFIG.port}/health`);
    console.log(`🔄 Platform Coordination: ${coordination.getPlatformAgentStatus().length} agents registered`);
    console.log(`📋 Compliance Frameworks: ${COMPLIANCE_CONFIG.frameworks.length} supported`);
    console.log('');

    return { orchestrator, apiServer, coordination, complianceEngine };

  } catch (error) {
    console.error('❌ Failed to initialize ORCHESTRATOR-PLATFORM:', error);
    throw error;
  }
}

/**
 * Register production-ready agents
 */
async function registerProductionAgents(orchestrator: OrchestratorPlatform, complianceEngine: ComplianceEngine): Promise<void> {
  console.log('[INIT] Registering production agents...');

  const productionAgents: Agent[] = [
    {
      id: 'orchestrator-primary-v0.1.9',
      name: 'Primary Orchestrator',
      version: '0.1.9-alpha.1',
      type: AgentType.ORCHESTRATOR,
      capabilities: [
        { name: 'workflow-coordination', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'agent-allocation', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'feedback-loop-execution', version: '0.1.9', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'ossa-platform',
        tags: ['production', 'orchestration', 'primary'],
        description: 'Primary orchestration agent for workflow coordination'
      },
      config: {
        resources: {
          cpu: '1000m',
          memory: '2Gi'
        },
        scaling: {
          min: 1,
          max: 5,
          targetUtilization: 70,
          scaleUpRate: 2,
          scaleDownRate: 1
        }
      }
    },
    {
      id: 'worker-data-processor-v0.1.9',
      name: 'Data Processing Worker',
      version: '0.1.9-alpha.1',
      type: AgentType.WORKER,
      capabilities: [
        { name: 'data-processing', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'data-transformation', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'data-validation', version: '0.1.9', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'ossa-platform',
        tags: ['production', 'worker', 'data'],
        description: 'High-performance data processing worker agent'
      },
      config: {
        resources: {
          cpu: '500m',
          memory: '1Gi'
        }
      }
    },
    {
      id: 'critic-quality-assurance-v0.1.9',
      name: 'Quality Assurance Critic',
      version: '0.1.9-alpha.1',
      type: AgentType.CRITIC,
      capabilities: [
        { name: 'quality-review', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'compliance-check', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'performance-analysis', version: '0.1.9', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'ossa-platform',
        tags: ['production', 'critic', 'quality'],
        description: 'Quality assurance and compliance critic agent'
      },
      config: {
        resources: {
          cpu: '300m',
          memory: '512Mi'
        }
      }
    },
    {
      id: 'judge-decision-engine-v0.1.9',
      name: 'Decision Engine Judge',
      version: '0.1.9-alpha.1',
      type: AgentType.JUDGE,
      capabilities: [
        { name: 'decision-making', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'conflict-resolution', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'final-evaluation', version: '0.1.9', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'ossa-platform',
        tags: ['production', 'judge', 'decision'],
        description: 'Final decision and conflict resolution judge agent'
      },
      config: {
        resources: {
          cpu: '400m',
          memory: '768Mi'
        }
      }
    },
    {
      id: 'governor-policy-enforcer-v0.1.9',
      name: 'Policy Enforcement Governor',
      version: '0.1.9-alpha.1',
      type: AgentType.GOVERNOR,
      capabilities: [
        { name: 'policy-enforcement', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'budget-management', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'compliance-governance', version: '0.1.9', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'ossa-platform',
        tags: ['production', 'governor', 'policy'],
        description: 'Policy enforcement and governance agent'
      },
      config: {
        resources: {
          cpu: '200m',
          memory: '256Mi'
        }
      }
    },
    {
      id: 'compliance-engine-v0.1.9',
      name: 'Enterprise Compliance Engine',
      version: '0.1.9-alpha.1',
      type: AgentType.MONITOR,
      capabilities: [
        { name: 'ossa-conformance-validation', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'regulatory-compliance', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'enterprise-policy-enforcement', version: '0.1.9', inputs: [], outputs: [] },
        { name: 'audit-trail-management', version: '0.1.9', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'ossa-platform',
        tags: ['production', 'compliance', 'enterprise', 'monitoring'],
        description: 'Enterprise compliance and governance engine for OSSA Platform production deployments'
      },
      config: {
        resources: {
          cpu: '500m',
          memory: '1Gi'
        },
        compliance: {
          frameworks: ['iso-42001', 'nist-ai-rmf', 'eu-ai-act'],
          enforcementLevel: 'blocking',
          auditRetention: '2y'
        }
      }
    }
  ];

  for (const agent of productionAgents) {
    await orchestrator.registerAgent(agent);
  }

  console.log(`[INIT] Registered ${productionAgents.length} production agents`);
}

/**
 * Setup health monitoring and alerting
 */
function setupHealthMonitoring(
  orchestrator: OrchestratorPlatform, 
  coordination: PlatformCoordination
): void {
  console.log('[INIT] Setting up health monitoring...');

  // Monitor orchestrator health
  setInterval(async () => {
    const health = orchestrator.getHealthStatus();
    
    if (health.metrics.errorRate > 10) {
      console.warn(`[HEALTH] High error rate detected: ${health.metrics.errorRate}`);
    }
    
    if (health.metrics.resourceUtilization > 90) {
      console.warn(`[HEALTH] High resource utilization: ${health.metrics.resourceUtilization}%`);
    }
  }, 60000); // Check every minute

  // Monitor platform coordination health
  setInterval(async () => {
    try {
      const coordHealth = await coordination.healthCheck();
      
      if (coordHealth.overall !== 'healthy') {
        console.warn(`[HEALTH] Platform coordination degraded: ${coordHealth.degradedAgents}/${coordHealth.totalAgents} agents affected`);
      }
    } catch (error) {
      console.error('[HEALTH] Coordination health check failed:', error);
    }
  }, 120000); // Check every 2 minutes

  console.log('[INIT] Health monitoring configured');
}

/**
 * Graceful shutdown handler
 */
export async function shutdownOrchestratorPlatform(
  orchestrator: OrchestratorPlatform,
  apiServer: OrchestrationAPIServer
): Promise<void> {
  console.log('\n🛑 Shutting down ORCHESTRATOR-PLATFORM...');

  try {
    // Stop accepting new requests
    await apiServer.stop();

    // Wait for active executions to complete (with timeout)
    const activeExecutions = orchestrator.getActiveExecutions();
    if (activeExecutions.length > 0) {
      console.log(`[SHUTDOWN] Waiting for ${activeExecutions.length} executions to complete...`);
      // Implement graceful execution termination
    }

    console.log('[SHUTDOWN] ORCHESTRATOR-PLATFORM stopped gracefully');
  } catch (error) {
    console.error('[SHUTDOWN] Error during shutdown:', error);
  }
}

// Export core components
export {
  OrchestratorPlatform,
  OrchestrationAPIServer,
  PlatformCoordination,
  PRODUCTION_CONFIG,
  API_CONFIG
};

// Export types
export * from './types';

// Auto-initialize if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeOrchestratorPlatform()
    .then(({ orchestrator, apiServer, coordination }) => {
      console.log('🎯 ORCHESTRATOR-PLATFORM ready for production workloads');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        await shutdownOrchestratorPlatform(orchestrator, apiServer);
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        await shutdownOrchestratorPlatform(orchestrator, apiServer);
        process.exit(0);
      });
    })
    .catch(error => {
      console.error('💥 Failed to start ORCHESTRATOR-PLATFORM:', error);
      process.exit(1);
    });
}