# GitLab Agent Platform Architecture

This directory contains the complete GitLab Duo Agent Platform configuration for OSSA (Open Standard Agents). All subdirectories work together to provide autonomous agent capabilities for GitLab projects.

## Architecture Overview

```
.gitlab/
├── agent-k8s/         # Public OSSA validator (K8s-backed, works in ANY project)
├── duo/               # GitLab Duo Agent Platform configuration
│   ├── agents/        # Agent definitions (GitLab Duo AI Catalog format)
│   ├── triggers.yaml  # Comprehensive trigger definitions
│   └── flow-triggers.yml # Event-to-flow mappings
├── flows/             # Workflow definitions (16 autonomous flows)
├── triggers/          # GitLab workflow automation triggers
├── config/            # Duo agent configs (by GitLab tier: Free/Ultimate/Root)
├── k8s/               # Kubernetes deployments (review apps, website)
└── webhooks/          # Webhook configurations
```

## Critical Components: Flows & Triggers

### Why Flows and Triggers Matter

**Flows and Triggers** are the core of the autonomous agent platform. They enable zero-touch automation:

- **Triggers** = Event listeners (when something happens in GitLab)
- **Flows** = Orchestrated workflows (what agents do in response)

Together they create fully autonomous DevOps operations.

## flows/ - Autonomous Workflows ⚡

**Purpose**: Workflow definitions that orchestrate multi-step agent actions. Each flow is a sequence of steps that can call agents, use tools, and make decisions based on GitLab events.

### Flow Architecture

```yaml
# Example: flows/ossa_validator_flow.yaml
image: node:22-alpine
injectGatewayToken: true

steps:
  - id: validate_ossa
    agent: bot-ossa-validator       # Calls GitLab Duo agent
    with:
      project_id: "{{ event.project_id }}"
      merge_request_id: "{{ event.merge_request_id }}"

  - id: post_result
    tool: CreateMergeRequestNote    # Uses GitLab API
    with:
      body: |
        ## Validation Results
        Status: {{ steps.validate_ossa.output.status }}
```

### Available Flows (16 Total)

#### Code Quality Flows
- **code-review-flow.yaml** - Autonomous code review on merge requests
  - Analyzes code quality, security, performance
  - Posts inline comments on issues
  - Suggests improvements

#### Issue Management Flows
- **issue-triage-flow.yaml** - Issue classification and routing
  - Auto-labels issues
  - Assigns to appropriate team
  - Sets milestones

- **issue-consolidation-flow.yaml** - Duplicate detection and merging
  - Finds duplicate issues using semantic search
  - Consolidates discussions
  - Updates references

#### Release & Deployment Flows
- **release-orchestration-flow.yaml** - Automated release management
  - Generates changelogs
  - Creates release notes
  - Updates documentation
  - Triggers deployments

#### CI/CD Optimization Flows
- **pipeline-optimization-flow.yaml** - CI/CD performance tuning
  - Analyzes pipeline performance
  - Identifies bottlenecks
  - Suggests parallelization
  - Optimizes caching

- **self-healing-flow.yaml** - Automatic error recovery
  - Detects failed pipelines
  - Analyzes failure patterns
  - Retries with fixes
  - Opens issues for persistent failures

#### Security Flows
- **security-remediation-flow.yaml** - Vulnerability remediation
  - Scans for CVEs
  - Generates security fixes
  - Creates security MRs
  - Tracks remediation progress

#### OSSA Validation Flows
- **ossa_validator_flow.yaml** - OSSA manifest validation
  - Validates against v0.3.5 schema
  - Checks extensions (Kagent, MCP, A2A)
  - Posts validation results
  - Suggests fixes

#### Advanced Orchestration Flows
- **autonomous-framework-orchestration.yaml** - Multi-agent coordination
  - Coordinates multiple agents
  - Manages dependencies
  - Handles conflicts
  - Optimizes execution order

- **enhanced-agent-orchestration.yaml** - Advanced agent patterns
  - Agent swarms
  - Hierarchical delegation
  - Parallel execution

- **full-autonomous-cycle.yaml** - Complete autonomous DevOps
  - Issue → Code → Test → Review → Merge → Deploy
  - Fully autonomous from feature request to production

#### Continuous Improvement Flow
- **continuous-improvement-flow.yaml** - Meta-optimization
  - Analyzes agent performance
  - Optimizes prompts
  - Improves workflows
  - Self-evolves

#### Workflow Automation Flows
- **mr_automation_flow.yaml** - MR lifecycle automation
- **issue_automation_flow.yaml** - Issue lifecycle automation
- **component_workflow_flow.yaml** - Component-specific workflows
- **recipe_workflow_flow.yaml** - Recipe-based automation

### Flow Best Practices

