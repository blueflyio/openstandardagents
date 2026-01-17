# OSSA v0.3.4 — What It Actually Is

## The Problem

Every AI agent framework defines agents differently:
- LangChain: Python classes with `agent_executor`
- CrewAI: `Agent()` with `role`, `goal`, `backstory`
- AutoGen: `ConversableAgent` with config dicts
- OpenAI: Assistants API with JSON
- Anthropic: System prompts in API calls
- GitLab Duo: YAML manifests

You build an agent in one framework, you're locked in. Moving to another = rewrite everything.

OSSA is a YAML schema. You define your agent once. Tools read the YAML and generate framework-specific code.

That's it. It's a schema. Like OpenAPI for REST APIs.

---

## The Schema

File: `spec/v0.3.4/ossa-0.3.4.schema.json`
Size: 9,656 lines
Format: JSON Schema Draft-07

### Root Structure (REQUIRED)

```yaml
apiVersion: ossa/v0.3.4   # REQUIRED. Regex: ^ossa/v(0\.3\.[0-9]+|1)
kind: Agent               # REQUIRED. Enum: Agent | Task | Workflow
metadata:                 # REQUIRED
  name: my-agent          # REQUIRED. DNS-1123 format (lowercase, hyphens ok)
  version: 1.0.0          # Optional. Semver
  namespace: team-x       # Optional
  description: string     # Optional
  labels: {}              # Optional. k/v pairs
  annotations: {}         # Optional. k/v pairs
spec:                     # REQUIRED. Schema depends on `kind`
```

### kind: Agent

For LLM-based reasoning. Burns tokens.

**AgentSpec has NO required fields.** But you need at least `role` or `prompts.system.template` to do anything useful.

```yaml
spec:
  # System prompt (pick ONE)
  role: "You are a code reviewer."           # Simple string
  # OR
  prompts:
    system:
      template: "You are a code reviewer."   # Structured
      version: "1.0"

  # LLM config (required if you want to specify model)
  llm:
    provider: anthropic    # REQUIRED in LLMConfig
    model: claude-sonnet-4-20250514  # REQUIRED in LLMConfig
    temperature: 0.1       # Optional
    maxTokens: 8192        # Optional

  # Tools available to the agent
  tools:
    - type: function
      name: get_file
      description: Read file contents
      handler: fs.readFile

  # Everything else is optional
  identity: {...}          # Service accounts, DORA tracking
  access: {...}            # Access tier (tier_1 through tier_4)
  separation: {...}        # Role conflicts, delegation rules
  safety: {...}            # Guardrails, rate limits, human oversight
  constraints: {...}       # Cost limits, resource limits
  observability: {...}     # Tracing, metrics, logging config
  messaging: {...}         # Pub/sub channels for A2A comms
  taxonomy: {...}          # Domain/type classification
  delegation: {...}        # Who can delegate to this agent
  compliance: {...}        # Framework mappings
  autonomy: {...}          # Decision boundaries
  state: {...}             # Persistent state config
  lifecycle: {...}         # Environment configs
  type: analyzer           # Enum: analyzer|worker|operator|supervisor|orchestrator|governor|specialist|critic
  functions: [...]         # OpenAI-style function defs
```

### kind: Task

Deterministic execution. No LLM. No tokens.

**TaskSpec requires:** `execution`

```yaml
spec:
  execution:               # REQUIRED
    runtime: node          # What runs it
    handler: lib/task.js   # Entry point
    timeout_seconds: 30

  input:                   # JSON Schema for input validation
    type: object
    required: [file_path]
    properties:
      file_path: {type: string}

  output:                  # JSON Schema for output validation
    type: object
    properties:
      success: {type: boolean}

  preconditions: [...]     # Must be true before run
  postconditions: [...]    # Must be true after run
  error_handling:
    strategy: retry | fail | fallback
    max_retries: 3
  dependencies: [...]      # Other tasks that must complete first
  capabilities: [...]      # Required system capabilities
  batch: {...}             # Batch processing config
  observability: {...}
```

### kind: Workflow

Composes Agents and Tasks.

