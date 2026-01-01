---
title: "Agent Lifecycle"
description: "OSSA agent lifecycle specification - the 5-phase execution model for agent initialization, planning, action, reflection, and termination"
---

# Agent Lifecycle

All OSSA agents follow a standardized 5-phase lifecycle that provides predictable execution behavior and clear state transitions.

## Overview

The lifecycle defines how agents move through discrete phases from initialization to termination:

```
init -> plan -> act -> reflect -> terminate
                 ^         |
                 |         v
                 +---------+
               (iteration loop)
```

## Lifecycle Phases

### 1. Init Phase

**Purpose**: Prepare the agent for execution

The init phase handles all setup required before the agent can begin processing tasks.

**Activities**:
- Load configuration and credentials
- Establish connections to tools and services
- Validate input parameters
- Set up logging and telemetry

**Configuration**:

```yaml
apiVersion: ossa/v0.3.0
kind: RuntimeSpec

lifecycle:
  phases:
    init:
      timeout_seconds: 30  # Default: 30s
```

**Success Signal**: `ready`

**Example Implementation**:

```python
async def init_phase(agent: Agent) -> Signal:
    # Load configuration
    config = await load_config(agent.manifest_path)
    
    # Validate credentials
    await validate_credentials(config.credentials)
    
    # Connect to required services
    await agent.connect_tools(config.tools)
    
    # Set up telemetry
    await init_telemetry(agent.id)
    
    return Signal(type="ready", payload={
        "capabilities": agent.capabilities,
        "version": agent.version
    })
```

### 2. Plan Phase

**Purpose**: Analyze task and generate execution strategy

The plan phase determines how the agent will accomplish its goal.

**Activities**:
- Analyze the task/goal
- Retrieve relevant context from memory
- Generate execution plan
- Determine required tools and delegations

**Configuration**:

```yaml
lifecycle:
  phases:
    plan:
      timeout_seconds: 60  # Default: 60s
```

**Success Signal**: `plan_ready`

**Example Implementation**:

```python
async def plan_phase(agent: Agent, task: Task) -> Signal:
    # Retrieve relevant context
    context = await agent.memory.search(task.query)
    
    # Generate plan using LLM
    plan = await agent.llm.generate_plan(
        task=task,
        context=context,
        tools=agent.available_tools
    )
    
    # Store plan in working memory
    agent.working_memory.set("current_plan", plan)
    
    return Signal(type="plan_ready", payload={
        "steps": len(plan.steps),
        "tools_required": plan.tools
    })
```

### 3. Act Phase

**Purpose**: Execute the planned actions

The act phase is where the agent performs its primary work.

**Activities**:
- Execute planned steps
- Make tool calls
- Delegate to sub-agents
- Produce artifacts/outputs

**Configuration**:

```yaml
lifecycle:
  phases:
    act:
      timeout_seconds: 300  # Default: 300s (5 minutes)
```

**Success Signal**: `action_complete`

**Example Implementation**:

```python
async def act_phase(agent: Agent) -> Signal:
    plan = agent.working_memory.get("current_plan")
    results = []
    
    for step in plan.steps:
        if step.type == "tool_call":
            result = await agent.execute_tool(step.tool, step.params)
        elif step.type == "delegation":
            result = await agent.delegate(step.target_agent, step.task)
        else:
            result = await agent.llm.execute(step)
        
        results.append(result)
    
    agent.working_memory.set("action_results", results)
    
    return Signal(type="action_complete", payload={
        "steps_executed": len(results),
        "success": all(r.success for r in results)
    })
```

### 4. Reflect Phase

**Purpose**: Evaluate results and decide next steps

The reflect phase assesses outcomes and determines whether to iterate or terminate.

**Activities**:
- Evaluate action results
- Update memory with learnings
- Determine if goal is achieved
- Decide on iteration or termination

**Configuration**:

```yaml
lifecycle:
  phases:
    reflect:
      timeout_seconds: 30  # Default: 30s
```

**Success Signal**: `reflection_complete`

**Decision Outcomes**:
- `iteration_needed` - Return to plan phase
- `goal_achieved` - Proceed to terminate phase

**Example Implementation**:

```python
async def reflect_phase(agent: Agent, task: Task) -> Signal:
    results = agent.working_memory.get("action_results")
    
    # Evaluate results
    evaluation = await agent.llm.evaluate(
        task=task,
        results=results,
        success_criteria=task.success_criteria
    )
    
    # Update long-term memory with learnings
    await agent.memory.store({
        "task_id": task.id,
        "outcome": evaluation,
        "learnings": evaluation.insights
    })
    
    if evaluation.goal_achieved:
        return Signal(type="reflection_complete", payload={
            "decision": "goal_achieved",
            "confidence": evaluation.confidence
        })
    else:
        return Signal(type="reflection_complete", payload={
            "decision": "iteration_needed",
            "reason": evaluation.gap_analysis
        })
```

### 5. Terminate Phase

**Purpose**: Clean up and finalize

The terminate phase handles proper shutdown and resource cleanup.

**Activities**:
- Finalize outputs
- Persist state to long-term memory
- Release resources
- Emit completion telemetry

**Configuration**:

```yaml
lifecycle:
  phases:
    terminate:
      timeout_seconds: 15  # Default: 15s
```

**Success Signal**: `terminated`

**Example Implementation**:

