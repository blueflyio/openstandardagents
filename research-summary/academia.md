# Academia and Research Notes (2025-2026)

This document summarizes university and research-center perspectives on agentic AI architecture, protocols, governance, and security.

## 1) Cornell (eCornell) - practitioner education pipeline

Cornell’s “Agentic AI Architecture” certificate is notable because it links technical agent construction to governance and risk in one ordered curriculum: LLM fundamentals, RAG/context engineering, tools/memory/protocols, then strategy/governance/ethics. [S39]

Key details:

- Program framing explicitly addresses moving from “AI that chats” to “AI that acts,” including tools, memory, and multi-agent workflows. [S39]
- MCP is explicitly included in course content for standardized tool interfaces. [S39]
- The governance module emphasizes risk, human oversight, and ethical evaluation for deployment at scale. [S39]

Interpretation: Cornell’s path reflects an industry trend where agent architecture and governance cannot be separated into different teams/phases.

## 2) Harvard (Berkman + Library Innovation Lab) - protocols as governance surface

Harvard’s Agent Protocols Tech Tree (APTT) argues that open protocols are the practical way to understand how the ecosystem is actually standardizing. [S28][S42]

Key claims from Harvard sources:

- Agent ecosystems are distributed and hard to regulate centrally because “agents” are relatively simple compositions (models + loop + tools), so protocol-level incentives matter. [S42]
- Open protocols reveal where builders are achieving “rough consensus and running code,” analogous to early internet protocol emergence. [S42]
- APTT was introduced via Berkman event/workshop context and is intended for both technical and policy audiences. [S28]

Interpretation: Harvard’s angle is less “which framework wins” and more “which protocol primitives become internet infrastructure.”

## 3) MIT AI Agent Index (2025) - transparency and accountability evidence

The MIT AI Agent Index provides a structured public-data snapshot of 30 major agents and 45 annotation fields. [S30][S31]

Important findings:

- 24/30 systems were released or significantly updated in 2024-2025 (rapid deployment cycle). [S31]
- Safety transparency lags capability transparency: most systems do not publish internal/third-party safety results. [S31]
- Dependency concentration: many systems depend on a small set of foundation model families. [S31]
- Web conduct standards are unsettled (e.g., robots/bot behavior inconsistencies). [S31]

Interpretation: MIT’s dataset supports the thesis that operational adoption outruns standardized disclosures and governance.

## 4) MIT Sloan guidance for decision-makers in 2026

MIT Sloan’s 2026 guidance explicitly states agentic AI is “not ready for prime time — yet,” citing hallucinations and prompt-injection vulnerabilities, while forecasting that agents may handle most transactions in major business processes within five years. [S32]

This introduces a dual planning message:

- short term: keep human-in-the-loop guardrails;
- medium term: build reusable enterprise capabilities for broader agent deployment.

## 5) MIT/industry security analysis in management channels

MIT Sloan Management Review security framing highlights three practical gaps: threat modeling, pre-deployment security checks, and runtime protections in agentic environments. [S33]

Interpretation: strategy publications are converging on “identity + authorization + runtime policy” rather than prompt engineering alone.

## 6) NIST / NCCoE direction (concept stage, 2026)

NIST NCCoE published an initial public draft concept paper for software/AI-agent identity and authorization, calling for input on identification, authorization, auditing, non-repudiation, and prompt injection controls. [S34]

This is an important signal: agent IAM is moving from ad-hoc best practice toward standards-backed implementation guidance.

## 7) Peer-reviewed and preprint protocol surveys

Recent survey papers provide useful synthesis lenses:

- “A Survey of AI Agent Protocols” (arXiv 2025) proposes two-dimensional taxonomy (context-oriented vs inter-agent; general-purpose vs domain-specific) and compares security/scalability/latency patterns. [S59]
- “A Survey of Agent Interoperability Protocols” (arXiv 2025) compares MCP/ACP/A2A/ANP and proposes phased adoption patterns. [S60]

These surveys are useful for architecture decisions, though many included protocols are still evolving.

## 8) Limitations and evidence quality notes

- Several university pages are announcement summaries pointing to other assets rather than full technical content (e.g., Berkman “story” pages). [S28]
- Some management publications are partially paywalled and only abstract-level text is accessible. [S58]
- Claims about “bot share of internet traffic” in the user request were not verifiable in the specific Harvard primary links captured; this report avoids asserting those figures as Harvard-validated findings.

