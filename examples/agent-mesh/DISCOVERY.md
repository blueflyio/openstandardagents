# Agent Discovery System

The Agent Discovery System enables agents to find and communicate with each other across different infrastructure environments. It provides a complete solution for service discovery, relationship mapping, and intelligent routing.

## Features

### 1. Discovery Mechanisms

- **DNS-based Discovery** - Uses DNS SRV/TXT records (agents.internal domain)
- **Consul Integration** - HashiCorp Consul service registry
- **Kubernetes Discovery** - Native Kubernetes Service discovery
- **Service Mesh Integration** - Istio/Linkerd service mesh
- **Multi-Provider Support** - Aggregate discovery across multiple systems

### 2. Agent Graph

- **Relationship Tracking** - Leader, worker, specialist, peer, supervisor, dependency
- **Communication Patterns** - Track message frequency, latency, error rates
- **Team Hierarchies** - Organize agents into teams with leaders and specialists
- **Capability Mapping** - Index agents by capabilities for fast lookup
- **Path Finding** - BFS algorithm to find communication paths between agents
- **Importance Scoring** - Calculate agent centrality and importance

### 3. Routing Logic

- **Capability-based Routing** - Find agents with specific capabilities
- **Load Balancing Strategies**:
  - Round-robin
  - Least connections
  - Weighted (based on performance)
  - Geographic (nearest agent)
- **Health-aware Routing** - Exclude unhealthy agents
- **Circuit Breaker Pattern** - Prevent cascading failures
- **Priority Routing** - Route based on message priority

### 4. A2A Communication

- **HTTP-based Protocol** - Standard HTTP transport
- **Message Routing** - Direct, broadcast, topic-based
- **Request/Response** - Synchronous RPC-style communication
- **Pub/Sub** - Asynchronous event distribution
- **Multi-agent Orchestration** - Coordinate work across multiple agents

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Discovery Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   DNS    │  │  Consul  │  │    K8s   │  │ Service Mesh │   │
│  │ Provider │  │ Provider │  │ Provider │  │   Provider   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│       │              │              │               │           │
│       └──────────────┴──────────────┴───────────────┘           │
│                          │                                      │
│              ┌───────────▼───────────┐                         │
│              │ Multi-Provider        │                         │
│              │ Registry              │                         │
│              └───────────┬───────────┘                         │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     Agent Graph                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   Agents    │  │ Relationships│  │  Communication     │    │
│  │   (Nodes)   │  │   (Edges)    │  │    Patterns        │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                  │
│  Features:                                                       │
│  - Team hierarchies                                             │
│  - Capability indexing                                          │
│  - Path finding (BFS)                                           │
│  - Centrality calculation                                       │
│  - Importance scoring                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   Advanced Routing                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ Load Balancing   │  │ Circuit Breaker │  │ Health Check │  │
│  │ - Round-robin    │  │ - Failure track │  │ - Status mon │  │
│  │ - Least conn     │  │ - Auto recovery │  │ - Heartbeat  │  │
│  │ - Weighted       │  │ - Half-open     │  │              │  │
│  │ - Geographic     │  │                 │  │              │  │
│  └──────────────────┘  └─────────────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Mesh Communication                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Direct    │  │ Broadcast  │  │  Pub/Sub   │  │   RPC    │ │
│  │  Messaging │  │            │  │            │  │          │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Discovery

```typescript
import {
  DiscoveryService,
  InMemoryAgentRegistry,
  AgentCard,
} from '@bluefly/openstandardagents/mesh';

// Create discovery service
const registry = new InMemoryAgentRegistry();
const discovery = new DiscoveryService(registry);

// Define your agent
const myAgent: AgentCard = {
  uri: 'uadp://team/creative-agent-naming',
  name: 'My Agent',
  version: '1.0.0',
  ossaVersion: '0.4.1',
  capabilities: ['data-processing'],
  endpoints: { http: 'http://localhost:8080' },
  transport: ['http'],
  authentication: ['bearer'],
  encryption: { tlsRequired: true, minTlsVersion: '1.3' },
};

// Register agent
await discovery.registerSelf(myAgent);

// Discover agents by capability
const agents = await discovery.discoverByCapability('data-processing');
console.log(`Found ${agents.length} agent(s)`);
```

### Multi-Provider Discovery

