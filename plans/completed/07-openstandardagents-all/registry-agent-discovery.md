# [Agent Registry] Ensure mesh discovery and MCP list_registry_agents stay in sync

Priority: medium
Project: platform-agents
Branch: release/v0.1.x

## Spec / Deliverables

Verify agent-protocol MCP tool platform.list_registry_agents returns the same agent list as registry.yaml. If mesh discovery is used elsewhere, ensure it reads from platform-agents or single source of truth.
