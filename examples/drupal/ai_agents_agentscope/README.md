# AI Agents: AgentScope Provider

Thin AiProvider bridge that connects Drupal's `drupal/ai` system to an [AgentScope](https://github.com/modelscope/agentscope) Python HTTP runtime.

## What This Module Does

Provides **one thing**: an `AiProvider` plugin (`agentscope`) that speaks AgentScope's REST API.

Everything else is handled by contrib:
- **Agent plugin derivation** -- `ai_agents_ossa` (reads OSSA manifests, creates AiAgent plugins)
- **Tool registration** -- `drupal/ai` Tool API
- **Manifest management** -- `ai_agents_ossa` config entities

## Requirements

- Drupal 10.4+ or 11.x
- PHP 8.3+
- `drupal/ai` module (provides AiProvider plugin system)
- `ai_agents_ossa` module (OSSA manifest bridge)
- AgentScope Python runtime running as HTTP service

## Installation

```bash
drush en ai_agents_agentscope
drush cr
```

## Configuration

Settings at `ai_agents_agentscope.settings`:

| Setting | Default | Description |
|---------|---------|-------------|
| `endpoint` | `http://127.0.0.1:12310` | AgentScope HTTP API URL |
| `timeout` | `60` | Request timeout (seconds) |
| `api_key` | `` | Optional API key for runtime auth |

## AgentScope Runtime

```bash
pip install agentscope
agentscope serve --port 12310
```

## Architecture

```
ai_agents_ossa (config entity + deriver + agent plugin)
    |
    v
AgentScopeProvider (THIS MODULE -- AiProvider, HTTP transport only)
    |
    v
AgentScope Python Runtime (POST /api/v1/agent/message)
```

## Links

- [AgentScope](https://github.com/modelscope/agentscope)
- [OSSA Specification](https://openstandardagents.org/)
- [Drupal AI Module](https://www.drupal.org/project/ai)
