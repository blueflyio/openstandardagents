# OSSA - Open Standard for Software Agents

**The OpenAPI for AI Agents**

A specification standard (not a framework) that defines contracts and metadata for production agent systems.

[![npm version](https://badge.fury.io/js/%40bluefly%2Fopenstandardagents.svg)](https://www.npmjs.com/package/@bluefly/openstandardagents)
[![GitLab Pipeline](https://gitlab.com/blueflyio/ossa/openstandardagents/badges/main/pipeline.svg)](https://gitlab.com/blueflyio/ossa/openstandardagents/-/pipelines)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is OSSA?

OSSA is a **specification standard** that provides a common contract for defining AI agents, similar to how OpenAPI standardizes REST APIs. It's **not a framework** - it's a JSON Schema-based specification that enables:

- **Interoperability**: Agents defined once, deployable anywhere
- **Portability**: Move agents between frameworks without rewriting
- **Discovery**: Machine-readable agent capabilities and contracts
- **Validation**: JSON Schema-based validation of agent manifests

## Real-World Benefits

### 1. Agent Lifecycle Management (NEW in v0.3.6)

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

### 2. Agent Genetics & Breeding (NEW in v0.3.6)

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

### 3. Agent Marketplace & Economics (NEW in v0.3.6)

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

### 4. Decentralized Identity (NEW in v0.3.6)

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
  apiVersion: "ossa/v0.3.6",
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

**Supported Frameworks:**
- LangChain
- LangGraph
- CrewAI
- AutoGen (AG2)
- Semantic Kernel
- Custom implementations

## Installation

```bash
npm install @bluefly/openstandardagents
```

## Quick Start

### 1. Define Your Agent

Create an `agent.ossa.yaml` file:

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: my-agent
  description: My first OSSA agent
spec:
  role: Assistant
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.7
  capabilities:
    - code-review
    - documentation
```

### 2. Validate Your Manifest

```typescript
import { OSSAValidator } from '@bluefly/openstandardagents/validation';

const validator = new OSSAValidator();
const result = validator.validateFile('./agent.ossa.yaml');

if (result.valid) {
  console.log('✅ Valid OSSA manifest');
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

### 3. Use Type-Safe Manifests

```typescript
import type { OssaAgent } from '@bluefly/openstandardagents/types';

const agent: OssaAgent = {
  apiVersion: "ossa/v0.3.6",
  kind: "Agent",
  metadata: {
    name: "code-reviewer"
  },
  spec: {
    role: "Code Reviewer"
  }
};
```

## What's New in v0.3.6

### New Features

1. **Decentralized Identity** - W3C DID-based agent identities with verifiable credentials
2. **Agent Genetics** - Breed agents by combining traits from successful parents
3. **Lifecycle Management** - Track agents from birth through retirement with career progression
4. **Agent Economics** - Built-in marketplace, wallet, and smart contract support
5. **Team Membership** - Multi-agent team collaboration metadata
6. **Taxonomy Integration** - Hierarchical classification across 9 primary domains

### Schema Enhancements

- **Schema Size**: 419KB → 441KB (+5%)
- **New Definitions**: 5 major new types
- **Example Manifests**: 4 comprehensive examples showcasing new features
- **Validation Tools**: New linter and validator with 7 rule categories

## Documentation

- **Full Documentation**: [openstandardagents.org](https://openstandardagents.org)
- **API Reference**: [GitLab Pages](https://blueflyio.gitlab.io/ossa/openstandardagents)
- **Examples**: [`examples/`](./examples) directory
- **Migration Guide**: [`spec/v0.3/MIGRATION-v0.3.5-to-v0.3.6.md`](./spec/v0.3/MIGRATION-v0.3.5-to-v0.3.6.md)

## Real-World Use Cases

### Enterprise Agent Platform

```yaml
# Production agent with full lifecycle tracking
apiVersion: ossa/v0.3.6
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
apiVersion: ossa/v0.3.6
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
- **Spec**: [JSON Schema](./spec/v0.3/ossa-0.3.6.schema.json)

## Support

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
- **Email**: support@openstandardagents.org

---

**Built with ❤️ by the BlueFly.io team**