```typescript
import {
  MultiProviderRegistry,
  InMemoryAgentRegistry,
  DNSDiscoveryProvider,
  ConsulDiscoveryProvider,
} from '@bluefly/openstandardagents/mesh';

// Create providers
const inMemory = new InMemoryAgentRegistry();
const dns = new DNSDiscoveryProvider({ domain: 'agents.internal' });
const consul = new ConsulDiscoveryProvider({ url: 'http://consul:8500' });

// Create multi-provider registry
const registry = new MultiProviderRegistry(inMemory, [dns, consul]);
await registry.initialize();

// Discover across all providers
const agents = await registry.findByCapability('vulnerability-scanning');
```

### Agent Graph

```typescript
import {
  AgentGraphBuilder,
  AgentCard,
} from '@bluefly/openstandardagents/mesh';

// Build graph
const graph = new AgentGraphBuilder()
  .withAgents([agent1, agent2, agent3])
  .withTeams([
    {
      id: 'security',
      name: 'Security Team',
      leader: 'uadp://security/leader',
      members: ['uadp://security/scanner'],
      specialists: ['uadp://security/secrets-detector'],
      capabilities: ['vulnerability-scanning', 'secret-detection'],
    },
  ])
  .withRelationships([
    {
      from: 'uadp://security/leader',
      to: 'uadp://security/scanner',
      type: 'leader',
      weight: 1.0,
      bidirectional: false,
    },
  ])
  .autoDiscoverRelationships()
  .build();

// Record communication
graph.recordCommunication({
  from: 'uadp://security/scanner',
  to: 'uadp://compliance/auditor',
  channel: 'security.vulnerabilities',
  frequency: 5.2,
  latencyMs: 45,
  errorRate: 0.02,
});

// Calculate importance
graph.calculateImportance();
const topAgents = graph.getTopAgents(5);

// Find path
const path = graph.findPath(
  'uadp://security/scanner',
  'uadp://compliance/auditor'
);
```

### Advanced Routing

```typescript
import {
  AdvancedAgentRouter,
  WeightedLoadBalancer,
  DiscoveryService,
} from '@bluefly/openstandardagents/mesh';

// Create router
const router = new AdvancedAgentRouter({
  discovery,
  loadBalancer: new WeightedLoadBalancer(),
  graph,
});

// Route by capability
const agent = await router.routeByCapability('data-processing', {
  preferredRegion: 'us-east-1',
  maxLatencyMs: 100,
  excludeAgents: ['uadp://workers/worker-1'],
});

// Route to multiple agents
const agents = await router.routeToMultiple('task-execution', 3);

// Route to nearest agent
const nearestAgent = await router.routeNearest(
  'data-processing',
  'us-west-2'
);

// Record result (updates circuit breaker and stats)
router.recordResult(agent.uri, true, 45);

// Get statistics
const stats = router.getStats();
console.log(`Success rate: ${stats.successfulRequests / stats.totalRequests}`);

// Check circuit breakers
const breakerStates = router.getCircuitBreakerStates();
for (const [uri, state] of breakerStates) {
  console.log(`${uri}: ${state}`);
}
```

## Discovery Providers

### DNS Provider

Uses DNS SRV and TXT records for discovery.

**DNS Structure:**
```
_agents._tcp.agents.internal           SRV    0 0 8080 agent1.agents.internal
agent1.agents.internal                 TXT    {"uri":"uadp://team/agent1","capabilities":["scan"]}

_vulnerability-scanning._tcp.agents.internal  SRV    0 0 8080 scanner.agents.internal
```

**Configuration:**
```typescript
const dns = new DNSDiscoveryProvider({
  domain: 'agents.internal', // DNS domain
});

await dns.initialize();
const agents = await dns.discover({
  capability: 'vulnerability-scanning',
  healthyOnly: true,
});
```

### Consul Provider

Integrates with HashiCorp Consul service registry.

**Configuration:**
```typescript
const consul = new ConsulDiscoveryProvider({
  url: 'http://localhost:8500',
  datacenter: 'dc1',
});

await consul.initialize();

// Register agent
await consul.register(myAgent);

// Discover agents
const agents = await consul.discover({
  capability: 'data-processing',
  region: 'us-east-1',
});

// Unregister
await consul.unregister(myAgent.uri);
```

