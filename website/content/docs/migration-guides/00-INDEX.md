---
title: Migration Guides
description: Migrate from existing AI frameworks to OSSA
weight: 1
---

# Migration Guides

Comprehensive guides for migrating from popular AI agent frameworks to OSSA (Open Standard for Scalable Agents).

## Available Guides

### 🤖 Framework Migrations

- **[Anthropic MCP to OSSA](./anthropic-mcp-to-ossa.md)** - Extend MCP servers with OSSA for production features
- **[CrewAI to OSSA](./crewai-to-ossa.md)** - Migrate CrewAI crews to OSSA orchestration
- **[LangChain to OSSA](./langchain-to-ossa.md)** - Convert LangChain agents to OSSA agents
- **[Langflow to OSSA](./langflow-to-ossa.md)** - Transform visual flows into OSSA manifests
- **[OpenAI to OSSA](./openai-to-ossa.md)** - Migrate OpenAI Assistants API to OSSA

### 🔧 Platform Migrations

- **[Drupal ECA to OSSA](./drupal-eca-to-ossa.md)** - Convert Drupal automation rules to OSSA agents

## Migration Overview

All OSSA migrations share common patterns:

### 1. Assessment Phase
- Inventory existing agents/workflows
- Map components to OSSA equivalents
- Identify production requirements

### 2. Design Phase
- Create OSSA agent manifests
- Define capability schemas
- Plan workflow execution

### 3. Implementation Phase
- Implement agent logic
- Add monitoring and policies
- Configure deployment

### 4. Testing Phase
- Unit test capabilities
- Integration test workflows
- Validate performance

### 5. Deployment Phase
- Deploy to target environment
- Configure monitoring
- Run smoke tests

## Why Migrate to OSSA?

### Production Features
- ✅ **Multi-Protocol Support** - HTTP, gRPC, WebSocket, MCP, A2A
- ✅ **Enterprise Monitoring** - Traces, metrics, logs, health checks
- ✅ **Kubernetes Native** - Deploy and scale on K8s
- ✅ **OpenAPI Integration** - REST APIs for all agents
- ✅ **Compliance Ready** - ISO42001, SOC2, GDPR support

### Framework Advantages
- 🔓 **No Vendor Lock-in** - Use any LLM provider
- 🌐 **Multi-Runtime** - Local, Docker, K8s, serverless
- 🔌 **Interoperable** - Works with existing frameworks
- 📊 **Observable** - Built-in monitoring and tracing
- 🔒 **Secure** - Enterprise security and policies

## Getting Help

- **Documentation**: [OSSA Wiki](https://github.com/blueflyio/openstandardagents/wiki/home)
- **Issues**: [GitHub Issues](https://github.com/blueflyio/openstandardagents/issues)
- **Discord**: [OSSA Community](https://github.com/blueflyio/openstandardagents/discussions)

Ready to migrate? Choose your framework above and get started!
