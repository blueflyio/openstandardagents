# Dragonfly and the Playwright Agent-Eval Vision: Full Roadmap

**Wiki path:** `openstandardagents.wiki/research/dragonfly-playwright-agent-eval-vision.md` (or `technical-docs.wiki/research/` as alternate)  
**Date:** March 3, 2026  
**Author:** Thomas Scola / Bluefly.io  
**Status:** Strategic roadmap — crosses Dragonfly (drupal-test-orchestrator) with Playwright-for-Agent-Testing gap analysis  
**Feeds into:** Dragonfly roadmap, `@bluefly/agent-tracer`, QITS, OSSA spec.testing

---

## Part 1: The Inversion Nobody Sees

The entire Playwright-plus-AI ecosystem in 2026 is pointed in one direction.

Playwright v1.56 introduced three AI agents — Planner, Generator, Healer — that use LLMs to *write and maintain* browser tests. The Playwright MCP server lets AI agents *drive* browsers. Microsoft, GitHub Copilot, Bug0, TestSprite, ZeroStep, Mabl: every player is building the same thing. **AI agents that test software.**

Nobody is building the inverse: **software that tests AI agents.**

That gap is what this article is about. And the platform we are building to fill it is **Dragonfly** — not as “yet another test runner,” but as the orchestration layer that runs **agent-evaluation-in-the-browser**: the same way Dragonfly today runs PHPUnit and Playwright *for* Drupal, it will run Playwright *against* AI agents, with scenarios, baselines, and compliance gates.

---

## Part 2: What Dragonfly Is Today

### Core product: one system for “run this suite” and “why did it fail?”

**Dragonfly** is an AI-powered Drupal test orchestration service. You point it at a Git repo and a test type; it provisions an isolated environment (Docker or DDEV), runs PHPUnit, PHPCS, PHPStan, and Playwright E2E, then stores results, posts to GitLab MRs, and feeds the knowledge graph. One API, one place to trigger, watch, and reason about test runs — without per-project CI YAML or manual runners.

- **Register** Drupal modules, themes, or recipes as projects (REST API).  
- **Trigger** runs with `testTypes`: `unit`, `kernel`, `functional`, `phpcs`, `phpstan`, `playwright`, `e2e`.  
- **Provision** isolated environments: Docker per PHP 8.2/8.3/8.4, or DDEV with optional addons.  
- **Execute** PHPUnit/PHPCS/PHPStan in-container; Playwright E2E with platform env (BASE_URL, MCP_URL, GKG_URL, DRAGONFLY_URL) injected.  
- **Persist** results to PostgreSQL; stream progress; optionally post to GitLab MRs and GKG.  
- **Expose** MCP resources and tools so agents and IDEs can list projects, trigger runs, and query results.

Seven OSSA agents handle selection, execution, analysis, and reporting: Orchestrator, Test Selector, Test Runner, Analysis, Rector, Reporter, Drupal Quality Control. So today Dragonfly is already “orchestrated test execution as a service” — for *applications* (Drupal).

### Premium layer: dragonfly-saas

**dragonfly-saas** is a separate, proprietary npm package (`@bluefly/dragonfly-saas`) that Dragonfly core optionally loads when `N8N_TENANT_BOOTSTRAP_WEBHOOK_URL` or `DRAGONFLY_PREMIUM_ENABLED` is set. It adds:

- **Tenant API:** `GET /tenant`, `POST /tenant/bootstrap`, `PATCH /tenant`, `GET /tenants` (admin).  
- **n8n integration:** `POST /tenant/bootstrap` calls an n8n webhook to create a GitLab project and links that project to the logged-in user in Dragonfly’s DB.

So: **Dragonfly core** = the product you deploy (MIT). **dragonfly-saas** = the optional SaaS layer (tenant + “link user to GitLab project”) that mounts on top. Same codebase; premium unlocks multi-tenant and GitLab-project bootstrap.

---

## Part 3: The Gap — What Exists and What Doesn’t

