# [AgentDash] Phase 2 - Run platform-import and verify gateway routes

Priority: high
Project: blueflyio/agent-platform/agentdashboard/demo_agentdash
Branch: release/v0.1.x

## Spec / Deliverables

From Drupal_AgentDash root with api_normalization and alternative_services enabled and ApiSchemaRegistryService endpoint https://api.blueflyagents.com: run ddev drush alternative_services:platform-import (optionally --tags for workflow-engine, dragonfly, compliance). Verify gateway routes and optional Tool generation. Ensure config in config sync; run platform-health and platform-routes --limit=20 to verify.
