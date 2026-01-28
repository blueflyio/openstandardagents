# OSSA v0.3.4 Technical Reference

**Schema:** `spec/v0.3.4/ossa-0.3.4.schema.json` (9,656 lines, JSON Schema Draft-07)

---

## Manifest Structure

```yaml
apiVersion: ossa/v0.3.4          # REQUIRED - exactly this string
kind: Agent | Task | Workflow    # REQUIRED - determines spec schema
metadata:                        # REQUIRED
  name: string                   # REQUIRED - kebab-case
  version: string                # REQUIRED - semver
  namespace: string              # optional
  description: string            # optional
  labels: {key: value}           # optional
  annotations: {key: value}      # optional
spec:                            # REQUIRED - schema varies by kind
  # ...
```

---

## Kind: Agent

For LLM-based reasoning. Uses tokens.

### AgentSpec Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `role` | string | Yes* | System prompt. *Either `role` OR `prompts.system.template` required |
| `prompts` | object | Yes* | Structured prompts. *Alternative to `role` |
| `llm` | LLMConfig | No | LLM provider config |
| `tools` | Tool[] | No | Available tools/functions |
| `identity` | AgentIdentity | No | Service account, DORA tracking |
| `access` | AccessTier | No | Permission tier (1-4) |
| `separation` | SeparationOfDuties | No | Role conflicts, delegation rules |
| `delegation` | DelegationConfig | No | Who can delegate to this agent |
| `taxonomy` | TaxonomyClassification | No | Domain/type/concerns classification |
| `safety` | Safety | No | Guardrails, kill switch, human oversight |
| `constraints` | Constraints | No | Cost, performance, resource limits |
| `observability` | AgentObservability | No | Tracing, metrics, logging |
| `messaging` | MessagingExtension | No | A2A pub/sub channels |
| `compliance` | object | No | SOC2, FedRAMP, HIPAA settings |
| `autonomy` | Autonomy | No | Decision-making boundaries |
| `state` | State | No | Persistent state config |
| `functions` | FunctionDefinition[] | No | OpenAI-style function definitions |
| `type` | enum | No | `analyzer\|worker\|operator\|supervisor\|orchestrator\|governor\|specialist\|critic` |
| `lifecycle` | object | No | Environment configs, dependencies |

### Minimal Valid Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
spec:
  role: "You are a code review assistant."
```

### Full Agent Example

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: code-review-agent
  version: 2.1.0
  namespace: engineering
  labels:
    team: platform
    tier: tier_2
spec:
  role: |
    You are a code reviewer. Analyze merge requests for:
    - Security vulnerabilities
    - Performance issues
    - Code style violations
    Output structured JSON with findings.

  type: analyzer

  identity:
    provider: gitlab
    service_account:
      id: "12345"
      username: bot-code-review
      email: bot-code-review@company.com
      display_name: Code Review Bot
      roles: [developer]
    dora_tracking:
      enabled: true
      metrics: [lead_time, change_failure_rate]
      labels:
        team: platform

  access:
    tier: tier_2
    permissions: [read_code, write_comments]
    prohibited: [merge, deploy]
    requires_approval: false

  separation:
    role: critic
    conflicts_with: [executor, deployer]
    can_delegate_to: [tier_1]

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.1
    maxTokens: 8192
    cost_tracking:
      enabled: true
      budget_alert_threshold: 25.0
      cost_allocation_tags:
        team: platform
        service: code-review

  tools:
    - type: function
      name: get_diff
      description: Fetch MR diff content
      handler: gitlab.getMergeRequestDiff
    - type: function
      name: post_comment
      description: Post inline comment on MR
      handler: gitlab.postComment

  constraints:
    cost:
      maxTokensPerDay: 500000
      maxTokensPerRequest: 16384
      maxCostPerDay: 50.0
      currency: USD
    performance:
      maxLatencySeconds: 30
      maxConcurrentRequests: 10
      timeoutSeconds: 120
    resources:
      cpu: "500m"
      memory: "512Mi"

  safety:
    human_in_loop:
      required: false
      escalation_threshold: 0.8
    guardrails:
      - pattern: "rm -rf"
        action: block
      - pattern: "DROP TABLE"
        action: block
    rate_limiting:
      requests_per_minute: 30

  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: http://jaeger:4317
    metrics:
      enabled: true
      exporter: prometheus
      port: 9090
    logging:
      level: info
      format: json

  messaging:
    publishes:
      - channel: code.review.complete
        schema:
          type: object
          required: [mr_id, findings_count, severity]
          properties:
            mr_id: {type: string}
            findings_count: {type: integer}
            severity: {type: string, enum: [low, medium, high, critical]}
    subscribes:
      - channel: ci.mr.opened
        handler: onMergeRequestOpened

  compliance:
    frameworks: [SOC2]
    audit_logging: required
```

