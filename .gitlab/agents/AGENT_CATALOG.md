# BlueFly.io Agent Catalog

**Last Updated**: 2025-12-07  
**Total Agents**: 15

## Agent Roster

### Code & Component Agents

#### Component Learning Agent (@bot-component-trainer)
- **Capabilities**: Pattern learning, component analysis
- **Triggers**: Component file changes
- **Purpose**: Learn from component patterns to improve scaffolding

#### Component Builder (@bot-component-builder)
- **Capabilities**: Component generation, template application
- **Triggers**: Manual invocation
- **Purpose**: Generate new components from learned patterns

#### Module Scaffolder (@bot-module-scaffolder)
- **Capabilities**: Module validation, structure checking, scaffolding
- **Triggers**: Module directory changes
- **Purpose**: Validate and scaffold Drupal modules

#### Canvas Builder (@bot-canvas-builder)
- **Capabilities**: Canvas/UI generation, layout creation
- **Triggers**: Manual invocation
- **Purpose**: Generate canvas and UI components

---

### Documentation & Content Agents

#### Docs Syncer (@bot-wiki-aggregator)
- **Capabilities**: Doc sync, wiki update, changelog generation
- **Triggers**: Markdown file changes, releases
- **Purpose**: Keep documentation in sync across wiki and repo

#### Content Auditor (@bot-content-auditor)
- **Capabilities**: Markdown validation, link checking, content quality
- **Triggers**: Documentation changes
- **Purpose**: Ensure documentation quality and accuracy

---

### Platform, Standards & Validation Agents

#### OSSA Validator (@bot-ossa-validator)
- **Capabilities**: Schema validation, manifest validation, compliance checking
- **Triggers**: .ossa.yaml file changes
- **Purpose**: Validate OSSA manifests against spec

#### Drupal Standards Checker (@bot-drupal-standards)
- **Capabilities**: PHPCS validation, Drupal best practices, code quality
- **Triggers**: PHP/module file changes
- **Purpose**: Enforce Drupal coding standards

#### Config Auditor (@bot-config-auditor)
- **Capabilities**: Config validation, security audit, breaking change detection
- **Triggers**: Config file changes
- **Purpose**: Audit configuration for security and correctness

---

### Pipeline & CI Agents

#### Pipeline Fixer (@bot-gitlab-ci-fixer)
- **Capabilities**: Pipeline validation, YAML syntax check, auto-fix common issues
- **Triggers**: .gitlab-ci.yml changes, pipeline failures
- **Purpose**: Validate and auto-fix CI/CD pipelines

---

### Recipe & Drupal Automation Agents

#### Recipe Publisher (@bot-drupal-recipe-pub)
- **Capabilities**: Recipe publishing, version management
- **Triggers**: Recipe merges to main
- **Purpose**: Publish validated Drupal recipes

#### Recipe Scaffolder (@bot-drupal-recipe-scaffolder)
- **Capabilities**: Recipe validation, dependency checking, scaffolding
- **Triggers**: Recipe directory changes
- **Purpose**: Validate and scaffold Drupal recipes

#### Theme Tester (@bot-theme-tester)
- **Capabilities**: Theme validation, visual regression testing
- **Triggers**: Theme file changes
- **Purpose**: Test Drupal themes for compatibility

---

### Issue & Merge Request Agents

#### Issue Worker (@bot-issue-worker)
- **Capabilities**: Issue triage, label assignment, milestone assignment, team notification
- **Triggers**: Issue created/updated
- **Purpose**: Automate issue management workflow

#### MR Reviewer (@bot-mr-reviewer)
- **Capabilities**: Code review, test validation, auto-approval, merge orchestration
- **Triggers**: MR created/updated
- **Purpose**: Comprehensive MR review and approval

---

## Agent Interaction Matrix

| Agent | Depends On | Notifies | Blocks |
|-------|------------|----------|--------|
| MR Reviewer | All validation agents | Issue Worker | None |
| OSSA Validator | None | MR Reviewer | MR Reviewer |
| Drupal Standards | None | MR Reviewer | MR Reviewer |
| Config Auditor | None | MR Reviewer | MR Reviewer |
| Pipeline Fixer | None | MR Reviewer | MR Reviewer |
| Docs Syncer | Content Auditor | None | None |
| Recipe Publisher | Recipe Scaffolder | None | None |

## Usage Guidelines

### For Claude Code

When performing automated tasks:

1. **Route to appropriate agent** based on file type:
   - `.ossa.yaml` → OSSA Validator
   - `.php`, `.module` → Drupal Standards
   - `.yml`, `config/` → Config Auditor
   - `.gitlab-ci.yml` → Pipeline Fixer
   - `.md`, `docs/` → Docs Syncer + Content Auditor
   - `recipes/` → Recipe Scaffolder
   - `components/` → Component Trainer
   - `modules/` → Module Scaffolder

2. **Use MR Reviewer** as orchestrator for final approval

3. **Use Issue Worker** for issue-based automation

4. **Never create new agents** - use only these 15

### Agent Invocation

```yaml
# In .gitlab/duo_workflow.yml
steps:
  - name: validate-ossa
    agent: bot-ossa-validator
    when: files.any(f => f.endsWith('.ossa.yaml'))
```

### Manual Invocation

```bash
# Via GitLab comment
/bot-mr-reviewer review this MR
/bot-ossa-validator check manifests
/bot-pipeline-fixer fix ci
```

## Agent Deployment

All agents deployed in k8s cluster:
- **Namespace**: `agent-platform`
- **Service**: Each agent has ClusterIP service
- **Secrets**: `gitlab-tokens`, `openai-key`

## Monitoring

- **Metrics**: Prometheus (agent-platform namespace)
- **Logs**: Loki (ossa-agents namespace)
- **Traces**: Tempo (ossa-agents namespace)
