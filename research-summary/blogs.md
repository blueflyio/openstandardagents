# Tech blogs and engineering publications

Generated on 2026-05-31.

## 47Billion: production lessons, frameworks, protocols, and cost

47Billion's 2026 production article is one of the most concrete engineering sources reviewed. It reports practical experience across AutoGen, CrewAI, LlamaIndex, proof-of-concept projects, and a production sales-training simulator for a global insurance company [S32].

Key framework takeaways:

- AutoGen is powerful for exploratory conversation-style multi-agent tasks, but expensive and hard to debug when agents loop or replay long conversation histories [S32].
- CrewAI is more structured and predictable for task-based multi-step work; 47Billion rebuilt a table reservation system in one week with CrewAI after three weeks with AutoGen [S32].
- LlamaIndex is best when the agent's main value is RAG, document processing, and information retrieval [S32].
- OpenAI Agents SDK is framed as a minimal framework with agents, handoffs, guardrails, tracing, and provider-agnostic support for 100+ LLMs [S32].
- LangGraph is framed as a graph-based workflow engine for stateful applications with cycles, loops, saved state, and resume behavior [S32].

Key production lessons:

- Agents need brutally clear boundaries: max tool-call counts, strict tool validation, and clear errors [S32].
- Long conversations need summarization and context pruning [S32].
- Unexpected user inputs are normal and must be handled gracefully [S32].
- Cost monitoring is non-negotiable, especially for multi-agent conversations [S32].
- Response-time variability can be more disruptive than consistent slowness [S32].
- Refinement after the first working build is the bulk of the work [S32].

47Billion's cost bands are useful for relative planning:

| Approach | Estimated cost/task | Typical use |
| --- | ---: | --- |
| Simple workflow | $0.10-$0.50 | Linear deterministic tasks |
| CrewAI multi-agent | $0.50-$2.00 | Structured multi-step tasks |
| AutoGen multi-agent | $2.00-$5.00 | Exploratory collaboration |
| LlamaIndex RAG | $0.20-$1.00 | Document queries |

Their architectural recommendation matches the protocol stack: use MCP for tools, A2A for external agent collaboration, and AG-UI for frontend communication, and avoid custom integrations where standards exist [S32].

## Ruh.ai: protocol guidance and enterprise security posture

Ruh.ai's protocol guide page was sparse in direct fetch output, but search excerpts describe it as a January 2026 guide to MCP, A2A, and ACP for standardizing AI communication, reducing integration complexity, avoiding vendor lock-in, and enabling secure multi-agent systems [S33]. Ruh.ai's MCP article provides clearer content: MCP is an open standard introduced by Anthropic in 2024, built on JSON-RPC, and designed to connect AI systems to tools and data through resources and tools [S34].

Ruh.ai's security article emphasizes "identity before autonomy": each agent should get a scoped, observable identity before it touches tools; credentials should be short-lived; permissions should be least-privilege; and tool calls should be attributable to agent, version, and trigger [S33]. This aligns with Gravitee and NIST findings that agent identity is the missing enterprise control plane [S22], [S36].

Gartner's related market signal is that 40% of enterprise applications are predicted to include task-specific AI agents by the end of 2026, up from less than 5% in 2025 [S35]. This explains why standards are moving quickly: bespoke integrations and ad hoc identities do not scale to that level of embedding.

## Gravitee: security as identity and runtime governance

Gravitee's report is not only a vendor blog; it is an empirical survey. Its main claim is that adoption is outpacing control [S36].

Important blog/report insights:

- Organizations are confident despite partial coverage: 82.0% of executive respondents feel confident policies can protect against misuse, yet only 47.1% of agents are actively monitored or secured on average [S36].
- Shadow AI is common: only 14.4% of organizations have full IT/security approval for their agent fleet [S36].
- Incidents are normal: 88% reported confirmed or suspected incidents, with healthcare at 92.7% [S36].
- The threat model is about control, not only model quality: data leakage, prompt injection, misuse, unauthorized LLM access, and lack of logging are top concerns [S36].
- Identity is the weakest link: only 21.9% treat agents as independent identities, and many still use shared API keys or generic tokens [S36].

