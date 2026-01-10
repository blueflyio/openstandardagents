# OSSA Technical Overview

**Open Standard for Scalable Agents** | Spec Version: 0.3.3 | Schema: JSON Schema Draft-07

---

## What It Is

OSSA is a **specification standard** (like OpenAPI for REST APIs). It defines agent manifests - NOT runtime behavior.

```yaml
apiVersion: ossa/v0.3.3
kind: Agent | Task | Workflow
metadata:
  name: string
  version: semver
spec:
  # Kind-specific properties
```

**Three Kinds:**
| Kind | Purpose | Tokens | Use Case |
|------|---------|--------|----------|
| `Agent` | LLM reasoning loops | Yes | Code review, analysis, decisions |
| `Task` | Deterministic steps | No | Data transform, API calls, scripts |
| `Workflow` | Composition | Mixed | CI pipelines, multi-step processes |

---

## Governance Model (The Differentiator)

### Access Tiers
```
Tier 1 (Read)     → Analyzers, scanners         → Can read, cannot modify
Tier 2 (Write)    → Generators, scaffolders     → Sandboxed writes only
Tier 3 (Elevated) → Deployers, operators        → Production writes + approval
Tier 4 (Policy)   → Governors                   → Define rules, CANNOT execute
```

### Separation of Duties
```yaml
spec:
  separation:
    role: critic
    conflicts_with: [executor, deployer]  # Cannot also execute
    can_delegate_to: [tier_1, tier_2]     # Privilege boundaries
```

**Rule:** Tier 4 agents define policy but delegate execution to Tier 3. No self-approval.

### Taxonomy
```yaml
spec:
  taxonomy:
    domain: security | infrastructure | development | data | ...
    type: analyzer | worker | operator | supervisor | orchestrator | governor | specialist | critic
    concerns: [compliance, observability, cost_optimization, ...]
```

---

## Agent Identity (GitLab Integration)

Agents are first-class citizens with service accounts:

```yaml
spec:
  identity:
    provider: gitlab
    service_account:
      id: ${GITLAB_SERVICE_ACCOUNT_ID}
      username: bot-code-review
      email: bot-code-review@company.com
      roles: [developer, maintainer]
    dora_tracking:
      enabled: true
      metrics: [deployment_frequency, lead_time, change_failure_rate, mttr]
```

**Result:** Agent commits appear in git history, agents can be assigned issues, DORA metrics track agent performance like developer performance.

---

## Required Spec Properties by Kind

### Agent (LLM-based)
```yaml
spec:
  role: "System prompt"              # OR prompts.system.template
  llm:
    provider: anthropic | openai | ...
    model: claude-sonnet-4-20250514
    temperature: 0.1
  tools: [...]                       # Available tools/functions
  safety:
    human_in_loop: {required: true}
    guardrails: [...]
  identity: {...}                    # Service account
  access: {tier: tier_2, ...}        # Permission level
  observability: {...}               # OpenTelemetry config
```

### Task (Deterministic)
```yaml
spec:
  inputs: [{name: string, type: string, required: bool}]
  outputs: [{name: string, type: string}]
  steps:
    - name: step_1
      action: transform | validate | call | ...
      config: {...}
  error_handling: {strategy: retry | fail | fallback}
```

### Workflow (Composition)
```yaml
spec:
  triggers: [schedule, webhook, event]
  steps:
    - ref: ./tasks/validate.ossa.yaml
    - ref: ./agents/review.ossa.yaml
      condition: "inputs.needs_review == true"
  parallel: [step_a, step_b]
  outputs: {...}
```

---

## Validation

```bash
# Install
npm install -g @bluefly/openstandardagents

# Validate manifest
ossa validate agent.ossa.yaml

# Check conformance tier
ossa conformance agent.ossa.yaml --tier standard

# Export to framework
ossa export agent.ossa.yaml --to cursor | langchain | openai
```

Schema location: `spec/v0.3.3/ossa-0.3.3.schema.json`

---

## A2A Messaging Protocol

Agent-to-agent communication via channels:

```yaml
spec:
  messaging:
    publishes:
      - channel: security.vulnerability.found
        schema: {type: object, properties: {...}}
    subscribes:
      - channel: ci.pipeline.complete
        handler: onPipelineComplete
    commands:
      - name: scan_repository
        inputSchema: {...}
        timeoutSeconds: 300
```

Channel format: `domain.entity.event` (e.g., `infrastructure.deployment.complete`)

---

## Compliance Mapping

| Framework | OSSA Feature |
|-----------|--------------|
| SOC2 | `separation.role` + `access.tier` + `observability.tracing` |
| FedRAMP | `access.requires_approval` + `compliance.audit_logging` |
| HIPAA | `compliance.data_residency` + `safety.pii_detection` |
| PCI-DSS | `separation.conflicts_with` + `identity.dora_tracking` |

---

## Contributing

**Repo:** `gitlab.com/blueflyio/ossa/openstandardagents`

### Add Framework Extension
1. Create schema: `spec/v0.3.3/extensions/your-framework.schema.json`
2. Add to main schema `definitions` + `extensions.properties`
3. Create example: `examples/your-framework/agent.ossa.yaml`
4. Add adapter: `src/adapters/your-framework-adapter.ts`
5. Add tests: `tests/integration/your-framework.test.ts`

### Fix/Extend Core Schema
1. Edit: `spec/v0.3.3/ossa-0.3.3.schema.json`
2. Update types: `src/types/index.ts`
3. Run: `npm run validate:schema && npm test`
4. Document in: `spec/v0.3.3/UNIFIED-SCHEMA.md`

### Governance Docs
Wiki: `gitlab.com/blueflyio/ossa/openstandardagents/-/wikis`

---

## Key Files

```
spec/v0.3.3/
├── ossa-0.3.3.schema.json    # THE schema (9,656 lines)
├── taxonomy.yaml             # Domain/type/concern definitions
├── access_tiers.yaml         # Tier permissions matrix
└── examples/                 # Reference manifests

src/
├── cli/                      # ossa validate, export, init
├── adapters/                 # LangChain, CrewAI, Anthropic, OpenAI
└── types/                    # TypeScript definitions
```

---

## TL;DR

OSSA = OpenAPI for agents. Define once, validate against schema, export to any framework. Governance model enforces access tiers + separation of duties for compliance. Agents get GitLab service accounts and DORA tracking.

**Schema:** JSON Schema Draft-07, 28 framework extensions, 9 domains, 4 access tiers.

**CLI:** `npm i -g @bluefly/openstandardagents && ossa validate your-agent.ossa.yaml`
