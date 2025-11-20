---
title: "Getting Started"
---

# Getting Started with OSSA

## What is OSSA?

OSSA (Open Standard for Scalable AI Agents) is a specification standard for AI agents, similar to how OpenAPI standardizes REST APIs.

**OSSA is NOT a framework** - it's a standard that defines the contract.

## Installation

```bash
npm install -g @bluefly/openstandardagents
```

## Quick Start

### 1. Initialize a New Agent

```bash
ossa init my-agent --type worker
cd .agents/my-agent
```

### 2. Edit Agent Manifest

Edit `agent.yml`:

```yaml
ossaVersion: "1.0"

agent:
  id: my-agent
  name: My Agent
  version: "1.0.0"
  role: worker
  
  runtime:
    type: docker
    
  capabilities:
    - name: process_data
      description: Process incoming data
      input_schema:
        type: object
        properties:
          data:
            type: string
      output_schema:
        type: object
        properties:
          result:
            type: string
```

### 3. Validate

```bash
ossa validate agent.yml
```

### 4. Deploy

OSSA doesn't dictate deployment. Deploy to YOUR infrastructure:
- Docker / Kubernetes
- AWS / GCP / Azure
- On-premise
- Serverless

## CLI Commands

- `ossa init <name>` - Initialize new agent project
- `ossa validate <path>` - Validate against OSSA 1.0 schema
- `ossa generate <type>` - Generate from template
- `ossa migrate <source>` - Migrate v0.1.9 → 1.0

## Next Steps

- Review [Examples](Examples/)
- Read the [Specification](Specification/ossa-1.0.schema.json)
- Visit the [GitHub Repository](https://github.com/blueflyio/openstandardagents)

## Need More Features?

For production features like GitLab integration, Kubernetes deployment, and monitoring, see:

**[agent-buildkit](https://github.com/blueflyio/openstandardagents)** - Reference implementation with production tooling

