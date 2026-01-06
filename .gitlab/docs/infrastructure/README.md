# Infrastructure Documentation

Internal infrastructure setup for the OSSA project.

## GitLab Infrastructure

- **GitLab Agents** - Kubernetes agent configuration
- **CI/CD Pipelines** - Automated testing, security scanning, deployment
- **Release Automation** - Automated release workflows

## Documents

- `ossa-ci-cd-agents.md` - CI/CD agent configuration
- `gitlab-kubernetes-agents.md` - Kubernetes agent setup
- `ossa-agent-ecosystem-for-gitlab-kubernetes-deployments.md` - Full ecosystem architecture

## OpenAPI Specifications

Internal infrastructure API specs are in `openapi/`:
- `gitlab-agent.openapi.yaml` - GitLab agent integration API
- `gitlab-orchestrator.openapi.yaml` - GitLab orchestration API
- `release-automation.openapi.yaml` - Release automation API

## Related

- CI/CD configuration: `.gitlab-ci.yml`
- Agent configs: `.gitlab/agents/`
- Release automation: `.gitlab/release-automation/`
