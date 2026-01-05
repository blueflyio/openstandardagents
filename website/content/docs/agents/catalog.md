---
title: "Agent Catalog"
---

# Agent Catalog

## Overview

Comprehensive catalog of OSSA-compliant agents available in the platform.

## Agent Roster

### Code & Component Agents
- **bot-ci-pipeline**: CI/CD pipeline management
- **bot-gitlab-ci-fixer**: GitLab CI configuration fixes
- **bot-architecture-validator**: Architecture compliance validation

### Documentation & Content Agents
- **bot-wiki-sync**: Wiki synchronization
- **bot-docs-sync**: Documentation synchronization
- **doc-validator**: Documentation validation

### Pipeline & CI Agents
- **bot-ci-pipeline**: Pipeline optimization
- **bot-test-generator**: Test generation
- **ci-automation**: CI/CD automation

### Platform, Standards & Validation Agents
- **bot-ossa-compliance**: OSSA compliance validation
- **bot-ossa-validator**: OSSA manifest validation
- **bot-policy-enforcer**: Policy enforcement

### Issue & Merge Request Agents
- **issue-triage**: Issue triage and classification
- **mr-manager**: MR lifecycle management
- **bot-mr-reviewer**: Automated MR review

### Recipe & Drupal Automation Agents
- **drupal-automation**: Drupal-specific automation
- **recipe-validator**: Recipe validation

## Agent Interaction Matrix

### For Claude Code
- **bot-ossa-validator**: Validates OSSA manifests
- **bot-architecture-validator**: Validates architecture
- **bot-policy-enforcer**: Enforces policies

### Agent Invocation
- **Manual**: Trigger via GitLab UI or CLI
- **Automatic**: Triggered by webhooks/events
- **Scheduled**: Cron-based triggers

### Agent Deployment
- **Kubernetes**: Deployed as K8s deployments
- **GitLab Agent**: Integrated with GitLab Agent
- **Local**: Development/testing mode

## Usage Guidelines

### Manual Invocation
```bash
# Via GitLab UI
# Navigate to CI/CD → Pipelines → Run Pipeline
# Select agent job and trigger

# Via CLI
glab ci run --job agent:bot-ossa-validator
```

### Automatic Invocation
- Webhook triggers (issue/MR events)
- Scheduled pipelines (cron)
- Pipeline dependencies

### Monitoring
- Check agent execution logs
- View metrics in observability dashboard
- Monitor agent health status

## Related Documentation

- [Agent Deployment](../deployment/index.md)
- [Agent Invocation](../runtime/lifecycle.md)
- [Agent Monitoring](../runtime/observability.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
