---
title: "Issue Lifecycle Automation"
---

# Issue Lifecycle Automation

## Overview

Automated issue lifecycle management with state transitions, label management, and milestone assignment.

## States

### Open → Assigned
- **Trigger**: Issue opened
- **Actions**:
  - Classify issue type (bug/feature/docs)
  - Auto-assign to team member based on expertise
  - Apply initial labels
  - Estimate weight

### Assigned → Validated
- **Trigger**: Issue template completed
- **Actions**:
  - Validate required fields
  - Check for duplicate issues
  - Verify issue completeness
  - Apply validation labels

### Validated → Merged
- **Trigger**: MR merged
- **Actions**:
  - Link MR to issue
  - Update issue status
  - Apply completion labels
  - Move to next milestone if applicable

### Merged → Closed
- **Trigger**: MR merged to main
- **Actions**:
  - Close issue automatically
  - Add release notes
  - Update changelog
  - Archive issue

## Required Labels by State

### Open State
- `type::` (bug, feature, documentation, question)
- `priority::` (P0-critical, P1-high, P2-medium, P3-low)

### Assigned State
- `assigned::` (username)
- `domain::` (ci-cd, infrastructure, agents, etc.)

### Validated State
- `validated::true`
- `ready::` (ready-for-work, ready-for-review)

### Merged State
- `merged::true`
- `release::` (v0.1.x, v0.2.x)

## Automation Rules

### Rule 1: New Issue Validation
- Validate issue template
- Check for required fields
- Apply initial labels
- Assign to triage agent

### Rule 2: Bot Assignment
- Analyze issue content
- Match to team expertise
- Auto-assign owner
- Set due date

### Rule 3: Branch Creation
- Create branch from issue
- Follow naming convention
- Link branch to issue
- Notify assignee

### Rule 4: MR Validation
- Validate MR requirements
- Check commit messages
- Verify branch naming
- Ensure issue linkage

### Rule 5: Pipeline Success
- Monitor pipeline status
- Update issue with results
- Apply labels based on outcome
- Notify stakeholders

### Rule 6: Merge Train Failure
- Detect merge train conflicts
- Notify team
- Create follow-up issue
- Update original issue

### Rule 7: Merge Completion
- Close linked issues
- Update milestones
- Generate release notes
- Archive completed work

### Rule 8: Release Tagging
- Create release tag
- Update version numbers
- Generate changelog
- Publish release notes

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
