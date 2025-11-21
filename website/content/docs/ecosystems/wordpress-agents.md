---
title: OSSA Agents in WordPress
description: How to organize and discover OSSA agents in WordPress plugins and themes
---

# OSSA Agents in WordPress

This guide explains how to organize and discover OSSA agents within WordPress plugins and themes using the standard `.agents/` folder structure.

## Folder Structure

### Plugin-Level Agents

```
wp-content/plugins/my-plugin/
├── .agents/                    # Plugin-specific agents
│   └── my-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
└── my-plugin.php
```

### Theme-Level Agents

```
wp-content/themes/my-theme/
├── .agents/                    # Theme-specific agents
│   └── theme-agent/
│       └── agent.ossa.yaml
└── style.css
```

### Site-Level Agents

```
wordpress-site/
├── .agents/                    # Site-level agents
│   └── site-orchestrator/
│       └── agent.ossa.yaml
└── wp-content/
```

## Discovery

WordPress core scans `wp-content/plugins/*/.agents/` and `wp-content/themes/*/.agents/` to discover plugin/theme agents. The OSSA WordPress integration automatically discovers and registers agents.

### Enable Discovery

```php
// In my-plugin.php
add_action('plugins_loaded', function() {
  // Register agents from .agents/ folder
  ossa_discover_plugin_agents(__DIR__ . '/.agents');
});
```

## Using Agents

### Load Agent

```php
// Load agent
$agent = ossa_get_agent('my-agent', 'my-plugin');

// Use agent
$result = $agent->processTask($data);
```

### Discover All Plugin Agents

```php
// Discover all agents in a plugin
$agents = ossa_discover_plugin_agents(__DIR__ . '/.agents');

foreach ($agents as $agent) {
  // Use agent
}
```

## Example: Content Generator Agent

See [examples/wordpress/plugin-with-agents/.agents/content-generator/](../../../../examples/wordpress/plugin-with-agents/.agents/content-generator/) for a complete example.

## Best Practices

- **Use plugin-level agents** for plugin-specific functionality
- **Use theme-level agents** for theme-specific functionality
- **Use site-level agents** for cross-plugin orchestration
- **Include README.md** in each agent folder
- **Use taxonomy** to enable capability-based discovery

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Example: WordPress Plugin](../../../../examples/wordpress/plugin-with-agents/)

