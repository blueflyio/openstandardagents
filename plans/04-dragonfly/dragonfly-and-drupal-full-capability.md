# Dragonfly and Drupal at full capability

This page describes how to use **Dragonfly** (Drupal test orchestration service) with **Drupal** at full capability: Drupal AI, ECA, orchestration, FlowDrop, and the **dragonfly_client** tools. It is the single reference for integrating Dragonfly with Drupal workflows.

## Overview

- **Dragonfly** is a Node service that orchestrates Drupal test runs (PHPUnit, PHPCS, Playwright, Rector, compliance). It exposes a REST API and optional tenant API (GitLab project bootstrap via n8n).
- **dragonfly_client** is a Drupal module that provides an HTTP client to the Dragonfly API, Tool API plugins, ECA events/conditions/actions, optional alternative_services Provider, and dashboard blocks. All Dragonfly operations from Drupal go through dragonfly_client.

## Drupal AI (drupal/ai, ai_agents)

- Use **drupal/ai** for LLM provider configuration and **drupal/ai_agents** for agent definitions. Dragonfly does not replace these; it is a backend for test execution.
- **Agent Dash** and chatbot flows can call Dragonfly via the Tool API: attach the `dragonfly_client:trigger_test`, `dragonfly_client:list_projects`, or other dragonfly_client tools to an AI assistant so users can trigger tests or check status from chat.
- Route LLM requests through **agent-router** when configured; store API keys in **drupal/key**. Dragonfly API key (for server-to-server or CLI) is separate and configured in dragonfly_client settings.

## ECA (Event-Condition-Action)

dragonfly_client provides ECA building blocks so you can automate reactions to test runs and tenant lifecycle.

**Events:**

- **Dragonfly test completed** – Fires when a test run completes successfully. Tokens: `project_id`, `test_run_id`, `status`, `duration`.
- **Dragonfly test failed** – Fires when a test run fails.
- **Dragonfly compliance checked** – Fires when a compliance check finishes.
- **Dragonfly rector applied** – Fires when rector rules are applied.
- **Dragonfly tenant bootstrapped** – Fires when a tenant is bootstrapped (GitLab project linked to user). Tokens: `tenant_id`, `gitlab_project_path`.

**Conditions:**

- **Dragonfly tests passed** – Condition that evaluates whether the last test run passed.
- **Dragonfly project compliant** – Condition that evaluates compliance result.

**Actions:**

- **Bootstrap Dragonfly Tenant** – Calls the `dragonfly_client:bootstrap_tenant` tool with configurable token-based inputs (requested_slug, user_id, email). Sets result tokens (e.g. `bootstrap_success`, `bootstrap_tenant_id`, `bootstrap_gitlab_project_path`) and optionally dispatches the **Dragonfly tenant bootstrapped** event on success.
- **Execute Tool** (from external_migration_integration or ECA) – Use to call any dragonfly_client Tool plugin by ID with YAML config and token replacement.

**Example ECA usage:**

- On **user registration**, run an action that calls **Bootstrap Dragonfly Tenant** (with user id/email from tokens), then run a follow-up action when `bootstrap_success` is true.
- On **Dragonfly test completed**, run a custom action that sends a notification or updates a field using `[token:project_id]` and `[token:test_run_id]`.

## Orchestration (drupal/orchestration)

- **dragonfly_client_orchestration** (submodule) registers all dragonfly_client Tool plugins as orchestration services. External systems (n8n, Activepieces, Zapier) can discover and execute them via `GET /orchestration/services` and `POST /orchestration/service/execute`.
- Use orchestration when you want to trigger Dragonfly tests, bootstrap tenants, or run compliance/rector from n8n or another automation tool without writing custom Drupal code.
- Required permission: **Use orchestration**. Configure the Drupal base URL and auth (e.g. Basic Auth or cookie) in your automation tool.

## FlowDrop

- **FlowDrop** (drupal/flowdrop, flowdrop_ui) provides visual workflow automation. Use the **Execute Tool** node (or equivalent) to call dragonfly_client Tool plugins from a FlowDrop canvas.
- **flowdrop_tool_provider** exposes the Tool API to FlowDrop so every dragonfly_client tool (trigger_test, list_projects, bootstrap_tenant, etc.) can be used as a node.
- Combine with **flowdrop_ai_provider** and **flowdrop_ui_agents** if you want AI-driven branches or agent steps that then call Dragonfly tools.

## dragonfly_client tools (Tool API)

All of these are available as Tool API plugins and, when dragonfly_client_orchestration is enabled, as orchestration services:

| Tool ID | Purpose |
|--------|---------|
| `dragonfly_client:bootstrap_tenant` | Bootstrap a tenant (GitLab project via n8n). Inputs: requested_slug, user_id, email. Outputs: tenant_id, gitlab_project_path. |
| `dragonfly_client:trigger_test` | Trigger a test run. Inputs: project_id, priority, etc. |
| `dragonfly_client:list_projects` | List Dragonfly projects. |
| `dragonfly_client:get_my_tenant` | Get current user's tenant. |
| Plus: compliance, rector, cost, rate_limit, agent memory, environment test cycle, and others as defined in the module. |

Use these from ECA (Bootstrap Dragonfly Tenant action or Execute Tool with plugin ID), orchestration (POST /orchestration/service/execute), FlowDrop (Tool node), or any code that uses the Tool API (e.g. ai_agents with tool_ai_connector).

## When to use what

- **Trigger tests from Drupal UI or chat:** Use the Tool API (trigger_test) from an AI assistant or a custom form/block that calls the tool.
- **React to test completion in Drupal:** Use ECA with the **Dragonfly test completed** or **Dragonfly test failed** event and your chosen actions.
- **Bootstrap a tenant on user registration:** Use ECA action **Bootstrap Dragonfly Tenant** in a model triggered by user insert (or a custom event), with token names for user id and email.
- **Expose Dragonfly to n8n/Zapier:** Enable orchestration and dragonfly_client_orchestration; list services and call execute with the appropriate tool id and config.
- **Visual workflows:** Use FlowDrop with the Tool node and select the dragonfly_client tool you need.

## References

- Dragonfly API: `https://dragonfly.blueflyagents.com` (base path `/api/drupal-test-orchestrator/v1`).
- dragonfly_client config: **Configuration > Dragonfly Client** (or equivalent admin path). Set base URL and API key.
- ECA: **Configuration > Workflow > ECA** to create models using Dragonfly events, conditions, and actions.
- Orchestration: **GET /orchestration/services** on your Drupal site to list all services, including dragonfly_client tools.