---

## Kind: Task

Deterministic execution. No LLM, no tokens.

### TaskSpec Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `input` | JSONSchema | No | Input validation schema |
| `output` | JSONSchema | No | Output validation schema |
| `preconditions` | string[] | No | Conditions that must be true before execution |
| `postconditions` | string[] | No | Conditions that must be true after execution |
| `execution` | object | No | Runtime config |
| `error_handling` | object | No | Retry, fallback strategies |
| `dependencies` | string[] | No | Required tasks to complete first |
| `capabilities` | string[] | No | Required system capabilities |
| `batch` | object | No | Batch processing config |
| `observability` | object | No | Metrics, tracing |

### Task Example

```yaml
apiVersion: ossa/v0.3.4
kind: Task
metadata:
  name: validate-json-schema
  version: 1.0.0
spec:
  input:
    type: object
    required: [schema, data]
    properties:
      schema: {type: object}
      data: {type: object}

  output:
    type: object
    properties:
      valid: {type: boolean}
      errors: {type: array, items: {type: string}}

  execution:
    runtime: node
    handler: validators/json-schema.js
    timeout_seconds: 30

  error_handling:
    strategy: fail
    max_retries: 0

  preconditions:
    - "input.schema != null"
    - "input.data != null"
```

---

## Kind: Workflow

Composition of Agents and Tasks.

### WorkflowSpec Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `triggers` | Trigger[] | No | What starts the workflow |
| `inputs` | JSONSchema | No | Workflow input schema |
| `outputs` | JSONSchema | No | Workflow output schema |
| `steps` | Step[] | Yes | Ordered execution steps |
| `context` | object | No | Shared context config |
| `concurrency` | object | No | Parallel execution settings |
| `timeout_seconds` | integer | No | Max workflow duration |
| `error_handling` | object | No | Workflow-level error handling |
| `observability` | object | No | Workflow tracing |

### Workflow Example

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: pr-review-pipeline
  version: 1.0.0
spec:
  triggers:
    - type: webhook
      event: merge_request.opened
    - type: schedule
      cron: "0 9 * * 1-5"

  inputs:
    type: object
    required: [mr_id]
    properties:
      mr_id: {type: string}
      priority: {type: string, enum: [low, normal, high]}

  steps:
    - id: fetch_diff
      ref: ./tasks/fetch-diff.ossa.yaml
      inputs:
        mr_id: "{{ inputs.mr_id }}"

    - id: security_scan
      ref: ./agents/security-scanner.ossa.yaml
      inputs:
        code: "{{ steps.fetch_diff.outputs.diff }}"

    - id: code_review
      ref: ./agents/code-reviewer.ossa.yaml
      inputs:
        diff: "{{ steps.fetch_diff.outputs.diff }}"
        security_findings: "{{ steps.security_scan.outputs.findings }}"
      condition: "{{ steps.security_scan.outputs.severity != 'critical' }}"

    - id: post_results
      ref: ./tasks/post-comment.ossa.yaml
      inputs:
        mr_id: "{{ inputs.mr_id }}"
        review: "{{ steps.code_review.outputs.review }}"

  outputs:
    type: object
    properties:
      review_complete: {type: boolean}
      findings_count: {type: integer}

  timeout_seconds: 600

  error_handling:
    strategy: fail_fast
    on_failure:
      - notify: slack://alerts
```

---

## Access Tiers

```yaml
spec:
  access:
    tier: tier_1 | tier_2 | tier_3 | tier_4
    permissions: [string]      # Allowed operations
    prohibited: [string]       # Explicitly denied operations
    audit_level: minimal | standard | comprehensive
    requires_approval: boolean
    approval_chain: [string]   # Who must approve
    isolation: none | namespace | cluster
