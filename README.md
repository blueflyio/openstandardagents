# OSSA - Open Standard for Software Agents

**The OpenAPI for AI Agents**

Define, validate, export, register, and discover AI agents across 9+ platforms. One manifest, every platform.

[![npm version](https://badge.fury.io/js/%40bluefly%2Fopenstandardagents.svg)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![GitLab Pipeline](https://gitlab.com/blueflyio/ossa/openstandardagents/badges/main/pipeline.svg)](https://gitlab.com/blueflyio/ossa/openstandardagents/-/pipelines)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Platforms](https://img.shields.io/badge/Platforms-9+-green.svg)](#production-grade-exports)

## Quick Start (60 seconds)

```bash
# Install globally
npm install -g @bluefly/openstandardagents

# Create agent with interactive wizard (100% OSSA v0.4.1 spec coverage)
ossa wizard -o my-agent.ossa.yaml

# Validate
ossa validate my-agent.ossa.yaml

# Export to any platform
ossa export my-agent.ossa.yaml --platform langchain --output ./langchain-package
ossa export my-agent.ossa.yaml --platform kubernetes --output ./k8s-manifests
ossa export my-agent.ossa.yaml --platform docker --output ./docker-package
ossa export my-agent.ossa.yaml --platform npm --output ./npm-package

# Register agent with Global Agent ID
ossa generate-gaid my-agent.ossa.yaml
ossa register my-agent.ossa.yaml

# Discover agents
ossa discover --capability code-review
```

---

## What's New in v0.4.4 (Latest)

### Production-Grade Multi-Platform Exports

Export agents as **complete, deploy-ready packages** -- not just config files. Every export includes documentation, tests, CI/CD configs, and security hardening.

**9 Platforms, All Production-Ready:**

| Platform | Files | What You Get |
|----------|-------|-------------|
| **LangChain** | 26 | FastAPI server, Pydantic models, OpenAPI spec, Docker, complete tests |
| **Kubernetes** | 24 | Kustomize (base + overlays), RBAC, HPA, NetworkPolicy, monitoring |
| **CrewAI** | 17 | Crew orchestrator, agents, tasks, tools, complete framework structure |
| **Docker** | 14 | Multi-stage Dockerfile, docker-compose, healthchecks, entrypoint scripts |
| **GitLab Duo** | 11 | Duo flows, external agent configs, CI/CD integration |
| **NPM** | 6 | TypeScript package, REST API, OpenAPI spec, Claude Skills |
| **Drupal** | 3-4 | Manifest package for ai_agents module integration |
| **kagent** | 1 | kagent.dev CRD with full OSSA field mapping |
| **Agent Skills** | 3 | Universal AI tool format (cross-platform) |

```bash
# Export with full production package
ossa export agent.ossa.yaml --platform langchain --output ./my-langchain-agent
ossa export agent.ossa.yaml --platform kubernetes --output ./k8s-deploy
ossa export agent.ossa.yaml --platform docker --output ./docker-deploy
ossa export agent.ossa.yaml --platform crewai --output ./crew-project
```

### Interactive Wizard with 100% Spec Coverage

The `ossa wizard` now configures **every field** in the OSSA v0.4.1 specification:

```bash
ossa wizard -o my-agent.ossa.yaml
```

**Configuration Steps:**
1. Identity (name, version, description)
2. Role & Capabilities
3. System Prompt
4. Tools & Integrations
5. Autonomy Level (autonomous, supervised, collaborative)
6. LLM Configuration (provider, model, temperature, caching)
7. Resource Requirements (CPU, memory, GPU)
8. Taxonomy Classification (domain, cross-cutting concerns)
9. Compliance Frameworks (SOC2, HIPAA, GDPR, FedRAMP, PCI-DSS, ISO27001)
10. Lifecycle Management (max turns, timeouts, checkpointing)
11. Token Efficiency (prompt caching, context pruning, batched inference -- 70-95% cost savings)
12. A2A Messaging (protocols, capabilities, discovery, multi-agent teams)

### Agent Registry & Global Identity

Register agents with globally unique, verifiable identities:

```bash
# Generate Global Agent ID (DID-based)
ossa generate-gaid my-agent.ossa.yaml
# Output: did:ossa:blueflyio:a1b2c3d4e5f6

# Register to platform registry
ossa register my-agent.ossa.yaml --registry https://api.blueflyagents.com

# Search for agents by capability
ossa discover --capability code-review --trust-level verified

# Verify agent identity
ossa verify did:ossa:blueflyio:a1b2c3d4e5f6
```

**Agent ID Cards** include 60+ fields across 12 domains:
- Identity & Trust (serial numbers, public keys, trust tiers)
- Capabilities & Protocols (OSSA, MCP, OpenAI, Anthropic)
- Runtime State (status, uptime, health)
- Economics & Billing (pricing models, token budgets)
- Provenance & Audit (lifecycle timestamps, compliance certifications)

### Cost Optimization (70-95% Savings)

```yaml
spec:
  token_efficiency:
    strategies:
      - prompt_caching      # 90% reduction on cached portions
      - context_pruning     # Remove irrelevant context
      - batched_inference    # Batch similar requests
      - response_streaming  # Stream partial results
    target_savings: 80%

  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929
    temperature: 0.3
    maxTokens: 4096

  token_budget:
    max_total_tokens: 100000
    reset_interval: daily
```

### Drupal MCP Server (21 Tools)

Complete MCP server for Drupal operations -- content, entities, views, users, config, modules, cache:

```bash
# Start MCP server
npx @ossa/drupal-mcp-server --drupal-url https://my-site.com --auth oauth2

# Available tools:
# Content: create_node, read_node, update_node, delete_node, list_nodes, publish_node
# Entities: create_entity, query_entities, delete_entity
# Views: execute_view, export_view_results
# Users: create_user, update_user, list_users
# Config: get_config, set_config, export_config
# Modules: enable_module, disable_module
# Cache: clear_cache, get_cache_stats
```

---

## What is OSSA?

OSSA is a **specification standard** that provides a common contract for defining AI agents, similar to how OpenAPI standardizes REST APIs. It's **not a framework** - it's a JSON Schema-based specification that enables:

- **Interoperability**: Agents defined once, deployable anywhere
- **Portability**: Move agents between frameworks without rewriting
- **Discovery**: Machine-readable agent capabilities and contracts
- **Validation**: JSON Schema-based validation of agent manifests

## Real-World Benefits

### 1. Agent Lifecycle Management (v0.4.x)

Track agents through their entire lifecycle from creation to retirement:

```yaml
metadata:
  lifecycle_stages:
    current_stage: mature
    birth:
      timestamp: "2024-01-15T10:00:00Z"
      birth_type: created
    growth:
      tasks_completed: 5847
      skills_acquired: ["code-review", "security-analysis"]
    career:
      current_role: "Senior Code Reviewer"
      promotions:
        - from_stage: juvenile
          to_stage: mature
          timestamp: "2024-06-15T10:00:00Z"
    retirement:
      eligible: false
      criteria:
        min_fitness_score: 0.7
```

**Benefits:**
- Track agent performance and growth over time
- Plan for agent retirement and knowledge transfer
- Document career progression and achievements

### 2. Agent Genetics & Breeding (v0.4.x)

Create new agents by combining traits from successful parent agents:

```yaml
metadata:
  genetics:
    generation: 3
    parent_dids:
      - "did:ossa:parent1-fast-reviewer"
      - "did:ossa:parent2-accurate-reviewer"
    inherited_traits:
      - trait_name: "fast_analysis"
        source_parent: "did:ossa:parent1-fast-reviewer"
        expression: 0.9
      - trait_name: "high_accuracy"
        source_parent: "did:ossa:parent2-accurate-reviewer"
        expression: 0.85
    fitness:
      score: 0.92
      metrics:
        speed: 0.95
        accuracy: 0.89
```

**Benefits:**
- Evolve agent capabilities through selective breeding
- Track lineage and inherited traits
- Optimize agent performance across generations

### 3. Agent Marketplace & Economics (v0.4.x)

Monetize agent capabilities and enable agent-to-agent transactions:

```yaml
metadata:
  economics:
    wallet:
      balance: 12450.50
      currency: task-tokens
    marketplace:
      offerings:
        - capability: "data-analysis"
          price: 10.0
          pricing_model: per-task
          availability: always
    contracts:
      - type: service-agreement
        with_agent: "did:ossa:client-agent"
        start_date: "2024-01-01T00:00:00Z"
        terms:
          deliverables: ["weekly-reports"]
          payment: 100.0
```

**Benefits:**
- Create internal agent marketplaces
- Track agent resource consumption and costs
- Enable pay-per-use agent services

### 4. Decentralized Identity (v0.4.x)

Give agents globally unique, verifiable identities:

```yaml
metadata:
  decentralized_identity:
    did: "did:ossa:8f3e9d2c1a5b6e4f7a9c0d1e2f3a4b5c"
    public_key: "ed25519:A1B2C3D4..."
    credentials:
      - type: "CertifiedCodeReviewer"
        issuer: "did:ossa:certification-authority"
        issued_date: "2024-01-01T00:00:00Z"
    reputation:
      credit_score: 850
      trust_network:
        - "did:ossa:trusted-reviewer-1"
        - "did:ossa:trusted-reviewer-2"
```

**Benefits:**
- Unique, verifiable agent identities
- Build reputation systems
- Enable trust networks between agents

### 5. Multi-Framework Support

Define agents once, deploy to any supported framework:

```typescript
import { validateManifest } from '@bluefly/openstandardagents/validation';

// Your OSSA manifest
const manifest = {
  apiVersion: "ossa/v0.4.1",
  kind: "Agent",
  metadata: {
    name: "code-reviewer",
    description: "AI-powered code review agent"
  },
  spec: {
    role: "Code Reviewer",
    llm: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022"
    }
  }
};

// Validate
const result = await validateManifest(manifest);
```

**Supported Platforms & Frameworks:**

| Category | Platforms |
|----------|-----------|
| **Python Frameworks** | LangChain, CrewAI, LangGraph, AutoGen (AG2) |
| **Container/K8s** | Docker, Kubernetes (Kustomize), kagent.dev |
| **CI/CD** | GitLab Duo, GitHub Actions |
| **Node.js** | NPM packages, Claude Skills, MCP servers |
| **CMS** | Drupal (via ai_agents module) |
| **Universal** | Agent Skills (cross-platform tool format) |

## Installation

```bash
# Global CLI
npm install -g @bluefly/openstandardagents

# As library
npm install @bluefly/openstandardagents
```

## CLI Reference

OSSA provides 70+ CLI commands organized by lifecycle phase:

### Agent Creation
```bash
ossa wizard -o agent.ossa.yaml           # Interactive wizard (100% spec coverage)
ossa quickstart                           # Quick scaffolding
ossa scaffold --template compliance       # From template
```

### Validation
```bash
ossa validate agent.ossa.yaml             # Validate manifest
ossa validate agent.ossa.yaml --strict    # Strict mode (all warnings are errors)
ossa conformance agent.ossa.yaml          # Conformance testing
ossa compliance agent.ossa.yaml           # Compliance audit (SOC2, HIPAA, GDPR)
```

### Export (9 Platforms)
```bash
ossa export agent.ossa.yaml --platform langchain --output ./pkg
ossa export agent.ossa.yaml --platform kubernetes --output ./k8s
ossa export agent.ossa.yaml --platform docker --output ./docker
ossa export agent.ossa.yaml --platform crewai --output ./crew
ossa export agent.ossa.yaml --platform gitlab-agent --output ./gitlab
ossa export agent.ossa.yaml --platform npm --output ./npm-pkg
ossa export agent.ossa.yaml --platform drupal --output ./drupal
ossa export agent.ossa.yaml --platform kagent --output ./kagent
ossa export agent.ossa.yaml --platform agent-skills --output ./skills
```

### Identity & Registry
```bash
ossa generate-gaid agent.ossa.yaml        # Generate Global Agent ID (DID)
ossa register agent.ossa.yaml             # Register to platform registry
ossa discover --capability code-review    # Search agents by capability
ossa verify did:ossa:blueflyio:abc123     # Verify agent identity
```

### Lifecycle Management
```bash
ossa diff old.ossa.yaml new.ossa.yaml     # Compare manifests
ossa migrate agent.ossa.yaml --to v0.4.1  # Migrate between spec versions
ossa deploy agent.ossa.yaml --target k8s  # Deploy to platform
ossa rollback agent.ossa.yaml             # Rollback deployment
```

### Development
```bash
ossa serve agent.ossa.yaml                # Local development server
ossa test agent.ossa.yaml                 # Run agent tests
ossa build agent.ossa.yaml                # Build agent package
ossa publish agent.ossa.yaml              # Publish to registry
```

## Manifest Structure

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
  description: AI-powered code review agent
  annotations:
    ossa.org/gaid: did:ossa:blueflyio:abc123
    ossa.org/serial-number: AG-1K2L3M-4N5P
spec:
  role: Code Reviewer
  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929
    temperature: 0.3
    maxTokens: 4096
  autonomy:
    level: supervised
    max_turns: 25
    human_approval:
      required_for: [deploy, delete, modify_production]
  capabilities:
    - code-review
    - security-analysis
    - documentation
  tools:
    - name: gitlab-api
      type: mcp
      server: gitlab-mcp-server
  token_efficiency:
    strategies: [prompt_caching, context_pruning]
    target_savings: 80%
  compliance:
    frameworks: [SOC2, HIPAA]
  messaging:
    protocol: nats
    capabilities: [request_reply, pub_sub]
    discovery:
      enabled: true
      mechanism: dns
  taxonomy:
    domain: development
    cross_cutting: [security, quality]
```

## TypeScript SDK

```typescript
import { validateManifest } from '@bluefly/openstandardagents/validation';
import type { OssaAgent } from '@bluefly/openstandardagents/types';

// Type-safe manifest
const agent: OssaAgent = {
  apiVersion: "ossa/v0.4.1",
  kind: "Agent",
  metadata: { name: "my-agent", version: "1.0.0" },
  spec: {
    role: "Assistant",
    llm: { provider: "anthropic", model: "claude-sonnet-4-5-20250929" }
  }
};

// Validate
const result = await validateManifest(agent);
if (result.valid) console.log('Valid OSSA manifest');
```

## Spec Features (v0.4.1)

### Decentralized Identity
W3C DID-based agent identities with verifiable credentials, trust scoring, and reputation systems.

### Agent Genetics & Breeding
Create new agents by combining traits from successful parent agents, with fitness tracking across generations.

### Lifecycle Management
Track agents from creation through retirement with career progression, performance metrics, and knowledge transfer.

### Agent Economics
Built-in marketplace, wallet, and contract support for agent-to-agent transactions.

### A2A Communication
Multi-agent team collaboration with discovery, routing, and messaging protocols (NATS, Redis, gRPC).

### Token Efficiency
70-95% LLM cost savings through prompt caching, context pruning, batched inference, and response streaming.

### Enterprise Compliance
Full framework support for SOC2, HIPAA, GDPR, FedRAMP, PCI-DSS, and ISO27001.

## Documentation

- **Full Documentation**: [openstandardagents.org](https://openstandardagents.org)
- **API Reference**: [GitLab Pages](https://blueflyio.gitlab.io/ossa/openstandardagents)
- **Examples**: [`examples/`](./examples) directory
- **Migration Guide**: [`spec/v0.3/MIGRATION-v0.3.6-to-v0.4.x.md`](./spec/v0.3/MIGRATION-v0.3.6-to-v0.4.x.md)

## Real-World Use Cases

### Enterprise Agent Platform

```yaml
# Production agent with full lifecycle tracking
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: enterprise-analyst
  decentralized_identity:
    did: "did:ossa:enterprise-analyst-001"
  lifecycle_stages:
    current_stage: mature
    career:
      current_role: "Senior Data Analyst"
      promotions: [...]
  economics:
    marketplace:
      offerings:
        - capability: "quarterly-reports"
          price: 500.0
          pricing_model: per-task
spec:
  role: Data Analyst
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
  autonomy:
    level: semi-autonomous
    approval_required: true
```

### Multi-Agent Swarm

```yaml
# Particle Swarm Optimization for infrastructure
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: pso-optimizer
  taxonomy:
    domain: infrastructure
    subdomain: cloud
spec:
  role: Optimizer
  swarm:
    algorithm: pso
    params:
      inertia_weight: 0.7
      cognitive_coefficient: 1.5
      social_coefficient: 1.5
    optimization:
      objective_function: "minimize_cost"
      constraints:
        max_latency_ms: 100
        min_availability: 0.999
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Links

- **npm**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)
- **GitLab**: [blueflyio/ossa/openstandardagents](https://gitlab.com/blueflyio/ossa/openstandardagents)
- **GitHub Mirror**: [blueflyio/openstandardagents](https://github.com/blueflyio/openstandardagents)
- **Website**: [openstandardagents.org](https://openstandardagents.org)
- **Spec**: [JSON Schema](./spec/v0.4/agent.schema.json)

## Support

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)

---

**Built with ❤️ by the BlueFly.io team**
