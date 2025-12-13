---
title: "CrewAI to OSSA"
---

# CrewAI to OSSA Migration Guide

## Overview

This guide helps you migrate from **CrewAI** multi-agent orchestration framework to **OSSA** (Open Standard for Scalable Agents).

### Why Migrate?

- **Vendor Independence**: Not tied to specific LLM providers
- **Kubernetes Native**: Deploy agents on K8s with built-in scaling
- **OpenAPI Integration**: RESTful APIs for all agent interactions
- **Production Monitoring**: Built-in observability with OpenTelemetry
- **Multi-Runtime Support**: Docker, K8s, serverless, edge

### Migration Complexity: Medium-High
- **Time**: 4-8 hours per crew
- **Effort**: Moderate refactoring required
- **Risk**: Low (parallel operation possible)

## Conceptual Mapping

| CrewAI Concept | OSSA Equivalent | Notes |
|----------------|-----------------|-------|
| **Crew** | OSSA Orchestrator Agent | Manages workflow coordination |
| **Agent** | OSSA Worker Agent | Individual task executor |
| **Task** | OSSA Capability | Executable function with schema |
| **Process** | Workflow Type | Sequential, parallel, hierarchical |
| **Tool** | Capability Implementation | Business logic + API integration |
| **Delegation** | Agent Dependencies | Explicit agent-to-agent calls |
| **Memory** | State Management | Redis/PostgreSQL backed |
| **Context** | Input/Output Schemas | Typed data contracts |

## Migration Strategy

### Phase 1: Analysis (1-2 hours)
1. Inventory all crews and agents
2. Map tasks to capabilities
3. Identify delegation patterns
4. Document tool dependencies

### Phase 2: Design (2-3 hours)
1. Create orchestrator manifest
2. Define worker agent manifests
3. Design capability schemas
4. Plan workflow execution

### Phase 3: Implementation (3-4 hours)
1. Implement orchestrator logic
2. Migrate agent implementations
3. Convert tools to capabilities
4. Set up state management

### Phase 4: Testing (1-2 hours)
1. Unit test capabilities
2. Integration test workflows
3. Load test orchestration
4. Validate delegation

### Phase 5: Deployment (1 hour)
1. Build Docker images
2. Deploy to Kubernetes
3. Configure monitoring
4. Run smoke tests

## Example 1: Simple Crew (Research + Writing)

### Before: CrewAI

\`\`\`python
from crewai import Agent, Task, Crew, Process

# Define agents
researcher = Agent(
    role='Researcher',
    goal='Research AI trends',
    backstory='Expert AI researcher',
    tools=[web_search, pdf_reader]
)

writer = Agent(
    role='Writer',
    goal='Write blog posts',
    backstory='Technical writer',
    tools=[grammar_check]
)

# Define tasks
research_task = Task(
    description='Research AI agents in 2024',
    agent=researcher
)

write_task = Task(
    description='Write blog post from research',
    agent=writer,
    context=[research_task]
)

# Create crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential
)

result = crew.kickoff()
\`\`\`

### After: OSSA

**Orchestrator Agent** (`orchestrator.ossa.yaml`):

\`\`\`yaml
ossaVersion: "0.2.9"
agent:
  id: research-writing-orchestrator
  name: Research & Writing Orchestrator
  version: 1.0.0
  role: orchestration
  runtime:
    type: k8s
    image: ghcr.io/ossa/orchestrator:latest
  workflow:
    type: sequential
    steps:
      - capability: coordinate_research
        agent_id: ai-researcher
        timeout: 300s
      - capability: coordinate_writing
        agent_id: technical-writer
        dependencies: [coordinate_research]
        context_from: coordinate_research
  capabilities:
    - name: coordinate_research
      description: "Coordinate AI research workflow"
      input_schema:
        type: object
        properties:
          topic:
            type: string
      output_schema:
        type: object
        properties:
          findings:
            type: string
          sources:
            type: array
            items:
              type: string
    - name: coordinate_writing
      description: "Coordinate blog writing workflow"
      input_schema:
        type: object
        properties:
          research:
            type: object
      output_schema:
        type: object
        properties:
          article:
            type: string
          word_count:
            type: integer
\`\`\`

**Researcher Agent** (`researcher.ossa.yaml`):

\`\`\`yaml
ossaVersion: "0.2.9"
agent:
  id: ai-researcher
  name: AI Research Agent
  version: 1.0.0
  role: worker
  runtime:
    type: k8s
    image: ghcr.io/ossa/researcher:latest
  llm:
    provider: openai
    model: gpt-4-turbo
  capabilities:
    - name: research_topic
      description: "Research AI trends using web search"
      tools: [web_search, pdf_reader]
      input_schema:
        type: object
        properties:
          topic:
            type: string
      output_schema:
        type: object
        properties:
          findings:
            type: string
          sources:
            type: array
\`\`\`

**Writer Agent** (`writer.ossa.yaml`):

\`\`\`yaml
ossaVersion: "0.2.9"
agent:
  id: technical-writer
  name: Technical Writer Agent
  version: 1.0.0
  role: worker
  runtime:
    type: k8s
    image: ghcr.io/ossa/writer:latest
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
  capabilities:
    - name: write_article
      description: "Write blog post from research"
      tools: [grammar_check]
      input_schema:
        type: object
        properties:
          research:
            type: object
      output_schema:
        type: object
        properties:
          article:
            type: string
\`\`\`

## Validation

\`\`\`bash
# Validate all manifests
ossa validate orchestrator.ossa.yaml
ossa validate researcher.ossa.yaml
ossa validate writer.ossa.yaml

# Deploy to Kubernetes
kubectl apply -f orchestrator.yaml
kubectl apply -f researcher.yaml
kubectl apply -f writer.yaml

# Test workflow
curl -X POST http://orchestrator/execute \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Agents in 2024"}'
\`\`\`

## FAQ

**Q: How do I handle CrewAI's memory feature?**
A: Use OSSA's state management with Redis/PostgreSQL backend.

**Q: What about custom tools?**
A: Wrap them as OSSA capabilities with proper schemas.

**Q: Can I mix CrewAI and OSSA during migration?**
A: Yes! Use OSSA agents as CrewAI tools during transition.

**Q: How does delegation work in OSSA?**
A: Use explicit agent dependencies in orchestrator manifest.

**Q: What about hierarchical processes?**
A: Use OSSA's hierarchical workflow type with manager-worker pattern.

## Next Steps

- [OSSA Orchestration Patterns](/Specification/Orchestration)
- [Multi-Agent Examples](/Examples/Multi-Agent)
- [Kubernetes Deployment](/Deployment/Kubernetes)