```

| Tier | Name | Can Do | Cannot Do |
|------|------|--------|-----------|
| `tier_1` | Read | Read code, configs, logs | Write anything |
| `tier_2` | Write Limited | Create files in sandbox | Modify production |
| `tier_3` | Write Elevated | Deploy with approval | Change policies |
| `tier_4` | Policy | Define rules, delegate | Execute directly |

**Enforcement:** Tier 4 MUST delegate execution to Tier 3. No agent can approve its own elevated actions.

---

## Separation of Duties

```yaml
spec:
  separation:
    role: analyzer | worker | operator | supervisor | orchestrator | governor | specialist | critic
    conflicts_with: [role...]   # Cannot hold these roles simultaneously
    can_delegate_to: [tier...]  # Allowed delegation targets
    prohibited_actions: [string] # Actions this role cannot perform
```

**Example Conflicts:**
- `critic` conflicts with `executor` (reviewer can't also deploy)
- `governor` conflicts with `operator` (policy maker can't execute)

---

## Agent Identity

```yaml
spec:
  identity:
    provider: gitlab | github | azure_ad | okta | custom
    service_account:
      id: string              # Provider account ID
      username: string        # Bot username
      email: string           # Bot email
      display_name: string
      roles: [string]         # Provider roles (developer, maintainer, etc.)
    authentication:
      method: project_access_token | oauth | mtls | jwt
      scopes: [api, read_repository, write_repository, ...]
    token_source:
      env_var: string         # Environment variable name
      fallback:
        vault:
          path: string
          key: string
    dora_tracking:
      enabled: boolean
      metrics: [deployment_frequency, lead_time, change_failure_rate, mttr]
      labels: {key: value}
      prometheus:
        push_gateway: string  # URL
```

---

## Messaging (A2A Protocol)

```yaml
spec:
  messaging:
    publishes:
      - channel: domain.entity.event    # e.g., security.vulnerability.found
        description: string
        schema: {JSONSchema}            # Message payload schema
        examples: [{...}]

    subscribes:
      - channel: domain.entity.event
        handler: string                 # Function name to call
        filter: string                  # Optional message filter
        priority: low | normal | high

    commands:
      - name: string                    # RPC-style command
        description: string
        inputSchema: {JSONSchema}
        outputSchema: {JSONSchema}
        timeoutSeconds: integer

    reliability:
      deliveryGuarantee: at-most-once | at-least-once | exactly-once
      retry:
        maxAttempts: integer
        backoff:
          strategy: fixed | exponential
          initialDelayMs: integer
          maxDelayMs: integer
      dlq:
        enabled: boolean
        channel: string
        retentionDays: integer
```

**Channel Naming:** `{domain}.{entity}.{event}`
- `security.vulnerability.found`
- `ci.pipeline.complete`
- `infrastructure.deployment.started`

---

## Validation Commands

```bash
# Install
npm install -g @bluefly/openstandardagents

# Validate schema compiles
npm run validate:schema
# Uses: npx ajv-cli compile -s spec/v0.3.4/ossa-0.3.4.schema.json --strict=false --allow-union-types

# Validate a manifest
npm run validate:manifest -- path/to/agent.ossa.yaml
# Uses: npx ajv validate -s spec/v0.3.4/ossa-0.3.4.schema.json --strict=false --allow-union-types -d

# Direct ajv command
npx ajv validate \
  -s spec/v0.3.4/ossa-0.3.4.schema.json \
  -d your-agent.ossa.yaml \
  --strict=false \
  --allow-union-types

# Validate all examples
find examples -name "*.ossa.yaml" | xargs -I {} npx ajv validate \
  -s spec/v0.3.4/ossa-0.3.4.schema.json -d {} --strict=false
```

---

## Schema Extension Points

Framework extensions go in `spec.extensions`:

```yaml
spec:
  # ... core properties
  extensions:
    langchain:
      chain_type: stuff | map_reduce | refine
      memory:
        type: buffer | summary | vector
        k: 5
    crewai:
      allow_delegation: true
      verbose: true
    mcp:
      servers:
        - name: filesystem
          command: npx
          args: ["-y", "@anthropic/mcp-filesystem"]
