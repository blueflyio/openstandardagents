/**
 * Agent Discovery System - Comprehensive Example
 *
 * Demonstrates:
 * - Multi-provider discovery (DNS, Consul, Kubernetes)
 * - Agent graph building and relationship tracking
 * - Advanced routing with load balancing
 * - Health-aware and capability-based routing
 * - Circuit breaker pattern
 * - Communication pattern tracking
 */

import {
  AgentCard,
  DiscoveryService,
  InMemoryAgentRegistry,
  DNSDiscoveryProvider,
  ConsulDiscoveryProvider,
  KubernetesDiscoveryProvider,
  MultiProviderRegistry,
  AgentGraph,
  AgentGraphBuilder,
  AdvancedAgentRouter,
  RoundRobinLoadBalancer,
  LeastConnectionsLoadBalancer,
  WeightedLoadBalancer,
  AgentMeshClientBuilder,
} from '../../src/mesh/index.js';

/**
 * Example 1: Multi-Provider Discovery
 * Discover agents across different infrastructure systems
 */
async function exampleMultiProviderDiscovery() {
  console.log('\n=== Example 1: Multi-Provider Discovery ===\n');

  // Setup multiple discovery providers
  const inMemoryRegistry = new InMemoryAgentRegistry();
  const dnsProvider = new DNSDiscoveryProvider({ domain: 'agents.internal' });
  const consulProvider = new ConsulDiscoveryProvider({
    url: process.env.CONSUL_URL || 'http://localhost:8500',
  });

  // Create multi-provider registry
  const multiRegistry = new MultiProviderRegistry(
    inMemoryRegistry,
    [dnsProvider, consulProvider]
  );

  try {
    await multiRegistry.initialize();

    // Register some test agents in memory
    const testAgents: AgentCard[] = [
      {
        uri: 'agent://security/scanner-1',
        name: 'Security Scanner 1',
        version: '1.0.0',
        ossaVersion: '0.4.1',
        capabilities: ['vulnerability-scanning', 'secret-detection'],
        endpoints: { http: 'http://localhost:8080' },
        transport: ['http'],
        authentication: ['bearer'],
        encryption: { tlsRequired: true, minTlsVersion: '1.3' },
        status: 'healthy',
        metadata: { region: 'us-east-1', team: 'security' },
      },
      {
        uri: 'agent://security/scanner-2',
        name: 'Security Scanner 2',
        version: '1.0.0',
        ossaVersion: '0.4.1',
        capabilities: ['vulnerability-scanning', 'license-checking'],
        endpoints: { http: 'http://localhost:8081' },
        transport: ['http'],
        authentication: ['bearer'],
        encryption: { tlsRequired: true, minTlsVersion: '1.3' },
        status: 'healthy',
        metadata: { region: 'us-west-2', team: 'security' },
      },
      {
        uri: 'agent://compliance/auditor',
        name: 'Compliance Auditor',
        version: '1.0.0',
        ossaVersion: '0.4.1',
        capabilities: ['policy-enforcement', 'audit-logging'],
        endpoints: { http: 'http://localhost:8082' },
        transport: ['http'],
        authentication: ['bearer'],
        encryption: { tlsRequired: true, minTlsVersion: '1.3' },
        status: 'healthy',
        metadata: { region: 'us-east-1', team: 'compliance' },
      },
    ];

    for (const agent of testAgents) {
      await multiRegistry.register(agent);
    }

    // Discover agents by capability
    console.log('🔍 Discovering agents with vulnerability-scanning capability...');
    const scanners = await multiRegistry.findByCapability('vulnerability-scanning');
    console.log(`Found ${scanners.length} scanner(s):`);
    scanners.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.uri}) in ${agent.metadata?.region}`);
    });

    // List all healthy agents
    console.log('\n💚 All healthy agents:');
    const healthyAgents = await multiRegistry.findHealthy();
    healthyAgents.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.status})`);
    });
  } catch (error) {
    console.error('Discovery error:', error);
  }
}

/**
 * Example 2: Agent Graph Building
 * Build a graph of agent relationships and track communication patterns
 */
