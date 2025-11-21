# Drupal Module with OSSA Agents

This example demonstrates how to organize OSSA agents within a Drupal module using the standard `.agents/` folder structure.

## Structure

```
commerce_custom/
├── .agents/                    # Module-specific agents
│   └── order-processor/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── commerce_custom.info.yml
├── commerce_custom.module
└── src/
```

## Discovery

Drupal core scans `modules/*/.agents/` to discover module-specific agents. The OSSA Drupal integration service automatically discovers and registers agents.

## Agent Example

See `.agents/order-processor/` for a complete example of an order processing agent.

## Usage

### Enable Agent Discovery

```php
// In commerce_custom.module
use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;

class CommerceCustomServiceProvider extends ServiceProviderBase {
  public function alter(ContainerBuilder $container) {
    // Register agents from .agents/ folder
    $container->get('ossa.agent_discovery')
      ->discoverModuleAgents('commerce_custom');
  }
}
```

### Use Agent in Code

```php
// Load agent
$agent = \Drupal::service('ossa.agent_manager')
  ->getAgent('order-processor', 'commerce_custom');

// Process order
$result = $agent->processOrder($order_data);
```

## Related

- [OSSA Drupal Integration Guide](../../../../website/content/docs/ecosystems/drupal-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

