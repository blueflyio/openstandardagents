# CrewAI to OSSA Migration Guide

Step-by-step guide for migrating CrewAI crews to OSSA workflows.

## Step 1: Analyze CrewAI Crew

Identify:
- Agents in the crew
- Tasks and their assignments
- Workflow process (sequential/hierarchical)
- Agent roles and goals

## Step 2: Create OSSA Workflow

Use the migrate command:

```bash
ossa migrate crewai_crew.py --from crewai --output workflow.ossa.yaml
```

## Step 3: Map Agents to OSSA Agents

Each CrewAI Agent becomes an OSSA Agent:

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: reviewer-agent
spec:
  role: "Review code changes"
```

## Step 4: Create Workflow

Map CrewAI Tasks to OSSA Workflow Steps:

```yaml
apiVersion: ossa/v0.3.6
kind: Workflow
metadata:
  name: code-review-workflow
spec:
  steps:
    - name: review
      agent: reviewer-agent
      description: "Review code changes"
    - name: fix
      agent: fixer-agent
      description: "Fix identified issues"
```

## Step 5: Deploy

```bash
ossa build workflow.ossa.yaml --platform all
```

## Migration Checklist

- [ ] Map all CrewAI Agents to OSSA Agents
- [ ] Convert CrewAI Tasks to OSSA Workflow Steps
- [ ] Preserve agent roles and goals
- [ ] Add OSSA taxonomy
- [ ] Configure constraints
- [ ] Test on target platforms