### Tier 1: Playwright’s own agent ecosystem

- **Playwright Test Agents (v1.56+).** Planner, Generator, Healer: they *generate* tests for web UIs. They don’t *test* agents.  
- **Playwright MCP Server.** Lets agents drive the browser. Mechanism only — no notion of “run this scenario *against* this agent and assert on behavior.”  
- **Playwright CLI + Skills (March 2026).** Route interception, isolation. Still “agent drives Playwright,” not “Playwright tests agent.”

### Tier 2: Agent evaluation frameworks (no browser)

- **Braintrust, Maxim AI, Galileo, Langfuse, Arize, LangSmith, Amazon Bedrock AgentCore.** Tracing, scoring, multi-turn simulation, tool selection, latency. All operate in an abstract space: text in, text out, maybe tool traces. None answer:

  - When my agent says “I clicked the submit button,” **did it actually click it?**  
  - When my agent does a multi-step workflow, **does the UI reflect the correct state at each step?**  
  - When my agent claims it found information on a page, **is that information actually there?**  
  - When two agents collaborate in a browser, **do their actions conflict or corrupt state?**  
  - When we change model or prompt, **does observable behavior in the browser regress?**

Nobody answers these because nobody has built the bridge between **agent evaluation** and **browser automation**. That bridge is what we build — and Dragonfly is where it runs.

---

## Part 4: The Vision — Dragonfly as the Platform for “Software That Tests AI Agents”

We flip the Playwright agent paradigm.

- **Today (everyone):** AI Agent → drives Playwright → tests your web app.  
- **Our direction:** Playwright → drives scenarios → tests your AI agent (in a real browser, with DOM and trajectory and cost and compliance).

Dragonfly already has:

- A trigger API (`POST /tests/trigger`) with `testTypes` (including `playwright`).  
- Isolated execution (Docker/DDEV), env injection, artifact collection.  
- GitLab MR integration, GKG, MCP.  
- An agent stack (Orchestrator, Test Runner, Analysis, Reporter).

The next level is to **add a new test mode** (and eventually a dedicated test type) that means: “run this Playwright run *against* this agent,” with:

- Scenario definitions (YAML, OSSA-compatible).  
- Behavioral assertions (trajectory, efficiency, hallucination, reasoning, cost).  
- Multi-agent coordination tests.  
- Regression detection across model/prompt changes.  
- OSSA compliance gates and NIST-audit export.

Dragonfly remains the single place you call to “run tests” — whether those tests are PHPUnit for Drupal or Playwright scenarios *for* an AI agent. Same queue, same results store, same GitLab and GKG integration.

---

## Part 5: The Five Capabilities (Crossed with Dragonfly)

### 1. Agent scenario runner (Dragonfly + plugin)

- **Scenario format:** YAML, OSSA-compatible (e.g. `spec.testing` in openstandardagents). Environment (URL, auth, mocks), task (prompt, max steps, timeout), acceptance (DOM state, tool sequence, reasoning, cost).  
- **Execution:** Dragonfly accepts a run with `testTypes: ['agent-eval']` (or `playwright` with a scenario ref). Test Runner agent (or a dedicated Agent-Eval Runner) provisions a browser, loads the scenario, invokes the agent via MCP/REST/A2A, and records DOM, tool calls, reasoning, and screenshots.  
- **Storage:** Same PostgreSQL and artifact store as today; new tables or JSON columns for scenario runs, baselines, and regression diffs.

So: “Trigger an agent-eval run” is just another Dragonfly trigger. Projects can be Drupal repos (current) or “agent-eval scenarios” (new project type or tag).

### 2. Behavioral assertions library (`@bluefly/playwright-agent-eval`)

