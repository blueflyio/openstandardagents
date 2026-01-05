---
title: "Installation"
---

# Installation

## Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0 or pnpm >= 9.0.0
- GitLab account (for GitLab integration)

## NPM Installation

```bash
npm install -g @bluefly/openstandardagents
```

## PNPM Installation

```bash
pnpm add -g @bluefly/openstandardagents
```

## Verify Installation

```bash
ossa --version
```

Expected output:
```
ossa v0.3.2
```

## Configuration

### GitLab Integration

1. Create Personal Access Token:
   - Settings → Access Tokens
   - Scopes: `api`, `read_repository`, `write_repository`

2. Set environment variable:
   ```bash
   export GITLAB_TOKEN=glpat-xxxxx
   ```

### LLM Provider Setup

1. **Anthropic (Claude)**:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```

2. **OpenAI (Fallback)**:
   ```bash
   export OPENAI_API_KEY=sk-xxxxx
   ```

## Next Steps

- [First Agent](./first-agent.md)
- [Running Agents](./running-agents.md)
- [CLI Reference](../cli-reference/index.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