1. **Keep steps atomic** - Each step should do one thing well
2. **Use clear step IDs** - Makes debugging and data passing easier
3. **Pass data explicitly** - Use `{{ steps.step_id.output.field }}`
4. **Handle errors gracefully** - Use conditionals and fallbacks
5. **Add observability** - Log important decisions and actions

## triggers/ - Event Automation 🎯

**Purpose**: Map GitLab events to flows. Triggers are the "if this, then that" of agent automation.

### Trigger Architecture

```yaml
# Example: triggers/ossa_validator.yaml
on:
  merge_request:
    events: ["opened", "updated"]
    paths:
      - "**/*.ossa.yaml"
      - "**/*.ossa.yml"
      - ".gitlab/agents/**/*.yaml"

run:
  flow: ossa_validator_flow
```

### Available Triggers (5 Total)

#### ossa_validator.yaml
**Triggers**: When MR contains OSSA manifest changes
**Runs**: `ossa_validator_flow`
**Purpose**: Validate OSSA manifests against v0.3.5 schema

#### issue_automation.yaml
**Triggers**: Issue created, labeled, commented
**Runs**: `issue_automation_flow`
**Purpose**: Auto-triage, label, assign issues

#### mr_automation.yaml
**Triggers**: MR opened, updated, commented
**Runs**: `mr_automation_flow`
**Purpose**: Code review, conflict detection, auto-merge

