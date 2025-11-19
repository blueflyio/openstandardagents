---
title: "README"
---

# Migration Guides

Comprehensive guides for migrating to or extending with OSSA (Open Standards for Scalable Agents).

## Available Guides

### 1. [Anthropic MCP to OSSA](./Anthropic-MCP-to-OSSA.md)
**Extend Anthropic Model Context Protocol servers with OSSA**

- **Target Audience:** MCP server developers, Claude Desktop users
- **Complexity:** Intermediate
- **Time to Complete:** 2-4 hours
- **Key Benefits:**
  - Keep MCP compatibility
  - Add HTTP/REST API support
  - Enable production monitoring
  - Deploy to Kubernetes
  - Multi-protocol access (MCP + OpenAPI + A2A)

**Topics Covered:**
- MCP servers → OSSA agents
- MCP tools → OSSA capabilities
- MCP resources → OSSA data sources
- Dual-mode implementation (stdio + HTTP)
- Integration patterns
- 3 complete before/after examples

---

### 2. [LangChain to OSSA](./LangChain-to-OSSA.md)
**Migrate Python LangChain agents to OSSA specification**

- **Target Audience:** LangChain developers, Python AI engineers
- **Complexity:** Intermediate to Advanced
- **Time to Complete:** 4-8 hours
- **Key Benefits:**
  - Language-agnostic deployment
  - Better orchestration
  - Production-ready infrastructure
  - Multi-framework support

---

## Quick Decision Guide

**Choose the right guide based on your current stack:**

```
Have MCP servers? → Use "Anthropic MCP to OSSA"
├─ Already working in Claude Desktop?
│  └─ Keep MCP, add OSSA for production features
│
Have LangChain agents? → Use "LangChain to OSSA"
├─ Python-based AI workflows?
│  └─ Migrate to OSSA for better orchestration
│
Starting fresh? → Check Getting Started guide
└─ Use OSSA from day one
```

## Common Scenarios

### Scenario 1: "I have MCP servers for Claude Desktop"
→ **Use:** [Anthropic MCP to OSSA](./Anthropic-MCP-to-OSSA.md)
- Extend with HTTP API
- Add monitoring/metrics
- Deploy to production

### Scenario 2: "I have LangChain Python agents"
→ **Use:** [LangChain to OSSA](./LangChain-to-OSSA.md)
- Migrate to TypeScript/Node.js
- Add multi-protocol support
- Enable agent orchestration

### Scenario 3: "I want to expose my agent via multiple protocols"
→ **Use:** [Anthropic MCP to OSSA](./Anthropic-MCP-to-OSSA.md)
- MCP for Claude Desktop
- OpenAPI for REST clients
- A2A for agent-to-agent communication

## Migration Roadmap

```
1. Assessment (1-2 hours)
   ├─ Inventory existing agents/servers
   ├─ Identify required features
   └─ Choose migration guide

2. Planning (2-4 hours)
   ├─ Map existing functionality to OSSA
   ├─ Design agent manifest
   └─ Plan deployment strategy

3. Implementation (4-8 hours)
   ├─ Create OSSA agent structure
   ├─ Migrate business logic
   ├─ Configure bridges (MCP, OpenAPI, etc.)
   └─ Add monitoring

4. Testing (2-4 hours)
   ├─ Test all protocols
   ├─ Verify backward compatibility
   └─ Load testing

5. Deployment (2-4 hours)
   ├─ Deploy to target environment
   ├─ Configure monitoring
   └─ Update client configurations
```

## Support

- **Documentation:** `/Users/flux423/Sites/LLM/agent-buildkit/docs/`
- **Examples:** `/Users/flux423/Sites/LLM/agent-buildkit/.agents/`
- **OSSA Spec:** [OSSA Complete Reference](../OSSA-COMPLETE-AGENT-REFERENCE.md)
- **BuildKit CLI:** `buildkit agents --help`

## Contributing

Found an issue or want to add a migration guide?

1. Create an issue: [GitLab Issues](https://gitlab.bluefly.io/llm/documentation/-/issues)
2. Submit a merge request with your guide
3. Follow the existing structure and format

---

**Last Updated:** 2025-11-10
**Maintained By:** Agent BuildKit Team