Actionable recommendation: use identity-aware enforcement and continuous monitoring around MCP/tool access, not only periodic audits or broad API gateway controls [S36].

## Dev.to production security guide

The Dev.to guide is framed around a failure example where a customer support agent issues a fraudulent refund because the backend authenticates the service account but never verifies whether the action is legitimate [S37].

Its seven critical risks are:

1. Prompt injection.
2. Excessive permissions.
3. Hallucinated actions.
4. No attribution.
5. Replay attacks.
6. No kill switch.
7. Opaque policy violations [S37].

The article's secure architecture pattern is a signed intent envelope plus verification layer:

- Verify Ed25519 signature.
- Check nonce and timestamp.
- Confirm declared action.
- Enforce constraints such as monetary limits or domain restrictions.
- Check revocation status.
- Log structured intent metadata, verification result, and execution outcome [S37].

This is especially relevant to OSSA/DUADP because manifests and discovery records can declare and verify agent identity, allowed capabilities, and trust tiers before runtime [S01], [S03], [S37].

## Harvard LIL and policy-oriented protocol analysis

Harvard's Agent Protocols Tech Tree blog is a policy-oriented engineering publication. It argues that protocols are key levers because agents are a distributed technique rather than a centrally controlled service [S17].

The blog's most actionable takeaway is to evaluate protocol proposals by the builder consensus they encode:

- What problem did the protocol solve?
- Who needed to agree?
- What virtuous cycle made others adopt it?
- What does the wire-level message actually look like? [S17]

For OSSA and DUADP, that means evaluating not only the homepage claims but also the schemas, npm package maturity, conformance tests, endpoint surface, and interoperability with MCP/A2A/AG-UI [S01], [S02], [S03], [S04].

## The Register and GetStream: protocol stack framing

The Register's January 2026 explainer treats MCP as the de facto standard for agentic tool integration while warning that MCP security vulnerabilities remain, especially where servers wrap code interpreters or remote command execution [S39].

It also differentiates A2A and ANP: A2A focuses on collaboration among agents, while ANP asks what an internet of agents would look like and uses a more peer-to-peer/decentralized framing [S39]. The Register notes Linux Foundation activity around agentic protocols and consolidation, including A2A/ACP convergence [S39].

GetStream's protocol overview similarly frames modern systems as combinations of protocols across layers: MCP for resources/tools, A2A/ACP/ANP for communication and negotiation, and AP2 for payments when commerce is involved [S40]. The recommendation is modular adoption, not chasing one universal standard [S40].

## Production recommendations distilled from blogs

1. Start with deterministic workflows and single agents before moving to multi-agent collaboration [S32].
2. Adopt MCP early for internal APIs and tools to avoid one-off connectors [S05], [S32], [S34].
3. Add A2A only when independent agents need to collaborate across vendors, teams, or organizations [S06], [S07], [S32].
4. Add AG-UI when user-facing applications need streaming state, tool progress, approvals, or HITL interaction [S09], [S10], [S32].
5. Use OSSA-like manifests to keep governance metadata out of scattered framework configs [S01], [S02].
6. Use DUADP-like discovery when multiple registries, teams, or domains need to publish and search agents/skills/tools [S03], [S04].
7. Instrument cost before scale. Track per-agent request IDs, model, prompt tokens, completion tokens, and tool calls [S32].
8. Add semantic validation and circuit breakers to A2A/sub-agent outputs before orchestrators act on results [S32].
9. Treat prompt injection as inevitable; design so compromised text cannot become compromised capability [S37].
10. Make agent identities scoped, observable, revocable, and independent from human identities [S22], [S36], [S37].

## Limitations and confidence

- Vendor blogs often mix implementation evidence with product positioning. Claims from 47Billion and Gravitee are useful but should be validated against internal workloads before direct adoption [S32], [S36].
- Ruh.ai's protocol guide did not expose enough page body through fetch, so the report uses available search excerpts and its MCP/security pages [S33], [S34].
- Cost bands from 47Billion are relative planning inputs, not universal benchmarks [S32].
- Protocol adoption counts can change quickly. The repository and npm metadata in this report are a 2026-05-31 snapshot.
