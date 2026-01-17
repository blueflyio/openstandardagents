# Archived CI Files

These CI configuration files were archived on 2025-12-28 as part of Issue #374 cleanup.

## Why Archived

These files were not included in `.gitlab-ci.yml` and were causing:
- Maintenance confusion
- ~3,500 lines of dead YAML
- Difficulty understanding active CI configuration

## Files

| File | Original Purpose |
|------|------------------|
| agent-integration.yml | Agent integration tests |
| analytics.yml | Analytics pipeline |
| auto-release.yml | Automated release (superseded by release-jobs.yml) |
| autonomous-evolution.yml | Self-evolving agent experiments |
| autonomous-workflows.yml | Autonomous workflow experiments |
| autoscaler-setup.yml | Runner autoscaler configuration |
| complete-deployment.yml | Full deployment pipeline |
| docs-generation.yml | Documentation generation |
| evolution-dashboard.yml | Evolution metrics dashboard |
| intelligence-automation.yml | AI-driven automation experiments |
| mirror-github.yml | GitHub mirroring (superseded by mirror-jobs.yml) |
| ossa-integration.yml | OSSA integration tests |
| pages.yml | GitLab Pages deployment |
| predictive-analysis.yml | Predictive analytics experiments |
| release-automation.yml | Release automation (superseded) |
| release-environments.yml | Release environment setup |
| resource-validation.yml | Resource validation |
| review-app.yml | Review app deployment |
| runner-maintenance.yml | Runner maintenance jobs |
| runner-optimization.yml | Runner optimization |
| scheduled-research.yml | Scheduled research jobs |
| schema-automation.yml | Schema automation |
| self-evolving.yml | Self-evolving experiments |
| self-healing-setup.yml | Self-healing infrastructure setup |
| self-healing.yml | Self-healing jobs |
| validate-documentation.yml | Documentation validation |
| validate-no-hardcoded-models.yml | Model validation |
| version-sync.yml | Version synchronization |

## Restoration

To restore a file, move it back to `.gitlab/ci/` and add an include in `.gitlab-ci.yml`:

```yaml
include:
  - local: '.gitlab/ci/<filename>.yml'
```

## Related

- Issue #374: Major Workflow Issues
- MR: CI cleanup and dead code removal
