---
name: agent-mr-reviewer
description: MR Reviewer – AI-powered merge request reviewer; code quality, security, best practices, automated comments, CI validation. Tier 2 write-limited.
metadata:
  short-description: Merge request review, code review, GitLab MR
triggers:
  - pattern: "mr review|merge request.*review|@mr-reviewer"
    priority: critical
  - pattern: "review.*MR|code review.*gitlab"
    priority: high
---

# MR Reviewer Agent Skill

Use when the user needs merge request review, automated code review comments, or GitLab MR quality/security checks. This agent reviews MRs and does not approve or merge (separation of duties).

## Agent summary

- **ID:** mr-reviewer
- **Domain:** gitlab
- **Tier:** worker (reviewer)
- **Service account:** agent-mr-reviewer (ID 32706577)
- **Manifest:** `platform-agents/packages/@ossa/mr-reviewer/manifest.ossa.yaml`
- **Repository:** https://gitlab.com/blueflyio/agent-platform/platform-agents

## What it does

- Reviews merge requests for code quality, security, and best practices
- Provides automated code review comments and suggests improvements
- Validates CI pipeline results before approval
- Risk assessment on MRs
- Tools: gitlab_api, diff_analyzer, security_scanner
- Access: tier_2_write_limited (read code/repo/MR, write comments; no merge, no protected branches)

## When to invoke

- User asks to review a merge request or "run mr reviewer"
- User mentions @mr-reviewer or MR review in GitLab context

## OSSA / Duo

- GitLab Duo: `.gitlab/duo/agents/mr-reviewer.yml`
- Separation: role reviewer; conflicts_with executor, approver; cannot approve/merge
