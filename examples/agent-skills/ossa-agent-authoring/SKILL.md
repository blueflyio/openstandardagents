---
name: ossa-agent-authoring
description: Author and validate OSSA (Open Standard for Software Agents) manifests. Use when creating or editing agent manifests, validating against the OSSA schema, scaffolding new agents, generating agent-card.json, or publishing to a registry. Triggers on tasks involving OSSA YAML/JSON, agent manifests, agent-card, or agentregistry/arctl.
---

# OSSA Agent Authoring

## Overview

Guidelines for authoring and validating OSSA agent manifests. Use the OSSA MCP server tools when available; otherwise use the OSSA CLI.

## When to Apply

- Creating or editing `manifest.ossa.yaml` or OSSA JSON manifests
- Validating manifests against the OSSA schema
- Scaffolding a new agent directory and manifest
- Generating `.well-known/agent-card.json` from a manifest
- Publishing an OSSA agent to a registry (agentregistry/arctl)

## MCP Tools (OSSA MCP server)

When the OSSA MCP server is attached (e.g. `ossa-mcp` in Cursor/Claude), use:

| Tool | Purpose |
|------|---------|
| `ossa_validate` | Validate a manifest file; returns errors and warnings |
| `ossa_scaffold` | Create a new agent directory and default manifest |
| `ossa_generate` | Generate agent-card JSON from a manifest |
| `ossa_publish` | Publish to registry (or get instructions if not configured) |

## CLI Fallback

From the project root or a path with manifests:

```bash
# Validate
npx @bluefly/openstandardagents validate <path-to-manifest>

# Scaffold
npx @bluefly/openstandardagents scaffold [name] -o .agents --with-prompts --with-tools

# Agent card
npx @bluefly/openstandardagents agent-card <path-to-manifest>
```

## Manifest Minimum

A valid OSSA v0.4 manifest must have:

- `apiVersion` (e.g. `ossa/v0.4`)
- `kind: Agent`
- `metadata.name` (DNS-1123)
- `spec.role` or `spec.prompts.system.template`

## Governance

- Use schema version matching the manifest `apiVersion` when validating.
- For platform-specific validation (kagent, langchain, etc.), use the CLI `--platform` flag or the MCP `ossa_validate` platform argument when supported.

## Publish Path

To publish to agentregistry: use `arctl publish` when installed and configured, or POST the manifest and agent-card to the registry API. The `ossa_publish` MCP tool returns next steps when the registry is not configured.
