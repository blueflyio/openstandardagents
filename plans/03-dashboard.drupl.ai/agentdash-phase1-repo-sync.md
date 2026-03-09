# [AgentDash] Phase 1 - Repo sync and baseline; validate then push release

Priority: high
Project: blueflyio/agent-platform/agentdashboard/demo_agentdash
Branch: release/v0.1.x

## Spec / Deliverables

Merge to release and push per Feature-merge-release-validate. For each custom module under AgentDash (separate git repo in web/modules/custom/*): merge latest into that repo's release branch, run local validation (ddev composer validate, drush cr), then push. For demo_agentdash root: merge feature into release/v0.1.x, validate, push. Use buildkit drupal sync-all from workspace root; no rebase, no force push. Then in Drupal_AgentDash root run ddev composer validate; confirm drupal/orchestration, flowdrop, tool, eca present; enable all orchestration submodules so GET /orchestration/services lists every provider.
