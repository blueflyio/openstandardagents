---
title: "Milestone Automation"
---

# Milestone Automation

## Overview

Automated milestone management with sprint planning, weight tracking, and release coordination.

## Sprint Start (Every 2 weeks)

### Automation
- Create new milestone for next sprint
- Set due date (14 days from start)
- Copy open issues from previous milestone
- Assign sprint labels
- Notify team

### Configuration
```yaml
sprint_duration: 14 days
sprint_start_day: Monday
auto_create_milestone: true
copy_open_issues: true
```

## Sprint End (Milestone due date)

### Automation
- Close completed milestones
- Move incomplete issues to next milestone
- Generate sprint report
- Update release planning
- Archive completed work

### Reports
- Issues completed
- Issues remaining
- Weight distribution
- Velocity metrics

## Daily (Automated)

### Tasks
- Check milestone progress
- Update weight tracking
- Alert on milestone overload
- Suggest issue reassignment
- Generate daily status

### Schedule
- Runs daily at 2 AM UTC
- Checks all active milestones
- Updates progress metrics
- Sends team notifications

## Milestone Automation Rules

### Entry Requirements
- Issue must have weight estimate
- Issue must be assigned
- Issue must have labels
- Issue must be validated

### Auto-Merge Conditions
- All tests passing
- Code review approved
- Milestone weight available
- No blocking issues

### Merge Train Configuration
- Enable merge trains
- Set train size limit
- Configure conflict resolution
- Set auto-merge rules

### Failure Handling
- Retry failed pipelines
- Notify on merge conflicts
- Escalate blocking issues
- Create follow-up tasks

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