**Consul Service Definition:**
```json
{
  "ID": "agent-security-scanner",
  "Name": "security-scanner",
  "Tags": ["ossa-agent", "vulnerability-scanning"],
  "Meta": {
    "uri": "uadp://security/scanner",
    "version": "1.0.0",
    "ossaVersion": "0.4.1",
    "capabilities": "vulnerability-scanning,secret-detection"
  },
  "Address": "10.0.1.5",
  "Port": 8080,
  "Check": {
    "HTTP": "http://10.0.1.5:8080/health",
    "Interval": "30s",
    "Timeout": "5s"
  }
}
```

### Kubernetes Provider

Uses Kubernetes Service API for discovery.

**Configuration:**
```typescript
const k8s = new KubernetesDiscoveryProvider({
  apiServer: 'https://kubernetes.default.svc',
  namespace: 'agents',
  token: process.env.KUBERNETES_SERVICE_TOKEN,
});

await k8s.initialize();
const agents = await k8s.discover({
  capability: 'task-execution',
});
```

**Kubernetes Service Annotations:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: security-scanner
  namespace: agents
  labels:
    app.kubernetes.io/name: security-scanner
    app.kubernetes.io/component: ossa-agent
    app.kubernetes.io/version: "1.0.0"
  annotations:
    ossa.io/agent-uri: "uadp://security/scanner"
    ossa.io/version: "0.4.1"
    ossa.io/capabilities: "vulnerability-scanning,secret-detection"
spec:
  selector:
    app: security-scanner
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
```

### Service Mesh Provider

Integrates with Istio or Linkerd service mesh.

**Configuration:**
```typescript
const istio = new ServiceMeshDiscoveryProvider({
  meshType: 'istio',
  apiServer: 'https://kubernetes.default.svc',
  namespace: 'agents',
});

await istio.initialize();
const agents = await istio.discover({
  capability: 'data-processing',
});

// Agents include mesh-specific metadata
agents.forEach(agent => {
  console.log(agent.metadata?.serviceMesh); // 'istio'
  console.log(agent.metadata?.mtlsEnabled); // true
});
```

## Load Balancing Strategies

### Round-Robin

Cycles through available agents in order.

```typescript
import { RoundRobinLoadBalancer } from '@bluefly/openstandardagents/mesh';

const lb = new RoundRobinLoadBalancer();
const agent = lb.select(candidates);
lb.recordRouting(agent.uri, true, 45);
```

### Least Connections

Routes to agent with fewest active connections.

```typescript
import { LeastConnectionsLoadBalancer } from '@bluefly/openstandardagents/mesh';

const lb = new LeastConnectionsLoadBalancer();
const agent = lb.select(candidates);
lb.recordRouting(agent.uri, true, 50);
```

### Weighted

Routes based on agent performance (success rate and latency).

```typescript
import { WeightedLoadBalancer } from '@bluefly/openstandardagents/mesh';

const lb = new WeightedLoadBalancer();
const agent = lb.select(candidates);
lb.recordRouting(agent.uri, true, 40);

// Agents with better performance get higher weight
// Weight = success_rate * (1 - latency_penalty)
```

## Circuit Breaker

Prevents cascading failures by temporarily blocking requests to failing agents.

**States:**
- **Closed** - Normal operation, requests allowed
- **Open** - Too many failures, requests blocked
- **Half-Open** - Testing if agent recovered, limited requests allowed

**Configuration:**
```typescript
import { CircuitBreaker } from '@bluefly/openstandardagents/mesh';

const breaker = new CircuitBreaker(
  5,      // failure threshold
  60000,  // timeout (ms)
  3       // half-open requests
);

if (breaker.allowRequest()) {
  try {
    // Make request
    breaker.recordSuccess();
  } catch (error) {
    breaker.recordFailure();
  }
}

console.log(breaker.getState()); // 'closed' | 'open' | 'half-open'
breaker.reset(); // Manually reset
```

**Automatic Circuit Breaker:**
```typescript
const router = new AdvancedAgentRouter({
  discovery,
  loadBalancer: new WeightedLoadBalancer(),
});

// Circuit breakers are automatically managed
const agent = await router.routeByCapability('task-execution');

// Record result - updates circuit breaker
router.recordResult(agent.uri, false); // Record failure

