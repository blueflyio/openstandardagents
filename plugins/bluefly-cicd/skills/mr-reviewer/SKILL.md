---
name: mr-review
description: "**MR Reviewer Agent**: AI-powered merge request analysis with code quality assessment, security vulnerability scanning, risk evaluation, test coverage validation, best practices enforcement, and automated approval recommendations. Provides inline comments, diff analysis, and auto-merge decisions. - MANDATORY TRIGGERS: MR, merge request, code review, PR, pull request, review changes, diff, approve MR, reject MR, review diff, GitLab MR, review my changes, check my MR, analyze merge request"
license: "Apache-2.0"
compatibility: "Requires git, glab CLI, GitLab API access. Environment: GITLAB_TOKEN, GITLAB_HOST"
allowed-tools: "Bash(git:*) Bash(glab:*) Read Edit WebFetch Task mcp__gitlab__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/mr-reviewer/agent.ossa.yaml
  service_account: bot-mr-reviewer
  service_account_id: pending
  domain: gitlab
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# MR Review Agent Skill

**OSSA Agent**: `mr-reviewer` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **mr-reviewer** OSSA agent for comprehensive merge request analysis, security scanning, risk assessment, and automated approval workflows.

## Quick Start

```bash
# Install OSSA SDK
npm i @bluefly/openstandardagents

# Authenticate with GitLab
export GITLAB_TOKEN=$(cat ~/.tokens/gitlab)
export GITLAB_HOST=gitlab.com
```

## Agent Capabilities (from OSSA Manifest)

### Core Review Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `code-review` | reasoning | fully_autonomous | Review code changes for quality and best practices |
| `security-review` | reasoning | fully_autonomous | Check for security vulnerabilities (SQL injection, XSS, secrets) |
| `diff_analysis` | reasoning | fully_autonomous | Analyze code diffs for structural changes |
| `style_checking` | reasoning | fully_autonomous | Validate code style compliance (ESLint, Prettier, PHPCS) |
| `best_practices_validation` | reasoning | fully_autonomous | Check adherence to language-specific best practices |

### Assessment Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `test-coverage-check` | reasoning | fully_autonomous | Validate test coverage meets thresholds (80%+ default) |
| `documentation-check` | reasoning | fully_autonomous | Ensure adequate documentation for public APIs |
| `risk-assessment` | reasoning | fully_autonomous | Assign risk score (0-10) based on change complexity |

### Action Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `comment-generation` | action | fully_autonomous | Generate inline review comments and suggestions |
| `approval-decision` | action | semi_autonomous | Decide on MR approval (requires human for critical) |
| `execution-tracking` | action | fully_autonomous | Track review progress and timing metrics |
| `auto-merge-recommendation` | action | fully_autonomous | Recommend auto-merge for low-risk changes |

## Security Patterns Detected

The agent scans for these security anti-patterns:

```yaml
security_patterns:
  secrets:
    - "glpat-[A-Za-z0-9]{20}"      # GitLab PAT
    - "ghp_[A-Za-z0-9]{36}"        # GitHub PAT
    - "sk-[A-Za-z0-9]{48}"         # OpenAI key
    - "ANTHROPIC_API_KEY"          # Anthropic
    - "password.*=.*['\"]"         # Hardcoded passwords

  sql_injection:
    - "\\$_(GET|POST|REQUEST).*query"
    - "mysql_query.*\\$"
    - "sprintf.*SELECT.*%s"

  xss:
    - "innerHTML.*=.*\\$"
    - "document.write.*\\$"
    - "echo.*\\$_(GET|POST)"
```

## Complete Workflow

### Phase 1: Fetch MR Details

```bash
# Get MR metadata
GITLAB_HOST=gitlab.com glab mr view <mr-id> --repo <project>

# Get full diff
GITLAB_HOST=gitlab.com glab mr diff <mr-id> --repo <project>

# Get pipeline status
GITLAB_HOST=gitlab.com glab mr view <mr-id> --repo <project> --web
```

### Phase 2: Analyze Changes

1. **Read all changed files** using the diff
2. **Check for security patterns** (secrets, SQL injection, XSS)
3. **Validate coding standards** per language
4. **Calculate test coverage** delta
5. **Assess breaking changes** for API modifications