async function exampleAgentGraph() {
  console.log('\n=== Example 2: Agent Graph Building ===\n');

  // Define agents for different teams
  const agents: AgentCard[] = [
    // Security Team
    {
      uri: 'agent://security/leader',
      name: 'Security Team Leader',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['orchestration', 'security-management'],
      endpoints: { http: 'http://localhost:9001' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
      metadata: { team: 'security', role: 'leader' },
    },
    {
      uri: 'agent://security/scanner',
      name: 'Security Scanner',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['vulnerability-scanning'],
      endpoints: { http: 'http://localhost:9002' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
      metadata: { team: 'security', role: 'worker' },
    },
    {
      uri: 'agent://security/secrets-detector',
      name: 'Secrets Detector',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['secret-detection'],
      endpoints: { http: 'http://localhost:9003' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
      metadata: { team: 'security', role: 'specialist' },
    },
    // Compliance Team
    {
      uri: 'agent://compliance/auditor',
      name: 'Compliance Auditor',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['policy-enforcement', 'audit-logging'],
      endpoints: { http: 'http://localhost:9004' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
      metadata: { team: 'compliance', role: 'worker' },
    },
  ];

  // Build agent graph
  const graph = new AgentGraphBuilder()
    .withAgents(agents)
    .withTeams([
      {
        id: 'security',
        name: 'Security Team',
        leader: 'agent://security/leader',
        members: ['agent://security/scanner'],
        specialists: ['agent://security/secrets-detector'],
        capabilities: ['vulnerability-scanning', 'secret-detection', 'security-management'],
      },
      {
        id: 'compliance',
        name: 'Compliance Team',
        leader: undefined,
        members: ['agent://compliance/auditor'],
        specialists: [],
        capabilities: ['policy-enforcement', 'audit-logging'],
      },
    ])
    .withRelationships([
      {
        from: 'agent://security/leader',
        to: 'agent://security/scanner',
        type: 'leader',
        weight: 1.0,
        bidirectional: false,
      },
      {
        from: 'agent://security/leader',
        to: 'agent://security/secrets-detector',
        type: 'leader',
        weight: 1.0,
        bidirectional: false,
      },
      {
        from: 'agent://security/scanner',
        to: 'agent://compliance/auditor',
        type: 'dependency',
        weight: 0.8,
        bidirectional: false,
      },
    ])
    .autoDiscoverRelationships()
    .build();

  // Record some communication patterns
  console.log('📊 Recording communication patterns...');
  graph.recordCommunication({
    from: 'agent://security/scanner',
    to: 'agent://compliance/auditor',
    channel: 'security.vulnerabilities',
    frequency: 5.2,
    latencyMs: 45,
    errorRate: 0.02,
  });

  graph.recordCommunication({
    from: 'agent://security/leader',
    to: 'agent://security/scanner',
    channel: 'security.tasks',
    frequency: 10.5,
    latencyMs: 20,
    errorRate: 0.01,
  });

  // Calculate importance scores
  graph.calculateImportance();

  // Get top agents
  console.log('\n⭐ Top agents by importance:');
  const topAgents = graph.getTopAgents(3);
  topAgents.forEach((agent, idx) => {
    const node = graph.getNode(agent.uri);
    console.log(
      `  ${idx + 1}. ${agent.name} (importance: ${node?.metadata.importance?.toFixed(3)})`
    );
  });

  // Get communication stats
  console.log('\n📈 Communication Statistics:');
  const stats = graph.getCommunicationStats();
  console.log(`  Total messages: ${stats.totalMessages}`);
  console.log(`  Avg latency: ${stats.avgLatency.toFixed(2)}ms`);
  console.log(`  Avg error rate: ${(stats.avgErrorRate * 100).toFixed(2)}%`);
  console.log('\n  Top channels:');
  stats.topChannels.forEach(ch => {
    console.log(`    - ${ch.channel}: ${ch.count} messages`);
  });

  // Find path between agents
  console.log('\n🔗 Finding path from scanner to auditor...');
  const path = graph.findPath('agent://security/scanner', 'agent://compliance/auditor');
  if (path) {
    console.log(`  Path: ${path.join(' → ')}`);
  }

  // Export graph
  const exported = graph.export();
  console.log(`\n📊 Graph statistics:`);
  console.log(`  Total agents: ${exported.stats.totalAgents}`);
  console.log(`  Total teams: ${exported.stats.totalTeams}`);
  console.log(`  Total relationships: ${exported.stats.totalRelationships}`);
}

/**
 * Example 3: Advanced Routing with Load Balancing
 * Demonstrate capability-based routing with different load balancing strategies
 */
async function exampleAdvancedRouting() {
  console.log('\n=== Example 3: Advanced Routing with Load Balancing ===\n');

  // Setup discovery
  const registry = new InMemoryAgentRegistry();
  const discovery = new DiscoveryService(registry);

  // Register multiple agents with same capability
  const agents: AgentCard[] = [
    {
      uri: 'agent://workers/worker-1',
      name: 'Worker 1',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['data-processing'],
      endpoints: { http: 'http://localhost:10001' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
      metadata: { region: 'us-east-1' },
    },
    {
      uri: 'agent://workers/worker-2',
      name: 'Worker 2',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['data-processing'],
      endpoints: { http: 'http://localhost:10002' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
      metadata: { region: 'us-west-2' },
    },
    {
      uri: 'agent://workers/worker-3',
      name: 'Worker 3',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['data-processing'],
      endpoints: { http: 'http://localhost:10003' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
      metadata: { region: 'us-east-1' },
    },
  ];

  for (const agent of agents) {
    await discovery.registerSelf(agent);
  }

  // Test Round-Robin load balancing
  console.log('🔄 Testing Round-Robin load balancing:');
  const rrRouter = new AdvancedAgentRouter({
    discovery,
    loadBalancer: new RoundRobinLoadBalancer(),
  });

  for (let i = 0; i < 5; i++) {
    const agent = await rrRouter.routeByCapability('data-processing');
    if (agent) {
      console.log(`  Request ${i + 1} → ${agent.name}`);
      rrRouter.recordResult(agent.uri, true, 50 + Math.random() * 50);
    }
  }

  // Test Least Connections load balancing
  console.log('\n⚡ Testing Least Connections load balancing:');
  const lcRouter = new AdvancedAgentRouter({
    discovery,
    loadBalancer: new LeastConnectionsLoadBalancer(),
  });

  for (let i = 0; i < 5; i++) {
    const agent = await lcRouter.routeByCapability('data-processing');
    if (agent) {
      console.log(`  Request ${i + 1} → ${agent.name}`);
      // Simulate varying connection times
      setTimeout(() => {
        lcRouter.recordResult(agent.uri, true, 30 + Math.random() * 40);
      }, Math.random() * 100);
    }
  }

  // Wait for connections to complete
  await new Promise(resolve => setTimeout(resolve, 200));

  // Test Weighted load balancing
  console.log('\n⚖️  Testing Weighted load balancing:');
  const weightedRouter = new AdvancedAgentRouter({
    discovery,
    loadBalancer: new WeightedLoadBalancer(),
  });

  // Simulate some failures for worker-2 to lower its weight
  weightedRouter.recordResult('agent://workers/worker-2', false);
  weightedRouter.recordResult('agent://workers/worker-2', false, 200);

  for (let i = 0; i < 5; i++) {
    const agent = await weightedRouter.routeByCapability('data-processing');
    if (agent) {
      console.log(`  Request ${i + 1} → ${agent.name}`);
      weightedRouter.recordResult(agent.uri, true, 40 + Math.random() * 30);
    }
  }

  // Geographic routing
  console.log('\n🌍 Testing geographic routing (prefer us-east-1):');
  const geoAgent = await rrRouter.routeNearest('data-processing', 'us-east-1');
  if (geoAgent) {
    console.log(`  Selected: ${geoAgent.name} in ${geoAgent.metadata?.region}`);
  }

  // Get statistics
  console.log('\n📊 Load Balancer Statistics:');
  const stats = rrRouter.getStats();
  console.log(`  Total requests: ${stats.totalRequests}`);
  console.log(`  Successful: ${stats.successfulRequests}`);
  console.log(`  Failed: ${stats.failedRequests}`);
  console.log(`  Avg latency: ${stats.avgLatencyMs.toFixed(2)}ms`);

  discovery.destroy();
}

/**
 * Example 4: Circuit Breaker Pattern
 * Demonstrate circuit breaker preventing cascading failures
 */
async function exampleCircuitBreaker() {
  console.log('\n=== Example 4: Circuit Breaker Pattern ===\n');

  const registry = new InMemoryAgentRegistry();
  const discovery = new DiscoveryService(registry);

  // Register agents
  const healthyAgent: AgentCard = {
    uri: 'agent://stable/worker',
    name: 'Stable Worker',
    version: '1.0.0',
    ossaVersion: '0.4.1',
    capabilities: ['task-execution'],
    endpoints: { http: 'http://localhost:11001' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
    status: 'healthy',
  };

  const flakyAgent: AgentCard = {
    uri: 'agent://flaky/worker',
    name: 'Flaky Worker',
    version: '1.0.0',
    ossaVersion: '0.4.1',
    capabilities: ['task-execution'],
    endpoints: { http: 'http://localhost:11002' },
    transport: ['http'],
    authentication: ['bearer'],
    encryption: { tlsRequired: true, minTlsVersion: '1.3' },
    status: 'healthy',
  };

  await discovery.registerSelf(healthyAgent);
  await discovery.registerSelf(flakyAgent);

  const router = new AdvancedAgentRouter({
    discovery,
    loadBalancer: new RoundRobinLoadBalancer(),
  });

  console.log('⚠️  Simulating failures on flaky worker...');

  // Simulate failures
  for (let i = 0; i < 6; i++) {
    const agent = await router.routeByCapability('task-execution');
    if (agent?.uri === 'agent://flaky/worker') {
      console.log(`  Request ${i + 1} → ${agent.name} (FAILED)`);
      router.recordResult(agent.uri, false);
    } else if (agent) {
      console.log(`  Request ${i + 1} → ${agent.name} (SUCCESS)`);
      router.recordResult(agent.uri, true, 30);
    }
  }

  // Check circuit breaker states
  console.log('\n🔌 Circuit Breaker States:');
  const states = router.getCircuitBreakerStates();
  for (const [uri, state] of states.entries()) {
    const agent = await discovery.discoverByUri(uri);
    console.log(`  ${agent?.name}: ${state}`);
  }

  console.log('\n✅ Subsequent requests will bypass flaky worker due to open circuit');

  discovery.destroy();
}

/**
 * Example 5: Complete Discovery System Integration
 * Full end-to-end example with all components
 */
async function exampleCompleteSystem() {
  console.log('\n=== Example 5: Complete Discovery System Integration ===\n');

  // Setup multi-provider discovery
  const registry = new InMemoryAgentRegistry();
  const discovery = new DiscoveryService(registry);

  // Setup agent graph
  const graph = new AgentGraphBuilder().build();

  // Setup advanced router
  const router = new AdvancedAgentRouter({
    discovery,
    loadBalancer: new WeightedLoadBalancer(),
    graph,
  });

  // Register agents
  const agents: AgentCard[] = [
    {
      uri: 'agent://platform/orchestrator',
      name: 'Platform Orchestrator',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['workflow-orchestration'],
      endpoints: { http: 'http://localhost:12000' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
    },
    {
      uri: 'agent://platform/analyzer',
      name: 'Code Analyzer',
      version: '1.0.0',
      ossaVersion: '0.4.1',
      capabilities: ['code-analysis'],
      endpoints: { http: 'http://localhost:12001' },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' },
      status: 'healthy',
    },
  ];

  for (const agent of agents) {
    await discovery.registerSelf(agent);
    graph.addAgent(agent);
  }

  // Define team relationship
  graph.defineTeam({
    id: 'platform',
    name: 'Platform Team',
    leader: 'agent://platform/orchestrator',
    members: ['agent://platform/analyzer'],
    specialists: [],
    capabilities: ['workflow-orchestration', 'code-analysis'],
  });

  graph.addRelationship({
    from: 'agent://platform/orchestrator',
    to: 'agent://platform/analyzer',
    type: 'leader',
    weight: 1.0,
    bidirectional: false,
  });

  // Create mesh client for orchestrator
  const orchestratorClient = new AgentMeshClientBuilder()
    .withLocalAgent(agents[0])
    .withDiscovery(discovery)
    .enableStats()
    .build();

  // Create mesh client for analyzer
  const analyzerClient = new AgentMeshClientBuilder()
    .withLocalAgent(agents[1])
    .withDiscovery(discovery)
    .enableStats()
    .build();

  // Register command on analyzer
  analyzerClient.registerCommand(
    {
      name: 'analyze_code',
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
    },
    async (input: { repository: string }) => {
      console.log(`  🔍 Analyzing ${input.repository}...`);
      return {
        status: 'success',
        issues: 2,
        quality_score: 92,
      };
    }
  );

  // Orchestrator discovers and invokes analyzer
  console.log('🎭 Orchestrator discovering code analyzer...');
  const analyzer = await router.routeByCapability('code-analysis');

  if (analyzer) {
    console.log(`  Found: ${analyzer.name}`);

    console.log('\n📞 Invoking code analysis...');
    const startTime = Date.now();

    try {
      const result = await orchestratorClient.invokeCommand(
        analyzer.uri,
        'analyze_code',
        { repository: 'github.com/example/repo' }
      );

      const latency = Date.now() - startTime;

      console.log('  ✅ Analysis complete:', result);

      // Record in router
      router.recordResult(analyzer.uri, true, latency);

      // Record in graph
      graph.recordCommunication({
        from: 'agent://platform/orchestrator',
        to: analyzer.uri,
        channel: 'code-analysis',
        frequency: 1,
        latencyMs: latency,
        errorRate: 0,
      });
    } catch (error) {
      console.error('  ❌ Analysis failed:', error);
      router.recordResult(analyzer.uri, false);
    }
  }

  // Show graph statistics
  console.log('\n📊 System Statistics:');
  const graphStats = graph.getStats();
  console.log(`  Agents: ${graphStats.agents}`);
  console.log(`  Teams: ${graphStats.teams}`);
  console.log(`  Relationships: ${graphStats.relationships}`);
  console.log(`  Communications: ${graphStats.communications}`);

  // Cleanup
  await orchestratorClient.close();
  await analyzerClient.close();
  discovery.destroy();
}

/**
 * Run all examples
 */
async function main() {
  try {
    await exampleMultiProviderDiscovery();
    await exampleAgentGraph();
    await exampleAdvancedRouting();
    await exampleCircuitBreaker();
    await exampleCompleteSystem();

    console.log('\n✅ All discovery system examples completed!\n');
  } catch (error) {
    console.error('❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