// Check states
const states = router.getCircuitBreakerStates();
states.forEach((state, uri) => {
  console.log(`${uri}: ${state}`);
});
```

## Agent Relationships

### Relationship Types

- **leader** - Orchestrates and delegates to workers
- **worker** - Executes tasks assigned by leaders
- **specialist** - Provides specific expertise
- **peer** - Equal collaboration
- **supervisor** - Monitors and manages
- **dependency** - Required by another agent

### Example

```typescript
graph.addRelationship({
  from: 'uadp://security/leader',
  to: 'uadp://security/scanner',
  type: 'leader',
  weight: 1.0,
  bidirectional: false,
  metadata: {
    established: new Date(),
    interactionCount: 0,
  },
});

// Get related agents
const workers = graph.findRelatedAgents(
  'uadp://security/leader',
  'leader'
);
```

## Communication Patterns

Track message frequency, latency, and errors between agents.

```typescript
graph.recordCommunication({
  from: 'uadp://security/scanner',
  to: 'uadp://compliance/auditor',
  channel: 'security.vulnerabilities',
  frequency: 5.2,  // messages per minute
  latencyMs: 45,
  errorRate: 0.02, // 2% error rate
});

// Get statistics
const stats = graph.getCommunicationStats(
  'uadp://security/scanner',
  'uadp://compliance/auditor'
);

console.log(`Total messages: ${stats.totalMessages}`);
console.log(`Avg latency: ${stats.avgLatency}ms`);
console.log(`Error rate: ${stats.avgErrorRate * 100}%`);
console.log(`Top channels:`, stats.topChannels);
```

## Examples

Run the comprehensive examples:

```bash
# All discovery system examples
tsx examples/agent-mesh/discovery-system.ts

# Basic agent mesh examples
tsx examples/agent-mesh/basic-usage.ts
```

## Production Deployment

### Infrastructure Setup

**1. DNS (external-dns on Kubernetes):**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: external-dns
data:
  domain: agents.internal
  policy: upsert-only
```

**2. Consul:**
```bash
consul agent -dev
# Or via Helm on Kubernetes
helm install consul hashicorp/consul
```

**3. Kubernetes:**
```yaml
# Agents automatically discovered via Service API
# Use annotations for OSSA metadata
```

**4. Service Mesh (Istio):**
```bash
istioctl install --set profile=default
# Agents inherit mTLS and observability
```

### Agent Registration

**Automatic registration via Kubernetes admission webhook:**
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: ossa-agent-injector
webhooks:
  - name: inject.ossa.io
    # Injects OSSA annotations on Pod creation
```

**Manual registration:**
```typescript
// On agent startup
const discovery = new DiscoveryService(registry);
await discovery.registerSelf(myAgent, 30000); // 30s heartbeat

// On shutdown
process.on('SIGTERM', async () => {
  await discovery.unregisterSelf();
});
```

## Best Practices

1. **Use Multi-Provider Discovery** - Aggregate across DNS, Consul, K8s for resilience
2. **Enable Circuit Breakers** - Prevent cascading failures
3. **Track Communication Patterns** - Monitor agent interactions
4. **Calculate Importance** - Identify critical agents
5. **Use Weighted Load Balancing** - Route based on actual performance
6. **Implement Health Checks** - Register heartbeat endpoints
7. **Use Geographic Routing** - Minimize latency with regional routing
8. **Monitor Circuit Breaker States** - Alert on open circuits
9. **Clean Up Old Agents** - Remove stale registrations
10. **Test Discovery Failures** - Ensure fallback mechanisms work

## Troubleshooting

### Agent Not Discovered

```typescript
// Check if agent is registered
const agent = await discovery.discoverByUri('uadp://team/creative-agent-naming');
if (!agent) {
  console.log('Agent not registered');
}

// List all agents
const allAgents = await discovery.listAgents();
console.log(`Total agents: ${allAgents.length}`);

// Check health
const healthyAgents = await discovery.findHealthyAgents();
```

### Circuit Breaker Open

```typescript
const states = router.getCircuitBreakerStates();
if (states.get('uadp://team/agent') === 'open') {
  // Reset manually if issue resolved
  router.resetCircuitBreaker('uadp://team/agent');
}
```

### High Latency

```typescript
// Check communication patterns
const stats = graph.getCommunicationStats('uadp://source', 'uadp://target');
console.log(`Avg latency: ${stats.avgLatency}ms`);

// Route to nearest agent
const agent = await router.routeNearest('capability', 'us-east-1');
```

## License

Apache-2.0
