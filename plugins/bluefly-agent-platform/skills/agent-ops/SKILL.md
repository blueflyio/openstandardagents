---
name: agent-ops
description: "OSSA agent lifecycle — spawn, validate, discover, register, decommission. 67 agents across 12 domains."
triggers:
  - pattern: "agent|spawn|ossa|manifest|marketplace"
    priority: critical
  - pattern: "register|decommission|capability|domain"
    priority: high
  - pattern: "who.*can|which.*agent|find.*agent"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Agent Operations

## Agent Inventory (67 Agents, 12 Domains)

| Domain | Count | Examples |
|--------|-------|----------|
| Security | 8 | vulnerability-scanner, secret-detector, dependency-auditor, sast-analyzer, container-scanner, license-checker, cve-monitor, pen-test-planner |
| Code Quality | 7 | code-reviewer, linter-orchestrator, complexity-analyzer, test-coverage, dead-code-finder, api-contract-validator, schema-drift-detector |
| DevOps | 6 | pipeline-builder, deploy-orchestrator, rollback-manager, canary-analyst, infra-provisioner, config-drift-detector |
| Compliance | 5 | audit-trail-generator, policy-enforcer, change-approver, soc2-checker, gdpr-scanner |
| Documentation | 5 | wiki-writer, api-doc-generator, changelog-builder, adr-creator, runbook-writer |
| Monitoring | 5 | alert-correlator, anomaly-detector, slo-tracker, cost-analyzer, capacity-planner |
| Data | 5 | etl-builder, data-quality-checker, schema-migrator, backup-verifier, pii-scanner |
| ML/AI | 5 | model-evaluator, prompt-optimizer, embedding-manager, rag-pipeline-builder, fine-tune-orchestrator |
| Communication | 5 | incident-commander, stakeholder-updater, standup-summarizer, retro-facilitator, knowledge-curator |
| Testing | 5 | integration-test-builder, e2e-orchestrator, performance-tester, chaos-engineer, contract-tester |
| Platform | 4 | service-mesh-manager, dns-configurator, certificate-manager, network-policy-builder |
| Drupal | 2 | drupal-module-builder, drupal-config-manager |

## OSSA Manifest Structure

Every agent MUST have a manifest at `platform-agents/packages/@ossa/{agent-id}/`:
```yaml
ossa: "0.4"
agent:
  id: "{agent-id}"
  name: "{Human Name}"
  version: "1.0.0"
  description: "{what it does}"
  domain: "{domain}"
capabilities:
  - id: "{cap-id}"
    description: "{what this capability does}"
    input_schema: { ... }
    output_schema: { ... }
security:
  access_tier: "tier_1_read | tier_2_write | tier_3_full | tier_4_policy"
  role: "analyzer | reviewer | executor | approver"
  conflicts_with: ["{conflicting-roles}"]
  data_classification: "public | internal | confidential | restricted"
runtime:
  transport: "mcp-sse | http | grpc"
  endpoint: "https://{service}.blueflyagents.com/{path}"
  health_check: "/health"
```

## Access Tiers & Role Separation

| Tier | Role | Permissions | Conflicts |
|------|------|-------------|-----------|
| tier_1_read | Analyzer | Read repos, scan artifacts, generate reports | Executor, Approver |
| tier_2_write | Reviewer | Comment on MRs, update issues, label/assign | Executor, Approver |
| tier_3_full | Executor | Push code, merge MRs, run deploys | Reviewer, Approver |
| tier_4_policy | Approver | Approve MRs, override gates, release | Analyzer, Executor |

**Rule**: No agent can review/approve its own work. Executor→Reviewer handoff in same chain is FORBIDDEN.

## Lifecycle Commands

```bash
# Discover agents
buildkit agents list
buildkit agents search --domain security
buildkit agents search --description "scan vulnerabilities"
buildkit agents search --tier tier_1_read

# Spawn an agent
buildkit agents spawn vulnerability-scanner
buildkit agents spawn --dry-run code-reviewer

# Marketplace operations
buildkit agents marketplace list
buildkit agents marketplace validate <agentId>
buildkit agents marketplace sync <agentId>
buildkit agents marketplace publish <agentId>

# OSSA CLI
ossa agent wizard          # Interactive creation
ossa agent validate .      # Validate manifest
ossa agent export --format card  # Export agent card
```

## Agent Registration Flow

```
1. Create manifest  →  platform-agents/packages/@ossa/{id}/
2. Validate         →  buildkit agents marketplace validate {id}
3. Register         →  buildkit agents marketplace sync {id}
4. Health check     →  curl https://{service}.blueflyagents.com/health
5. Announce         →  Agent appears in marketplace & studio
```

## Decommission Flow

```
1. Mark deprecated  →  Update manifest: status: deprecated
2. Drain traffic    →  Router stops sending new requests
3. Monitor          →  Verify zero active sessions
4. Archive          →  Move to platform-agents/archive/
5. Remove routes    →  Update Cloudflare tunnel config
```

## Management UIs

| UI | URL | Purpose |
|----|-----|---------|
| Agent Studio | https://studio.blueflyagents.com | Visual agent builder |
| OSSA UI | https://ossa-ui.blueflyagents.com | Registry browser |
| KAgent UI | https://kagent-ui.blueflyagents.com | K8s agent management |
| Marketplace | https://marketplace.blueflyagents.com | Agent catalog |