- A Playwright plugin (fixtures, assertions, reporters) lives in the ecosystem — initially in or alongside `@bluefly/agent-tracer`, as in the gap analysis.  
- Assertions: `toHaveToolSequence`, `toHaveStepEfficiency`, `not.toHaveBacktracked`, `not.toHaveHallucinatedSelector`, `toHaveMinConfidence`, `toSatisfyGovernanceTriggers`, cost bounds.  
- Dragonfly’s Test Runner (or Agent-Eval Runner) uses this plugin when executing agent-eval scenarios; results are written into Dragonfly’s result model and exposed via API and MCP.

### 3. Multi-agent coordination testing

- Playwright’s parallel contexts become “two agents, one browser (or shared state).”  
- Scenarios define agent A and agent B, tasks and handoffs; assertions check for state corruption, conflicting DOM mutations, and clean handoff.  
- Dragonfly runs these as multi-step jobs: same queue, same reporting. Optional: dedicated “multi-agent” test type and UI in the dashboard.

### 4. Regression detection across model/prompt changes

- **Baselines:** Recorded agent behavior (trajectory, efficiency, cost) from a “golden” run (e.g. last stable release). Stored in Dragonfly (or artifact store) and keyed by scenario + agent + model version.  
- **Thresholds:** Step efficiency drop, tool-sequence drift, confidence drop, new hallucinations, cost increase. Configurable per project or per scenario.  
- **CI:** GitLab pipeline (or Dragonfly-triggered run) runs agent-eval scenarios on every MR that touches prompts, model config, or tools. Reporter (e.g. from gitlab_components) posts a behavioral diff comment on the MR.  
- Dragonfly already has “post to GitLab MR”; the new piece is “behavioral diff” content and the regression engine that compares current run to baseline.

### 5. OSSA compliance gate

- Each scenario can require OSSA manifest compliance: identity (GAID), capabilities (declared tools only), cognition (trace, governance triggers), security (no scope escalation), compliance (audit export).  
- The plugin (or a Dragonfly-side checker) validates the run’s trace against the manifest and produces a pass/fail and an audit bundle (e.g. NIST-exportable).  
- Dragonfly stores compliance results and can expose them via API and to the marketplace (e.g. “this agent passed tier_2 OSSA checks in the browser”).

---

## Part 6: Where This Lives in the Ecosystem

No new “Dragonfly 2” product. We extend the existing stack:

| Component | Repo / package | What gets added |
|-----------|----------------|------------------|
| **Orchestration** | Dragonfly (dragonfly/dragonfly) | New test type or mode: `agent-eval`; scenario-aware trigger; Agent-Eval Runner (or extended Test Runner); baseline storage and regression comparison; MR comment with behavioral diff. |
| **Playwright plugin** | `@bluefly/agent-tracer` (or dedicated `@bluefly/playwright-agent-eval`) | Fixtures, assertions, reporters for agent-eval; MCP bridge for agent ↔ Playwright. |
| **Scenario schema** | openstandardagents | YAML scenario format in OSSA spec (`spec.testing`); Zod validation; optional wizard step in openstandard-ui to generate starter scenarios from manifest. |
| **Reasoning capture** | agent-brain | ThoughtNode / thought-graph capture during Playwright agent-eval runs; storage and query for “why did the agent do that?” |
| **MCP bridge** | agent-protocol | Bidirectional MCP adapter so Dragonfly’s runner can “talk to” the agent under test and capture tool calls and reasoning. |
| **CI reporter** | gitlab_components | GitLab MR reporter component: behavioral regression diff (step efficiency, tool sequence, cost, OSSA compliance). |
| **Drupal / marketplace** | ai_agents_ossa, marketplace | Agent test results as entities or quality scores; “this agent passed browser-based OSSA checks” in the marketplace. |

Dragonfly stays the single entry point for “run tests” — including “run agent-eval scenario X for agent Y.” The plugin and scenario format are the contract; Dragonfly is the engine.

---

## Part 7: Implementation Sequence (Plan to Next Level)

