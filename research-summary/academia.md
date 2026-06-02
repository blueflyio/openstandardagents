# Academia, Research Centers, and Education

Research snapshot: June 2, 2026. Citation keys map to `reading-list.md`.

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is a useful indicator of where professional education has moved. The curriculum starts with LLM mechanics, prompt engineering, and context engineering, then moves into RAG, Text-to-SQL, GraphRAG, tool-using agents, memory, orchestration, reflection loops, multi-agent workflows, agentic protocols, MCP, governance, risk, security, and human oversight [T09].

The program explicitly frames the transition as moving from "AI that chats" to "AI that acts" [T09]. That framing matters because it matches the broader ecosystem distinction between chat applications and agents that use tools, interact with environments, and complete multi-step workflows. Cornell's course descriptions also emphasize predictable LLM failure modes, including hallucinations and context limits, and the need to improve reliability through grounding, structured data access, and governance frameworks [T09].

The practical patterns Cornell highlights are the same patterns found in production engineering blogs: prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, memory, tool calling, and standardized tool interfaces through MCP [T09] [T19]. The governance course adds strategic evaluation, ethical considerations, workforce risks, and oversight rather than treating agents as only an implementation problem [T09].

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) is a visual map of open protocols supporting AI agents [T10]. The project's most important contribution is methodological: it treats open protocols as evidence of what builders have actually agreed to standardize. Harvard's post argues that protocols reveal "what the builder community actually cares about, what they are forced to agree on, what is already done, and what is likely to come next" [T10].

The comparison to early internet history is central. The APTT post points to TCP/IP, SMTP, DNS, FTP, HTTP, and SSL as standards that emerged through "rough consensus and running code" rather than a single central authority [T10]. The same argument is applied to agents: because agents can be built from a model, a loop, and tools, they are a technique rather than a single service. This makes them hard to regulate directly and makes protocol design an unusually important governance lever [T10].

The Berkman Klein Center summary notes that APTT originated from a February 2026 workshop on "The Role of Protocols in the Agents Ecosystem" and is intended for both technical and policy audiences [T10]. It is intentionally opinionated and not authoritative, but it gives a useful taxonomy of layers ranging from widely adopted technologies like MCP to speculative ideas such as interoperable memory and signed intent mandates [T10].

## MIT AI Agent Index

The 2025 AI Agent Index documents 30 prominent agents across origins, design, capabilities, ecosystem, autonomy, control, safety, evaluation, and impact [T11] [T12]. MIT's headline findings show both acceleration and immaturity:

| Finding | Evidence |
|---|---|
| Rapid deployment | 24 of 30 agents launched or received major agentic updates in 2024-2025 [T11] |
| Autonomy split | Chat agents stay mostly at Level 1-3; browser agents operate at Level 4-5; enterprise agents can move from Level 1-2 in design to Level 3-5 when deployed [T11] |
| Safety transparency gap | Of 13 frontier-autonomy agents, only 4 disclose agentic safety evaluations [T11] |
| Missing safety data | 25 of 30 disclose no internal safety results; 23 of 30 have no third-party testing information [T11] [T12] |
| Web conduct gap | No established standards for agent web behavior; browser agents often ignore robots.txt or mimic human browsing [T11] [T12] |
| Model concentration | Most agents rely on GPT, Claude, or Gemini model families [T11] |

The Index's methodology is also important. Seven subject-matter experts annotated 45 fields across six categories, using public documentation, demos, governance documents, and developer correspondence; the team did not perform experimental testing [T12]. The authors note that the 2025 edition is a snapshot as of December 31, 2025 [T12].

For policymakers, the Index implies that voluntary transparency is insufficient. For developers, it identifies concrete missing artifacts: agent-specific system cards, sandboxing documentation, web conduct policies, safety evaluations, third-party testing, and identity/disclosure mechanisms [T11] [T12].

## MIT Sloan and MIT Press

MIT Sloan's 2026 guidance is more cautious than vendor marketing. Davenport and Bean characterize 2026 as a "level-set" year and say agentic AI is not ready for prime time because hallucinations, mistakes, prompt injection, and related attacks have slowed adoption [T13]. They still predict that AI agents will handle most transactions in many large-scale business processes within five years, but advise companies to start with reusable use cases and internal capabilities for creating and testing agents [T13].

MIT Sloan's "Agentic AI, explained" coverage adds an operational point: in a 2025 clinical agent deployment, 80% of the work was consumed by data engineering, stakeholder alignment, governance, and workflow integration rather than prompt engineering or fine-tuning [T13]. That finding aligns with production reports that agent reliability is primarily a systems problem: evaluation, cost control, permissions, monitoring, and integration are often harder than the first demo [T19].

MIT Press / Harvard Data Science Review coverage of AI agents in decision making emphasizes data readiness, governance, trust, integration, human-in-the-loop approaches, and evidence display for operational decisions [T13]. The practical implication is that agentic systems should augment decision processes with visible evidence and escalation paths, not silently replace human judgment in opaque workflows.

## Harvard Journal of Law & Technology

Harvard JOLT's "On the Institutional Origins of the Agentic Web" frames the Amazon-Perplexity dispute as an institutional choice between platform-controlled agent access and protocol-mediated agent authority [T20]. The article argues that transparent agent identification is a prerequisite for governance and that future standards need portable identity, verifiable delegation, and accountability across environments [T20].

The piece's most actionable concept is Know Your Agent (KYA). KYA standards should establish: agent identity through cryptographically verifiable credentials, linkage to the principal authorizing the agent, delegation parameters defining scope and revocability, and auditability/behavioral record keeping [T20]. This aligns tightly with NIST/NCCoE's focus on identification, authorization, auditing, non-repudiation, and prompt-injection controls [T14].

## Other current research threads

Recent arXiv and academic work is beginning to formalize agent transparency and safety evaluation. The AI Agent Index paper documents "accountability fragmentation" across model providers, scaffolding builders, deployment platforms, tools, and users, making model-level evaluation insufficient for agentic risk [T11] [T12].

Protocol research is also moving beyond tool APIs. ANP proposes a three-layer architecture with W3C DID-based identity and secure communication, meta-protocol negotiation, and semantic application protocols, aiming to become "the HTTP of the Agentic Web era" [T05]. IETF drafts and web-governance proposals such as HTTP Agent Profile explore agent identity and traffic separation at the HTTP layer [T20].

## Education and governance takeaways

1. Agent education is shifting from prompt skills to architecture, governance, and operations.
2. Protocol literacy is becoming a policy competency: understanding MCP, A2A, AG-UI, ANP, OSSA, DUADP, ACP, and ATP is now part of understanding who controls the agentic web.
3. Safety disclosures lag capability disclosures. The most urgent research need is reproducible agentic evaluation that tests behavior, tool use, delegation, web conduct, identity, and recovery under realistic deployment contexts.
4. Universities are converging on a cautious message: use agents where the workflow is bounded, evidence-backed, auditable, and supervisable; avoid open-ended high-stakes autonomy without runtime enforcement.
