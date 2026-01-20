# CrewAI Integration Guide

Complete guide for converting OSSA orchestrators to CrewAI crews.

## Quick Start

### 1. Export OSSA Workflow to CrewAI

```bash
ossa export workflow.ossa.yaml --platform crewai --format python --output crew.py
```

### 2. Install Dependencies

```bash
pip install crewai
```

### 3. Run CrewAI Crew

```bash
python crew.py
```

## Conversion Examples

### Multi-Agent Crew

**OSSA Workflow**:
```yaml
apiVersion: ossa/v0.3.6
kind: Workflow
metadata:
  name: code-review-crew
spec:
  steps:
    - name: reviewer
      agent: code-reviewer
      description: Review code changes
    - name: fixer
      agent: code-fixer
      description: Fix identified issues
```

**Generated CrewAI Code**:
```python
from crewai import Agent, Task, Crew

agents = [
    Agent(
        role="code-reviewer",
        goal="Review code changes",
        backstory="Expert code reviewer",
        verbose=True,
    ),
    Agent(
        role="code-fixer",
        goal="Fix identified issues",
        backstory="Expert developer",
        verbose=True,
    ),
]

tasks = [
    Task(description="Review code changes", agent=agents[0]),
    Task(description="Fix identified issues", agent=agents[1]),
]

crew = Crew(agents=agents, tasks=tasks, process="sequential", verbose=True)
result = crew.kickoff()
```

## Agent Mapping

OSSA agents map to CrewAI Agents:
- `spec.role` → `role` and `goal`
- `metadata.description` → `backstory`
- `spec.tools` → Agent tools

## Best Practices

1. **Agent Roles**: Define clear, distinct roles
2. **Task Dependencies**: Use sequential process for dependencies
3. **Verbose Mode**: Enable for debugging
4. **Error Handling**: Add error handling for production
