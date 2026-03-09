# [13-plans] Oracle Deploy: fix agent-brain CI include path if 404

Priority: medium
Project: gitlab_components
Branch: release/v0.1.x

## Spec / Deliverables

If agent-brain pipeline 404s on component include, use full path blueflyio/agent-platform/tools/gitlab_components (or blueflyio/agent-platform/services/agent-brain as appropriate). Check .gitlab-ci.yml in agent-brain repo; add or fix include ref. One-line fix.
