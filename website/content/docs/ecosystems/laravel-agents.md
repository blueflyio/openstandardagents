---
title: OSSA Agents in Laravel
description: How to organize and discover OSSA agents in Laravel packages
---

# OSSA Agents in Laravel

This guide explains how to organize and discover OSSA agents within Laravel packages using the standard `.agents/` folder structure.

## Folder Structure

### Package-Level Agents

```
packages/my-package/
├── .agents/                    # Package-specific agents
│   └── my-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── src/
│   └── MyPackageServiceProvider.php
└── composer.json
```

### App-Level Agents

```
laravel-app/
├── .agents/                    # App-level agents
│   └── app-agent/
│       └── agent.ossa.yaml
└── packages/
```

## Discovery

Laravel service providers can scan `packages/*/.agents/` and register agents via the service container. The OSSA Laravel integration automatically discovers and registers agents.

### Register Agents in Service Provider

```php
// In MyPackageServiceProvider.php
public function register()
{
    // Register agents from .agents/ folder
    $this->app->make('ossa.agent_discovery')
        ->discoverPackageAgents(__DIR__ . '/../.agents');
}
```

## Using Agents

### Load Agent

```php
// Load agent via service container
$agent = app('ossa.agent_manager')
    ->getAgent('my-agent', 'my-package');

// Use agent
$result = $agent->processTask($data);
```

### Discover All Package Agents

```php
// Discover all agents in a package
$agents = app('ossa.agent_discovery')
    ->discoverPackageAgents(__DIR__ . '/../.agents');

foreach ($agents as $agent) {
    // Use agent
}
```

## Example: API Client Agent

See [examples/laravel/package-with-agents/.agents/api-client/](../../../../examples/laravel/package-with-agents/.agents/api-client/) for a complete example.

## Best Practices

- **Use package-level agents** for package-specific functionality
- **Use app-level agents** for application-wide orchestration
- **Include README.md** in each agent folder
- **Use taxonomy** to enable capability-based discovery
- **Register agents in service providers**

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Example: Laravel Package](../../../../examples/laravel/package-with-agents/)

