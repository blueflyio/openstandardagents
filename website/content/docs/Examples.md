---
title: "Examples"
---

# OSSA Examples

Complete working examples demonstrating OSSA capabilities, from minimal agents to production-ready ecosystems.

---

## 🚀 Production-Ready: GitLab Kubernetes Agent Ecosystem

**NEW**: Complete production ecosystem with 8 specialized agents for GitLab-integrated Kubernetes deployments.

[**View Full Documentation →**](./gitlab-kubernetes-agents)

**Highlights**:
- 8 OSSA-compliant agents (Security, Performance, Database, Config, Monitoring, Rollback, Cost, Compliance)
- Agent mesh with Istio + mTLS
- Elite DORA metrics (12 deployments/day, 45min lead time, 8.5% CFR)
- $80-145K/month cost savings potential
- SOC2, HIPAA, PCI-DSS, GDPR, FedRAMP compliance

**Location**: [`.gitlab/agents/`](https://gitlab.bluefly.io/llm/openstandardagents/-/tree/main/.gitlab/agents)

---

## OpenAPI Extensions Examples

Complete working examples demonstrating OSSA OpenAPI extensions.

### Example Specifications

### [Minimal Agent API](./examples/openapi-extensions/minimal-agent-api.openapi.yml)

Basic example showing:
- Root-level `x-ossa` and `x-agent` extensions
- Single operation with `x-ossa-capability`, `x-ossa-autonomy`, and `x-ossa-llm`
- Minimal configuration for a simple greeting agent

**Use Case**: Starting point for new OSSA-compliant agents

### [Worker Agent API](./examples/openapi-extensions/worker-agent-api.openapi.yml)

Comprehensive worker agent example showing:
- Full `x-ossa-metadata` with governance and compliance
- All operation-level extensions (capability, autonomy, constraints, tools, llm)
- Parameter extensions (`X-OSSA-Agent-ID`, `X-OSSA-Version`)
- Schema extensions (`x-ossa-capability-schema`)
- Real-world scenario: Kubernetes troubleshooting agent

**Use Case**: Production-ready worker agent with full OSSA compliance

### [Orchestrator Agent API](./examples/openapi-extensions/orchestrator-agent-api.openapi.yml)

Advanced orchestrator agent showing:
- Multi-agent coordination patterns
- Workflow execution capabilities
- Complex input/output schemas
- Orchestrator-specific autonomy and constraints

**Use Case**: Coordinating multiple specialized agents

---

## Validating Examples

All examples can be validated using the OSSA CLI:

```bash
# Validate a specific example
ossa validate examples/openapi-extensions/worker-agent-api.openapi.yml --openapi --verbose

# Or validate all examples
for spec in examples/openapi-extensions/*.openapi.yml; do
  echo "Validating $spec..."
  ossa validate "$spec" --openapi
done
```

---

## Integration with OSSA Manifests

These OpenAPI specs complement OSSA agent manifests (`.ossa.yaml` files):

- **OSSA Manifest** - Declarative agent definition with full configuration
- **OpenAPI Spec with Extensions** - API interface with agent metadata

Together they provide a complete picture of agent behavior and external interfaces.

---

**See Also**: [OpenAPI-Extensions](./OpenAPI-Extensions) · [Quick-Reference](./Quick-Reference)
