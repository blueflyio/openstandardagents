# AI Agents OSSA - Drupal Module

Drupal integration for the Open Standard for Scalable AI Agents (OSSA). This module discovers and manages OSSA agents from Drupal modules following the standard `.agents/` folder structure.

## Features

- **Automatic Agent Discovery** - Scans modules for `.agents/` folders and discovers `agent.ossa.yaml` files
- **Service-Based Access** - Access agents via Drupal services
- **Capability-Based Search** - Find agents by capability or domain
- **OSSA v0.2.4 Compatible** - Supports the latest OSSA specification

## Installation

1. Copy this module to `modules/custom/ai_agents_ossa/`
2. Enable the module: `drush en ai_agents_ossa`
3. Agents in module `.agents/` folders will be automatically discovered

## Usage

### Module Structure

```
my_module/
├── .agents/                    # Module-specific agents
│   └── my-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── my_module.info.yml
└── src/
```

### Get an Agent

```php
// Load agent via service
$agent = \Drupal::service('ossa.agent_manager')
  ->getAgent('my-agent', 'my_module');

// Use agent manifest
$manifest = $agent['manifest'];
$role = $manifest['spec']['role'];
```

### Discover All Agents

```php
// Get all agents
$all_agents = \Drupal::service('ossa.agent_manager')
  ->getAllAgents();

// Find agents by capability
$agents = \Drupal::service('ossa.agent_manager')
  ->findAgentsByCapability('process-order');

// Find agents by domain
$agents = \Drupal::service('ossa.agent_manager')
  ->findAgentsByDomain('e-commerce');
```

### Discover Module Agents

```php
// Discover agents in a specific module
$agents = \Drupal::service('ossa.agent_discovery')
  ->discoverModuleAgents('my_module');
```

## Example Agent

See `.agents/example-agent/` for a complete example.

## Services

- **ossa.agent_discovery** - Discovers agents in modules
- **ossa.agent_manager** - Manages and provides access to discovered agents

## Related

- [OSSA Specification](https://openstandardagents.org)
- [Drupal Integration Guide](../../../../website/content/docs/ecosystems/drupal-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

