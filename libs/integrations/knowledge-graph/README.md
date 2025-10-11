# OSSA Knowledge Graph

**309 agents | 32,732 relationships | 6 clusters**

## Quick Access

- **Full Guide:** [docs/AGENT_KNOWLEDGE_GRAPH_GUIDE.md](../docs/AGENT_KNOWLEDGE_GRAPH_GUIDE.md)
- **Drupal Integration:** [docs/integrations/drupal-eca-integration.md](../docs/integrations/drupal-eca-integration.md)

## Files

```
knowledge-graph/
├── graph.json              # Full JSON (4.4MB, 199K lines)
├── graph.graphml           # Gephi/yEd format (4.9MB)
└── graph-cytoscape.json    # Cytoscape format (5.3MB)
```

## Graph Statistics

**Agents by Type:**
- Orchestrators: 16 (5.2%) - Coordinate workflows
- Workers: 262 (84.8%) - Execute tasks
- Monitors: 10 (3.2%) - Health tracking
- Integrators: 9 (2.9%) - External systems
- Governors: 8 (2.6%) - Policy enforcement
- Critics: 4 (1.3%) - Quality review

**Agents by Domain:**
- General: 236 (76.4%)
- Monitoring: 73 (23.6%)
- Execution: 16 (5.2%)
- Validation: 1 (0.3%)

**Relationships:**
- Total: 32,732 edges
- Types: depends_on, communicates_with, coordinates, monitors
- Average degree: 106 connections per agent

## Rebuild Graph

```bash
# From OSSA root
npm run graph:build

# Or with CLI
ossa knowledge-graph --output knowledge-graph
```

## Visualization

### Cytoscape
```bash
# Import graph-cytoscape.json
# Layout: yFiles Organic
```

### Gephi
```bash
# Import graph.graphml
# Layout: Force Atlas 2
```

### Phoenix Traces
```bash
# View at http://localhost:6006
npm run dev:start
npm run graph:build
```

## Programmatic Access

```typescript
import graph from './knowledge-graph/graph.json';

// Find all orchestrators
const orchestrators = graph.nodes.filter(n => n.type === 'orchestrator');

// Get agent by ID
const agent = graph.nodes.find(n => n.id === 'my-agent');

// Find dependencies
const deps = graph.relationships.filter(r =>
  r.source === 'my-agent' && r.type === 'depends_on'
);

// Statistics
console.log(graph.stats);
// {
//   totalAgents: 309,
//   byType: {...},
//   byDomain: {...},
//   avgDependencies: 0
// }
```

## Integration

### Drupal ECA

```yaml
# Trigger graph rebuild from Drupal
events:
  entity_update_node:
    bundle: agent_config
actions:
  http_request:
    url: http://localhost:3000/api/v1/knowledge-graph/rebuild
```

### CI/CD

```bash
# Install Git hooks
npm run hooks:install

# Auto-rebuilds on agent changes
git push  # Hook triggers rebuild
```

## Last Build

- **Date:** October 4, 2025
- **Duration:** 376ms
- **Agents Discovered:** 309
- **Relationships Created:** 32,732

## Resources

- **Main Guide:** [AGENT_KNOWLEDGE_GRAPH_GUIDE.md](../docs/AGENT_KNOWLEDGE_GRAPH_GUIDE.md)
- **Phoenix:** http://localhost:6006
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001
