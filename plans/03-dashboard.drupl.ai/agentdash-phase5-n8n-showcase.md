# [AgentDash] Phase 5 - n8n workflows and wiki runbook

Priority: high
Project: blueflyio/agent-platform/tools/agent-buildkit
Branch: release/v0.1.x

## Spec / Deliverables

Create n8n workflow: Webhook (GitLab push/MR) -> HTTP to Drupal POST /orchestration/service/execute with body dragonfly_client:trigger_test and config. Optionally HTTP to workflow-engine execute-by-name. Second flow: HTTP GET DRUPAL_BASE/orchestration/services then Execute service nodes. Publish runbook to GitLab Wiki (agent-buildkit or technical-docs) "AgentDash orchestration and n8n" with both flows, permissions, and how to add Tools. No new .md in repo roots.