#### component_workflow.yaml
**Triggers**: Component file changes (src/*, lib/*)
**Runs**: `component_workflow_flow`
**Purpose**: Component-specific testing and validation

#### recipe_workflow.yaml
**Triggers**: Recipe changes (recipes/*, templates/*)
**Runs**: `recipe_workflow_flow`
**Purpose**: Recipe validation and documentation

### Trigger Best Practices

1. **Be specific with paths** - Only trigger on relevant file changes
2. **Use appropriate events** - Don't trigger on every event
3. **Keep triggers small** - Logic goes in flows, not triggers
4. **Test trigger patterns** - Use GitLab's dry-run mode
5. **Document conditions** - Explain why the trigger exists

## duo/ - GitLab Duo Agent Platform

**Purpose**: GitLab Duo AI agent definitions and comprehensive trigger configurations.

### duo/agents/ - Agent Definitions

#### ossa-validator.yml
GitLab Duo AI Catalog agent for OSSA manifest validation.

**Features**:
- Schema validation against OSSA v0.3.5
- Extension validation (Kagent, MCP, A2A, LangChain, CrewAI, AG2)
- LLM configuration validation
- Safety guardrails validation
- Cost tracking validation
- Best practices recommendations

**Context**: Fetches schema from canonical GitHub URL
**Model**: claude-sonnet-4-20250514
**Tools**: read_file, find_files, create_merge_request_note, run_command

**Triggers**:
- MR with *.ossa.yaml changes
- Mention: `@ossa-validator`
- Keywords: "validate ossa", "check manifest"

#### ossa-duo-bridge.yml
Bridge agent for GitLab Duo platform integration.

#### version-auditor.yaml
Version consistency checker across manifests.

### duo/triggers.yaml - Comprehensive Trigger Configuration

High-level trigger definitions with service accounts and conditions.

**Service Accounts** (for autonomous execution):
- `bot-release-orchestrator` - Release automation
- `bot-ci-cd-optimizer` - Pipeline optimization
- `bot-security-scanner` - Security scanning
- `bot-code-reviewer` - Code review
- `bot-issue-triage` - Issue triage
- `bot-doc-agent` - Documentation sync
- `bot-ossa-validator` - OSSA validation

**Trigger Types**:
- **release-orchestration-trigger** - On milestone closure (v*.*.*)
- **pipeline-optimization-trigger** - On pipeline failure or slow execution
- **security-remediation-trigger** - On high-severity vulnerabilities
- **code-review-trigger** - On MR to main (non-draft)
- **issue-triage-trigger** - On issue creation
- **documentation-sync-trigger** - On doc file changes (every 6 hours)

### duo/flow-triggers.yml - Event-to-Flow Mappings

Simplified trigger definitions for common GitLab events.

**Mappings**:
- `issue_created` → `issue-worker` (with label conditions)
- `issue_labeled` → `issue-triage`
- `mr_opened` → `mr-reviewer` (conventional commits enforcement)
- `mr_updated` → `mr-reviewer` (review changes only)
- `pipeline_failed` → `incident-response` (with retry threshold)
- `mr_opened` (spec changes) → `ossa-validate` (strict mode)

**Defaults**:
- Model: claude-sonnet-4-20250514
- Timeout: 30 minutes
- Max iterations: 20
- Observability: enabled

## config/ - Duo Agent Configuration

**Purpose**: GitLab Duo agent configurations for different GitLab tiers.

### duo-agent-config.yaml
Standard configuration with comprehensive toolset:
- Git, jq, yq, curl, python3, shellcheck, ripgrep
- npm build and validation
- OSSA v0.3.0 schema validation
- Auto-fix capabilities
- Documentation generation

### duo-agent-config-ultimate.yaml
Ultimate tier features (most comprehensive):
- All standard features
- Advanced security scanning
- Dependency auditing
- Migration guide generation
- Multi-agent coordination
- Self-healing capabilities

### duo-agent-config-root.yaml
Root-level configuration with full GitLab access.

### merge-request-settings.yml
MR automation settings (auto-label, auto-assign, auto-merge).

## agent-k8s/ - Public OSSA Validator

**Purpose**: External Kubernetes-backed agent that ANY GitLab project can use to validate OSSA v0.3.x manifests.

**Key Features**:
- Works in ANY project (not just this one)
- Uses `@bluefly/openstandardagents` from npmjs.org
- Validates manifests with `ossa validate`
- CI template for easy integration
- Supports strict mode
- Cost estimation
- Safety checks

**Usage**: See [agent-k8s/README.md](./agent-k8s/README.md)

## k8s/ - Kubernetes Deployments

- `review-app.yaml` - Ephemeral review environments
- `website-deployment.yaml` - OSSA website deployment
- `website-proxy.yaml` - Ingress/proxy configuration

## webhooks/ - Webhook Configuration

- `autonomous-webhook-config.json` - Webhook endpoint definitions
- `evolution-triggers.yml` - Evolution event triggers

## Complete Flow: OSSA Manifest Validation

### Step-by-Step Execution

1. **Developer** opens MR with `agent.ossa.yaml` changes

2. **Trigger** (`triggers/ossa_validator.yaml`) detects:
   ```yaml
   on:
     merge_request:
       events: ["opened"]
       paths: ["**/*.ossa.yaml"]
   ```

3. **Flow** (`flows/ossa_validator_flow.yaml`) executes:
   ```yaml
   steps:
     - id: validate_ossa
       agent: bot-ossa-validator
   ```

4. **Agent** (`duo/agents/ossa-validator.yml`):
   - Fetches OSSA v0.3.5 schema from GitHub
   - Validates manifest against schema
   - Checks extensions (Kagent, MCP, A2A)
   - Validates LLM config, tools, capabilities
   - Checks safety guardrails

5. **Results** posted as MR comment:
   ```
   ✅ OSSA Validation Passed
   Validated: 1 manifest
   Schema: OSSA v0.3.5
   Extensions: Kagent, MCP
   All manifests comply with OSSA v0.3.5 specification
   ```

6. **Developer** sees validation results immediately

## Adding New Flows & Triggers

### Create a New Flow

1. Create `flows/my-new-flow.yaml`:
   ```yaml
   image: node:22-alpine
   injectGatewayToken: true

   steps:
     - id: step_one
       agent: bot-my-agent
       with:
         param: "{{ event.data }}"

     - id: step_two
       tool: CreateMergeRequestNote
       with:
         body: "Result: {{ steps.step_one.output.result }}"
   ```

2. Test locally with GitLab CLI:
   ```bash
   glab workflow run flows/my-new-flow.yaml
   ```

3. Deploy and monitor

### Create a New Trigger

1. Create `triggers/my-new-trigger.yaml`:
   ```yaml
   on:
     merge_request:
       events: ["opened", "updated"]
       paths:
         - "my-feature/**"

   run:
     flow: my-new-flow
   ```

2. Add to `duo/triggers.yaml`:
   ```yaml
   - name: my-new-trigger
     description: "Description of what this does"
     service_account: bot-my-agent
     event_types:
       - merge_request_opened
     flow_config:
       source: configuration_path
       path: .gitlab/flows/my-new-flow.yaml
   ```

3. Test by creating an MR with matching path

## Best Practices

1. **Flows**:
   - Keep steps atomic and focused
   - Use clear IDs for all steps
   - Pass data explicitly via template syntax
   - Handle errors with conditionals
   - Add logging for debugging

2. **Triggers**:
   - Be specific with path patterns
   - Use appropriate events (don't over-trigger)
   - Keep trigger files minimal (logic in flows)
   - Document trigger purpose
   - Test with dry-run mode

3. **Agents**:
   - Provide comprehensive prompts with examples
   - Include error handling instructions
   - Specify expected output format
   - Use appropriate model and temperature
   - List required tools explicitly

4. **Validation**:
   - Always validate OSSA manifests locally first
   - Test flows in feature branches
   - Monitor agent execution logs
   - Review agent decisions
   - Iterate based on feedback

## Maintenance

- **Owner**: OSSA Core Team
- **Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- **Docs**: https://openstandardagents.org/docs/

## Related Documentation

- [GitLab Duo Agent Platform](https://docs.gitlab.com/user/duo_agent_platform/)
- [GitLab Workflows](https://docs.gitlab.com/user/project/integrations/webhooks.html)
- [OSSA Specification](https://openstandardagents.org/spec/v0.3/)
- [OSSA Validator Agent](./agent-k8s/README.md)
