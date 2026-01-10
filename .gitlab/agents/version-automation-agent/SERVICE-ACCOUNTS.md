# Service Accounts Used by Version Automation Agent

This agent uses existing service accounts from the platform-agents repository.

## Primary Service Account

**@release-coordinator** - Used for all version automation operations
- **Purpose**: Version bumping, release coordination, MR creation
- **CI/CD Variable**: `SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN`
- **Scopes Required**: `api`, `write_repository`, `read_repository`
- **Role**: Maintainer

## Available Service Accounts (Platform Agents)

The following service accounts are available from platform-agents and can be used for related operations:

| Service Account | Purpose | Use Case |
|----------------|---------|----------|
| @release-coordinator | Release & version management | **Primary** - Version automation |
| @mr-reviewer | Merge request reviews | Code review after version bump |
| @code-quality-reviewer | Code quality checks | Quality validation |
| @pipeline-remediation | CI/CD fixes | Fix pipeline issues |
| @issue-lifecycle-manager | Issue management | Link issues to version MRs |
| @documentation-aggregator | Documentation sync | Update docs with new version |
| @ossa-validator | OSSA validation | Validate manifests |
| @vuln-scanner | Security scanning | Security checks |
| @cost-intelligence-monitor | Cost monitoring | Track version release costs |
| @cluster-operator | Kubernetes operations | Deploy version updates |
| @task-dispatcher | Task orchestration | Coordinate version tasks |
| @kagent-catalog-sync | Catalog sync | Sync agent catalogs |
| @mcp-server-builder | MCP builds | Build MCP servers |
| @drupal-standards-checker | Drupal standards | Drupal-specific checks |
| @module-generator | Module generation | Generate modules |
| @recipe-publisher | Recipe publishing | Publish recipes |

## Configuration

### CI/CD Variables

Set these in GitLab: Settings → CI/CD → Variables

```bash
# Primary service account for version automation
SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN=<token>  # Protected, Masked

# Optional: For related operations
SERVICE_ACCOUNT_MR_REVIEWER_TOKEN=<token>  # Protected, Masked
SERVICE_ACCOUNT_CODE_QUALITY_TOKEN=<token>  # Protected, Masked
```

### Token Priority

The agent uses this priority order:

1. `SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN` (preferred)
2. `GITLAB_TOKEN` (fallback)
3. `GITLAB_AGENT_TOKEN` (fallback)

## Usage in Pipeline

The version automation pipeline automatically uses `@release-coordinator`:

```yaml
# .gitlab/ci/version-automation-duo.yml
platform-agents:version-bump:
  variables:
    AGENT_SERVICE_ACCOUNT: @release-coordinator
    SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN: ${SERVICE_ACCOUNT_RELEASE_COORDINATOR_TOKEN}
```

## Integration with Other Agents

After version bump, you can chain other agents:

```yaml
# After version bump, trigger code quality review
code-quality-review:
  extends: .code_quality_base
  variables:
    AGENT_SERVICE_ACCOUNT: @code-quality-reviewer
    SERVICE_ACCOUNT_CODE_QUALITY_TOKEN: ${SERVICE_ACCOUNT_CODE_QUALITY_TOKEN}
  needs:
    - platform-agents:version-bump
```

## References

- [Platform Agents Repository](https://gitlab.com/blueflyio/platform-agents)
- [Service Accounts Documentation](../docs/SERVICE-ACCOUNTS-INTEGRATION.md)
- [GitLab Service Accounts](https://docs.gitlab.com/user/group/service_accounts/)
