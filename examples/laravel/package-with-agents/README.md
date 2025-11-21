# Laravel Package with OSSA Agents

This example demonstrates how to organize OSSA agents within a Laravel package using the standard `.agents/` folder structure.

## Structure

```
my-api-package/
├── .agents/                    # Package-specific agents
│   └── api-client/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── src/
│   └── MyApiPackageServiceProvider.php
└── composer.json
```

## Discovery

Laravel service providers can scan `packages/*/.agents/` and register agents via the service container. The OSSA Laravel integration automatically discovers and registers agents.

## Agent Example

See `.agents/api-client/` for a complete example of an API client agent.

## Usage

### Register Agents in Service Provider

```php
// In MyApiPackageServiceProvider.php
public function register()
{
    // Register agents from .agents/ folder
    $this->app->make('ossa.agent_discovery')
        ->discoverPackageAgents(__DIR__ . '/../.agents');
}
```

### Use Agent in Code

```php
// Load agent via service container
$agent = app('ossa.agent_manager')
    ->getAgent('api-client', 'my-api-package');

// Make API request
$response = $agent->makeRequest('/api/endpoint');
```

## Related

- [OSSA Laravel Integration Guide](../../../../website/content/docs/ecosystems/laravel-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

