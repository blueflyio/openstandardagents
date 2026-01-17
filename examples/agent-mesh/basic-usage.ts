/**
 * Agent Mesh - Basic Usage Example
 *
 * This example demonstrates how to set up and use the agent mesh communication layer
 * for inter-agent communication following the OSSA A2A protocol.
 */

import {
  AgentMeshClientBuilder,
  DiscoveryService,
  InMemoryAgentRegistry,
  AgentCard,
  MessageEnvelope,
} from '../../src/mesh/index.js';

/**
 * Example 1: Setting up a simple agent with pub/sub messaging
 */
async function examplePubSub() {
  console.log('\n=== Example 1: Pub/Sub Messaging ===\n');

  // Create shared discovery service
  const registry = new InMemoryAgentRegistry();
  const discovery = new DiscoveryService(registry);

  // Define security scanner agent
  const securityAgent: AgentCard = {
    uri: 'agent://security/scanner',
    name: 'Security Scanner',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['vulnerability-scanning', 'secret-detection'],
    endpoints: {
      http: 'http://localhost:8080',
    },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: {
      tlsRequired: true,
      minTlsVersion: '1.3',
    },
  };

  // Define monitoring agent
  const monitoringAgent: AgentCard = {
    uri: 'agent://observability/monitor',
    name: 'Monitoring Agent',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['metrics-analysis', 'anomaly-detection'],
    endpoints: {
      http: 'http://localhost:8081',
    },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: {
      tlsRequired: true,
      minTlsVersion: '1.3',
    },
  };

  // Register agents
  await discovery.registerSelf(securityAgent);

  // Create mesh client for security agent
  const securityClient = new AgentMeshClientBuilder()
    .withLocalAgent(securityAgent)
    .withDiscovery(discovery)
    .enableStats()
    .build();

  // Create mesh client for monitoring agent
  const monitoringClient = new AgentMeshClientBuilder()
    .withLocalAgent(monitoringAgent)
    .withDiscovery(discovery)
    .enableStats()
    .build();

  // Subscribe to security vulnerabilities
  monitoringClient.subscribe(
    {
      channel: 'security.vulnerabilities',
      handler: 'handleVulnerability',
      priority: 'high',
    },
    async (message: MessageEnvelope) => {
      console.log('📊 Monitoring agent received vulnerability:');
      console.log(JSON.stringify(message.payload, null, 2));
    }
  );

  // Publish a vulnerability event
  console.log('🔍 Security agent publishing vulnerability...\n');
  await securityClient.publish('security.vulnerabilities', {
    vulnerability_id: 'vuln-2024-001',
    severity: 'critical',
    cve_id: 'CVE-2024-1234',
    affected_package: 'lodash@4.17.20',
    remediation: 'Update to lodash@4.17.21',
  });

  // Give time for message to be processed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Cleanup
  await securityClient.close();
  await monitoringClient.close();
  discovery.destroy();
}

/**
 * Example 2: Request/Response pattern
 */
async function exampleRequestResponse() {
  console.log('\n=== Example 2: Request/Response Pattern ===\n');

  // Create shared discovery service
  const registry = new InMemoryAgentRegistry();
  const discovery = new DiscoveryService(registry);

  // Define code analyzer agent
  const analyzerAgent: AgentCard = {
    uri: 'agent://code/analyzer',
    name: 'Code Analyzer',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['code-analysis', 'security-scanning'],
    endpoints: {
      http: 'http://localhost:8082',
    },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: {
      tlsRequired: true,
      minTlsVersion: '1.3',
    },
  };

  // Define orchestrator agent
  const orchestratorAgent: AgentCard = {
    uri: 'agent://orchestrator/main',
    name: 'Orchestrator',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['workflow-orchestration'],
    endpoints: {
      http: 'http://localhost:8083',
    },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: {
      tlsRequired: true,
      minTlsVersion: '1.3',
    },
  };

  // Register agents
  await discovery.registerSelf(analyzerAgent);

  // Create mesh clients
  const analyzerClient = new AgentMeshClientBuilder()
    .withLocalAgent(analyzerAgent)
    .withDiscovery(discovery)
    .build();

  const orchestratorClient = new AgentMeshClientBuilder()
    .withLocalAgent(orchestratorAgent)
    .withDiscovery(discovery)
    .build();

  // Register command handler on analyzer
  analyzerClient.registerCommand(
    {
      name: 'analyze_code',
      inputSchema: {
        type: 'object',
        properties: {
          repository: { type: 'string' },
          branch: { type: 'string' },
        },
        required: ['repository'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          issues: { type: 'array' },
          quality_score: { type: 'number' },
        },
      },
      timeoutSeconds: 60,
    },
    async (input: { repository: string; branch?: string }) => {
      console.log(`🔍 Analyzing code from ${input.repository}...\n`);
      // Simulate analysis
      return {
        issues: [
          { type: 'security', severity: 'medium', message: 'Potential SQL injection' },
          { type: 'style', severity: 'low', message: 'Line too long' },
        ],
        quality_score: 87,
      };
    }
  );

  // Invoke command from orchestrator
  console.log('📞 Orchestrator invoking code analysis...\n');
  const result = await orchestratorClient.invokeCommand(
    'agent://code/analyzer',
    'analyze_code',
    {
      repository: 'https://github.com/org/repo',
      branch: 'main',
    }
  );

  console.log('✅ Analysis result:');
  console.log(JSON.stringify(result, null, 2));

  // Cleanup
  await analyzerClient.close();
  await orchestratorClient.close();
  discovery.destroy();
}

