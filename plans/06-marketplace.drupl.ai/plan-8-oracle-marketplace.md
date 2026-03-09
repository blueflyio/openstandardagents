# [13-plans] Oracle Deploy Phase 2: migrate Drupal_AgentMarketplace to buildkit

Priority: high
Project: agent-buildkit
Branch: release/v0.1.x

## Spec / Deliverables

Ensure deploy-services.config.ts (or hosted-apps-registry) has agent-marketplace with oraclePath; deploy oracle agent-marketplace uses clone/pull and DDEV start at that path. Fix any missing vars (ORACLE_SSH_HOST etc). Document in wiki or AGENTS.md. No new .sh.
