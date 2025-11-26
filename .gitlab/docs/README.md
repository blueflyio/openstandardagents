# OSSA Internal Documentation

Internal documentation for OSSA project development, infrastructure, and processes.

**This documentation is NOT synced to the public website.**

## Structure

### `/development`
Development workflows, coding standards, and contributor guides for the OSSA project itself.

**Key documents:**
- **VERSIONING.md** - Automated version management (NEVER manually update versions)

### `/releases`
Release management, versioning strategy, and release checklists for OSSA versions.

### `/infrastructure`
Internal infrastructure setup: CI/CD pipelines, GitLab agents, Kubernetes deployments, monitoring.

**Key documents:**
- **GitHub Mirroring** - See GitLab Wiki: [Deployment/GitHub-Mirroring](https://gitlab.com/blueflyio/openstandardagents/-/wikis/Deployment/GitHub-Mirroring)

### `/processes`
Internal processes: issue triage, PR review, security response, governance decisions.

## Public vs Internal Docs

**Public Docs** (GitLab Wiki → Website)
- OSSA specification and standard
- Usage guides and tutorials
- API reference
- Migration guides
- Community contribution guidelines

**Internal Docs** (This directory)
- How we build and release OSSA
- Internal tooling and automation
- Infrastructure setup
- Project governance and processes

## Editing

Internal docs are version controlled in `.gitlab/docs/`. Edit directly and commit to the repository.

Public docs are managed in the GitLab Wiki and synced to the website during build.
