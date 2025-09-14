# OSSA - Open Standards Scalable Agents

[![Version](https://img.shields.io/badge/version-0.1.9-blue.svg)](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1.0-orange.svg)](src/api/)
[![NPM Package](https://img.shields.io/badge/npm-@bluefly/open--standards--scalable--agents-red.svg)](https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents)

## Pure Specification Standard for AI Agent Interoperability

**OSSA** is an open, vendor-neutral specification that standardizes how AI agents discover, communicate, and orchestrate with each other. This repository contains the **specification only** - no implementation code.

### 📦 What This Package Contains

This is a **pure specification package** containing:

- **OpenAPI Specifications** (v3.1.0)
  - `acdl-specification.yml` - Agent Capability Description Language
  - `orchestration.openapi.yml` - Multi-agent orchestration API
  - `specification.openapi.yml` - Core OSSA specification engine
  - `voice-agent-specification.yml` - Voice agent integration spec

- **JSON Schemas**
  - `agent-manifest.schema.json` - Agent manifest validation
  - `workflow.schema.json` - Workflow definition validation

- **TypeScript Type Definitions**
  - Complete type definitions for all OSSA components
  - Auto-generated from OpenAPI specifications

- **Specification Validator**
  - Runtime validation for OSSA compliance
  - Conformance level checking (Bronze/Silver/Gold)

### 🚀 Quick Start

```bash
# Install the specification package
npm install @bluefly/open-standards-scalable-agents

# Validate an agent manifest
npx ossa-validate agent-manifest.yml

# Generate TypeScript types from specs
npm run api:generate
```

### 📖 Using the Specification

```typescript
import { 
  OSSA_VERSION,
  SPECIFICATION_FILES,
  SpecificationValidator 
} from '@bluefly/open-standards-scalable-agents';

// Validate an agent manifest
const validator = new SpecificationValidator();
const result = await validator.validate(agentManifest);

// Access specification metadata
console.log(`OSSA Version: ${OSSA_VERSION}`); // "0.1.9"
```

### 🔧 Implementation

For the reference implementation of OSSA, see:
- **Repository**: [agent-buildkit](https://gitlab.bluefly.io/llm/agent_buildkit)
- **Examples**: [agent-buildkit/examples](https://gitlab.bluefly.io/llm/agent_buildkit/-/tree/main/examples)

### 📋 Specification Components

#### Agent Manifest (ACDL)
Defines agent capabilities using the Agent Capability Description Language:
```yaml
apiVersion: @bluefly/ossa/v0.1.9
kind: Agent
metadata:
  name: example-agent
  version: 1.0.0
spec:
  agentType: worker
  capabilities:
    domains: ["nlp", "data"]
    operations:
      - name: process_text
        inputs: [text]
        outputs: [processed_text]
```

#### Workflow Definition
Orchestrates multi-agent workflows with the 360° feedback loop:
```yaml
apiVersion: @bluefly/ossa/v0.1.9
kind: Workflow
metadata:
  name: example-workflow
spec:
  phases:
    enabled: ["plan", "execute", "review", "judge", "learn", "govern"]
  tasks:
    - id: task-1
      type: processing
      agent:
        type: worker
        capabilities: ["nlp"]
```

### 🏢 Enterprise Adoption

OSSA is designed for enterprise-grade AI agent systems:

- **Standardization**: Common format across all agent frameworks
- **Interoperability**: Agents from different vendors work together
- **Governance**: Built-in compliance and audit capabilities
- **Scalability**: From single agents to thousands

### 📝 Specification Version

- **Current Version**: 0.1.9
- **API Version String**: `@bluefly/ossa/v0.1.9`
- **OpenAPI Version**: 3.1.0
- **JSON Schema Version**: Draft-07

### 🔗 Resources

- **Repository**: [GitLab - openapi-ai-agents-standard](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard)
- **Issues**: [Issue Tracker](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues)
- **NPM Package**: [@bluefly/open-standards-scalable-agents](https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents)
- **Implementation**: [agent-buildkit](https://gitlab.bluefly.io/llm/agent_buildkit)

### 🤝 Contributing

We welcome contributions to the OSSA specification:

1. Fork the repository
2. Create a feature branch
3. Make your changes to the specification files
4. Ensure all validations pass: `npm run api:validate`
5. Submit a merge request

### 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

### ⚠️ Important Notes

- This package contains **specifications only** - no runtime implementation
- The NPM package is not yet published (coming soon)
- For implementation code, see the [agent-buildkit](https://gitlab.bluefly.io/llm/agent_buildkit) repository
- API version format is `@bluefly/ossa/v0.1.9` (not a URL)

---

**OSSA** - Enabling AI agents to work together, regardless of implementation.