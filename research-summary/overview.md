# Agentic AI Landscape (Late 2025 to Early 2026): Overview

Date compiled: April 3, 2026

## What these are, in one page

The fastest way to understand the ecosystem is as a stack:

1. **Tool protocol layer**: how an agent talks to tools/data (MCP). [SRC-MCP-ANTHROPIC-2024] [SRC-MCP-SITE-2026]  
2. **Agent coordination layer**: how agents talk to agents (A2A, ACP). [SRC-A2A-SPEC-2026] [SRC-ACP-README-2026]  
3. **Agent contract layer**: what an agent is (identity, capabilities, policy), independent of runtime (OSSA). [SRC-OSSA-SITE-2026] [SRC-OSSA-SPEC-2026]  
4. **Discovery/federation layer**: how agents are found across domains (DUADP, ANP-style systems). [SRC-DUADP-SITE-2026] [SRC-ANP-README-2026]  
5. **Governance/security layer**: authorization, logging, safety checks, incident response, and human controls. [SRC-NIST-NCCOE-2026] [SRC-GRAVITEE-REPORT-PORTAL-2026]

In other words: the ecosystem is moving from isolated agent demos toward internet-like infrastructure.

## Direct answer: DUADP and OSSA

### DUADP (`duadp.org`, `@bluefly/duadp`)

DUADP is presented as a **decentralized discovery protocol** for agents/skills/tools. It combines well-known endpoints, search/publish APIs, and federation endpoints so registries can interoperate rather than stay siloed. [SRC-DUADP-SITE-2026] [SRC-DUADP-DOCS-2026]

From the npm package perspective, `@bluefly/duadp` is the TypeScript SDK implementing this model (client + server helpers, DID/signing helpers, conformance tooling). [SRC-DUADP-NPM-2026]

### OSSA (`openstandardagents.org`, `@bluefly/openstandardagents`)

OSSA is presented as an **agent manifest/contract standard**: define one YAML contract and export to multiple platforms. It is explicit that OSSA complements MCP and A2A rather than replacing them. [SRC-OSSA-SITE-2026] [SRC-OSSA-SPEC-2026]

From npm, `@bluefly/openstandardagents` is a large CLI/tooling package for scaffold, validate, transform/export, and related agent operations. [SRC-OSSA-NPM-2026]

## Main patterns observed in 2026

### 1) Interoperability pressure is real

The market has converged on the idea that bespoke agent integrations do not scale. MCP and A2A each target a different interoperability gap, and many teams now architect for both. [SRC-MCP-ANTHROPIC-2024] [SRC-A2A-GCLOUD-2025]

### 2) No single standard controls the whole stack

Protocol specialization is increasing: MCP (tools), A2A/ACP (coordination), AG-UI (agent-to-interface events), plus contract/discovery initiatives such as OSSA/DUADP. [SRC-A2A-SPEC-2026] [SRC-ACP-README-2026] [SRC-AGUI-ARCH-2026] [SRC-OSSA-SPEC-2026] [SRC-DUADP-DOCS-2026]

### 3) Security posture lags deployment velocity

Cross-source evidence points to widespread deployment with incomplete identity and policy enforcement. The result is recurring incidents and high concern around prompt injection, over-permissioned tools, and weak observability. [SRC-GRAVITEE-BLOG-2026] [SRC-GRAVITEE-REPORT-PORTAL-2026] [SRC-OWASP-LLM01-2025] [SRC-OWASP-LLM06-2025]

## High-confidence risks

- Prompt injection remains an agent-system problem, especially when tool calls are weakly gated. [SRC-DEVTO-WAXELL-2026] [SRC-ARXIV-ADAPTIVE-IPI-2025]  
- Transparency is uneven: capabilities are publicized more than safety details. [SRC-MIT-AGENT-INDEX-2025] [SRC-ARXIV-AGENT-INDEX-2026]  
- Shared credentials and coarse authorization still appear in production practice. [SRC-GRAVITEE-REPORT-PORTAL-2026]

## What to do next (practical)

1. Adopt a **contract-first** approach (manifest + identity + policy before runtime rollout). [SRC-OSSA-SPEC-2026]  
2. Use **protocol layering** deliberately: MCP for tools, A2A/ACP for multi-agent flow, AG-UI for user-facing orchestration. [SRC-MCP-SITE-2026] [SRC-A2A-SPEC-2026] [SRC-ACP-README-2026] [SRC-AGUI-EVENTS-2026]  
3. Treat agents as **first-class identities** with least privilege and auditable delegation. [SRC-NIST-NCCOE-2026] [SRC-ARXIV-AUTH-DELEGATION-2025]  
4. Add runtime governance controls (telemetry, policy checks, containment paths). [SRC-ARXIV-SAGA-2025] [SRC-ARXIV-MI9-2025]

## Confidence and limitations

- Vendor blog metrics are useful but not equivalent to neutral benchmarking. [SRC-47B-2026] [SRC-RUH-2026]  
- Some protocols are still changing quickly; maturity labels on websites can move faster than production adoption.  
- This report prioritizes primary docs and official repos where available; unresolved or ambiguous claims are flagged in the section files.
