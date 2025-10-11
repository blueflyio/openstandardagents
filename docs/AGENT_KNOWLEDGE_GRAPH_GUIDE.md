# Agent Knowledge Graph Guide

Complete guide to building, visualizing, and leveraging OSSA agent knowledge graphs with Phoenix/OpenTelemetry observability.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Building Knowledge Graphs](#building-knowledge-graphs)
- [Visualization](#visualization)
- [Observability with Phoenix](#observability-with-phoenix)
- [Drupal/ECA Integration](#drupaleca-integration)
- [Advanced Usage](#advanced-usage)
- [CI/CD Automation](#cicd-automation)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

The OSSA Knowledge Graph system provides:

- **Automated agent discovery** across 300+ agents
- **Relationship mapping** with 32,000+ connections
- **Visual graph exploration** (GraphML, Cytoscape, JSON)
- **Phoenix observability** with OpenTelemetry tracing
- **Drupal integration** via ECA workflows
- **CI/CD automation** with Git hooks

### What is a Knowledge Graph?

A knowledge graph represents agents as **nodes** and their relationships as **edges**:

```
┌─────────────┐      coordinates      ┌─────────────┐
│ Orchestrator│─────────────────────>│   Worker    │
└─────────────┘                       └─────────────┘
      │                                     │
      │ depends_on                   communicates_with
      ▼                                     ▼
┌─────────────┐                       ┌─────────────┐
│   Monitor   │<──────monitors────────│   Critic    │
└─────────────┘                       └─────────────┘
```

**Benefits:**
- Discover agent capabilities by querying the graph
- Visualize complex multi-agent systems
- Optimize agent workflows and dependencies
- Track agent performance with Phoenix tracing

---

## Quick Start

### 1. Start Development Environment

```bash
# Start Phoenix, Prometheus, Grafana
npm run dev:start

# Wait for services to start (~10 seconds)
# Phoenix UI: http://localhost:6006
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001
```

### 2. Build Your First Knowledge Graph

```bash
# Build graph from all agents
npm run graph:build

# Output: knowledge-graph/graph.json (+ GraphML, Cytoscape)
```

### 3. View in Phoenix

Open http://localhost:6006 and view traces for:
- `build_knowledge_graph_main` - Overall graph build
- `load_all_agents` - Agent discovery
- `build_relationships` - Relationship creation

### 4. Initialize a New Project

```bash
# Create a new knowledge graph project
npm run graph:init my-project -- --template full

cd ossa-project/my-project
./scripts/build-graph.sh
```

---

## Installation

### Prerequisites

- **Node.js** 18+
- **Docker** (for Phoenix, Prometheus, Grafana)
- **OSSA CLI** installed globally: `npm install -g @bluefly/ossa`

### Install OSSA

```bash
# Clone repository
git clone https://github.com/your-org/ossa
cd ossa

# Install dependencies
npm install

# Build CLI
npm run build

# Link globally (optional)
npm link

# Install Git hooks
npm run hooks:install
```

### Start Services

```bash
# Option 1: Use npm script
npm run dev:start

# Option 2: Direct docker-compose
docker-compose -f docker-compose.dev.yml up -d

# Verify services
curl http://localhost:6006  # Phoenix
curl http://localhost:9090  # Prometheus
curl http://localhost:3001  # Grafana
```

---

## Building Knowledge Graphs

### CLI Command

```bash
ossa knowledge-graph [options]
```

**Options:**
- `--buildkit <path>` - agent_buildkit path (default: `/Users/flux423/Sites/LLM/agent_buildkit/.agents`)
- `--ossa <path>` - OSSA agents path (default: `/Users/flux423/Sites/LLM/OSSA/.agents`)
- `-o, --output <dir>` - Output directory (default: `./knowledge-graph`)
- `--phoenix` - Enable Phoenix tracing (default: `true`)

**Example:**

```bash
# Full ecosystem graph
ossa knowledge-graph \
  --buildkit /path/to/agent_buildkit/.agents \
  --ossa /path/to/OSSA/.agents \
  --output ./my-graph

# Custom agent paths
ossa knowledge-graph \
  --buildkit /custom/path \
  --output ./output
```

### Output Files

**1. graph.json** - Full JSON representation:

```json
{
  "nodes": [
    {
      "id": "orchestrator-1",
      "name": "Main Orchestrator",
      "type": "orchestrator",
      "capabilities": ["coordination", "task-routing"],
      "domains": ["execution", "monitoring"],
      "dependencies": ["worker-1"],
      "path": "/path/to/agent.yml"
    }
  ],
  "relationships": [
    {
      "source": "orchestrator-1",
      "target": "worker-1",
      "type": "coordinates",
      "weight": 1.0
    }
  ],
  "stats": {
    "totalAgents": 309,
    "byType": { "orchestrator": 16, "worker": 262 },
    "byDomain": { "general": 236, "monitoring": 73 },
    "avgDependencies": 0
  }
}
```

**2. graph.graphml** - GraphML format for Gephi, yEd:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <graph id="AgentKnowledgeGraph" edgedefault="directed">
    <node id="orchestrator-1">
      <data key="type">orchestrator</data>
      <data key="name">Main Orchestrator</data>
    </node>
    <edge source="orchestrator-1" target="worker-1">
      <data key="type">coordinates</data>
    </edge>
  </graph>
</graphml>
```

**3. graph-cytoscape.json** - Cytoscape format:

```json
{
  "nodes": [
    { "data": { "id": "orchestrator-1", "label": "Main Orchestrator", "type": "orchestrator" } }
  ],
  "edges": [
    { "data": { "source": "orchestrator-1", "target": "worker-1", "type": "coordinates" } }
  ]
}
```

### Agent Discovery

Agents are auto-discovered from OpenAPI 3.1 specs:

```yaml
# Example: .agents/workers/my-agent/openapi.yml
openapi: 3.1.0
info:
  title: My Agent API
  version: 1.0.0
x-agent-type: worker
x-capabilities: [text-processing, analysis]
x-domains: [nlp, content]
x-dependencies: [tokenizer-agent, classifier-agent]
paths:
  /execute:
    post:
      summary: Execute agent task
```

**Inference Rules:**

If OpenAPI extensions aren't present, the system infers:

- **Type**: From agent name (e.g., "orchestrator" → `orchestrator`)
- **Domains**: From API paths (e.g., `/health` → `monitoring`)
- **Capabilities**: Extracted from path operations

### Relationship Types

**1. depends_on** (Explicit Dependencies):
```
Agent A declares Agent B in x-dependencies → A depends_on B
```

**2. communicates_with** (Domain-Based):
```
Agent A and Agent B share domain → A communicates_with B
Weight: 0.5 per shared domain
```

**3. coordinates** (Orchestrator-Worker):
```
Orchestrator type + Worker in same domain → Orchestrator coordinates Worker
Weight: 0.3 × shared_domain_count
```

**4. monitors** (Monitor-Agent):
```
Monitor type → monitors all agents in same domain
```

---

## Visualization

### Cytoscape Desktop

**Install:**
```bash
# macOS
brew install --cask cytoscape

# Or download from https://cytoscape.org
```

**Import Graph:**
1. Open Cytoscape
2. File → Import → Network from File
3. Select `knowledge-graph/graph-cytoscape.json`
4. Layout → yFiles Organic Layout

**Styling:**
- Color nodes by `type` (orchestrator=red, worker=blue)
- Size nodes by degree (number of connections)
- Edge thickness by `weight`

### Gephi

**Install:**
```bash
# Download from https://gephi.org
```

**Import Graph:**
1. Open Gephi
2. File → Open → `knowledge-graph/graph.graphml`
3. Layout → Force Atlas 2
4. Appearance → Nodes → Color by type
5. Appearance → Edges → Weight by weight

**Analysis:**
- Run Statistics → Network Diameter
- Run Statistics → Modularity (find communities)
- Filter → Degree Range (show hubs)

### Neo4j (Advanced)

**Load Graph into Neo4j:**

```cypher
// Create nodes
LOAD CSV WITH HEADERS FROM 'file:///graph.json' AS row
CREATE (a:Agent {
  id: row.id,
  name: row.name,
  type: row.type,
  domains: split(row.domains, ',')
});

// Create relationships
LOAD CSV WITH HEADERS FROM 'file:///relationships.json' AS row
MATCH (a:Agent {id: row.source})
MATCH (b:Agent {id: row.target})
CREATE (a)-[r:RELATES {type: row.type, weight: toFloat(row.weight)}]->(b);

// Query: Find all orchestrators
MATCH (a:Agent {type: 'orchestrator'})
RETURN a;

// Query: Find agent dependencies
MATCH (a:Agent)-[r:DEPENDS_ON]->(b:Agent)
RETURN a.name, b.name;

// Query: Find agent communities
CALL gds.louvain.stream('myGraph')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).name AS name, communityId
ORDER BY communityId;
```

### Web Visualization (Custom)

**Using Cytoscape.js:**

```javascript
import cytoscape from 'cytoscape';

// Load graph data
const response = await fetch('/knowledge-graph/graph-cytoscape.json');
const elements = await response.json();

// Render graph
const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: elements,
  style: [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'background-color': (node) => {
          const colors = {
            orchestrator: '#e74c3c',
            worker: '#3498db',
            monitor: '#2ecc71',
            critic: '#f39c12'
          };
          return colors[node.data('type')] || '#95a5a6';
        }
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 'data(weight)',
        'line-color': '#bdc3c7',
        'target-arrow-color': '#bdc3c7',
        'target-arrow-shape': 'triangle'
      }
    }
  ],
  layout: {
    name: 'cose',
    animate: true
  }
});
```

---

## Observability with Phoenix

### What is Phoenix?

Phoenix is an AI observability platform for:
- **Trace visualization** of agent workflows
- **Performance analytics** for graph operations
- **Debugging** agent interactions

### Viewing Traces

**1. Start Phoenix:**
```bash
npm run dev:start
# Phoenix UI: http://localhost:6006
```

**2. Build Graph with Tracing:**
```bash
npm run graph:build
# Traces automatically sent to Phoenix
```

**3. View in Phoenix UI:**
- Navigate to http://localhost:6006
- Click **Traces** tab
- Find trace: `build_knowledge_graph_main`
- Expand to see:
  - `load_all_agents` - Agent discovery (309 agents, ~50ms)
  - `build_relationships` - Relationship creation (32,732 edges, ~200ms)
  - `export_graph_formats` - Export to JSON/GraphML (~100ms)

### Trace Attributes

Each span includes:
```json
{
  "trace_id": "abc123",
  "span_id": "def456",
  "name": "load_all_agents",
  "attributes": {
    "total_agents": 309,
    "buildkit_agents": 150,
    "ossa_agents": 159,
    "duration_ms": 52
  }
}
```

### Custom Tracing

Add tracing to your own code:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

const span = tracer.startSpan('my_operation');
try {
  // Your code here
  const result = await myOperation();
  span.setAttribute('result_count', result.length);
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  });
  throw error;
} finally {
  span.end();
}
```

### Prometheus Integration

**Export Metrics:**
```bash
npm run graph:build
# Metrics available at http://localhost:9090
```

**Query Metrics:**
```promql
# Total agents
agent_graph_total_agents

# Relationships
agent_graph_relationships

# Build duration
rate(graph_build_duration_seconds[5m])
```

**Grafana Dashboards:**
1. Open http://localhost:3001 (admin/admin)
2. Import dashboard from `infrastructure/grafana/dashboards/knowledge-graph.json`
3. View metrics:
   - Agent count over time
   - Relationship density
   - Build performance

---

## Drupal/ECA Integration

**See:** [Drupal ECA Integration Guide](./integrations/drupal-eca-integration.md)

**Quick Example:**

```yaml
# ECA Model: Rebuild graph on agent update
events:
  entity_update_node:
    entity_type: node
    bundle: agent_config

actions:
  http_rebuild:
    url: 'http://localhost:3000/api/v1/knowledge-graph/rebuild'
    method: POST
```

---

## Advanced Usage

### Programmatic API

**TypeScript/JavaScript:**

```typescript
import { AgentGraphBuilder } from '@bluefly/ossa/services/knowledge-graph/AgentGraphBuilder';

const builder = new AgentGraphBuilder();

// Load agents
await builder.loadAgents([
  '/path/to/agent_buildkit/.agents',
  '/path/to/OSSA/.agents'
]);

// Build relationships
await builder.buildRelationships();

// Generate graph
const graph = await builder.buildGraph();

console.log(`Loaded ${graph.stats.totalAgents} agents`);
console.log(`Created ${graph.relationships.length} relationships`);

// Export
const exports = await builder.exportGraph(graph);
fs.writeFileSync('graph.json', exports.json);
```

### Custom Relationship Logic

**Extend the builder:**

```typescript
class CustomGraphBuilder extends AgentGraphBuilder {
  protected async buildCustomRelationships(): Promise<void> {
    // Add custom relationship type
    for (const agent of this.agents) {
      if (agent.capabilities.includes('ml-training')) {
        const dataAgents = this.agents.filter(a =>
          a.capabilities.includes('data-processing')
        );

        for (const dataAgent of dataAgents) {
          this.relationships.push({
            source: agent.id,
            target: dataAgent.id,
            type: 'consumes_data_from',
            weight: 0.8
          });
        }
      }
    }
  }
}
```

### Filtering Agents

```typescript
// Filter by domain
const mlAgents = graph.nodes.filter(n =>
  n.domains.includes('machine-learning')
);

// Filter by type
const orchestrators = graph.nodes.filter(n =>
  n.type === 'orchestrator'
);

// Filter by capability
const nlpAgents = graph.nodes.filter(n =>
  n.capabilities.some(c => c.includes('nlp'))
);
```

### Graph Analytics

```typescript
// Calculate degree centrality
function degreeCentrality(graph, nodeId) {
  return graph.relationships.filter(r =>
    r.source === nodeId || r.target === nodeId
  ).length;
}

// Find hub nodes
const hubs = graph.nodes
  .map(n => ({ id: n.id, degree: degreeCentrality(graph, n.id) }))
  .sort((a, b) => b.degree - a.degree)
  .slice(0, 10);

// Calculate clustering coefficient
function clusteringCoefficient(graph, nodeId) {
  const neighbors = graph.relationships
    .filter(r => r.source === nodeId || r.target === nodeId)
    .map(r => r.source === nodeId ? r.target : r.source);

  const possibleEdges = neighbors.length * (neighbors.length - 1) / 2;
  const actualEdges = graph.relationships.filter(r =>
    neighbors.includes(r.source) && neighbors.includes(r.target)
  ).length;

  return actualEdges / possibleEdges;
}
```

---

## CI/CD Automation

### Git Hooks

**Install:**
```bash
npm run hooks:install
```

**Pre-Push Hook:**
- Auto-detects agent file changes
- Rebuilds graph if agents modified
- Auto-commits graph updates
- Prevents outdated graphs in remote

**Disable Temporarily:**
```bash
# Skip hook for one push
git push --no-verify

# Disable auto-commit
export OSSA_AUTO_COMMIT_GRAPH=false
git push
```

### GitLab CI/CD

**Example `.gitlab-ci.yml`:**

```yaml
include:
  - component: gitlab.bluefly.io/llm/gitlab_components/workflow/golden@v0.1.0

stages:
  - build
  - test
  - graph
  - deploy

build:graph:
  stage: graph
  image: node:18-alpine
  script:
    - npm install
    - npm run build
    - npm run graph:build
  artifacts:
    paths:
      - knowledge-graph/
    expire_in: 30 days

schedule:nightly-graph:
  stage: graph
  only:
    - schedules
  script:
    - npm run graph:build
    - ./scripts/export-metrics.sh
    - curl -X POST $SLACK_WEBHOOK -d "payload={'text':'Knowledge graph rebuilt: ${CI_PIPELINE_URL}'}"
```

### GitHub Actions

```yaml
name: Build Knowledge Graph

on:
  push:
    paths:
      - '.agents/**/*.yml'
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  build-graph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build graph
        run: npm run graph:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: knowledge-graph
          path: knowledge-graph/

      - name: Commit graph updates
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add knowledge-graph/
          git commit -m "chore: update knowledge graph [skip ci]" || true
          git push
```

---

## API Reference

### CLI Commands

```bash
# Initialize project
ossa init <name> --template <small|medium|full|custom>

# Build graph
ossa knowledge-graph --output <dir> [--phoenix]

# List available commands
ossa --help
```

### REST API Endpoints

**GET /api/v1/dashboard/ecosystem**
- Returns ecosystem statistics
- Response: `{ agents: {...}, compliance: {...}, services: {...} }`

**GET /api/v1/dashboard/agents/live**
- Returns live agent status from router
- Response: `{ router: {...}, timestamp: "..." }`

**GET /api/v1/dashboard/metrics**
- Returns Prometheus metrics
- Response: `{ router_up: [], request_duration: [], ... }`

**POST /api/v1/knowledge-graph/rebuild**
- Triggers graph rebuild
- Body: `{ reason: "manual" }`
- Response: `{ status: "success", duration: 376 }`

---

## Troubleshooting

### Graph Build Fails

**Symptom:** `Error building knowledge graph`

**Solutions:**
1. Check agent paths exist:
   ```bash
   ls -la /Users/flux423/Sites/LLM/agent_buildkit/.agents
   ```

2. Verify OpenAPI specs are valid:
   ```bash
   ossa validate .agents/**/*.yml
   ```

3. Check permissions:
   ```bash
   chmod -R 755 .agents/
   ```

### Phoenix Connection Refused

**Symptom:** `ECONNREFUSED ::1:4317`

**Solutions:**
1. Start Phoenix:
   ```bash
   npm run dev:start
   ```

2. Verify Phoenix is running:
   ```bash
   docker ps | grep phoenix
   curl http://localhost:6006
   ```

3. Use HTTP endpoint instead:
   ```bash
   export OTLP_HTTP_ENDPOINT=http://localhost:4318/v1/traces
   ```

### Missing Agents

**Symptom:** Graph shows fewer agents than expected

**Solutions:**
1. Check file extensions:
   ```bash
   find .agents -name "*.yaml" # Should also find .yml
   ```

2. Verify recursive search:
   ```bash
   find .agents -type f \( -name "*.yml" -o -name "*.yaml" \) | wc -l
   ```

3. Check OpenAPI format:
   ```yaml
   # Must have at minimum:
   openapi: 3.1.0
   info:
     title: Agent Name
   ```

### Performance Issues

**Symptom:** Graph build takes too long

**Solutions:**
1. **Reduce agent count:**
   ```bash
   ossa knowledge-graph --ossa /path/only
   ```

2. **Disable relationship building:**
   Edit config to skip domain/coordination relationships

3. **Use caching:**
   ```typescript
   // Cache loaded agents
   const cache = new Map();
   ```

---

## Resources

- **Phoenix Documentation:** https://docs.arize.com/phoenix/
- **Cytoscape:** https://cytoscape.org/
- **Gephi:** https://gephi.org/
- **OpenTelemetry:** https://opentelemetry.io/
- **Drupal ECA:** https://www.drupal.org/project/eca

---

## Support

**Issues:**
- OSSA GitHub: https://github.com/your-org/ossa/issues
- Phoenix: https://github.com/Arize-ai/phoenix/issues

**Community:**
- Slack: #ossa-knowledge-graph
- Discord: OSSA Community Server

---

**Last Updated:** October 4, 2025
**Version:** OSSA v0.1.9