**WorkflowSpec requires:** `steps`

```yaml
spec:
  steps:                   # REQUIRED
    - id: step_1
      ref: ./agents/reviewer.ossa.yaml
      inputs:
        code: "{{ inputs.code }}"

    - id: step_2
      ref: ./tasks/format.ossa.yaml
      inputs:
        review: "{{ steps.step_1.outputs.review }}"
      condition: "{{ steps.step_1.outputs.needs_format }}"

  triggers:
    - type: webhook
      event: merge_request.opened
    - type: schedule
      cron: "0 9 * * 1-5"

  inputs: {JSON Schema}
  outputs: {JSON Schema}
  context: {...}
  concurrency: {...}
  timeout_seconds: 600
  error_handling: {...}
  observability: {...}
```

---

## Access Tiers

```yaml
spec:
  access:
    tier: tier_1_read | tier_2_write_limited | tier_3_write_elevated | tier_4_policy
    permissions: [read_code, write_comments]
    prohibited: [merge, deploy, delete]
    requires_approval: true
    approval_chain: [lead-agent, human-admin]
    audit_level: minimal | standard | comprehensive
    isolation: none | namespace | cluster
```

| Tier | What it means |
|------|---------------|
| `tier_1_read` | Can read. Cannot write. Analyzers, scanners. |
| `tier_2_write_limited` | Can write to sandbox only. Generators, scaffolders. |
| `tier_3_write_elevated` | Can write to prod with approval. Deployers, operators. |
| `tier_4_policy` | Can define rules. CANNOT execute. Governors only. |

**The rule:** Tier 4 agents define policy. They delegate execution to Tier 3. No agent approves its own elevated action.

---

## Separation of Duties

```yaml
spec:
  separation:
    role: critic | executor | governor | operator | ...
    conflicts_with: [executor, deployer]     # Cannot also be these
    can_delegate_to: [tier_1_read, tier_2_write_limited]
    prohibited_actions: [approve_own_mr, deploy_without_review]
```

**Example:** A `critic` agent that reviews code cannot also be the `executor` that merges it. If your manifest has `separation.role: critic` and `separation.conflicts_with: [executor]`, tooling should enforce that this agent never gets execute permissions.

---

## Identity (GitLab Integration)

```yaml
spec:
  identity:
    provider: gitlab
    service_account:
      id: "12345"
      username: bot-code-review
      email: bot-code-review@company.com
      display_name: Code Review Bot
      roles: [developer]
    authentication:
      method: project_access_token
      scopes: [api, read_repository, write_repository]
    token_source:
      env_var: GITLAB_BOT_TOKEN
    dora_tracking:
      enabled: true
      metrics:
        - deployment_frequency
        - lead_time
        - change_failure_rate
        - mttr
      labels:
        team: platform
```

**Why this matters:** Agent gets a real GitLab identity. Its commits show up in git history. It can be assigned issues. DORA metrics track its performance like a developer.

---

## Safety

```yaml
spec:
  safety:
    human_in_loop:
      required: true
      escalation_threshold: 0.8    # Confidence below this = escalate
      timeout_action: reject
    guardrails:
      - pattern: "rm -rf"
        action: block
        message: "Destructive command blocked"
      - pattern: "DROP TABLE"
        action: block
    rate_limiting:
      requests_per_minute: 30
      tokens_per_day: 100000
    content_filtering:
      enabled: true
      categories: [pii, secrets]
    pii_detection:
      enabled: true
      action: redact | block | warn
```

---

## Validation

### Install

```bash
npm install ajv-cli -g
```

### Validate Schema Compiles

```bash
ajv compile \
  -s spec/v0.3.4/ossa-0.3.4.schema.json \
  --strict=false \
  --allow-union-types
```

### Validate a Manifest

```bash
ajv validate \
  -s spec/v0.3.4/ossa-0.3.4.schema.json \
  -d your-agent.ossa.yaml \
  --strict=false \
  --allow-union-types
```

### Common Errors

