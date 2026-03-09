# Dragonfly + Agent Eval: The Platform Vision

> **Wiki Path:** `dragonfly.wiki/architecture/agent-eval-vision.md`
> **Date:** March 3, 2026
> **Author:** Thomas Scola / Bluefly.io
> **Status:** Architecture — extends Dragonfly core, no new projects

---

## 1. The Inversion

The entire Playwright + AI industry in 2026 builds one thing: **AI agents that test software.** Playwright v1.56 ships Planner, Generator, Healer. Microsoft, GitHub Copilot, Bug0, TestSprite, ZeroStep, Mabl — all building agents that write and maintain browser tests.

Meanwhile, the agent evaluation industry builds a parallel thing: **abstract scoring of agent outputs.** Braintrust, Maxim, Galileo, LangSmith, Arize — all scoring text-in/text-out with rubrics, trajectories, and LLM-as-judge. No browser. No DOM. No real-world state validation.

**Nobody builds the inverse: a platform that tests AI agents in real browser environments with DOM-level evidence.**

Dragonfly already runs your Drupal tests. We extend it to run your agent tests. Same platform, same queue, same reporting, same seven OSSA agents — now validating agent behavior alongside application behavior.

One platform. Two test modes. App tests and agent-in-browser tests.

## 2. The Gap — What Exists and What Doesn't

**Tier 1 — Playwright's agent ecosystem:** Playwright Test Agents (v1.56+), MCP Server, CLI + Skills. They generate or drive tests; they do not *test* agents in the browser.

**Tier 2 — Agent evaluation frameworks (no browser):** Braintrust, Maxim, Galileo, Langfuse, Arize, LangSmith, Bedrock AgentCore. Tracing, scoring, multi-turn simulation. None answer: did the agent actually click? Does the UI reflect correct state? Is that information actually on the page? Do two agents conflict in the browser? Does behavior regress when we change model or prompt? The bridge between agent evaluation and browser automation is what we build in Dragonfly.

## 3. What Dragonfly Is Today

### Dragonfly Core (MIT)

Drupal test orchestration as a service. Register projects, trigger runs, get results.

**What it runs:** PHPUnit (unit, kernel, functional), PHPCS, PHPStan, Playwright E2E. Seven OSSA agents coordinate: Orchestrator, Test Selector (AI-driven from git diff), Test Runner (Docker/DDEV per PHP 8.2/8.3/8.4), Analysis (Qdrant + Vast.ai failure diagnosis), Rector (automated upgrades), Reporter (GitLab MR + GKG), Quality Control (platform-wide gates).

**How it runs:** `POST /api/dragonfly/v1/tests/trigger` with `projects` and `testTypes`. Dragonfly provisions an isolated environment, injects platform env (`BASE_URL`, `MCP_URL`, `GKG_URL`, `DRAGONFLY_URL`), executes, persists results to PostgreSQL, posts to GitLab MRs, feeds the knowledge graph.

**What makes it different from CI:** CI is "push and pray." Dragonfly is orchestrated — you trigger from Drupal, n8n, the API, or an AI agent. It chooses the PHP version, DDEV addons, and platform context. Results land in one system, not scattered across pipeline logs.

**Deployment:** Oracle production (`dragonfly.blueflyagents.com:3020`), NAS backup, BuildKit deploy commands. MCP resources and tools exposed so agents and IDEs can list projects, trigger runs, query results.

### Dragonfly SaaS (Proprietary)

Optional premium plugin (`@bluefly/dragonfly-saas`). Adds tenant API and n8n GitLab bootstrap. When `DRAGONFLY_PREMIUM_ENABLED=true`, Dragonfly loads tenant routes: `GET /tenant`, `POST /tenant/bootstrap` (calls n8n webhook → creates GitLab project → links to tenant in DB), `PATCH /tenant`, `GET /tenants` (admin).

SaaS is the multi-tenant layer. Core is the product. SaaS makes it a platform service where each user gets their own GitLab project provisioned automatically.

### Dragonfly Client (Drupal Module)

