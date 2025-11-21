# Drupal Module Integration Guide

## Your Community Module: `ai_agents_ossa`

Location: `/Users/flux423/Sites/LLM/all_drupal_custom/modules/ai_agents_ossa`

## Integration with OSSA Agent Folder Structure Standard

Your Drupal module should implement agent discovery following the OSSA standard:

### Standard Structure

```
ai_agents_ossa/
├── .agents/                    # Module-specific agents (NEW)
│   └── example-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── ai_agents_ossa.info.yml
├── ai_agents_ossa.services.yml
└── src/
    └── Service/
        ├── AgentDiscoveryService.php    # NEW: Implements discovery
        └── AgentManagerService.php      # NEW: Manages agents
```

### Implementation Steps

1. **Add Discovery Service** (`src/Service/AgentDiscoveryService.php`)
   - Scans `modules/*/.agents/` folders
   - Finds `agent.ossa.yaml` or `agent.yml` files
   - Parses YAML manifests
   - Returns discovered agents

2. **Add Manager Service** (`src/Service/AgentManagerService.php`)
   - Provides access to discovered agents
   - Supports capability/domain-based search
   - Caches loaded agents

3. **Update services.yml**
   ```yaml
   services:
     ossa.agent_discovery:
       class: Drupal\ai_agents_ossa\Service\AgentDiscoveryService
       arguments: ['@file_system', '@logger.factory']
     
     ossa.agent_manager:
       class: Drupal\ai_agents_ossa\Service\AgentManagerService
       arguments: ['@ossa.agent_discovery', '@logger.factory']
   ```

4. **Create Example Agent** (`.agents/example-agent/agent.ossa.yaml`)
   - Demonstrates the standard structure
   - Shows how other modules should organize agents

### Usage in Other Modules

Other Drupal modules can now add agents:

```
my_module/
├── .agents/
│   └── my-agent/
│       ├── agent.ossa.yaml
│       └── README.md
└── my_module.info.yml
```

The `ai_agents_ossa` module will automatically discover them.

### API Usage

```php
// Get an agent
$agent = \Drupal::service('ossa.agent_manager')
  ->getAgent('my-agent', 'my_module');

// Discover all agents
$all_agents = \Drupal::service('ossa.agent_manager')
  ->getAllAgents();

// Find by capability
$agents = \Drupal::service('ossa.agent_manager')
  ->findAgentsByCapability('process-order');

// Find by domain
$agents = \Drupal::service('ossa.agent_manager')
  ->findAgentsByDomain('e-commerce');
```

## Reference Implementation

See the example implementation files:
- `src/Service/AgentDiscoveryService.php` - Discovery logic
- `src/Service/AgentManagerService.php` - Agent management
- `.agents/example-agent/` - Example agent structure

## Related Documentation

- [OSSA Drupal Integration Guide](../website/content/docs/ecosystems/drupal-agents.md)
- [Workspace Discovery](../website/content/docs/core-concepts/Workspace-Discovery.md)
- [Agent Folder Structure Standard](../docs/agent-folder-structure.md)

