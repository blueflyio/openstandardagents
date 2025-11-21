# WordPress Plugin with OSSA Agents

This example demonstrates how to organize OSSA agents within a WordPress plugin using the standard `.agents/` folder structure.

## Structure

```
my-content-plugin/
├── .agents/                    # Plugin-specific agents
│   └── content-generator/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── my-content-plugin.php
└── includes/
```

## Discovery

WordPress core scans `wp-content/plugins/*/.agents/` and `wp-content/themes/*/.agents/` to discover plugin/theme agents. The OSSA WordPress integration automatically discovers and registers agents.

## Agent Example

See `.agents/content-generator/` for a complete example of a content generation agent.

## Usage

### Enable Agent Discovery

```php
// In my-content-plugin.php
add_action('plugins_loaded', function() {
  // Register agents from .agents/ folder
  ossa_discover_plugin_agents(__DIR__ . '/.agents');
});
```

### Use Agent in Code

```php
// Load agent
$agent = ossa_get_agent('content-generator', 'my-content-plugin');

// Generate content
$post = $agent->generatePost([
  'title' => 'My Post Title',
  'topic' => 'AI and WordPress',
]);
```

## Related

- [OSSA WordPress Integration Guide](../../../../website/content/docs/ecosystems/wordpress-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

