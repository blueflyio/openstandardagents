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

## Symfony AI Agent – deep research and OSSA adoption path

**Source:** [Symfony AI – Agent Component](https://symfony.com/doc/current/ai/components/agent.html), [Platform Component](https://symfony.com/doc/current/ai/components/platform.html). Purpose: align OSSA with Symfony’s PHP agent stack to further openstandardagents adoption in PHP/Drupal ecosystems.

### What Symfony AI provides

- **Platform component** (`symfony/ai-platform`): Abstraction over LLM providers (OpenAI, Anthropic, Google, Ollama, LiteLLM, OpenRouter, Vertex, Bedrock, etc.). Message types (User, System, Assistant), MessageBag, streaming, embeddings, structured output, failover, caching. Model = name + capabilities + options.
- **Agent component** (`symfony/ai-agent`): Agent = Platform + Model; input/output processors; **Toolbox** with tool calling. Tools are PHP classes with `#[AsTool(name, description)]` (and optional `method`), JSON Schema derived from params and `#[With]` / enums. Third-party tools via `MemoryToolFactory`; **Subagent** = agent-as-tool. Fault tolerance (`FaultTolerantToolbox`), tool filtering per call, tool lifecycle events, RAG via Store + `SimilaritySearch` tool, **memory** (StaticMemoryProvider, EmbeddingProvider) injected into system prompt. Testing: `MockAgent`, `MockResponse`, callable responses.
- **Store component** (`symfony/ai-store`): Vector stores for RAG (Pinecone, MongoDB, etc.).

### OSSA ↔ Symfony concept mapping

| OSSA | Symfony AI | Notes |
|------|------------|--------|
| `metadata.name`, `version`, `description` | Agent identity (no manifest) | OSSA has a single manifest; Symfony agents are code + config. |
| `spec.role` or `prompts.system.template` | `Message::forSystem(...)` in MessageBag | Direct mapping; OSSA templates → Symfony message templates. |
| `spec.llm` (provider, model, temperature, maxTokens) | Platform + Model (e.g. `PlatformFactory::create()`, `'gpt-4o-mini'`) | OSSA llm-config → Symfony platform bridge + model name/options. |
| `spec.tools` (list of tool refs) | Toolbox([$tool1, $tool2]), AgentProcessor | OSSA tool definitions → PHP classes with `#[AsTool]` or MemoryToolFactory. |
| Tool schema (name, description, parameters) | AsTool attribute + method params + docblock / `#[With]` | OSSA JSON Schema for tools → Symfony’s generated JSON Schema for LLM. |
| Sub-agents / delegation | Subagent tool (agent as tool in Toolbox) | OSSA multi-agent or tools that are agents → Symfony Subagent. |
| Memory / context | MemoryInputProcessor + StaticMemoryProvider / EmbeddingProvider | OSSA extensions.memory or context → Symfony memory providers. |
| Observability / tracing | Not in Symfony doc | OSSA spec.observability → future Symfony listener or bridge. |

### Gaps and opportunities

1. **No manifest format in Symfony:** Agents are built in code (Platform, Model, Toolbox, processors). OSSA can be the **declarative source**: export OSSA → Symfony config or generated PHP (agent factory from manifest).
2. **Tool schema direction:** Symfony generates JSON Schema from PHP. OSSA has tool schemas in manifest. **Bidirectional:** OSSA → Symfony (generate `#[AsTool]` stubs or register tools from OSSA tools.yaml); Symfony → OSSA (infer tool schema from PHP for `ossa import`).
3. **Drupal already has ai_agents:** Drupal’s ai_agents + OSSA bridge (ai_agents_ossa) uses config entities. Symfony AI is framework-level (PHP, not Drupal-specific). **Path:** Use OSSA as the contract; Drupal can use either (a) ai_agents + OSSA manifests, or (b) a Symfony AI adapter that instantiates `Agent` from an OSSA manifest (e.g. in a Drupal or Symfony app).
4. **Platform matrix:** Add **Symfony** as a platform in `ossa platforms`: export = “generate Symfony Agent + Toolbox from OSSA manifest”; import = “infer OSSA manifest from Symfony Agent/Toolbox config or PHP attributes” (best-effort).

### Concrete adoption paths

1. **OSSA → Symfony export (CLI/bridge):**  
   - Input: `manifest.ossa.yaml` (+ optional prompts/tools).  
   - Output: PHP bootstrap or config that builds `Agent($platform, $model, inputProcessors: [AgentProcessor($toolbox)], outputProcessors: [...])`, registers tools from `spec.tools` (generated `#[AsTool]` classes or MemoryToolFactory), sets system message from `spec.role` / `prompts.system.template`.  
   - Enables: one OSSA manifest → runnable Symfony Agent.

2. **Symfony → OSSA import:**  
   - Input: Symfony app with Agent(s) and Toolbox (or a config file describing them).  
   - Output: `manifest.ossa.yaml` with `metadata`, `spec.role`, `spec.llm`, `spec.tools` (names + descriptions + schema inferred from PHP).  
   - Enables: existing Symfony AI apps to become OSSA-described and portable.

3. **Drupal + Symfony AI + OSSA:**  
   - Keep Drupal extension (`extensions.drupal`) and ai_agents_ossa as the primary Drupal story.  
   - Optional: a **Symfony AI runtime adapter** for Drupal or standalone Symfony apps that loads an OSSA manifest and runs the agent via `symfony/ai-agent` (e.g. “run this OSSA agent in PHP” without going through ai_agents plugin system).  
   - ECA / Recipes: Issue #255; Symfony Messenger for async execution can be wired to ECA or OSSA task triggers.

4. **New OSSA extension (optional):** `extensions.symfony` or document Symfony in `extensions.drupal` as “alternative PHP runtime” (Symfony AI Agent vs ai_agents plugin). Prefer one PHP/Drupal story in the platform matrix with two backends: Drupal ai_agents, Symfony Agent.

5. **Docs and platform matrix:**  
   - Add “Symfony” to `ossa platforms --json` and docs: what they need (composer require symfony/ai-agent, symfony/ai-platform), folder structure (OSSA standard), export/import how (OSSA → Symfony bootstrap; Symfony → OSSA import).  
   - Publish a short “OSSA + Symfony AI” guide (wiki or docs): one manifest, export to Symfony, run agent in PHP.

### Recommended next steps

| Priority | Action | Owner |
|----------|--------|--------|
| 1 | Add **Symfony** to platform matrix (docs + `ossa platforms`): export = OSSA → Symfony Agent bootstrap; import = Symfony → OSSA manifest. | openstandardagents |
| 2 | Implement **OSSA → Symfony** export: from manifest generate PHP (or config) that builds Agent + Toolbox + system message. | openstandardagents or community |
| 3 | Implement **Symfony → OSSA** import: from Agent/Toolbox (or config) produce manifest.ossa.yaml. | openstandardagents or community |
| 4 | Document **Drupal + Symfony AI + OSSA**: when to use ai_agents_ossa vs Symfony Agent with OSSA manifest; ECA/Messenger. | technical-docs / openstandardagents wiki |
| 5 | Create GitLab issue(s): “Symfony AI Agent adapter (export/import)” and “Platform matrix: Symfony” for tracking. | openstandardagents |

---

## Worktree Execution Plan

```bash
# Each issue gets its own worktree
WORKTREE_BASE="${HOME}/Sites/blueflyio/WORKING_DEMOs/openstandardagents"

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