Standalone Drupal client for Dragonfly. Bridges the Node.js service into Drupal via contrib-first architecture: `http_client_manager` (zero custom HTTP), ECK entities (projects, agents, test results), `migrate_plus` (sync via `drush migrate:import --group=dragonfly`), Tool API plugins (`list_projects`, `trigger_test`, `agent_status`), and the critical `dragonfly_client_orchestration` submodule that exposes all tools to n8n/Activepieces/Zapier/ECA via the Orchestration module's service catalog.

**The architecture pattern:** Dragonfly Client doesn't duplicate logic. It exposes Dragonfly's capabilities through Drupal's native plugin system. Tools auto-derive as FunctionCall plugins via `tool_ai_connector`. The Orchestration submodule makes everything callable via `POST /orchestration/service/execute`.

## 4. What We Add: Agent Eval Mode

Dragonfly gets a new `testType`: `agent-eval`.

Same trigger API. Same queue. Same runner. Same reporter. But instead of running PHPUnit against your Drupal code, it runs Playwright scenarios against your AI agents.

```json
POST /api/dragonfly/v1/tests/trigger
{
  "projects": ["checkout-assistant"],
  "testTypes": ["agent-eval"],
  "config": {
    "scenarios": ["checkout-happy-path", "checkout-error-handling"],
    "agent": {
      "endpoint": "http://localhost:3001/agent",
      "protocol": "mcp",
      "manifest": "@ossa/checkout-assistant"
    },
    "baselines": "v0.4.5",
    "thresholds": {
      "stepEfficiency": 0.6,
      "maxCost": { "tokens": 5000 },
      "minConfidence": 0.7
    }
  }
}
```

Dragonfly's Test Runner provisions the environment (same Docker/DDEV mechanism), starts Playwright, loads the scenario YAML, connects to the agent via MCP (or REST/gRPC), executes the task, captures everything, evaluates against acceptance criteria, and persists results.

The seven OSSA agents adapt naturally:

| Agent | App Test Mode | Agent Eval Mode |
|---|---|---|
| **Orchestrator** | Coordinates PHPUnit/PHPCS/Playwright runs | Coordinates agent scenario runs |
| **Test Selector** | AI-selects tests from git diff | AI-selects scenarios from agent manifest changes |
| **Test Runner** | Provisions Docker, runs tests | Provisions Docker, runs Playwright + agent |
| **Analysis** | Failure diagnosis via Qdrant | Behavioral anomaly diagnosis — *why* the agent deviated |
| **Rector** | Automated Drupal upgrades | Automated agent prompt/config suggestions |
| **Reporter** | GitLab MR + GKG | GitLab MR behavioral diff + GKG + OSSA compliance report |
| **Quality Control** | Code quality gates | Agent behavioral + compliance gates |

## 5. The Five Capabilities on Dragonfly

### 5.1 Agent Scenario Runner

Scenarios live alongside test specs. YAML format, OSSA-compatible, executed by Dragonfly's runner:

```yaml
# scenarios/checkout-assistant/happy-path.scenario.yaml
scenario: "Complete checkout with payment validation"
agent:
  manifest: "@ossa/checkout-assistant"
  endpoint: "http://localhost:3001/agent"
  protocol: mcp
environment:
  url: "https://staging.example.com/shop"
  mocks:
    - route: "**/api/inventory"
      response: { status: 200, body: "./fixtures/inventory.json" }
task:
  prompt: "Add the blue widget to cart and complete checkout"
  max_steps: 15
  timeout: 60s
acceptance:
  dom:
    - selector: "[data-testid='order-confirmation']"
      state: visible
  agent:
    - tool_called: "click"
      target_contains: "Add to Cart"
    - no_tool: "navigate_away"
  reasoning:
    min_confidence: 0.7
    max_revisions: 3
    no_hallucinated_elements: true
  cost:
    max_tokens: 5000
    max_api_calls: 20
```

Dragonfly registers the scenario as a project. `POST /tests/trigger` with `testTypes: ["agent-eval"]` runs it. Results follow the same schema — pass/fail counts, artifacts (screenshots, traces, thought graphs), execution time.