```

**Available Extensions:** `mcp`, `skills`, `autogen`, `langflow`, `vercel_ai`, `openai_assistants`, `langchain`, `openai_swarm`, `agents_md`, `llms_txt`, `dify`, `crewai`, `bedrock`, `llamaindex`, `vertexai`, `langgraph`, `haystack`, `pydantic_ai`, `smolagents`, `phidata`, `instructor`, `autogpt`, `metagpt`, `kagent`, `semantic_kernel`, `cursor`, `claude_code`, `drupal`, `kubernetes`

---

## File Structure

```
spec/v0.3.4/
├── ossa-0.3.4.schema.json     # Main schema
├── taxonomy.yaml              # Domain/type definitions
├── access_tiers.yaml          # Tier permission matrix
├── examples/
│   ├── drupal-content-writer.ossa.yaml
│   ├── multi-provider-identity.ossa.yaml
│   ├── tasks/
│   │   ├── data-transform.ossa.yaml
│   │   └── publish-content.ossa.yaml
│   └── workflows/
│       └── content-publishing.ossa.yaml
├── extensions/                # Extension schemas
├── adapters/                  # Runtime adapter specs
└── protocols/                 # A2A protocol specs

src/
├── cli/
│   ├── commands/
│   │   ├── validate.command.ts
│   │   ├── export.command.ts
│   │   └── init.command.ts
│   └── index.ts
├── adapters/
│   ├── langchain-adapter.ts
│   ├── crewai-adapter.ts
│   ├── anthropic/
│   └── drupal/
├── services/
│   ├── validation.service.ts
│   └── generation.service.ts
└── types/
    └── index.ts               # TypeScript definitions
```

---

## Adding a New Extension

1. **Define schema** in `spec/v0.3.4/ossa-0.3.4.schema.json`:

```json
{
  "definitions": {
    "YourFrameworkExtension": {
      "type": "object",
      "description": "Your framework config",
      "properties": {
        "your_property": {"type": "string"}
      },
      "additionalProperties": false
    }
  }
}
```

2. **Add to extensions** in the same file:

```json
{
  "definitions": {
    "extensions": {
      "properties": {
        "your_framework": {
          "$ref": "#/definitions/YourFrameworkExtension"
        }
      }
    }
  }
}
```

3. **Create adapter** in `src/adapters/your-framework-adapter.ts`:

```typescript
import { OSSAManifest } from '../types';

export function toYourFramework(manifest: OSSAManifest): YourFrameworkConfig {
  const ext = manifest.spec.extensions?.your_framework;
  return {
    // Map OSSA to framework config
  };
}

export function fromYourFramework(config: YourFrameworkConfig): Partial<OSSAManifest> {
  return {
    apiVersion: 'ossa/v0.3.4',
    kind: 'Agent',
    // ...
  };
}
```

4. **Add example** in `examples/your-framework/agent.ossa.yaml`

5. **Add test** in `tests/integration/your-framework.test.ts`

6. **Run validation:**

```bash
npm run validate:schema
npm test
```

---

## Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `must NOT have additional properties` | Unknown property in spec | Check property name against schema |
| `must be object` | String where object expected | `prompts.system` must be `{template: "..."}` not raw string |
| `must be string` | Number where string expected | `resources.cpu: "1"` not `cpu: 1` |
| `must match "then" schema` | Kind/spec mismatch | Agent kind needs AgentSpec properties |

---

## CI Integration

```yaml
# .gitlab-ci.yml
validate:ossa:
  stage: validate
  image: node:20
  script:
    - npm ci
    - npm run validate:schema
    - |
      find . -name "*.ossa.yaml" -not -path "./node_modules/*" | while read f; do
        echo "Validating: $f"
        npm run validate:manifest -- "$f"
      done
  rules:
    - changes:
        - "**/*.ossa.yaml"
        - "spec/**/*"
```

---

## Quick Reference

```bash
# Validate
npx ajv validate -s spec/v0.3.4/ossa-0.3.4.schema.json -d agent.yaml --strict=false

# List AgentSpec properties
cat spec/v0.3.4/ossa-0.3.4.schema.json | jq '.definitions.AgentSpec.properties | keys'

# List all extensions
cat spec/v0.3.4/ossa-0.3.4.schema.json | jq '.definitions | keys | map(select(endswith("Extension")))'

# Get specific definition
cat spec/v0.3.4/ossa-0.3.4.schema.json | jq '.definitions.AccessTier'
```

---

**Repo:** gitlab.com/blueflyio/ossa/openstandardagents
**npm:** @bluefly/openstandardagents
**Schema:** spec/v0.3.4/ossa-0.3.4.schema.json
