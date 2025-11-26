# Requirements Document

## Introduction

This feature extends agent-buildkit to centralize IDE configuration templates, steering rules, hooks, MCP server configurations, and spec templates across a complex multi-project ecosystem. The ecosystem includes OSSA (OpenAPI schema master), gitlab_components, 20+ Drupal custom modules, 15+ npm packages, agent-studio IDE, and multiple domain models. Instead of copying configuration folders to 40+ projects, developers use agent-buildkit's new template management features, with updates propagating through standard npm update workflows. This extends the existing `--use-kiro-context` flag and integrates with OSSA schema sync and GitLab CI infrastructure.

## Glossary

- **Agent Buildkit**: The existing npm package at `/Users/flux423/Sites/LLM/agent-buildkit` that will be extended with template management capabilities
- **Template System**: The collection of reusable configuration files for steering, hooks, settings, specs, tests, and MCP servers stored within agent-buildkit
- **Context Initialization**: The new `--init-context` command in agent-buildkit for setting up projects with templates
- **Consumer Project**: Any of the 40+ projects that use agent-buildkit and will access centralized templates
- **Configuration Pointer**: A minimal `.kiro/config.json` file that references agent-buildkit's template directory
- **MCP Server**: Model Context Protocol server configuration
- **Steering Rules**: IDE guidance files that influence agent behavior
- **OSSA**: Open Standard Agents specification at `/Users/flux423/Sites/LLM/openstandardagents` - the master OpenAPI and schema source
- **GitLab Components**: CI/CD library at `/Users/flux423/Sites/LLM/gitlab_components`
- **Ecosystem Projects**: The 40+ projects including Drupal modules, npm packages, models, and recipes
- **Agent Studio**: Monorepo IDE tool at `/Users/flux423/Sites/LLM/common_npm/agent-studio` for macOS, iOS, Electron, VS Code extension, and web IDE

## Requirements

### Requirement 1

**User Story:** As a developer managing multiple projects, I want agent-buildkit to provide centralized templates, so that I can avoid copying configuration folders across 40+ projects.

#### Acceptance Criteria

1. WHEN agent-buildkit is installed THEN the Agent Buildkit SHALL include a `templates/` directory in its package structure
2. WHEN the templates directory exists THEN the Agent Buildkit SHALL provide subdirectories for steering, hooks, settings, specs, tests, and mcp-servers
3. WHEN a developer runs `npx agent-buildkit --init-context` THEN the Agent Buildkit SHALL create a minimal `.kiro/config.json` file
4. WHEN the initialization completes THEN the Agent Buildkit SHALL display available template paths and next steps
5. THE Agent Buildkit SHALL make templates accessible to all consumer projects via node_modules resolution

### Requirement 2

**User Story:** As a developer, I want to update all projects' templates by updating agent-buildkit, so that I can maintain consistency across my entire project portfolio.

#### Acceptance Criteria

1. WHEN a developer publishes a new version of agent-buildkit THEN the Package Manager SHALL make the updated version available on npm
2. WHEN a developer runs `npm update @bluefly/agent-buildkit` in a Consumer Project THEN the Package Manager SHALL fetch and install the latest version
3. WHEN agent-buildkit updates THEN the Template System SHALL provide the new templates without requiring manual file copying
4. THE Agent Buildkit SHALL use semantic versioning for all releases
5. WHEN template breaking changes are introduced THEN the Agent Buildkit SHALL document migration steps in CHANGELOG

### Requirement 3

**User Story:** As a developer, I want agent-buildkit to initialize my project with minimal configuration, so that I can start using templates quickly.

#### Acceptance Criteria

1. WHEN a developer runs `npx agent-buildkit --init-context` THEN the Agent Buildkit SHALL check if `.kiro` directory exists
2. IF the `.kiro` directory does not exist THEN the Agent Buildkit SHALL create it
3. WHEN creating the configuration THEN the Agent Buildkit SHALL write a `.kiro/config.json` file with a reference to agent-buildkit's template directory
4. WHEN the initialization is complete THEN the Agent Buildkit SHALL output the paths to available templates
5. THE Agent Buildkit SHALL not overwrite existing `.kiro/config.json` files without user confirmation

### Requirement 4

**User Story:** As a developer, I want agent-buildkit's existing `--use-kiro-context` flag to work with the new template system, so that I can use context in my build processes.

#### Acceptance Criteria

1. WHEN agent-buildkit is invoked with `--use-kiro-context` flag THEN the Agent Buildkit SHALL locate the `.kiro/config.json` file
2. WHEN the configuration pointer is found THEN the Agent Buildkit SHALL resolve template paths from its own templates directory
3. WHEN templates are resolved THEN the Agent Buildkit SHALL load steering rules, hooks, and settings
4. THE Agent Buildkit SHALL export a programmatic API for template path resolution
5. THE Agent Buildkit SHALL provide TypeScript type definitions for all template-related APIs

### Requirement 5

**User Story:** As a developer working with GitLab and Kubernetes, I want default MCP configurations for K8s agents and CI/CD, so that I can quickly set up agent-based workflows.

#### Acceptance Criteria