1. **Plugin scaffold** (agent-tracer or new package): Playwright fixture, basic agent executor (MCP or REST), minimal scenario loader. Prove “Playwright drives scenario, agent responds, we capture DOM + tools.” No new Dragonfly code yet; run locally.  
2. **Scenario YAML schema** (openstandardagents): Formal spec for agent test scenarios; Zod validation; document in OSSA spec.testing.  
3. **Dragonfly: agent-eval trigger and runner:** Extend `POST /tests/trigger` to accept scenario ref and agent ref; add a runner path that runs Playwright with the plugin and scenario; store results in existing DB and artifact store.  
4. **Assertion library:** Implement `toHaveToolSequence`, `toHaveStepEfficiency`, `not.toHaveHallucinatedSelector`, etc., in the plugin; wire into Dragonfly’s result model (e.g. assertion pass/fail per criterion).  
5. **Baseline recording and regression:** In Dragonfly, record baselines (by scenario + agent + model version); on each run, compare to baseline; compute diff and thresholds; expose in API and for reporter.  
6. **GitLab reporter** (gitlab_components): MR comment with behavioral diff (e.g. “step efficiency −12%”, “3 new tool calls”, “cost +18%”).  
7. **OSSA compliance gate:** In plugin or Dragonfly, validate trace against OSSA manifest; produce compliance result and optional audit bundle; store and expose.  
8. **Multi-agent coordination:** Scenarios with two agents, shared browser or state; assertions for conflict and handoff; Dragonfly job type and dashboard support.  
9. **Drupal / marketplace surface:** Consume Dragonfly agent-eval results; show “browser-validated” or “OSSA tier_2 passed” in Agent Marketplace and AgentDash.

---

## Part 8: Competitive Position (Recap)

| Capability | Playwright agents | Braintrust / Maxim / Galileo | Dragonfly + playwright-agent-eval |
|------------|--------------------|-----------------------------|------------------------------------|
| Tests agents (not writes tests) | No | Yes | Yes |
| Real browser validation | No | No | Yes |
| DOM state + agent behavior | No | No | Yes |
| Multi-agent coordination in browser | No | No | Yes |
| Behavioral regression in CI/CD | No | Yes | Yes |
| OSSA manifest compliance in browser | No | No | Yes |
| Single platform for app tests and agent tests | No | No | Yes (Dragonfly) |

The unique combination: one orchestration platform (Dragonfly) that runs both “tests for my Drupal site” and “tests for my AI agent in a real browser,” with trajectory, reasoning, cost, and OSSA compliance, and with results in GitLab, GKG, and the marketplace.

---

## Part 9: The Pitch (Summary)

- **Today:** Dragonfly is the place you trigger and watch Drupal tests — PHPUnit, PHPCS, PHPStan, Playwright — with agents, GitLab, and GKG integrated.  
- **Gap:** The industry builds AI that tests software; almost no one builds software that tests AI agents in the browser.  
- **Next level:** Dragonfly becomes the platform that runs *agent-evaluation-in-the-browser*: scenario-based, with behavioral assertions, baselines, regression, and OSSA compliance, using a Playwright plugin and OSSA scenario format, without replacing Dragonfly — we extend it.  
- **For enterprise:** One system for application tests and agent behavioral tests; NIST-auditable evidence from real browser runs.  
- **For OSSA:** The testing primitive that completes the lifecycle: define → build → deploy → **validate in the browser**.

This document is the full write-up and plan for crossing Dragonfly with the Playwright-for-Agent-Testing vision. Implementation follows the sequence above and feeds into the QITS roadmap and `@bluefly/agent-tracer` evolution.

---

## References

- Playwright Test Agents (playwright.dev/docs/test-agents)  
- Playwright MCP Server (github.com/microsoft/playwright-mcp)  
- Research: Playwright for Agent Testing — Gap Analysis & Innovation Opportunity (`openstandardagents.wiki/research/playwright-agent-testing-gap-analysis.md`)  
- Dragonfly README and AGENTS.md (gitlab.com/blueflyio/dragonfly/dragonfly)  
- OSSA v0.4 Specification (openstandardagents.org/specification/)
