---
name: issue
description: "**Issue Worker Agent**: Autonomous issue implementation from analysis to merge request. Analyzes issue requirements, designs solutions, implements code changes, creates tests, submits merge requests, and responds to review feedback. Full issue lifecycle management with priority analysis and duplicate detection. - MANDATORY TRIGGERS: issue, ticket, bug, feature request, triage, implement issue, work on issue, fix bug, create issue, GitLab issue, pick up issue, start working on, implement feature, close issue, resolve issue"
license: "Apache-2.0"
compatibility: "Requires git, glab CLI, GitLab API access. Environment: GITLAB_TOKEN, GITLAB_HOST"
allowed-tools: "Bash(git:*) Bash(glab:*) Read Edit Write Task mcp__gitlab__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/issue-worker/agent.ossa.yaml
  service_account: bot-issue-worker
  service_account_id: pending
  domain: workflow
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# Issue Worker Agent Skill

**OSSA Agent**: `issue-worker` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **issue-worker** OSSA agent for autonomous issue implementation, from requirements analysis to merge request submission.

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
| `issue-analysis` | reasoning | fully_autonomous | Analyze issue requirements and scope |
| `solution-design` | reasoning | fully_autonomous | Design implementation approach |
| `priority_analysis` | reasoning | fully_autonomous | Analyze and assign priority (MoSCoW/RICE) |
| `duplicate_detection` | reasoning | fully_autonomous | Detect duplicate issues |
| `risk-assessment` | reasoning | fully_autonomous | Assess risk level of code changes |

### Implementation Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `code-implementation` | action | fully_autonomous | Implement code changes |
| `test-creation` | action | fully_autonomous | Create tests for implementation |
| `mr-creation` | action | fully_autonomous | Create merge request with changes |
| `feedback-response` | action | fully_autonomous | Respond to review feedback |

### Management Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `issue_triage` | action | fully_autonomous | Triage incoming issues |
| `label_management` | action | fully_autonomous | Manage issue labels |
| `milestone_tracking` | reasoning | fully_autonomous | Track milestone progress |
| `issue_summarization` | reasoning | fully_autonomous | Summarize issues |
| `workload_analysis` | reasoning | fully_autonomous | Analyze team workload |
| `board_organization` | action | fully_autonomous | Organize issue boards |

### Tracking Capabilities
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `execution-tracking` | action | fully_autonomous | Track task execution progress |
| `performance-metrics` | action | fully_autonomous | Emit performance metrics |

## Complete Issue Workflow

### Phase 1: Issue Analysis

```bash
# View issue details
GITLAB_HOST=gitlab.com glab issue view <issue-id> --repo <project>

# Get issue discussions
glab api "projects/:id/issues/:iid/discussions"
```

**Analysis Questions:**
1. What is the core requirement?
2. What files need modification?
3. What tests are needed?
4. What are the acceptance criteria?
5. Are there dependencies on other issues?

### Phase 2: Solution Design

```markdown
## Solution Design for #<issue-id>

### Requirements
- [Extracted from issue]

### Affected Files
- src/module/file.ts - Add new function
- tests/module/file.test.ts - New test suite

### Implementation Approach
1. Step 1: [Description]
2. Step 2: [Description]

### Test Plan
- Unit tests for new function
- Integration test for workflow

### Risk Assessment
- Risk Level: LOW
- Rollback: Revert commit
```

### Phase 3: Create Worktree

```bash
# Create branch via GitLab (auto-links to issue)
# On GitLab: Issue → Create merge request

# Fetch and create worktree
git fetch origin
git worktree add ../worktrees/<branch-name> <branch-name>
cd ../worktrees/<branch-name>
```

### Phase 4: Implement Solution

1. **Read existing code** to understand context
2. **Implement changes** following project standards
3. **Write tests** with full coverage
4. **Update documentation** if needed

### Phase 5: Create Merge Request

```bash
# Stage and commit
git add .
git commit -m "feat(#<issue-id>): implement feature X

- Add new function for Y
- Include unit tests
- Update documentation

Closes #<issue-id>"

# Push
git push -u origin <branch-name>

# MR already exists from issue creation
glab mr view
```

### Phase 6: Respond to Feedback

```bash
# View MR discussions
glab api "projects/:id/merge_requests/:iid/discussions"

# Make requested changes
git add .
git commit -m "fix: address review feedback"
git push
```

## Priority Framework (MoSCoW + RICE)

```yaml
priority:
  moscow:
    must: "Critical for release"
    should: "Important but not critical"
    could: "Nice to have"
    wont: "Out of scope"

  rice:
    reach: "How many users affected (1-1000)"
    impact: "How much impact (0.25, 0.5, 1, 2, 3)"
    confidence: "How confident (0.5, 0.8, 1.0)"
    effort: "Person-weeks (1-10)"
    score: "(reach * impact * confidence) / effort"
```

## Issue Templates

### Bug Report Analysis
```markdown
### Bug: #<issue-id>

**Reproduction Steps**
1. [Step from issue]

**Expected vs Actual**
- Expected: [X]
- Actual: [Y]

**Root Cause**
[Analysis]

**Fix**
[Implementation plan]
```

### Feature Request Analysis
```markdown
### Feature: #<issue-id>

**User Story**
As a [role], I want [feature] so that [benefit]

**Acceptance Criteria**
- [ ] Criterion 1
- [ ] Criterion 2

**Technical Design**
[Architecture]
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_2_write_limited
  permissions:
    - read:code
    - read:repository
    - read:issues
    - read:labels
    - read:milestones
    - write:repository
    - write:merge_requests
    - write:issues
    - read:api
  prohibited:
    - write:credentials
    - delete:repository
    - write:protected_branches
```

## Observability Metrics

```yaml
custom_metrics:
  - name: task_start_time
    type: gauge
    description: "Timestamp when task execution started"
  - name: task_completion_time
    type: gauge
    description: "Timestamp when task execution completed"
  - name: task_duration_seconds
    type: histogram
    description: "Task execution duration in seconds"
  - name: task_success_rate
    type: counter
    description: "Number of successfully completed tasks"
  - name: task_failure_rate
    type: counter
    description: "Number of failed tasks"
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Work on issue #123"
- "Implement feature request #456"
- "Fix bug #789"
- "Pick up the next issue"
- "Triage new issues"

## Examples

### Implement Issue
```
User: Work on issue #123 in platform-agents
Agent: Fetching issue details...
       Analyzing requirements...
       Creating solution design...
       [Implements changes]
       Creating MR... Done!
       MR: !150 linked to #123
```

### Triage Issues
```
User: Triage new issues in the project
Agent: Found 5 new issues
       #124: Bug - HIGH priority, duplicate of #100
       #125: Feature - MEDIUM priority, needs clarification
       [Updates labels and priorities]
```

### Track Progress
```
User: What's the status of milestone v1.3?
Agent: Milestone v1.3: 75% complete
       - 15/20 issues closed
       - 3 in progress
       - 2 blocked
```

## Service Account

- **Account**: bot-issue-worker
- **Group**: blueflyio
- **Permissions**: Developer (create MRs, update issues)

## Related Agents

- `mr-reviewer` - Review the MR created by issue-worker
- `ci-fixer-worker` - Fix any CI failures
- `code-reviewer` - Deep code analysis

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [GitLab Issues API](https://docs.gitlab.com/ee/api/issues.html)
- [Issue Workflow Best Practices](https://gitlab.com/blueflyio/agent-platform/technical-docs/-/wikis/)
