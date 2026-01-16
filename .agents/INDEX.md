# OSSA Agent Catalog Index

**Version:** 1.0.0
**Spec Version:** ossa/v0.3.5
**Generated:** 2026-01-16
**Total Agents:** 14
**Compliance Rate:** 100% v0.3.5 compliant

## Quick Navigation

- [Orchestrators](#orchestrators) (1)
- [Healers](#healers) (2)
- [Workers](#workers) (10)
- [Workflows](#workflows) (1)

---

## Orchestrators

Orchestrators manage and coordinate multiple agents, routing work and monitoring health.

### meta-orchestrator

**Version:** 1.0.0
**Domain:** orchestration → agent-management → coordination
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/orchestrators/meta-orchestrator/manifest.ossa.yaml`

Master orchestrator agent that manages all other OSSA agents, routes work, monitors health, and coordinates multi-agent workflows.

**Key Capabilities:**
- Agent routing and health monitoring
- Multi-agent workflow coordination
- Agent healing and recovery
- A2A (agent-to-agent) communication
- Wave-based execution (5 waves)

**LLM:** Anthropic Claude Sonnet 4 (fallback: GPT-4o)

**Managed Agents:** 12
**Tools:** spawn_agents, monitor_agents, heal_agents, optimize_workflows, route_issues, coordinate_waves, a2a_send, a2a_broadcast

**Bot Waves:**
- Wave 1 (Compilation): ts-local, gitlab-lib-local, drupal-local, ml-local, ossa-local
- Wave 2 (Production): ts-prod, drupal-prod, infra-prod, ml-prod, gitlab-lib-ci
- Wave 3 (Review): wiki-aggregator, security-healer, quality agents
- Wave 4 (Release): release-agent, semantic-versioning, changelog
- Wave 5 (Docs): wiki-aggregator, orchestrator

**Usage Example:**
```yaml
# Automatically routes incoming work to appropriate agents
# Monitors agent health and heals failures
# Coordinates multi-agent workflows
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure | ✅ MoE

---

## Healers

Healers automatically detect and fix issues in code, security, architecture, and specifications.

### spec-healer

**Version:** 0.1.0
**Domain:** specification → schema-validation → consistency-maintenance
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/spec-healer/manifest.ossa.yaml`

Agent that maintains OSSA specification consistency and validates schema correctness.

**Key Capabilities:**
- JSON Schema validation
- Spec-to-implementation consistency checks
- Backward compatibility verification
- Migration guide generation

**LLM:** Anthropic Claude Sonnet 4 (20250514)

**Tools:** validate_json_schema, compare_spec_impl, check_backward_compat, generate_migration, create_gitlab_issue

**Usage Example:**
```bash
# Validates OSSA manifests against schema
# Detects drift between spec and implementation
# Ensures backward compatibility across versions
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure | ✅ MoE

---

### security-healer

**Version:** 1.0.0
**Domain:** security → vulnerability-management → remediation
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/security-healer/manifest.ossa.yaml`

Security scanning and remediation agent with automated patching, SBOM generation, and compliance reporting.

**Key Capabilities:**
- Comprehensive vulnerability scanning (SAST, DAST, secrets, containers, dependencies)
- Automated CVE patching
- SBOM generation (CycloneDX, SPDX)
- Security incident creation
- MR blocking for CVSS ≥7.0

**LLM:** Anthropic Claude Sonnet 4 (fallback: GPT-4o)

**Compliance:** FedRAMP Moderate, SOC2 Type 2

**Tools:** scan_vulnerabilities, apply_patches, verify_fixes, create_incidents, generate_sbom, block_merge

**Usage Example:**
```bash
# Automatically scans code on commit
# Blocks merges for critical vulnerabilities
# Generates SBOM for compliance
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

## Workers

Workers are specialized agents that perform specific tasks in their domain.

### bot-ossa-validator

**Version:** 1.0.0
**Domain:** ossa → validation → schema-validation
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/bot-ossa-validator.ossa.yaml`

Validates OSSA manifests against the schema specification. Ensures compliance with OSSA v0.3.0 standards and best practices.

**Key Capabilities:**
- Schema validation
- Manifest linting
- Compliance checking
- Migration assistance

**LLM:** Anthropic Claude Sonnet 4 (20250514) (fallback: Claude 3.5 Sonnet)

**Commands:** validate, lint, diff, migrate

**Usage Example:**
```bash
# Triggered automatically on MR with .ossa.yaml changes
# /ossa validate --strict
# /ossa migrate --target-version 0.3.5
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### agent-optimizer-v035

**Version:** 1.0.0
**Domain:** platform → agent-optimization → v035_feature_completion
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/agent-optimizer-v035/manifest.ossa.yaml`

Optimizes all OSSA agents to leverage 100% of v0.3.5 features.

**Key Capabilities:**
- Adds MoE experts to agents
- Adds BAT framework
- Adds feedback loops
- Adds infrastructure substrate

**LLM:** Anthropic Claude Sonnet 4 (20250514)

**Usage Example:**
```bash
# Scans all agents for missing v0.3.5 features
# Automatically adds experts, BAT, feedback
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### branch-cleanup-agent

**Version:** 1.0.0
**Domain:** platform → automation → branch_cleanup_agent
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/branch-cleanup-agent/manifest.ossa.yaml`

Specialized agent for branch cleanup and repository maintenance.

**Key Capabilities:**
- Stale branch detection
- Automated branch cleanup
- Repository maintenance

**LLM:** Anthropic Claude Sonnet 4 (20250514)

**Usage Example:**
```bash
# Runs on schedule to clean up merged branches
# Removes stale feature branches
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### code-quality-fixer

**Version:** 1.0.0
**Domain:** platform → automation → code_quality_fixer
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/code-quality-fixer/manifest.ossa.yaml`

Specialized agent for code quality analysis and automated fixing.

**Key Capabilities:**
- Code quality analysis
- Automated fixing
- Linting and formatting

**LLM:** Anthropic Claude Sonnet 4 (20250514)

**Usage Example:**
```bash
# Automatically fixes linting errors
# Formats code to standards
# Provides quality reports
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### cost-optimizer

**Version:** 1.0.0
**Domain:** finops → cost-optimization → llm-cost-management
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/cost-optimizer/manifest.ossa.yaml`

Intelligent cost optimization agent that monitors and optimizes LLM costs across all OSSA agents. Leverages v0.3.5 MoE, BAT framework, and MOE metrics to achieve 30%+ cost reduction.

**Key Capabilities:**
- Real-time cost monitoring
- MoE expert selection optimization
- BAT framework technology selection
- Anomaly detection
- Budget enforcement
- Cost allocation

**LLM:** Anthropic Claude Haiku 4 (20250514) - Cost optimized!

**Tools:** get_agent_costs, analyze_cost_efficiency, optimize_expert_selection, optimize_bat_selection, detect_cost_anomalies, enforce_budget, generate_cost_report

**Target Metrics:**
- Cost reduction: 30%
- Optimization accuracy: 85%
- Budget compliance: 95%

**Usage Example:**
```bash
# Runs every 15 minutes to monitor costs
# Recommends optimal expert selection
# Alerts on budget violations
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure | ✅ MoE

---

### documentation-updater

**Version:** 1.0.0
**Domain:** platform → automation → documentation_updater
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/documentation-updater/manifest.ossa.yaml`

Specialized agent for documentation generation and updates.

**Key Capabilities:**
- Documentation generation
- Content updates
- Synchronization

**LLM:** Anthropic Claude Sonnet 4 (20250514)

**Usage Example:**
```bash
# Keeps documentation in sync with code
# Generates API documentation
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### drupal-migration-intelligence

**Version:** 1.0.0
**Domain:** migration → drupal → d7-to-d11
**Platform:** Drupal
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/drupal-migration-intelligence/agent.ossa.yaml`

Intelligent Drupal migration specialist for D7 to D11 migrations with automated assessment and planning.

**Key Capabilities:**
- Migration readiness assessment
- Migration plan generation
- Content migration execution
- Migration validation

**LLM:** Anthropic Claude Sonnet 4 (fallback: GPT-4o)

**Tools:** assess_drupal_site, generate_migration_plan, execute_content_migration, validate_migration

**Usage Example:**
```bash
# Assesses Drupal 7 site for migration
# Generates comprehensive migration plan
# Executes and validates content migration
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### drupal-module-developer

**Version:** 1.0.0
**Domain:** development → drupal → module-development
**Platform:** Drupal
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/drupal-module-developer/agent.ossa.yaml`

Advanced Drupal module development specialist with AI-powered code generation and best practices.

**Key Capabilities:**
- Module scaffolding
- Custom entity creation
- REST API endpoint generation
- Form API generation
- Plugin system creation

**LLM:** Anthropic Claude Sonnet 4 (fallback: GPT-4o)

**Tools:** generate_module_scaffold, create_custom_entity, build_api_endpoint, generate_form_api, create_plugin_system

**Usage Example:**
```bash
# /scaffold module my_module --type=custom_entity
# /scaffold entity my_entity --bundle=true --revisionable=true
# /scaffold form my_form --type=config --ajax=true
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### drupal-security-compliance

**Version:** 1.0.0
**Domain:** security → compliance → drupal-security
**Platform:** Drupal
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/drupal-security-compliance/agent.ossa.yaml`

Drupal security and compliance specialist for FedRAMP, NIST, and enterprise security requirements.

**Key Capabilities:**
- Comprehensive security audits
- Vulnerability scanning
- Compliance assessment
- Security hardening configuration

**LLM:** Anthropic Claude Sonnet 4 (fallback: GPT-4o)

**Compliance Frameworks:** FedRAMP, NIST CSF, NIST 800-53, SOX, HIPAA, GDPR, WCAG AA

**Tools:** security_audit, vulnerability_scan, compliance_assessment, generate_security_hardening

**Usage Example:**
```bash
# Audit Drupal site for FedRAMP compliance
# Scan for vulnerabilities in core and contrib
# Generate security hardening configurations
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

### skills-completer

**Version:** 1.0.0
**Domain:** platform → automation → skills_completer
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workers/skills-completer/manifest.ossa.yaml`

Specialized agent for skill completion and management.

**Key Capabilities:**
- Skill completion
- Skill management

**LLM:** Anthropic Claude Sonnet 4 (20250514)

**Usage Example:**
```bash
# Completes partial implementations
# Manages skill registry
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

## Workflows

Workflows orchestrate multi-step processes and route events to appropriate agents.

### mr-agent-router

**Version:** 1.0.0
**Kind:** Workflow
**Domain:** gitlab → merge-requests → routing
**File:** `/Users/thomas.scola/Sites/Agent-platform/openstandardagents/.agents/workflows/mr-agent-router.ossa.yaml`

Routes GitLab MR events to OSSA agents based on file changes, commands, and mentions.

**Key Capabilities:**
- Event parsing and routing
- Agent mention handling (@agent-name)
- Auto-dispatch by file type
- Response aggregation
- MR comment posting

**Triggers:** merge_request (open, update, reopen), note (comments)

**Routing Logic:**
- OSSA files → bot-ossa-validator
- Drupal files → bot-drupal-standards
- CI files → bot-gitlab-ci-fixer
- Recipe files → bot-drupal-recipe-scaffolder
- Config files → bot-config-auditor

**Command Mapping:**
```bash
/review → bot-mr-reviewer
/ossa validate → bot-ossa-validator
/ci validate → bot-gitlab-ci-fixer
/drupal check → bot-drupal-standards
/scaffold module → bot-module-scaffolder
```

**Usage Example:**
```bash
# Automatically triggered on MR events
# Comment: @bot-ossa-validator /validate --strict
# Auto-routes based on file changes
```

**v0.3.5 Features:** ✅ Experts | ✅ BAT | ✅ Feedback | ✅ Infrastructure

---

## Statistics

### By Tier
- **Workers:** 10 agents
- **Orchestrators:** 1 agent
- **Healers:** 2 agents
- **Workflows:** 1 workflow

### By Domain
- **Platform:** 6 agents (automation, optimization)
- **Security:** 2 agents (vulnerability management, compliance)
- **Drupal:** 3 agents (migration, development, security)
- **Orchestration:** 1 agent (agent management)
- **Specification:** 1 agent (schema validation)
- **FinOps:** 1 agent (cost optimization)
- **GitLab:** 1 workflow (routing)
- **OSSA:** 1 agent (validation)

### LLM Providers
- **Anthropic:** 13 agents
  - Claude Sonnet 4: 9 agents (primary)
  - Claude Sonnet 4 (20250514): 4 agents
  - Claude Haiku 4 (20250514): 1 agent (cost-optimizer)
- **Fallback Models:** GPT-4o (6 agents)

### Compliance
- **100% v0.3.5 Compliant:** All 14 agents
- **Experts Extension:** 14/14 (100%)
- **BAT Framework:** 14/14 (100%)
- **Feedback Loops:** 14/14 (100%)
- **Infrastructure Substrate:** 14/14 (100%)
- **MoE Metrics:** 3/14 (21%)
- **Checkpointing:** 14/14 (100%)
- **Completion Signals:** 14/14 (100%)

---

## Getting Started

### Using Agents

1. **Via MR Comments:**
   ```bash
   @agent-name /command --options
   ```

2. **Via GitLab Duo:**
   ```bash
   /automate/ossa-agents/:agent-name
   ```

3. **Via Agent Mesh:**
   ```bash
   curl mesh.blueflyagents.com:3005/invoke/:agent-name
   ```

### File-Based Triggers

Agents automatically trigger based on file changes in MRs:

- `**/*.ossa.yaml` → bot-ossa-validator
- `web/modules/**/*` → bot-drupal-standards
- `.gitlab-ci.yml` → bot-gitlab-ci-fixer
- `recipes/**/*` → bot-drupal-recipe-scaffolder
- `config/**/*.yml` → bot-config-auditor

### Adding New Agents

1. Create manifest in appropriate tier directory:
   ```
   .agents/workers/my-agent/manifest.ossa.yaml
   ```

2. Ensure v0.3.5 compliance:
   - ✅ experts extension
   - ✅ bat framework
   - ✅ feedback loops
   - ✅ infrastructure substrate
   - ✅ checkpointing
   - ✅ completion signals

3. Register with meta-orchestrator

4. Update mr-agent-router workflow mapping

---

**Catalog Version:** 1.0.0
**Last Updated:** 2026-01-16
**Maintained By:** OpenStandardAgents.org