| Error | You wrote | Should be |
|-------|-----------|-----------|
| `must NOT have additional properties: capabilities` | `capabilities: [...]` | `tools: [...]` |
| `must NOT have additional properties: policy` | `policy: {...}` | `safety: {...}` |
| `must NOT have additional properties: guardrails` | `guardrails: [...]` | `safety.guardrails: [...]` |
| `must NOT have additional properties: kill_switch` | `kill_switch: {...}` | `safety.human_in_loop: {...}` |
| `must NOT have additional properties: telemetry` | `telemetry: {...}` | `observability: {...}` |
| `must be object` | `prompts.system: "text"` | `prompts.system.template: "text"` |
| `must be string` | `resources.cpu: 1` | `resources.cpu: "1"` |
| `tier must be equal to one of the allowed values` | `tier: tier_2` | `tier: tier_2_write_limited` |

---

## Minimal Valid Manifests

### Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: my-agent
spec:
  role: "You are a helpful assistant."
```

### Task

```yaml
apiVersion: ossa/v0.3.4
kind: Task
metadata:
  name: my-task
spec:
  execution:
    runtime: node
    handler: task.js
```

### Workflow

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: my-workflow
spec:
  steps:
    - id: step_1
      ref: ./task.ossa.yaml
```

---

## Query the Schema

```bash
# List all AgentSpec properties
cat spec/v0.3.4/ossa-0.3.4.schema.json | jq '.definitions.AgentSpec.properties | keys'

# Get AccessTier structure
cat spec/v0.3.4/ossa-0.3.4.schema.json | jq '.definitions.AccessTier'

# Get all definition names
cat spec/v0.3.4/ossa-0.3.4.schema.json | jq '.definitions | keys'

# Get required fields for any definition
cat spec/v0.3.4/ossa-0.3.4.schema.json | jq '.definitions.LLMConfig.required'
# Output: ["provider", "model"]
```

---

## Framework Extensions

Framework-specific config goes in `spec.extensions`:

```yaml
spec:
  extensions:
    langchain:
      chain_type: stuff
      memory:
        type: buffer
        k: 5
    crewai:
      allow_delegation: true
    mcp:
      servers:
        - name: filesystem
          command: npx
          args: ["-y", "@anthropic/mcp-filesystem"]
```

28 extensions defined: `mcp`, `langchain`, `crewai`, `autogen`, `openai_assistants`, `openai_swarm`, `langflow`, `vercel_ai`, `dify`, `bedrock`, `llamaindex`, `vertexai`, `langgraph`, `haystack`, `pydantic_ai`, `smolagents`, `phidata`, `instructor`, `autogpt`, `metagpt`, `kagent`, `semantic_kernel`, `cursor`, `claude_code`, `drupal`, `kubernetes`, `skills`, `agents_md`, `llms_txt`

---

## File Locations

```
spec/v0.3.4/
├── ossa-0.3.4.schema.json    # THE schema. This is the source of truth.
└── examples/                  # Reference manifests

src/
├── adapters/                  # Framework converters (OSSA → LangChain, etc.)
└── cli/                       # Validation CLI
```

---

## Contributing

1. Edit `spec/v0.3.4/ossa-0.3.4.schema.json`
2. Run: `ajv compile -s spec/v0.3.4/ossa-0.3.4.schema.json --strict=false --allow-union-types`
3. Create example manifest that uses your changes
4. Validate example: `ajv validate -s spec/v0.3.4/ossa-0.3.4.schema.json -d your-example.ossa.yaml --strict=false --allow-union-types`
5. Open MR

---

## TL;DR

OSSA is a JSON Schema for AI agent manifests.

- `apiVersion: ossa/v0.3.4` — required
- `kind: Agent | Task | Workflow` — required
- `metadata.name` — required
- `spec` — schema depends on kind

Validate with ajv. That's it.

The governance stuff (access tiers, separation of duties) is in the schema. Tooling enforces it. An agent defined as `tier_1_read` with `separation.role: critic` should never get write permissions or execute its own reviews.

GitLab identity integration means agents get service accounts, show up in git history, and track DORA metrics.

**Repo:** gitlab.com/blueflyio/ossa/openstandardagents
