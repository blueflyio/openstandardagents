# [AgentDash] Phase 3 - Add orchestration providers for alternative_services, layout_system_converter, drupal_patch_framework, external_migration

Priority: high
Project: blueflyio/agent-platform/agentdashboard/demo_agentdash
Branch: release/v0.1.x

## Spec / Deliverables

Add ServicesProvider for alternative_services (discover Tool plugins with prefix alternative_services:, alternative_router:, alternative_mcp:). Add layout_system_converter_orchestration submodule exposing layout_system_converter:* Tools. Add drupal_patch_framework_orchestration exposing drupal_patch_framework:* Tools. Add external_migration_orchestration (or provider in external_migration) for external_migration:* Tools. Reuse pattern from dragonfly_client_orchestration and code_executor_orchestration (ServicesProviderInterface, tag orchestration_services_provider). Edit in TESTING_DEMOs or per-plan in AgentDash custom; push from module repos.