```python
async def terminate_phase(agent: Agent, result: TaskResult) -> Signal:
    # Persist final state
    await agent.memory.checkpoint()
    
    # Release resources
    await agent.release_tools()
    await agent.close_connections()
    
    # Emit telemetry
    await emit_completion_telemetry(
        agent_id=agent.id,
        duration=agent.execution_time,
        result=result
    )
    
    return Signal(type="terminated", payload={
        "status": result.status,
        "outputs": result.outputs
    })
```

## Lifecycle Transitions

State transitions follow strict rules based on signals:

| From | To | Condition |
|------|-----|-----------|
| `init` | `plan` | `ready` signal received |
| `plan` | `act` | `plan_ready` signal received |
| `act` | `reflect` | `action_complete` signal received |
| `reflect` | `act` | `iteration_needed` decision |
| `reflect` | `terminate` | `goal_achieved` decision |
| **any** | `terminate` | `halt_signal` or `error_unrecoverable` |

### State Diagram

```
                    +------------+
                    |    INIT    |
                    +-----+------+
                          | ready
                          v
                    +-----+------+
            +------>|    PLAN    |
            |       +-----+------+
            |             | plan_ready
            |             v
            |       +-----+------+
            |       |    ACT     |
            |       +-----+------+
            |             | action_complete
            |             v
            |       +-----+------+
            +-------|  REFLECT   |
     iteration_needed +----+------+
                          | goal_achieved
                          v
                    +-----+------+
                    | TERMINATE  |
                    +------------+
```

## Iteration Control

### Max Iterations

Prevent infinite loops with iteration limits:

```yaml
lifecycle:
  max_iterations: 10  # Default: 10
  total_timeout_seconds: 3600  # Default: 1 hour
```

### Iteration Behavior

```python
class LifecycleController:
    def __init__(self, max_iterations: int = 10):
        self.max_iterations = max_iterations
        self.current_iteration = 0
    
    async def run(self, agent: Agent, task: Task):
        await self.init(agent)
        
        while self.current_iteration < self.max_iterations:
            await self.plan(agent, task)
            await self.act(agent)
            
            decision = await self.reflect(agent, task)
            
            if decision == "goal_achieved":
                break
            
            self.current_iteration += 1
        
        return await self.terminate(agent)
```

## Error Handling

### Recoverable Errors

Errors that allow continuation:

```yaml
control_signals:
  error:
    payload:
      error_code: "TOOL_ERROR"
      recoverable: true
      retry_count: 3
```

### Unrecoverable Errors

Errors that trigger immediate termination:

```yaml
control_signals:
  error:
    payload:
      error_code: "INIT_FAILED"
      recoverable: false
      message: "Failed to load credentials"
```

### Error Codes

| Code | Phase | Description |
|------|-------|-------------|
| `INIT_FAILED` | init | Initialization error |
| `PLAN_FAILED` | plan | Planning error |
| `ACTION_FAILED` | act | Action execution error |
| `TOOL_ERROR` | act | Tool invocation error |
| `DELEGATION_ERROR` | act | Sub-agent delegation error |
| `REFLECTION_ERROR` | reflect | Reflection evaluation error |
| `TIMEOUT` | any | Phase timeout exceeded |
| `RESOURCE_EXHAUSTED` | any | Resource limits exceeded |

## Complete Configuration Example

```yaml
apiVersion: ossa/v0.3.0
kind: RuntimeSpec

lifecycle:
  phases:
    init:
      timeout_seconds: 30
      retry_on_failure: true
      max_retries: 3
    plan:
      timeout_seconds: 60
    act:
      timeout_seconds: 300
    reflect:
      timeout_seconds: 30
    terminate:
      timeout_seconds: 15
      force_after_seconds: 30
  
  max_iterations: 10
  total_timeout_seconds: 3600
  
  error_handling:
    on_timeout: terminate
    on_resource_exhausted: terminate
    on_tool_error: retry  # retry, skip, terminate
    max_tool_retries: 3
```

## Best Practices

### 1. Set Appropriate Timeouts

Match timeouts to expected operation durations:

```yaml
# Fast API agent
phases:
  act:
    timeout_seconds: 30

# Complex analysis agent
phases:
  act:
    timeout_seconds: 600
```

### 2. Handle Iteration Limits

Always check iteration count in reflect phase:

```python
if self.current_iteration >= self.max_iterations - 1:
    # Force completion or raise error
    return "goal_achieved"  # or raise MaxIterationsError
```

### 3. Clean Up Resources

Always release resources in terminate phase, even on error:

```python
async def terminate_phase(agent: Agent):
    try:
        await agent.finalize()
    finally:
        await agent.release_all_resources()
```

### 4. Emit Telemetry

Track lifecycle events for observability:

```python
@lifecycle_event("phase_started")
async def on_phase_start(phase: str, agent_id: str):
    emit_metric(f"agent.lifecycle.{phase}.started", 1)

@lifecycle_event("phase_completed")
async def on_phase_complete(phase: str, duration_ms: int):
    emit_metric(f"agent.lifecycle.{phase}.duration", duration_ms)
```

## Related Documentation

- [Control Signals](/docs/runtime/control-signals) - Signal types and communication
- [Runtime Overview](/docs/runtime/) - Complete runtime specification
- [Execution Flow](/docs/architecture/execution-flow) - Request flow visualization

---

**Specification Version**: v0.3.2
**Last Updated**: 2024-01
