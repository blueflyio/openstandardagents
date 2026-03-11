---
name: ci-fix
description: "**CI Fixer Worker Agent**: Monitors and automatically fixes failing CI/CD pipelines. Analyzes failure logs, identifies root causes, applies automated fixes, optimizes pipeline performance, manages GitLab CI components, and enforces quality gates. - MANDATORY TRIGGERS: CI, pipeline, build failed, job failed, GitLab CI, fix pipeline, pipeline error, CI/CD, build error, test failed, pipeline broken, fix my build, why did CI fail, debug pipeline, pipeline timeout, runner issue"
license: "Apache-2.0"
compatibility: "Requires git, glab CLI, GitLab API access. Environment: GITLAB_TOKEN, GITLAB_HOST"
allowed-tools: "Bash(git:*) Bash(glab:*) Read Edit WebFetch Task mcp__gitlab__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/ci-fixer-worker/agent.ossa.yaml
  service_account: bot-gitlab-ci-fixer
  service_account_id: 31840513
  domain: gitlab
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# CI Fixer Worker Agent Skill

**OSSA Agent**: `ci-fixer-worker` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **ci-fixer-worker** OSSA agent for comprehensive CI/CD pipeline analysis, failure diagnosis, automatic fixes, and performance optimization.

## Quick Start

```bash
# Install OSSA SDK
npm i @bluefly/openstandardagents

# Authenticate with GitLab
export GITLAB_TOKEN=$(cat ~/.tokens/gitlab)
export GITLAB_HOST=gitlab.com
```

## Agent Capabilities (from OSSA Manifest)

### Analysis Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `failure-analysis` | reasoning | fully_autonomous | Analyze pipeline failure logs and identify root cause |
| `pipeline_analysis` | reasoning | fully_autonomous | Analyze pipeline structure and performance |
| `error_diagnosis` | reasoning | fully_autonomous | Diagnose pipeline errors with pattern matching |
| `config_validation` | reasoning | fully_autonomous | Validate .gitlab-ci.yml configuration |
| `test_failure_analysis` | reasoning | fully_autonomous | Analyze test failures and suggest fixes |

### Fix Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `auto-fix` | action | fully_autonomous | Apply automated fixes for common failures |
| `pipeline-optimization` | reasoning | fully_autonomous | Optimize pipeline performance and caching |
| `component-management` | action | fully_autonomous | Manage GitLab CI component library |

### Quality Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `quality-gate-enforcement` | action | fully_autonomous | Enforce quality gates across pipelines |
| `dependency_resolution` | reasoning | fully_autonomous | Resolve dependency issues |
| `fix_generation` | action | fully_autonomous | Generate fix suggestions |
| `retry_recommendation` | reasoning | fully_autonomous | Recommend retry strategies |

## Common Failure Patterns

The agent recognizes and fixes these patterns:

```yaml
failure_patterns:
  npm_errors:
    pattern: "npm ERR! (code|errno)"
    fixes:
      - "npm cache clean --force"
      - "rm -rf node_modules && npm ci"
      - "Check package-lock.json conflicts"

  docker_errors:
    pattern: "(Cannot connect to Docker|docker: not found)"
    fixes:
      - "Enable Docker-in-Docker service"
      - "Use kaniko for rootless builds"

  memory_errors:
    pattern: "(JavaScript heap out of memory|OOMKilled)"
    fixes:
      - "Increase NODE_OPTIONS=--max-old-space-size"
      - "Request more memory in job resources"

  timeout_errors:
    pattern: "(Job timed out|deadline exceeded)"
    fixes:
      - "Increase job timeout"
      - "Enable parallel execution"
      - "Add caching for dependencies"

  test_failures:
    pattern: "(FAIL|AssertionError|Expected.*but got)"
    fixes:
      - "Analyze test output for specific failure"
      - "Check for flaky tests"
      - "Verify test data fixtures"
```

## Complete Workflow

### Phase 1: Identify Failed Pipeline

