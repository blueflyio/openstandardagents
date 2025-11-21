---
title: OSSA Agents in Drupal
description: How to organize and discover OSSA agents in Drupal modules
---

# OSSA Agents in Drupal

This guide explains how to organize and discover OSSA agents within Drupal modules using the standard `.agents/` folder structure.

## Folder Structure

### Module-Level Agents

```
modules/custom/my-module/
├── .agents/                    # Module-specific agents
│   └── my-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── my_module.info.yml
└── src/
```

### Site-Level Agents

```
drupal-site/
├── .agents/                    # Site-level agents
│   └── site-orchestrator/
│       └── agent.ossa.yaml
└── modules/
```

## Discovery

Drupal core scans `modules/*/.agents/` to discover module-specific agents. The OSSA Drupal integration service automatically discovers and registers agents.

### Enable Discovery

```php
// In my_module.module
use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;

class MyModuleServiceProvider extends ServiceProviderBase {
  public function alter(ContainerBuilder $container) {
    // Register agents from .agents/ folder
    $container->get('ossa.agent_discovery')
      ->discoverModuleAgents('my_module');
  }
}
```

## Using Agents

### Load Agent

```php
// Load agent via service
$agent = \Drupal::service('ossa.agent_manager')
  ->getAgent('my-agent', 'my_module');

// Use agent
$result = $agent->processTask($data);
```

### Discover All Module Agents

```php
// Discover all agents in a module
$agents = \Drupal::service('ossa.agent_discovery')
  ->discoverModuleAgents('my_module');

foreach ($agents as $agent) {
  // Use agent
}
```

## Example: Order Processor Agent

See [examples/drupal/module-with-agents/.agents/order-processor/](../../../../examples/drupal/module-with-agents/.agents/order-processor/) for a complete example.

## Best Practices

- **Use module-level agents** for module-specific functionality
- **Use site-level agents** for cross-module orchestration
- **Include README.md** in each agent folder
- **Use taxonomy** to enable capability-based discovery
- **Version your manifests** using semantic versioning

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Example: Drupal Module](../../../../examples/drupal/module-with-agents/)

