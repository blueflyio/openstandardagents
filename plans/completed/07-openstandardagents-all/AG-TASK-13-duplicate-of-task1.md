# Migrate Custom Registries to `drupal/ai` & `ai_agents_ossa`

## Goal Description
The objective of Pillar 3 is to overhaul the AI ecosystem, moving away from custom discovery scrapers, custom provider bridges, and bespoke entities (like `McpServerProject`) built into `mcp_registry` / `ai_agents_client`. We will transition the platform to exclusively leverage `drupal/ai` for core LLM routing and `ai_agents_ossa` for tool discovery.

## User Review Required
> [!IMPORTANT]
> To properly enforce Pillar 3, we will permanently delete the bespoke AI discovery and registry services. This may have sweeping effects across `mcp_registry` and `ai_agents_client`.
> Please review the deletions and adoptions below. If this looks correct, simply approve and I will execute these changes immediately.

## Proposed Changes

### `mcp_registry` Component
To fully transition to the `ai_agents_ossa` standard, we will remove custom DB table definitions, entity routing, and scraping services.

#### [DELETE] `src/Entity/McpServerProject.php` & accompanying classes
- We will delete the `McpServerProject` entity and its list builders, forms, and routing (`McpServerProjectListBuilder`, `McpServerProjectForm`, `McpServerProjectHtmlRouteProvider`).
- **Target**: Use the native registry supplied by `ai_agents` / `ai_agents_ossa`.

#### [DELETE] Custom Scrapers & Discovery
- Remove bespoke polling scrapers (`McpDiscoveryService`, `McpRegistrySyncBatch`).
- **Target**: Ensure discovery flows natively through `ai_agents_ossa`.

### `ai_agents_client` / Core AI Routing
- We will audit and identify custom bridge code used for routing LLMs without `drupal/ai`.
- **Target**: Rely exclusively on `drupal/ai` for routing protocols and API key storage (`drupal/key`).

## Verification Plan

### Automated Tests
1. Clear cache with `drush cr` to ensure no database mismatch or missing route failures block bootstrap.
2. Confirm the site builds completely with the legacy services removed.

### Manual Verification
1. Verify that `drupal/ai` and `drupal/ai_agents_ossa` correctly handle discovery and tool capabilities (which is our next step).