/**
 * Example 3: Workflow with multiple agents
 */
async function exampleWorkflow() {
  console.log('\n=== Example 3: Multi-Agent Workflow ===\n');

  // Create shared discovery service
  const registry = new InMemoryAgentRegistry();
  const discovery = new DiscoveryService(registry);

  // Define agents
  const validatorAgent: AgentCard = {
    uri: 'agent://validation/config',
    name: 'Config Validator',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['kubernetes-validation', 'helm-linting'],
    endpoints: { http: 'http://localhost:8084' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
  };

  const deployerAgent: AgentCard = {
    uri: 'agent://deployment/deployer',
    name: 'Deployer',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['kubernetes-deployment'],
    endpoints: { http: 'http://localhost:8085' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
  };

  const monitorAgent: AgentCard = {
    uri: 'agent://observability/monitor',
    name: 'Monitor',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['metrics-monitoring'],
    endpoints: { http: 'http://localhost:8086' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
  };

  // Register all agents
  await discovery.registerSelf(validatorAgent);

  // Create mesh clients
  const validatorClient = new AgentMeshClientBuilder()
    .withLocalAgent(validatorAgent)
    .withDiscovery(discovery)
    .build();

  const deployerClient = new AgentMeshClientBuilder()
    .withLocalAgent(deployerAgent)
    .withDiscovery(discovery)
    .build();

  const monitorClient = new AgentMeshClientBuilder()
    .withLocalAgent(monitorAgent)
    .withDiscovery(discovery)
    .build();

  // Subscribe to deployment events
  deployerClient.subscribe(
    {
      channel: 'deployment.validated',
      handler: 'handleValidated',
    },
    async (message: MessageEnvelope) => {
      console.log('🚀 Deployer: Configuration validated, proceeding with deployment...');
      await deployerClient.publish('deployment.started', {
        app: message.payload,
        timestamp: new Date().toISOString(),
      });
    }
  );

  monitorClient.subscribe(
    {
      channel: 'deployment.started',
      handler: 'handleDeployment',
    },
    async (message: MessageEnvelope) => {
      console.log('📊 Monitor: Deployment started, setting up monitoring...');
      console.log(JSON.stringify(message.payload, null, 2));
    }
  );

  // Start workflow
  console.log('1️⃣ Validator: Validating configuration...\n');
  await validatorClient.publish('deployment.validated', {
    app: 'my-application',
    version: 'v1.2.3',
    namespace: 'production',
  });

  // Give time for workflow to complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Cleanup
  await validatorClient.close();
  await deployerClient.close();
  await monitorClient.close();
  discovery.destroy();
}

/**
 * Example 4: Broadcast messaging
 */
async function exampleBroadcast() {
  console.log('\n=== Example 4: Broadcast Messaging ===\n');

  // Create shared discovery service
  const registry = new InMemoryAgentRegistry();
  const discovery = new DiscoveryService(registry);

  // Define orchestrator
  const orchestrator: AgentCard = {
    uri: 'agent://orchestrator/main',
    name: 'Orchestrator',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['workflow-orchestration'],
    endpoints: { http: 'http://localhost:9000' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
  };

  // Define workers
  const worker1: AgentCard = {
    uri: 'agent://workers/worker-1',
    name: 'Worker 1',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['task-execution'],
    endpoints: { http: 'http://localhost:9001' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
  };

  const worker2: AgentCard = {
    uri: 'agent://workers/worker-2',
    name: 'Worker 2',
    version: '1.0.0',
    ossaVersion: '0.3.0',
    capabilities: ['task-execution'],
    endpoints: { http: 'http://localhost:9002' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
  };

  // Register agents
  await discovery.registerSelf(orchestrator);

  // Create clients
  const orchestratorClient = new AgentMeshClientBuilder()
    .withLocalAgent(orchestrator)
    .withDiscovery(discovery)
    .build();

  const worker1Client = new AgentMeshClientBuilder()
    .withLocalAgent(worker1)
    .withDiscovery(discovery)
    .build();

  const worker2Client = new AgentMeshClientBuilder()
    .withLocalAgent(worker2)
    .withDiscovery(discovery)
    .build();

  // Workers subscribe to broadcast
  worker1Client.subscribe(
    {
      channel: 'workers',
      handler: 'handleBroadcast',
    },
    async (message: MessageEnvelope) => {
      console.log('👷 Worker 1 received broadcast:', message.payload);
    }
  );

  worker2Client.subscribe(
    {
      channel: 'workers',
      handler: 'handleBroadcast',
    },
    async (message: MessageEnvelope) => {
      console.log('👷 Worker 2 received broadcast:', message.payload);
    }
  );

  // Broadcast message to all workers
  console.log('📣 Orchestrator broadcasting to all workers...\n');
  await orchestratorClient.broadcast('workers', {
    event: 'shutdown_initiated',
    reason: 'maintenance',
    scheduled_time: new Date(Date.now() + 3600000).toISOString(),
  });

  // Give time for broadcast to be processed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Cleanup
  await orchestratorClient.close();
  await worker1Client.close();
  await worker2Client.close();
  discovery.destroy();
}

/**
 * Run all examples
 */
async function main() {
  try {
    await examplePubSub();
    await exampleRequestResponse();
    await exampleWorkflow();
    await exampleBroadcast();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
