# OSSA Adoption Priority Plan

## Top 15 Issues for Maximum Adoption Impact

Based on integration research with kagent.dev, AgentQL, AgentK, dagrunner, Symfony, and Drupal.

---

### Tier 1: Critical Path (Enables All Integrations)

| # | Issue | Title | Impact | Effort |
|---|-------|-------|--------|--------|
| 1 | #182 | OSSA ↔ OpenAPI Bidirectional Conversion | Enables REST API ecosystem adoption | M |
| 2 | #176 | OpenAPI Validation Pipeline | CI/CD for API-first development | S |
| 3 | #34 | Runtime Spec: Agent Lifecycle & Execution Model | Foundation for all runtimes | L |
| 4 | #16 | Graph Execution Runtime (LangGraph, CrewAI) | Enables AgentK, multi-agent patterns | L |

### Tier 2: Kubernetes & Cloud Native (kagent.dev alignment)

| # | Issue | Title | Impact | Effort |
|---|-------|-------|--------|--------|
| 5 | #365 | Kubernetes Runtime Binding Validation | kagent.dev compatibility | M |
| 6 | #366 | Security Context Validation for K8s | Enterprise adoption | S |
| 7 | #367 | Resource Limit Validation for K8s | Production readiness | S |
| 8 | #368 | Identity Authentication with KAS Patterns | A2A protocol alignment | M |

### Tier 3: Developer Experience (Quick Wins)

| # | Issue | Title | Impact | Effort |
|---|-------|-------|--------|--------|
| 9 | #155 | CLI: `ossa test` Command | Developer adoption | S |
| 10 | #154 | CLI: `ossa deploy` and `ossa status` | DevOps workflow | M |
| 11 | #153 | Anthropic Runtime Adapter | Claude integration | M |
| 12 | #196 | Migration CLI: `ossa migrate` | v0.2.x → v0.3.x adoption | S |

### Tier 4: Framework Integrations

| # | Issue | Title | Impact | Effort |
|---|-------|-------|--------|--------|
| 13 | #167 | dagrunner Integration (MetOffice) | Scientific workflow adoption | M |
| 14 | #255 | Drupal & Recipe Automation Agents | CMS ecosystem | L |
| 15 | #6 | Microsoft Semantic Kernel + AutoGen | Enterprise .NET adoption | L |

---

## Integration Mapping

### kagent.dev (CNCF Sandbox)
- **A2A Protocol**: Issue #368 (identity.authentication)
- **MCP Servers**: Issue #365 (runtime binding)
- **Kubernetes**: Issues #365-367 (K8s validation)

### AgentQL (Web Automation)
- **Capability**: Add as tool binding in runtime spec
- **MCP Server**: Native MCP support via #365
- **Playwright**: Add browser capability schema

### AgentK (Self-Evolving Agents)
- **LangGraph**: Issue #16 (graph execution)
- **Agent Creation**: Meta-agent pattern in #34
- **Python Runtime**: Add Python adapter

### dagrunner (MetOffice)
- **DAG Workflows**: Issue #167 (direct integration)
- **Scientific Patterns**: Extend workflow schema

### Symfony/Drupal
- **PHP Runtime**: New adapter needed
- **Messenger**: Async agent execution
- **ECA Module**: Issue #255 (Drupal agents)
- **Recipes**: Deployment automation

---

## Worktree Execution Plan

```bash
# Each issue gets its own worktree
WORKTREE_BASE="${HOME}/.worktrees/openstandardagents"

# Tier 1 - Start immediately
git worktree add "$WORKTREE_BASE/182-openapi-conversion" -b feature/182-openapi-conversion release/v0.3.x
git worktree add "$WORKTREE_BASE/176-openapi-validation" -b feature/176-openapi-validation release/v0.3.x
git worktree add "$WORKTREE_BASE/34-runtime-spec" -b feature/34-runtime-spec release/v0.3.x
git worktree add "$WORKTREE_BASE/16-langgraph-runtime" -b feature/16-langgraph-runtime release/v0.3.x

# Tier 2 - After Tier 1 foundations
git worktree add "$WORKTREE_BASE/365-k8s-runtime-binding" -b feature/365-k8s-runtime-binding release/v0.3.x
git worktree add "$WORKTREE_BASE/366-k8s-security-context" -b feature/366-k8s-security-context release/v0.3.x

# Quick wins - Parallel track
git worktree add "$WORKTREE_BASE/155-ossa-test" -b feature/155-ossa-test release/v0.3.x
git worktree add "$WORKTREE_BASE/196-ossa-migrate" -b feature/196-ossa-migrate release/v0.3.x
```

---

## Success Metrics

| Metric | Target | Measures |
|--------|--------|----------|
| npm downloads | +50% | Developer adoption |
| GitHub stars | +100 | Community interest |
| Integration PRs | 5+ | External contributions |
| Runtime adapters | 3 new | Platform coverage |

---

## Timeline (No Dates - Sequential)

1. **Phase 1**: OpenAPI foundation (#182, #176)
2. **Phase 2**: Runtime spec (#34) + CLI quick wins (#155, #196)
3. **Phase 3**: Kubernetes validation (#365-368)
4. **Phase 4**: LangGraph runtime (#16) + dagrunner (#167)
5. **Phase 5**: Framework integrations (#255, #6, Symfony)