### 5.2 Behavioral Assertions Library

The Playwright plugin (`@bluefly/playwright-agent-eval`) provides assertion primitives used inside Dragonfly runs:

**DOM + Trajectory combined:** `toHaveToolSequence()`, `toHaveStepEfficiency()`, `not.toHaveHallucinatedSelector()` (every selector the agent targeted actually existed in the Accessibility Tree), `not.toHaveBacktracked()`.

**Reasoning assertions:** `toHaveMinConfidence()`, `not.toHaveContradiction()`, `toSatisfyGovernanceTriggers()` (OSSA `spec.cognition` compliance).

**Cost assertions:** `toBeLessThan({ tokens, latency_ms, api_calls })`.

These don't exist anywhere. Playwright has DOM assertions. Evaluation tools have trajectory metrics. Nobody combines them. Dragonfly's runner executes them; the Analysis agent diagnoses failures.

### 5.3 Multi-Agent Coordination Tests

Dragonfly already handles parallel test execution. Agent eval extends this to multi-agent browser scenarios:

Agent A handles product selection in one browser context. Agent B handles checkout in the same context (shared state). Dragonfly captures both traces, validates no DOM mutation conflicts, verifies clean handoff of cart state. The Quality Control agent enforces coordination rules.

This tests what nobody else tests: **what happens when two agents touch the same browser?**

### 5.4 Regression Detection

Dragonfly records baselines — the behavioral fingerprint of a stable agent version. When the model changes, the prompt changes, or the tool definitions change, Dragonfly runs the same scenarios against the new version and diffs:

