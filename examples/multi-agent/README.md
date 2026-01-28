# Multi-Agent Examples

Examples demonstrating different multi-agent patterns using OSSA.

## Patterns

### 1. Sequential Pipeline (`sequential-pipeline.ossa.yaml`)

**Pattern**: Chain of agents processing data sequentially

```
Input → Researcher → Analyzer → Writer → Output
```

**Use Cases**:
- Research and report generation
- Data processing pipelines
- Content creation workflows

### 2. Parallel Execution (`parallel-execution.ossa.yaml`)

**Pattern**: Fan-out to multiple agents, then fan-in to aggregate

```
        ┌─ Agent A ─┐
Input ──┼─ Agent B ─┼─→ Aggregator → Output
        └─ Agent C ─┘
```

**Use Cases**:
- Parallel data processing
- Multiple perspective analysis
- Distributed task execution

### 3. Conditional Router (`conditional-router.ossa.yaml`)

**Pattern**: Router analyzes input and routes to specialist

```
                ┌─ Code Specialist
Input → Router ─┼─ Data Specialist
                └─ General Assistant
```

**Use Cases**:
- Question routing
- Skill-based delegation
- Dynamic agent selection

## Running Examples

```bash
# Validate examples
ossa validate examples/multi-agent/*.yaml

# Run sequential pipeline
ossa run examples/multi-agent/sequential-pipeline.ossa.yaml

# Run parallel execution
ossa run examples/multi-agent/parallel-execution.ossa.yaml

# Run conditional router
ossa run examples/multi-agent/conditional-router.ossa.yaml
```

## Implementation Notes

These examples show the OSSA manifest structure. Actual multi-agent orchestration requires:
- Runtime that supports tool calling
- Agent registry/discovery mechanism
- Communication protocol between agents
- State management

See [Agent Buildkit](https://github.com/blueflyio/agent-buildkit) for production multi-agent orchestration.
