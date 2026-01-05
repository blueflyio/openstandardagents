---
title: "Entry Requirements"
---

# Entry Requirements

## Overview

Requirements that must be met before work can begin on an issue or MR.

## Issue Entry Requirements

### Required Fields
- **Title**: Clear, descriptive title
- **Description**: Detailed description
- **Type**: Issue type (bug/feature/docs)
- **Priority**: Priority level (P0-P3)
- **Labels**: Appropriate labels

### Required Labels
- `type::` (bug, feature, documentation, question)
- `priority::` (P0-critical, P1-high, P2-medium, P3-low)
- `domain::` (ci-cd, infrastructure, agents, etc.)

### Validation
- Issue template completed
- No duplicate issues
- Appropriate milestone assigned
- Team member assigned

## MR Entry Requirements

### Required Fields
- **Title**: Conventional commit format
- **Description**: MR description template
- **Issue Link**: Linked to GitLab issue
- **Milestone**: Version milestone assigned
- **Target Branch**: Correct target (release/*)

### Required Labels
- `type::` (feature, bugfix, chore, hotfix)
- `semver::` (major, minor, patch)
- `domain::` (matching issue domain)

### Validation
- Branch naming convention
- Commit message format
- Pipeline passing
- No merge conflicts
- All discussions resolved

## Required Fields for Agent Issues

### Agent-Specific Requirements
- **Agent Name**: Unique agent identifier
- **Agent Type**: worker, orchestrator, validator
- **Capabilities**: List of agent capabilities
- **OSSA Version**: Schema version (0.3.2)
- **Access Tier**: Tier 1, 2, or 3

### Validation
- OSSA manifest valid
- Schema compliance
- Access tier appropriate
- Taxonomy classification
- Security requirements met

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
