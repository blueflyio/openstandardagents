# Drupal Integration - Getting Started

This guide will help you integrate OSSA agents with Drupal 11.

## Prerequisites

- Drupal 11.x installed
- PHP 8.2+
- Composer
- OSSA CLI installed (`npm install -g @bluefly/openstandardagents`)

## Quick Start

### 1. Scaffold a Drupal Agent

```bash
ossa scaffold my-drupal-agent --platform drupal
```

This creates a pre-configured agent manifest with Drupal-specific settings.

### 2. Install Drupal Module

Create a custom Drupal module to host your agent:

```bash
cd /path/to/drupal
composer require drupal/core-composer-scaffold
ddev drush generate module --module=ossa_agent --machine-name=ossa_agent
```

### 3. Configure Agent Runtime

Edit your agent manifest to include Drupal runtime configuration:

```yaml
apiVersion: ossa.io/v1
kind: Agent
metadata:
  name: my-drupal-agent
spec:
  integrations:
    drupal:
      enabled: true
      version: 11
      module: ossa_agent
      hooks:
        - hook_entity_presave
        - hook_node_insert
```

### 4. Deploy Agent

```bash
ossa deploy my-drupal-agent --platform drupal
```

## Next Steps

- [Architecture Guide](./architecture.md) - Understand integration patterns
- [Hooks Integration](./hooks-integration.md) - Integrate with Drupal hooks
- [Entity Integration](./entity-integration.md) - Work with Drupal entities
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
