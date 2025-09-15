# OSSA Shared Libraries

This directory contains reusable libraries and utilities that can be used across the OSSA ecosystem - by the CLI, examples, external projects, and integrations.

## Directory Structure

```
lib/
├── frameworks/          # Framework-specific utilities
│   └── autogen/        # AutoGen framework integration
├── integrations/       # AI framework integrations
│   ├── crewai/        # CrewAI integration utilities
│   └── langchain/     # LangChain integration utilities
├── mcp/               # Model Context Protocol utilities
├── observability/     # Monitoring and metrics
├── services/          # Shared services
│   ├── agent-communication-router.js
│   └── agent-deployment-service.js
├── uadp-discovery.*   # Universal Agent Discovery Protocol
└── validation/        # Shared validation utilities
```

## Library Categories

### Framework Integration (`frameworks/`, `integrations/`)
Utilities for integrating OSSA agents with various AI frameworks:
- **AutoGen**: Conversation patterns and agent coordination
- **CrewAI**: Team-based agent collaboration
- **LangChain**: Tool integration and chain composition

### Protocol Support (`mcp/`, `uadp-discovery.*`)
- **MCP (Model Context Protocol)**: Server implementations and utilities
- **UADP (Universal Agent Discovery Protocol)**: Agent discovery and registration

### Core Services (`services/`)
- **Agent Communication Router**: Inter-agent message routing
- **Agent Deployment Service**: Automated deployment and scaling

### Infrastructure (`observability/`, `validation/`)
- **Observability**: Metrics, tracing, and monitoring utilities
- **Validation**: Schema validation and compliance checking

## Usage

These libraries are designed to be imported and used by:
- OSSA CLI implementation
- Example applications
- External projects building on OSSA
- Framework-specific adapters

```javascript
// Example usage
import { validateAgent } from './lib/validation/agent-validator.js';
import { discoverAgents } from './lib/uadp-discovery.js';
import { routeMessage } from './lib/services/agent-communication-router.js';
```

## Principles

- **Framework Agnostic**: Libraries work across different AI frameworks
- **Reusable**: Can be used by CLI, examples, and external projects
- **Well-Tested**: Each library includes comprehensive tests
- **Standards Compliant**: Follows OSSA v0.1.8 specifications