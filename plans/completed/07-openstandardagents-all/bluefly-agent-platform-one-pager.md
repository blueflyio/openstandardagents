```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     BLUEFLY AGENT PLATFORM — ONE PAGER                     ║
║                         bluefly.io · v0.1.x · 2026                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

────────────────────────────────────────────────────────────────────────────────
 WHAT THIS IS
────────────────────────────────────────────────────────────────────────────────

  A GitLab-native, open-source agent orchestration platform built on the
  Open Standard for Software Agents (OSSA). 67 agents across 12 domains,
  18 TypeScript packages, ~70 GitLab repos, 40 Cloudflare tunnel endpoints,
  Drupal CMS 2.0 fleet, and a Tailscale mesh connecting Oracle Cloud (prod),
  Synology NAS (storage/dev), and Mac (local dev).

  Everything is real infrastructure — running services, deployed pipelines,
  enforced separation of duties, Cedar policy gates, and zero-touch CI/CD.

────────────────────────────────────────────────────────────────────────────────
 CORE CONCEPTS
────────────────────────────────────────────────────────────────────────────────

  OSSA    Open Standard for Software Agents. YAML manifest schema defining
          agent identity, tools, LLM config, governance, and deployment.
          Think OpenAPI but for autonomous agents.
          Spec: openstandardagents.org | SDK: @bluefly/openstandardagents

  OaAS    Outcome-as-a-Service. Enterprise model with outcome-based pricing.
          NOT the same as OSSA — OaAS is the business model, OSSA is the spec.

  UADP    Universal Agent Discovery Protocol. Convention-based discovery
          using .agents/ and .agents-workspace/ directories. OSSA extension.

  SoD     Separation of Duties. 4-tier access model with Cedar policy engine.
          Agents cannot review or approve their own work. CI-enforced.

────────────────────────────────────────────────────────────────────────────────
 THREE-TIER OSSA ARCHITECTURE
────────────────────────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Tier 1: platform-agents/            Agent manifests ONLY (YAML)       │
  │  Tier 2: common_npm/agent-*          Infrastructure packages (TS)      │
  │  Tier 3: gitlab-agent_ossa/          Platform implementation (Go)      │
  └─────────────────────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────
 THREE PILLARS
────────────────────────────────────────────────────────────────────────────────

  1. platform-agents     Agent registry. 67 OSSA agents across 12 domains.
                         Canonical manifests at .agents/@ossa/.

  2. agent-buildkit      CLI & automation. Agent marketplace, spawn, Drupal
                         sync, workspace status, GitLab ops, worktree mgmt.

  3. @bluefly/* pkgs     18 TypeScript packages in common_npm. ALL shared
                         code lives here — separation of duties is mandatory.

────────────────────────────────────────────────────────────────────────────────
 18 @BLUEFLY/* PACKAGES — PACKAGE OWNERSHIP
────────────────────────────────────────────────────────────────────────────────

  ┌──────────────────────────┬──────────────────────────────────────────────┐
  │ Package                  │ Domain                                       │
  ├──────────────────────────┼──────────────────────────────────────────────┤
  │ agent-router             │ Routing & Discovery                          │
  │ agent-mesh               │ Agent Communication (A2A)                    │
  │ agent-brain              │ Vector / Search / RAG (Qdrant)               │
  │ agent-tracer             │ Tracing & Observability                      │
  │ agent-docker             │ Docker / K8s / Tunnel ConfigMap              │
  │ agent-tailscale          │ Tailscale / Network Mesh                     │
  │ agent-protocol           │ MCP / Protocol (SSE, streamable_http)        │
  │ foundation-bridge        │ LLM Providers (multi-model)                  │
  │ workflow-engine          │ Workflow Execution & State                   │
  │ agentic-flows            │ Flow Definitions & Orchestration             │
  │ compliance-engine        │ Compliance / Audit / Cedar                   │
  │ studio-ui                │ React UI Components                          │
  │ iac                      │ Infrastructure as Code (endpoints, sync,     │
  │                          │ env templates, tunnel-routes, runners)        │
  │ openstandardagents       │ OSSA SDK & CLI (npmjs, not GitLab)           │
  └──────────────────────────┴──────────────────────────────────────────────┘

  Plus: gitlab_components (CI/CD pipelines), api-schema-registry (OpenAPI),
  platform-agents (agent YAML), technical-docs (GitLab Wiki)

────────────────────────────────────────────────────────────────────────────────
 INFRASTRUCTURE
────────────────────────────────────────────────────────────────────────────────

  ┌───────────────┬────────────────────────────────────────────────────────┐
  │ Layer         │ Role                                                    │
  ├───────────────┼────────────────────────────────────────────────────────┤
  │ Oracle Cloud  │ PRODUCTION. All platform services, runners, tunnel.    │
  │               │ 32 Cloudflare tunnel subdomains.                       │
  │ Synology NAS  │ Storage / dev / backup. Config, wikis, code-server,   │
  │               │ MinIO S3. 8 tunnel subdomains.                         │
  │ Mac (M4)      │ DDEV + Drupal only. IDE, BuildKit CLI, worktrees.     │
  │ Vast.ai       │ GPU compute when needed (RTX 4090). Costs money.      │
  └───────────────┴────────────────────────────────────────────────────────┘

  Tailscale Mesh (tailcf98b3.ts.net):
    mac-m4 ─── blueflynas ─── oracle-platform

  40 Cloudflare Tunnel Subdomains:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ ORACLE (32): mesh, mcpdash, router, agents, studio, tracer, mcp,      │
  │   brain, compliance, workflow, devops, a2a-collector, a2a-stream,      │
  │   adash, gkg, ecma-agent, content-guardian, intel, langflow, grafana,  │
  │   n8n, infra, chat, happy, orchestrator, api, openstandard-ui,        │
  │   kagent, kagent-ui, dragonfly                                         │
  │                                                                        │
  │ NAS (8): nas, storage, npm, dockge, obsidian, zotero, code, flowise   │
  └─────────────────────────────────────────────────────────────────────────┘

  Key Endpoints:
    mcp.blueflyagents.com        MCP Protocol Server (SSE)
    gkg.blueflyagents.com        Global Knowledge Graph
    mesh.blueflyagents.com       Agent Mesh API
    router.blueflyagents.com     Agent Router
    n8n.blueflyagents.com        Workflow Automation (prod)
    grafana.blueflyagents.com    Observability Dashboards
    openstandard-ui.blueflyagents.com   OSSA UI (creator/wizard/sandbox)

  Port Allocation:
  ┌─────────────────┬──────────────────────────────────────────────────────┐
  │ 3000-3015       │ Agent services (brain, chat, mesh, router, tracer)   │
  │ 4000            │ LiteLLM gateway                                      │
  │ 5000-5003       │ ML models                                            │
  │ 5432/6379/27017 │ PostgreSQL / Redis / MongoDB                         │
  │ 6333            │ Qdrant vector DB                                     │
  │ 9090            │ Prometheus                                           │
  └─────────────────┴──────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────
 GITLAB-FIRST WORKFLOW
────────────────────────────────────────────────────────────────────────────────

  ~70 repos on GitLab.com. Worktree-based development. No direct commits
  to main or release branches. CI-enforced compliance at every step.

  Branch Flow:
    Issue → Create MR (GitLab UI) → {issue#}-{slug} branch
    → worktree from __BARE_REPOS → push → CI → MR review
    → merge to release/v0.X.x → promote to main → CI → tag

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. Find/create GitLab Issue (link to Epic — no orphans)               │
  │  2. Create MR from Issue page (GitLab creates branch)                  │
  │  3. Create worktree from __BARE_REPOS                                  │
  │  4. Code → commit with "Refs: #123" → push                            │
  │  5. MR targets release/v0.X.x (never main)                            │
  │  6. Merge when CI passes + approvals satisfied                         │
  │  7. Promote: release → MR → main → CI → tag                           │
  └─────────────────────────────────────────────────────────────────────────┘

  Automation Stack:
    n8n (workflow automation) + Chef (infra-as-code) + GitLab (source of truth)
    n8n production on Oracle only. GitLab webhooks → n8n → workflow-engine.

────────────────────────────────────────────────────────────────────────────────
 DRUPAL CMS 2.0 & FLEET
────────────────────────────────────────────────────────────────────────────────

  Platform target: Drupal CMS 2.0 (Core 11.3+, Canvas, Experience Builder,
  Mercury components, recipes, AI tools). Contrib-first — custom PHP is
  last resort.

  Priority Chain:
    Configuration → Contrib modules → Recipes → Custom PHP (last resort)

  Key Contrib (strategic):
    drupal/tool           Pluggable Tool API (typed tools, MCP, tool_ai)
    drupal/orchestration  Expose tools/agents/ECA to n8n/Zapier/Activepieces
    drupal/eca            Event-Condition-Action automation
    drupal/flowdrop       Visual workflow builder + AI providers
    drupal/ai             AI ecosystem (providers, connectors)

  Fleet (3 Drupal Sites):
  ┌──────────────────────┬─────────────────────────────────────────────────┐
  │ Drupal_AgentDash     │ Platform dashboard & monitoring                 │
  │ Drupal_AgentMktplace │ Agent Marketplace (you own this)                │
  │ Drupal_Fleet_Manager │ Fleet management & source-connect               │
  └──────────────────────┴─────────────────────────────────────────────────┘

  Custom code in all_drupal_custom/ → buildkit drupal sync → test in
  demo_llm-platform/ → NEVER edit demo_llm-platform/web/ directly.

────────────────────────────────────────────────────────────────────────────────
 .agents/ AND DISCOVERY (UADP)
────────────────────────────────────────────────────────────────────────────────

  Every project can declare agents via the .agents/ directory convention:

    .agents/
    ├── @ossa/
    │   ├── agent-one.ossa.yaml       # OSSA manifest
    │   └── agent-two.ossa.yaml
    └── .agents-workspace/
        └── workspace-config.yaml     # Discovery metadata

  Platform registry: platform-agents/packages/@ossa/ (67 agents, 12 domains)
  Wizard-generated: openstandard-generated-agents (blueflyio/ossa/lab)
  Discovery: UADP scans .agents/ dirs for auto-registration.

  OSSA Four-Repo SoD (no overlap):
  ┌─────────────────────────────┬──────────────────────────────────────────┐
  │ openstandardagents          │ Spec + CLI only                          │
  │ openstandardagents.org      │ Marketing + thin agent builder/YAML ed.  │
  │ openstandard-ui             │ The app: creator/save/pipelines          │
  │ openstandard-generated-agents│ Artifact store only                     │
  └─────────────────────────────┴──────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────
 GOOSE INTEGRATION
────────────────────────────────────────────────────────────────────────────────

  Block/Square's open-source AI agent framework (Rust + TypeScript).
  Recipe/extension architecture with MCP as the protocol layer.

  Integration Strategy (876-line plan completed):

  ┌─────────────────────────────┬──────────────────────────────────────────┐
  │ Bluefly                     │ Goose                                    │
  ├─────────────────────────────┼──────────────────────────────────────────┤
  │ @bluefly/* packages         │ → Goose Extensions                       │
  │ Bluefly workflows           │ → Goose Recipes                          │
  │ MCP servers (SSE)           │ → SSE/streamable_http extensions         │
  │ OSSA manifests              │ → Extension metadata + discovery         │
  │ BuildKit CLI commands       │ → Goose CLI recipes                      │
  │ Cedar policies              │ → Extension permission boundaries        │
  └─────────────────────────────┴──────────────────────────────────────────┘

  Key extensions: goose-bluefly-mesh, goose-bluefly-brain,
  goose-bluefly-router, goose-bluefly-mcp, goose-bluefly-workflow

  Goose recipes map to Bluefly agentic flows — n8n triggers
  workflow-engine, which can now be invoked as Goose recipes.

────────────────────────────────────────────────────────────────────────────────
 WHAT YOU DO WITH IT
────────────────────────────────────────────────────────────────────────────────

  • Spawn agents from the marketplace with OSSA manifests
  • Orchestrate multi-agent workflows with separation of duties
  • Route tasks through Cedar-governed policy gates
  • Build and deploy Drupal CMS 2.0 sites with AI-native tooling
  • Connect any MCP-compatible tool (IDE, CLI, browser, Goose)
  • Run CI/CD pipelines with 18 reusable GitLab components
  • Monitor everything via Grafana dashboards and agent-tracer
  • Search platform knowledge via Global Knowledge Graph (GKG)
  • Automate GitLab ops (issues, MRs, wiki) through BuildKit CLI
  • Expose Drupal tools/agents to n8n/Zapier via orchestration module
  • Generate and validate OSSA agents via openstandard-ui wizard
  • Extend to Goose framework via recipes and extensions

────────────────────────────────────────────────────────────────────────────────
 AGENT ROLE SEPARATION (ENFORCED)
────────────────────────────────────────────────────────────────────────────────

  ┌───────────────────────────┬──────────┬────────────┬────────────────────┐
  │ Agent                     │ Role     │ Tier       │ Conflicts With     │
  ├───────────────────────────┼──────────┼────────────┼────────────────────┤
  │ vulnerability-scanner     │ Analyzer │ tier_1_read│ Executor, Approver │
  │ merge-request-reviewer    │ Reviewer │ tier_2_write│ Executor, Approver│
  │ pipeline-remediation      │ Executor │ tier_3_full│ Reviewer, Approver │
  │ release-coordinator       │ Orchestr.│ tier_2_write│ Executor (direct) │
  └───────────────────────────┴──────────┴────────────┴────────────────────┘

  Rule: Executor → Reviewer handoff in same chain is FORBIDDEN.

────────────────────────────────────────────────────────────────────────────────
 SAFETY CLASSIFICATIONS
────────────────────────────────────────────────────────────────────────────────

  🟢 SAFE       Reading files, running tests, creating worktrees,
                feature branches

  🟡 PROTECTED  Modifying package.json, CI/CD config, creating MRs

  🔴 HIGH RISK  Version fields, git tags, protected branches,
                production deploys

  Version Authority:
    HUMAN (milestone) → CI PIPELINE (semantic-release) → GIT TAG
    AI Agents: READ-ONLY for all version information.

────────────────────────────────────────────────────────────────────────────────
 CRITICAL RULES
────────────────────────────────────────────────────────────────────────────────

  NEVER:
    ✗ Commit to main or release/* directly
    ✗ Create .sh/.bash scripts (TypeScript + BuildKit only)
    ✗ Create .md files in repos (GitLab Wiki only)
    ✗ Create symlinks (forbidden)
    ✗ Touch versions, create tags, run npm version
    ✗ Use git stash, reset --hard, push --force, rebase on shared branches
    ✗ Run platform services on Mac (Oracle = prod, NAS = backup)
    ✗ Run GitLab runners on employer hardware
    ✗ Duplicate code from @bluefly/* packages
    ✗ Create new projects (add to existing repos only)
    ✗ Build custom if open-source exists

  ALWAYS:
    ✓ Use git worktrees from __BARE_REPOS
    ✓ Create MRs from GitLab Issue page
    ✓ Target MRs to release/v0.X.x
    ✓ Import from @bluefly/* packages
    ✓ Use BuildKit CLI before writing scripts
    ✓ Reference issues in commits: Refs: #123
    ✓ Run tests before pushing
    ✓ Search drupal.org/npm/GitHub before writing custom code
    ✓ Put docs in GitLab Wiki, issues in GitLab Issues
    ✓ Drupal contrib first, custom PHP last resort

╔══════════════════════════════════════════════════════════════════════════════╗
║  Built by Thomas Scola · Bluefly.io · GitLab-native · Open Source First   ║
║  67 agents · 18 packages · 40 endpoints · ~70 repos · Drupal CMS 2.0     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
