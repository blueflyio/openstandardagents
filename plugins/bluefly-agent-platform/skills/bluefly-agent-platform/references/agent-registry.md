# Agent Registry Reference

## Table of Contents
1. [Active Platform Agents](#active-platform-agents)
2. [Agent Capabilities](#agent-capabilities)
3. [Agent Marketplace Commands](#agent-marketplace-commands)

## Active Platform Agents (16)

| Agent | Handle | Role | Access Tier |
|-------|--------|------|-------------|
| Vulnerability Scanner | @vuln-scanner | Analyzer | tier_1_read |
| MR Reviewer | @mr-reviewer | Reviewer | tier_2_write |
| Recipe Publisher | @recipe-publisher | Executor | tier_3_full |
| Release Coordinator | @release-coordinator | Orchestrator | tier_2_write |
| Task Dispatcher | @task-dispatcher | Orchestrator | tier_2_write |
| Pipeline Remediation | @pipeline-remediation | Executor | tier_3_full |
| Kagent Catalog Sync | @kagent-catalog-sync | Executor | tier_3_full |
| Code Quality Reviewer | @code-quality-reviewer | Reviewer | tier_2_write |
| Cluster Operator | @cluster-operator | Executor | tier_3_full |
| Issue Lifecycle Manager | @issue-lifecycle-manager | Orchestrator | tier_2_write |
| MCP Server Builder | @mcp-server-builder | Executor | tier_3_full |
| Drupal Standards Checker | @drupal-standards-checker | Reviewer | tier_2_write |
| Cost Intelligence Monitor | @cost-intelligence-monitor | Analyzer | tier_1_read |
| Documentation Aggregator | @documentation-aggregator | Executor | tier_3_full |
| OSSA Validator | @ossa-validator | Analyzer | tier_1_read |
| Module Generator | @module-generator | Executor | tier_3_full |

## Agent Capabilities

### Vulnerability Scanner (@vuln-scanner)
- Scans code for security vulnerabilities
- Integrates with GitLab SAST/DAST
- Reports findings to compliance-engine
- **Triggers**: MR created, scheduled pipeline

### MR Reviewer (@mr-reviewer)
- Reviews merge request code quality
- Checks coding standards compliance
- Provides automated feedback
- **Triggers**: MR created, MR updated

### Recipe Publisher (@recipe-publisher)
- Publishes Drupal recipes to registry
- Validates recipe dependencies
- Updates recipe catalog
- **Triggers**: Recipe MR merged

### Release Coordinator (@release-coordinator)
- Orchestrates release process
- Coordinates between agents
- Manages release branch flow
- **Triggers**: Milestone closed, manual

### Task Dispatcher (@task-dispatcher)
- Routes tasks to appropriate agents
- Manages task queues
- Monitors agent availability
- **Triggers**: Issue created, webhook

### Pipeline Remediation (@pipeline-remediation)
- Fixes failing CI/CD pipelines
- Analyzes pipeline errors
- Applies automated fixes
- **Triggers**: Pipeline failed

### Code Quality Reviewer (@code-quality-reviewer)
- Reviews code style and patterns
- Checks TypeScript/PHP standards
- Suggests improvements
- **Triggers**: MR created

### Cluster Operator (@cluster-operator)
- Manages Kubernetes deployments
- Scales services
- Handles infrastructure changes
- **Triggers**: Deployment requested

### Issue Lifecycle Manager (@issue-lifecycle-manager)
- Manages issue states
- Closes stale issues
- Links related issues
- **Triggers**: Scheduled, issue events

### MCP Server Builder (@mcp-server-builder)
- Creates new MCP servers
- Validates MCP schemas
- Publishes to registry
- **Triggers**: Manual, issue assigned

### Drupal Standards Checker (@drupal-standards-checker)
- Validates Drupal coding standards
- Checks module structure
- Reviews hook implementations
- **Triggers**: Drupal module MR

### Cost Intelligence Monitor (@cost-intelligence-monitor)
- Monitors infrastructure costs
- Tracks Vast.ai spending
- Reports cost anomalies
- **Triggers**: Scheduled (hourly)

### Documentation Aggregator (@documentation-aggregator)
- Syncs documentation
- Updates GitLab wikis
- Generates API docs
- **Triggers**: Code merged, scheduled

### OSSA Validator (@ossa-validator)
- Validates OSSA manifests
- Checks compliance with spec
- Reports validation errors
- **Triggers**: Agent manifest changed

### Module Generator (@module-generator)
- Scaffolds new modules
- Generates boilerplate code
- Creates test structures
- **Triggers**: Issue assigned

## Agent Marketplace Commands

```bash
# List all marketplace-ready agents
buildkit agents marketplace list

# Register agent for marketplace
buildkit agents marketplace register -m path/to/agent.ossa.yaml

# Validate agent against OSSA v0.3.2
buildkit agents marketplace validate <agentId>

# Sync agent to Claude/Cursor/GitLab Duo
buildkit agents marketplace sync <agentId>

# Search for agents
buildkit agents search --description "security scanning"
buildkit agents search --tag security

# Spawn agent for task
buildkit agents spawn <agentId>

# Check agent status
buildkit agents status <agentId>
```

## Agent Definition Location

All agent definitions are in: `platform-agents/packages/@ossa/`

Each agent has:
- `agent.ossa.yaml` - OSSA manifest
- `capabilities/` - Capability definitions
- `triggers/` - Event triggers
- `config/` - Configuration files

**NEVER** create agent runtime code in platform-agents. Runtime code belongs in common_npm packages.
