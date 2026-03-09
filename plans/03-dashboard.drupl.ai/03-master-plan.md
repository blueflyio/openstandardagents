# 03 - AgentDash Master Plan (dashboard.drupl.ai)

## Context
AgentDash is the Drupal-based (Drupal 11) administrative control plane for the BlueFly Agent Platform. It serves as the visual interface for orchestration, repository synchronization, workflow building, and compliance monitoring.

## Core Features & Phased Rollout
1. **Phase 1: Repo Sync**
   - Import and synchronize GitLab repositories directly into Drupal entities for visibility into all agent codebases.
2. **Phase 2: Platform Import**
   - Connect and import external platform data (specifically BlueFly agent infrastructure elements).
3. **Phase 3: Orchestration Providers**
   - Unified orchestration layer supporting multiple backends: n8n, Kagent (Kubernetes agent operator), and AgentScope Runtime.
   - Drupal orchestrates triggers and job execution via `/orchestration/services` endpoints.
4. **Phase 4: FlowDrop ECA**
   - Integration with FlowDrop, a visual ECA (Event-Condition-Action) canvas builder plugin, allowing drag-and-drop workflow drawing directly within Drupal.
5. **Phase 5: n8n Showcase**
   - Embed n8n workflows directly into Drupal dashboards (via web components or secure iframes).

## Integrations & Ecosystem
- **Kagent-n8n-GitLab Gamechanger Workflow**:
  - GitLab Merge Request opens → Triggers n8n via webhook.
  - n8n securely calls Drupal orchestration API (`/orchestration/service/execute`).
  - Drupal commands Kagent (`ai_agents_kagent_sync_catalog`) to deploy/sync the CRDs to Kubernetes.
- **Drupal Recipes**:
  - AgentDash is deployed using the `recipe_agentdash` Drupal recipe, ensuring reproducible system state and module configuration.
- **Compliance & Security**:
  - **Module Audit**: custom modules must strictly use `http_client_manager` and Drupal's `Key` module for secrets (no hardcoded credentials or URLs).
  - **SOD Enforcement**: Grafana dashboards monitor Separation of Duties (SOD) Gate Decision Rates, violations by agent pairs, and gate latency across the platform.

## Demo Goals (DrupalCon)
- Showcase "AgentDash Live" connecting seamlessly to the agent marketplace.
- Demonstrate real-time GitOps workflows originating from Drupal UI and executing on K3s via Kagent.


## Implementation Status (Updated 2026-03-08)
- **Phase 1-2 (Repo/Platform Sync)**: [x] Core Drupal setup in `Drupal_AgentDashDeploy` is live.
- **Phase 3 (Orchestration Providers)**: [In Progress] Core orchestration structure exists but needs full n8n/Kagent unification.
- **Phase 4 (FlowDrop ECA)**: [In Progress] Pending drag-and-drop verification.
- **Phase 5 (n8n Showcase)**: [Pending]
- **Drupal Recipes**: [x] `recipe_agentdash` is implemented and available in the AgentDash deploy project.
- **Compliance**: [In Progress] Module audit for `http_client_manager` usage.