- Tool call sequence drift (did the agent's approach change?)
- Step efficiency delta (did it get slower/faster?)
- Confidence distribution shift (is it less certain?)
- New hallucinated selectors (is it targeting elements that don't exist?)
- Cost delta (is it burning more tokens?)

The Reporter agent posts the behavioral diff as a GitLab MR comment — not a code diff, a *behavior* diff. The Quality Control agent gates the merge on thresholds.

### 5.5 OSSA Compliance Gate

Every agent eval run validates OSSA manifest compliance:

- `identity.gaid_present` — DID attached to every action
- `capabilities.declared_match` — agent only used tools declared in its manifest
- `cognition.trace_complete` — full thought graph captured per `spec.cognition`
- `cognition.governance_triggers` — triggers fired when confidence dropped below threshold
- `security.no_scope_escalation` — agent didn't access routes outside its declared scope
- `compliance.audit_exportable` — trace can be exported as NIST SP 800-53 audit bundle

The Dragonfly Client's `dragonfly_client_orchestration` submodule exposes compliance results to Drupal. ECA workflows can react to compliance failures. The marketplace displays agent quality scores derived from eval runs.

## 6. Ecosystem Placement

No new projects. Extensions to existing repos:

| Component | Repo | What Gets Added |
|---|---|---|
| `agent-eval` testType | `dragonfly` (core) | New runner mode, scenario loader, agent connector |
| Playwright plugin | `common_npm/agent-tracer` | `@bluefly/playwright-agent-eval` — fixtures, assertions, reporters |
| Scenario schema | `openstandardagents` | YAML scenario format in OSSA spec (`spec.testing`) |
| Reasoning capture | `common_npm/agent-brain` | ThoughtNode capture during eval runs |
| MCP bridge | `common_npm/agent-protocol` | Bidirectional MCP adapter for agent ↔ Playwright |
| CI reporter | `gitlab_components` | MR behavioral diff reporter |
| Drupal surface | `all_drupal_custom/dragonfly_client` | Agent eval results as entities, marketplace quality scores |
| SaaS tenant scoping | `dragonfly-saas` | Per-tenant agent eval quotas and result isolation |
| Wizard integration | `openstandard-ui` | "Testing" step — generate starter scenarios from manifest |

## 6. Implementation Sequence

All steps extend existing code. No new repos. No shell scripts.

1. **Plugin scaffold** — `@bluefly/playwright-agent-eval` in `agent-tracer`. Playwright fixture that connects to an MCP agent, executes a task, captures trace. Proves the inversion works.

2. **Scenario schema** — YAML format in `openstandardagents` spec. Zod validation. CLI flag `ossa scenario validate`.

3. **Dragonfly trigger + runner** — New `agent-eval` testType in Dragonfly core. Runner provisions environment, starts Playwright, loads scenario, connects agent, executes, captures. Same queue, same reporting path.

4. **Assertion library** — Behavioral assertions in the Playwright plugin. DOM + trajectory + reasoning + cost in one chain.

5. **Baselines + regression** — Record stable behavior. Diff against new runs. Threshold alerting.

6. **GitLab reporter** — `gitlab_components` CI component. Posts behavioral diff as MR comment.

7. **OSSA compliance gate** — Manifest validation during runs. Audit bundle export (`spec.cognition` + `spec.security` + `spec.compliance`).

8. **Multi-agent coordination** — Shared browser context management. State corruption detection. Handoff validation.

9. **Drupal + marketplace** — `dragonfly_client` gets agent eval result entities. Marketplace quality scores. ECA reactions to compliance failures. `dragonfly-saas` scopes results per tenant.

## 7. Competitive Position

| Capability | Dragonfly | Braintrust | Maxim | Galileo | LangSmith | Playwright Agents |
|---|---|---|---|---|---|---|
| Tests AI agents | **Yes** | Yes | Yes | Yes | Yes | No* |
| Tests applications (PHPUnit etc.) | **Yes** | No | No | No | No | No |
| Real browser validation | **Yes** | No | No | No | No | Yes** |
| DOM + agent behavior combined | **Yes** | No | No | No | No | No |
| Multi-agent coordination | **Yes** | No | Partial | No | Partial | No |
| Behavioral regression in CI/CD | **Yes** | Yes | Yes | Yes | Yes | No |
| OSSA manifest compliance | **Yes** | No | No | No | No | No |
| NIST audit export | **Yes** | No | No | No | No | No |
| Single platform for both modes | **Yes** | No | No | No | No | No |

\* Playwright agents *write* tests, they don't get tested
\*\* Playwright *drives* browsers for agents, but doesn't *evaluate* agents in browsers

**The unique position:** Dragonfly is the only platform that runs both your application tests and your agent behavior tests through the same queue, the same seven OSSA agents, the same reporting pipeline, and the same GitLab integration.

## 8. The Pitch

**For enterprise QA:** "You already run PHPUnit through Dragonfly. Now run your agent evaluations through the same platform. One trigger API, one results dashboard, one GitLab integration. When your agent touches a browser, Dragonfly validates what actually happened in the DOM — not just what the agent claimed happened."

**For the OSSA ecosystem:** "Define → Build → Deploy → **Validate.** The agent lifecycle has four phases. Dragonfly completes the fourth. Every agent built in the wizard, exported from the manifest, deployed to production — now gets behavioral validation with compliance evidence."

**For government/compliance:** "FedRAMP auditors ask for evidence of automated decision-making oversight. Dragonfly produces traversable thought graphs with confidence scores, governance trigger history, and DOM-level proof of agent actions. Export as a NIST SP 800-53 audit bundle."

**For open source:** "The first test orchestration platform that treats AI agents as test subjects. MIT core. Playwright plugin for anyone. OSSA compliance for standards-aligned organizations. SaaS layer for multi-tenant deployments."

## 9. References

- Dragonfly core README: `https://gitlab.com/blueflyio/dragonfly/dragonfly`
- Dragonfly Client README: `https://gitlab.com/blueflyio/dragonfly/dragonfly_client`
- Dragonfly SaaS: `https://gitlab.com/blueflyio/dragonfly/dragonfly-saas`
- Playwright Agent Testing Gap Analysis (companion wiki doc)
- Human-Centric Agent Design Analysis (companion wiki doc)
- OSSA Ecosystem Architecture & Execution Plan
- OSSA v0.4 Specification: `https://openstandardagents.org/specification/`

---

*This document extends the Playwright Agent Testing Gap Analysis with Dragonfly-specific architecture. Implementation depends on Dragonfly core stability and OSSA v0.4.6 release.*