```bash
# Get recent pipelines
GITLAB_HOST=gitlab.com glab ci list --repo <project>

# View specific pipeline
GITLAB_HOST=gitlab.com glab ci view <pipeline-id> --repo <project>

# Get failed jobs
GITLAB_HOST=gitlab.com glab api "projects/:id/pipelines/:pipeline_id/jobs" \
  | jq '.[] | select(.status == "failed")'
```

### Phase 2: Analyze Failure Logs

```bash
# Get job trace (logs)
GITLAB_HOST=gitlab.com glab api "projects/:id/jobs/:job_id/trace"

# Get job details
GITLAB_HOST=gitlab.com glab api "projects/:id/jobs/:job_id"
```

### Phase 3: Diagnose Root Cause

1. **Parse error messages** from job trace
2. **Match against known patterns**
3. **Check dependency versions**
4. **Verify runner configuration**
5. **Analyze resource usage**

### Phase 4: Apply Fix

```bash
# Retry job with new variables
glab ci retry --repo <project> <job-id>

# Or apply config fix
# Edit .gitlab-ci.yml
git add .gitlab-ci.yml
git commit -m "fix(ci): resolve npm memory issue"
git push
```

### Phase 5: Generate Report

```markdown
## CI Pipeline Fix Report

### Pipeline: #<pipeline-id>
- **Status**: Fixed
- **Failed Job**: <job-name>
- **Root Cause**: npm memory exceeded

### Diagnosis
The build job failed with "JavaScript heap out of memory" error.
Node.js default heap is 512MB which is insufficient for this build.

### Applied Fix
```yaml
build:
  variables:
    NODE_OPTIONS: "--max-old-space-size=4096"
```

### Prevention
- Consider splitting the build into parallel jobs
- Enable incremental builds
- Add dependency caching
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read:code
    - read:repository
    - read:pipelines
    - read:jobs
    - write:merge_requests
    - read:ci_config
    - write:ci_config
    - read:api
    - admin:cicd
  prohibited:
    - delete:production
    - write:protected_branches
    - cancel:pipelines
```

## CI Component Library

The agent manages reusable GitLab CI components:

```yaml
# Include from component library
include:
  - component: $CI_SERVER_FQDN/blueflyio/agent-platform/gitlab_components/milestone-release@v0.1.4
    inputs:
      stage_validate: validate
      stage_release: release
```

## Observability Metrics

```yaml
custom_metrics:
  - name: pipelines_fixed
    type: counter
    description: "Number of pipelines fixed"
  - name: fix_success_rate
    type: gauge
    description: "Success rate of applied fixes"
  - name: time_to_fix_seconds
    type: histogram
    description: "Time to fix pipeline issues"
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Fix my CI pipeline"
- "Why did the build fail?"
- "Debug pipeline #12345"
- "Pipeline timeout in project X"
- "Help with GitLab CI error"

## Examples

### Fix Failed Build
```
User: Fix the failed pipeline in platform-agents
Agent: Fetching pipeline status... Analyzing failure logs...
       Found: npm memory error. Applying fix...
```

### Diagnose Flaky Tests
```
User: Why does my test job keep failing randomly?
Agent: Analyzing test patterns... Detected flaky test: test_user_auth
       Recommendation: Add retry:2 to test job
```

### Optimize Slow Pipeline
```
User: My pipeline takes 30 minutes, can we speed it up?
Agent: Analyzing pipeline structure...
       Recommendations:
       1. Enable parallel jobs
       2. Add npm cache
       3. Use smaller Docker image
```

## Service Account

- **Account**: bot-gitlab-ci-fixer
- **ID**: 31840513
- **Group**: blueflyio
- **Permissions**: Developer (write to CI config)

## Related Agents

- `mr-reviewer` - Review MR after CI fix
- `release-manager` - Manage releases after pipeline success
- `security-scanner` - Scan pipeline for security issues

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [GitLab CI/CD Docs](https://docs.gitlab.com/ee/ci/)
- [GitLab Components](https://docs.gitlab.com/ee/ci/components/)
