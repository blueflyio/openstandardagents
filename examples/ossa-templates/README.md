# OSSA Specification Templates

10 OSSA v0.3.3 manifest templates showcasing the full specification.

## Templates

| # | Template | Kind | Category | Features Showcased |
|---|----------|------|----------|-------------------|
| 01 | **code-assistant** | Agent | Development | IDE extensions, tool use, LLM config |
| 02 | **security-scanner** | Agent | Security | Safety policies, constraints, access tiers |
| 03 | **ci-pipeline** | Agent | DevOps | Runtime integration, messaging, GitLab extension |
| 04 | **code-reviewer** | Agent | Development | Identity, access tiers, contracts |
| 05 | **doc-generator** | Agent | Documentation | Multi-provider LLM, templates |
| 06 | **compliance-validator** | Agent | Compliance | Schema validation, policy DSL |
| 07 | **workflow-orchestrator** | Workflow | Orchestration | Multi-agent composition, state management |
| 08 | **content-writer** | Agent | Content | Drupal extension, async processing |
| 09 | **test-generator** | Agent | Testing | Code analysis, multi-language |
| 10 | **data-transformer** | Agent | Data | Deterministic execution, batch processing |

## OSSA Kinds Demonstrated

- **Agent** - AI agents with LLM inference
- **Workflow** - Multi-agent orchestration
- **Task** - Deterministic, non-agentic operations

## Key Features

### 1. IDE Integration (code-assistant)
```yaml
extensions:
  claude-code:
    hooks: [before_execute, after_execute]
  cursor:
    composer_integration: true
  copilot:
    suggestions: { enabled: true }
```

### 2. Safety & Access Control (security-scanner)
```yaml
safety:
  constraints:
    - Never expose actual secret values
  policies:
    - policy: no-secret-exposure
identity:
  access_tier: elevated
  permissions: [security.scan.read]
```

### 3. Agent Composition (workflow-orchestrator)
```yaml
kind: Workflow
spec:
  agents:
    - ref: code-reviewer
      on_complete: security-scanner
  steps:
    - id: review
      agent: reviewer
      depends_on: []
```

### 4. Drupal Extension (content-writer)
```yaml
extensions:
  drupal:
    module: ai_agents_ossa
    messenger:
      transport: redis
      queue: content_generation
    workflow_engine: eca
```

### 5. Deterministic Execution (data-transformer)
```yaml
kind: Agent
spec:
  execution:
    type: deterministic
    batch:
      enabled: true
      parallelism: 10
```

## Usage

```bash
# Validate all OSSA templates
ossa validate examples/ossa-templates/*.ossa.yaml

# Generate agent from template
ossa generate agent security-scanner -o my-scanner.ossa.yaml
```

## Documentation

https://openstandardagents.org/agents