### Phase 3: Risk Assessment Matrix

| Factor | Low (1-3) | Medium (4-6) | High (7-10) |
|--------|-----------|--------------|-------------|
| Files Changed | 1-5 | 6-15 | 16+ |
| Lines Changed | <100 | 100-500 | 500+ |
| Security Issues | 0 | 1-2 (non-critical) | Any critical |
| Breaking Changes | None | Deprecated APIs | Removed APIs |
| Test Coverage | >80% | 60-80% | <60% |

### Phase 4: Generate Review Report

```markdown
## MR Review: !<mr-id>

### Summary
- **Title**: [MR Title]
- **Author**: @username
- **Files Changed**: X
- **Lines**: +Y / -Z

### Risk Assessment: [LOW|MEDIUM|HIGH|CRITICAL]
Risk Score: X/10

### Security Audit
- [ ] No secrets exposed
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No hardcoded credentials
- [ ] Dependencies up to date

### Code Quality
- [ ] Follows coding standards (PHPCS/ESLint score: X%)
- [ ] Adequate test coverage (current: X%, required: 80%)
- [ ] Documentation updated for public APIs
- [ ] No console.log/print statements in production code

### Breaking Changes
[List any API changes, removed methods, schema changes]

### Inline Comments
[Link to specific line comments]

### Recommendation
**[APPROVE|REQUEST_CHANGES|COMMENT]**

Rationale: [Detailed explanation]
```

### Phase 5: Post Review

```bash
# Add inline comment
glab mr note <mr-id> --message "## Code Review Summary\n\n..."

# Add discussion on specific line
glab api "projects/:id/merge_requests/:mr_id/discussions" \
  --method POST \
  --field "body=Suggestion: Consider using..." \
  --field "position[base_sha]=..." \
  --field "position[start_sha]=..." \
  --field "position[head_sha]=..." \
  --field "position[position_type]=text" \
  --field "position[new_line]=42"

# Approve MR (if appropriate)
glab mr approve <mr-id>

# Request changes
glab mr note <mr-id> --message "## Changes Requested\n\n..."
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read:code
    - read:repository
    - read:merge_requests
    - write:merge_requests
    - write:comments
    - read:pipelines
    - read:api
  prohibited:
    - delete:production
    - write:protected_branches
    - merge:merge_requests  # Cannot self-merge
```

## Separation of Duties

```yaml
separation:
  role: reviewer
  conflicts_with:
    - code_author  # Reviewer cannot be the author
```

## Observability Metrics

```yaml
custom_metrics:
  - name: review_start_time
    type: gauge
    description: "Timestamp when review started"
  - name: review_completion_time
    type: gauge
    description: "Timestamp when review completed"
  - name: review_duration_seconds
    type: histogram
    description: "Review duration in seconds"
  - name: reviews_approved
    type: counter
    description: "Number of MRs approved"
  - name: reviews_rejected
    type: counter
    description: "Number of MRs rejected"
  - name: risk_score_assessed
    type: gauge
    description: "Risk score assigned to MR (0-10)"
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Review MR !150 in platform-agents"
- "Check my merge request"
- "Scan MR !42 for security vulnerabilities"
- "Analyze the diff in !99"
- "Should I approve this MR?"

## Examples

### Basic Review
```
User: Review MR !150 in blueflyio/platform-agents
Agent: Fetching MR details... [performs full review workflow]
```

### Security-Focused Review
```
User: Scan MR !42 for security issues
Agent: Running security scan... [focuses on security patterns]
```

### Quick Approval Check
```
User: Is MR !99 safe to merge?
Agent: Checking risk factors... [quick risk assessment]
```

## Service Account

- **Account**: bot-mr-reviewer
- **Group**: blueflyio
- **Permissions**: Reporter (read) + Comment/Approve
- **Created via**: GitLab API (pending creation)

## Related Agents

- `code-reviewer` - Deep code analysis without MR context
- `security-scanner` - Full security audit beyond MR scope
- `ci-fixer-worker` - Fix pipeline failures in the MR

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [GitLab MR API](https://docs.gitlab.com/ee/api/merge_requests.html)
- [glab CLI Reference](https://gitlab.com/gitlab-org/cli)
