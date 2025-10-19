# Getting Started with OSSA

Welcome to OSSA (Open Standards for Scalable Agents)! This guide will help you get up and running with OSSA in just a few minutes.

## Prerequisites

- **Node.js 18+** - For CLI tools and development
- **Docker** - For containerized agent deployment
- **Kubernetes** (optional) - For production orchestration
- **Git** - For source code management

## Quick Start

### 1. Install OSSA CLI

```bash
# Install globally via npm
npm install -g @ossa/cli

# Verify installation
ossa --version
```

### 2. Initialize Your First Project

```bash
# Create a new OSSA project
ossa init my-first-agent
cd my-first-agent

# Install dependencies
npm install
```

### 3. Create Your First Agent

```bash
# Generate a basic agent
ossa generate agent --name greeting-agent --type worker

# The generated agent structure:
# src/
#   agents/
#     greeting-agent/
#       agent.yaml       # Agent configuration
#       index.ts         # Agent implementation
#       package.json     # Dependencies
```

### 4. Configure Agent Specification

Edit `src/agents/greeting-agent/agent.yaml`:

```yaml
apiVersion: ossa.dev/v1
kind: Agent
metadata:
  name: greeting-agent
  namespace: default
spec:
  capabilities:
    - text-generation
    - conversation
  frameworks:
    - general
  runtime:
    image: node:18-alpine
    entrypoint: ["node", "index.js"]
    resources:
      cpu: "100m"
      memory: "128Mi"
  config:
    model: "gpt-3.5-turbo"
    maxTokens: 150
    temperature: 0.7
```

### 5. Implement Agent Logic

Edit `src/agents/greeting-agent/index.ts`:

```typescript
import { OSSAAgent, AgentContext, AgentResponse } from '@ossa/sdk';

export default class GreetingAgent extends OSSAAgent {
  async handle(context: AgentContext): Promise<AgentResponse> {
    const { input, metadata } = context;
    
    // Generate a personalized greeting
    const greeting = `Hello ${input.name || 'there'}! Welcome to OSSA. 
                     How can I assist you today?`;
    
    return {
      output: {
        message: greeting,
        timestamp: new Date().toISOString(),
        agentId: this.config.metadata.name
      },
      metadata: {
        processingTime: Date.now() - metadata.startTime,
        capabilities: this.config.spec.capabilities
      }
    };
  }
}
```

### 6. Test Your Agent Locally

```bash
# Start local development server
ossa dev

# Test the agent
curl -X POST http://localhost:3000/agents/greeting-agent \
  -H "Content-Type: application/json" \
  -d '{"name": "Developer"}'
```

### 7. Deploy to Kubernetes

```bash
# Build and deploy
ossa build
ossa deploy --environment production

# Check deployment status
ossa status
```

## Next Steps

### Learn More
- **[Agent Development Guide](../development/)** - Comprehensive agent development
- **[API Reference](../api/)** - Complete API documentation
- **[Best Practices](../development/best-practices.md)** - Production-ready patterns

### Enterprise Features
- **[Compliance Configuration](../compliance/)** - FDA, SOX, HIPAA, FedRAMP setup
- **[Security Hardening](../security/)** - Production security guidelines
- **[Monitoring & Observability](../monitoring/)** - Production monitoring setup

### Examples
- **[Chat Agent](../examples/chat-agent.md)** - Conversational AI agent
- **[Data Processing](../examples/data-processor.md)** - Batch data processing agent
- **[API Integration](../examples/api-integration.md)** - External API integration
- **[Multi-Agent Workflow](../examples/multi-agent.md)** - Coordinated agent systems

## Common Issues

### Port Already in Use
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Permission Denied
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

### Docker Issues
```bash
# Ensure Docker is running
docker ps

# Reset Docker if needed
docker system prune -f
```

## Get Help

- **[Documentation](../overview/)** - Complete OSSA documentation
- **[GitLab Issues](https://app-4001.cloud.bluefly.io/llm/openapi-ai-agents-standard/-/issues)** - Bug reports and feature requests
- **[Community Support](../community/)** - Community forums and chat

---

Ready to build your first production agent? Check out our [comprehensive examples](../examples/) or dive into the [complete specification](../specification/).