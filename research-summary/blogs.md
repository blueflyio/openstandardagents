# Industry Blogs and Engineering Publications

Prepared on May 22, 2026. Citations use the source IDs in [reading-list.md](reading-list.md).

## 47Billion: AI agents in production

47Billion's production-focused analysis divides readiness by system type: simple workflows are production-ready with normal engineering controls, tool-using agents are production-ready with guardrails, structured multi-agent systems are cautiously viable with heavy guardrails and human checkpoints, and open-ended multi-agent systems are not yet reliable enough for critical paths [S39].

Their reliability advice is pragmatic: prevent hallucinated function calls through constrained tool definitions, validate outputs, monitor costs, use fallbacks, and roll out progressively from internal pilots to selected beta customers to general availability [S39]. The article explicitly recommends not building custom integration code when standards such as MCP, A2A, and AG-UI exist [S39].

## Ruh.ai: AI Agent Protocols 2026 Guide

Ruh.ai frames standardized protocols as essential because Gartner's 2025 research predicted 40% of enterprise applications would integrate AI agents by 2026, while communication barriers remain a primary cause of implementation failures [S40]. The guide focuses on MCP for agent-to-tool communication, A2A for multi-agent coordination, and ACP for lightweight REST messaging [S40]. Since ACP is now merging into A2A, teams should consider migration rather than creating new long-lived standalone ACP dependencies [S23][S40].

## Gravitee: State of AI Agent Security 2026

Gravitee's report is the clearest industry warning that adoption is ahead of governance [S41]. Its data shows teams are deploying agents faster than security models can adapt: 80.9% past planning, 14.4% full fleet approval, 47.1% average monitoring coverage, 88% incidents, and only 21.9% independent agent identities [S41]. The action item is to move from human-centric API security assumptions to agentic identity-aware enforcement [S41].

## DEV Community security guides

DEV Community production security articles consistently identify prompt injection, excessive permissions, and hallucinated actions as execution-layer risks [S45][S46]. One guide argues that prompt injection cannot be eliminated at the LLM level, but its consequences can be constrained by cryptographic or policy verification before execution [S45]. Another guide recommends a runtime authorization gateway between agents and tools, with OAuth 2.1 delegated authorization, granular scopes, context-aware policy, no self-escalation, and human approval for high-risk operations [S46].

## Harvard JOLT and the agentic web

Harvard JOLT asks how an agent's identity, trustworthiness, and enforceability should be established, especially if centralized registries become gatekeepers [S11]. It favors interoperable protocols and credentials that travel with agents across environments [S11]. The proposed KYA minimums are agent identity, principal-agent linkage, delegation parameters, and auditability/behavioral records [S11].

## Imperva and Cisco: agentic web traffic and networks

Imperva's 2026 Bad Bot Report says automated bots accounted for more than 53% of all web traffic in 2025, while human traffic fell to 47% [S47]. It frames AI agents as a new category of internet participant that retrieves data, executes workflows, and acts on behalf of users [S47]. Cisco estimates AI inference will represent 25% of all network traffic by 2035 and calls for resilience, observability, quality of service, and path security for machine-speed AI flows [S48].

## Engineering takeaways

1. Adopt protocols by boundary: MCP for tools, A2A for agent delegation, AG-UI for frontend streaming, DUADP/ANP for discovery/identity, OSSA for contracts [S01][S02][S17][S18][S21][S25].
2. Production readiness means validation, tracing, cost controls, HITL, and progressive rollout, not just successful demos [S39].
3. Security architecture must sit outside the model: runtime gateways, scoped credentials, policy checks, and audit evidence [S43][S46].
4. Identity must be unique per agent, with delegation and revocation, not shared API keys [S11][S41][S42].
5. The web and network layers are becoming agent-facing surfaces; web conduct and bot/agent identity standards are urgent [S09][S47][S48].
