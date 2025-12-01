# AgentGraph Resource Specification

**Version:** v0.2.7  
**Status:** Draft  
**Type:** Core Resource

## Overview

AgentGraph is a resource type for defining multi-agent compositions as directed graphs. It enables orchestration of multiple agents with explicit data flow and conditional routing.

## Motivation

Single agents are limited in capability. Complex tasks require:
- Multiple specialized agents working together
- Data flow between agents
- Conditional routing based on outputs
- Error handling across agent boundaries

AgentGraph provides a declarative way to compose agents into workflows.

## Resource Structure

```yaml
apiVersion: ossa.ai/v0.2.7
kind: AgentGraph
metadata:
  name: string
  version: string
  description: string
spec:
  agents: Agent[]
  edges: Edge[]
  entrypoint: string
  errorHandling: ErrorHandling
```

## Fields

### metadata

Standard OSSA metadata block.

**Required fields:**
- `name`: Unique identifier for the graph
- `version`: Semantic version

### spec.agents

Array of agent definitions within the graph.

**Fields:**
- `id` (required): Unique identifier within graph
- `agentRef` (required): Reference to Agent resource
- `config` (optional): Agent-specific configuration overrides

**Example:**
```yaml
agents:
  - id: analyzer
    agentRef: sentiment-analyzer
    config:
      threshold: 0.8
  - id: responder
    agentRef: response-generator
```

### spec.edges

Array defining data flow between agents.

**Fields:**
- `from` (required): Source agent ID
- `to` (required): Target agent ID
- `condition` (optional): Boolean expression for conditional routing
- `transform` (optional): Data transformation expression

**Example:**
```yaml
edges:
  - from: analyzer
    to: responder
  - from: analyzer
    to: escalation
    condition: output.sentiment < 0.3
```

### spec.entrypoint

ID of the starting agent. Graph execution begins here.

### spec.errorHandling

Error handling strategy for the graph.

**Fields:**
- `strategy`: `fail-fast` | `continue` | `retry`
- `maxRetries`: Maximum retry attempts (for retry strategy)
- `fallbackAgent`: Agent ID to invoke on error

## Execution Model

### Sequential Execution

Agents execute in topological order based on edges.

```yaml
edges:
  - from: A
    to: B
  - from: B
    to: C
```

Execution: A → B → C

### Parallel Execution

Agents with no dependencies execute in parallel.

```yaml
edges:
  - from: A
    to: B
  - from: A
    to: C
  - from: B
    to: D
  - from: C
    to: D
```

Execution: A → (B || C) → D

### Conditional Routing

Edges with conditions enable branching.

```yaml
edges:
  - from: classifier
    to: pathA
    condition: output.category == 'A'
  - from: classifier
    to: pathB
    condition: output.category == 'B'
```

### Data Flow

Output from source agent becomes input to target agent.

**Transformation:**
```yaml
edges:
  - from: extractor
    to: formatter
    transform: |
      {
        "data": output.extracted,
        "format": "json"
      }
```

## Error Handling

### Fail-Fast (default)

Stop execution on first error.

```yaml
errorHandling:
  strategy: fail-fast
```

### Continue

Continue execution, skip failed agents.

```yaml
errorHandling:
  strategy: continue
```

### Retry

Retry failed agents up to maxRetries.

```yaml
errorHandling:
  strategy: retry
  maxRetries: 3
```

### Fallback

Invoke fallback agent on error.

```yaml
errorHandling:
  strategy: fail-fast
  fallbackAgent: error-handler
```

## Examples

### Sequential Pipeline

```yaml
apiVersion: ossa.ai/v0.2.7
kind: AgentGraph
metadata:
  name: content-pipeline
  version: 1.0.0
spec:
  agents:
    - id: researcher
      agentRef: research-agent
    - id: writer
      agentRef: writing-agent
    - id: editor
      agentRef: editing-agent
  edges:
    - from: researcher
      to: writer
    - from: writer
      to: editor
  entrypoint: researcher
```

### Parallel Processing

```yaml
apiVersion: ossa.ai/v0.2.7
kind: AgentGraph
metadata:
  name: parallel-analysis
  version: 1.0.0
spec:
  agents:
    - id: splitter
      agentRef: data-splitter
    - id: analyzer1
      agentRef: sentiment-analyzer
    - id: analyzer2
      agentRef: entity-extractor
    - id: merger
      agentRef: result-merger
  edges:
    - from: splitter
      to: analyzer1
    - from: splitter
      to: analyzer2
    - from: analyzer1
      to: merger
    - from: analyzer2
      to: merger
  entrypoint: splitter
```

### Conditional Routing

```yaml
apiVersion: ossa.ai/v0.2.7
kind: AgentGraph
metadata:
  name: support-router
  version: 1.0.0
spec:
  agents:
    - id: classifier
      agentRef: intent-classifier
    - id: technical
      agentRef: technical-support
    - id: billing
      agentRef: billing-support
    - id: general
      agentRef: general-support
  edges:
    - from: classifier
      to: technical
      condition: output.intent == 'technical'
    - from: classifier
      to: billing
      condition: output.intent == 'billing'
    - from: classifier
      to: general
      condition: output.intent == 'general'
  entrypoint: classifier
  errorHandling:
    strategy: fail-fast
    fallbackAgent: general
```

## Validation Rules

1. **Acyclic**: Graph MUST NOT contain cycles
2. **Connected**: All agents MUST be reachable from entrypoint
3. **Valid References**: All `agentRef` MUST reference existing Agent resources
4. **Unique IDs**: Agent IDs MUST be unique within graph
5. **Valid Edges**: Edge `from`/`to` MUST reference agent IDs in graph

## Runtime Requirements

Implementations MUST:
- Validate graph structure before execution
- Execute agents in topological order
- Handle parallel execution where possible
- Evaluate conditions before edge traversal
- Apply transformations to data flow
- Implement specified error handling strategy

## Future Considerations

- **Loops**: Support for iterative agent execution
- **Subgraphs**: Nested AgentGraph resources
- **Dynamic Routing**: Runtime edge creation
- **State Management**: Shared state across agents
- **Observability**: Built-in tracing and metrics

## Related Resources

- [Agent Resource](./agent-definition.md)
- [Multi-Agent Composition](../examples/multi-agent/)
- [Error Handling](./error-handling.md)