1. THE Agent Buildkit SHALL include MCP server templates for GitLab integration in templates/mcp-servers/
2. THE Agent Buildkit SHALL include MCP server templates for Kubernetes agent operations
3. THE Agent Buildkit SHALL include MCP server templates for CI/CD pipeline automation
4. WHEN a developer accesses MCP templates THEN the Template System SHALL provide configuration files in JSON format
5. THE Agent Buildkit SHALL include documentation for each MCP server template

### Requirement 6

**User Story:** As a developer using OrbStack for local development, I want MCP integration for local Kubernetes clusters, so that I can test agent workflows locally before deploying.

#### Acceptance Criteria

1. THE Agent Buildkit SHALL include MCP server templates for OrbStack Kubernetes integration
2. WHEN using OrbStack templates THEN the Template System SHALL provide localhost connection configurations
3. THE Agent Buildkit SHALL include examples for local K8s agent testing
4. THE Agent Buildkit SHALL document the differences between local and production MCP configurations
5. WHEN local configurations are used THEN the MCP Server SHALL connect to OrbStack's Kubernetes API

### Requirement 7

**User Story:** As a developer following API-first principles with OSSA as the schema master, I want agent-buildkit to support React, OpenAPI, Zod, and Drupal templates, so that my templates align with my technology stack across all ecosystem projects.

#### Acceptance Criteria

1. THE Agent Buildkit SHALL include spec templates for OpenAPI-based projects that reference OSSA schemas
2. THE Agent Buildkit SHALL include steering rules for React component development used in studio-ui and agent-studio
3. THE Agent Buildkit SHALL include test templates that use Zod for schema validation synced with OSSA
4. THE Agent Buildkit SHALL include steering rules for Drupal module development covering the 20+ custom modules
5. THE Agent Buildkit SHALL provide templates for npm package development used across the 15+ common_npm packages

### Requirement 8

**User Story:** As a package maintainer, I want a clear directory structure for templates within agent-buildkit, so that users can easily understand and extend the templates.

#### Acceptance Criteria

1. THE Agent Buildkit SHALL organize templates in a `templates/` directory at the package root
2. THE Template System SHALL use subdirectories for each template category: steering, hooks, settings, specs, tests, mcp-servers
3. WHEN a user browses agent-buildkit THEN the Template System SHALL provide a README in each template directory
4. THE Agent Buildkit SHALL include template documentation in its existing docs directory
5. THE Agent Buildkit SHALL maintain its existing npm package structure while adding the templates directory

### Requirement 9

**User Story:** As a developer, I want to selectively use templates from agent-buildkit, so that I can customize my project configuration while still benefiting from centralized updates.

#### Acceptance Criteria

1. WHEN a developer references a template THEN the Template System SHALL allow copying individual templates to the project
2. THE Agent Buildkit SHALL provide a `--template` flag to copy specific template categories
3. WHEN templates are copied THEN the Agent Buildkit SHALL preserve the original template structure
4. THE Agent Buildkit SHALL allow projects to override package templates with local files
5. WHEN local overrides exist THEN the Template System SHALL prioritize local files over agent-buildkit templates

### Requirement 10

**User Story:** As a developer working with OSSA schemas, I want agent-buildkit to integrate with OSSA schema sync and Apidog, so that my templates stay synchronized with the master OpenAPI specifications.

#### Acceptance Criteria

1. THE Agent Buildkit SHALL include steering rules that reference OSSA schema locations
2. WHEN OSSA schemas are updated THEN the Template System SHALL provide guidance for syncing with Apidog
3. THE Agent Buildkit SHALL include spec templates for API-first development using OSSA patterns
4. THE Agent Buildkit SHALL provide hooks for validating OpenAPI schema compliance
5. WHEN agent-buildkit uses `--use-kiro-context` THEN the Agent Buildkit SHALL resolve OSSA schema references

### Requirement 11

**User Story:** As a developer managing Drupal recipes and modules, I want templates specific to Drupal development, so that I can maintain consistency across llm_platform, secure_drupal recipes and 20+ custom modules.

#### Acceptance Criteria

1. THE Agent Buildkit SHALL include steering rules for Drupal 10+ module development
2. THE Agent Buildkit SHALL include spec templates for Drupal recipe creation
3. THE Agent Buildkit SHALL include hooks for Drupal coding standards validation
4. THE Agent Buildkit SHALL provide MCP server templates for Drupal AI agent modules (OSSA, KAgent, Claude, Cursor, etc.)
5. WHEN developing Drupal modules THEN the Template System SHALL provide guidance for recipe integration

### Requirement 12

**User Story:** As a developer, I want agent-buildkit to maintain its existing npm package quality while adding template features, so that all 40+ ecosystem projects can benefit from the updates.

#### Acceptance Criteria

1. THE Agent Buildkit SHALL continue to be published to npm under the `@bluefly` scope
2. WHEN published THEN the Agent Buildkit SHALL update package.json to document new template features
3. THE Agent Buildkit SHALL update its README.md with template initialization and usage instructions
4. THE Agent Buildkit SHALL maintain its existing Node.js version requirements
5. THE Agent Buildkit SHALL update its CHANGELOG.md to document template system additions
