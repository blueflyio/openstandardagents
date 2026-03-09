# [AgentDash] Phase 4 - FlowDrop generic Execute Tool node and ECA Execute Tool by id

Priority: high
Project: blueflyio/agent-platform/agentdashboard/demo_agentdash
Branch: release/v0.1.x

## Spec / Deliverables

Ensure generic Execute Tool (or Invoke Tool) FlowDrop node exists so any Tool plugin id can be invoked from FlowDrop (input tool_plugin_id, config). If only domain-specific nodes exist, add generic one (flowdrop_tool_provider from contrib or custom node calling ToolManager). Document or add ECA action Execute Tool by id. Document one canonical ECA or FlowDrop flow: on content publish run Cedar then Dragonfly then workflow-engine; publish as AgentDash native chain in wiki.
