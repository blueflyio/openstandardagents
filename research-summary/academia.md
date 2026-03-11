# Academia and Research Centers (2025-2026)

_Report date: 2026-03-11_

## Cornell

Cornell/eCornell materials in scope emphasize practical agentic capability building, including generative AI foundations and RAG-oriented context engineering tracks.[SRC-51][SRC-52]  
In this source set, Cornell content is more curriculum/industry-practice oriented than formal protocol standardization, but it is relevant to the talent pipeline problem: teams need practitioners who can bridge LLM fundamentals, retrieval design, and production controls.

## Harvard (Berkman/LIL + policy discussion)

Harvard Library Innovation Lab’s Agent Protocols Tech Tree (APTT) and related workshop context frame protocol development as a core governance lever: open protocols expose emerging consensus and can shape agent behavior similarly to how internet protocols shaped the web.[SRC-48]  

The policy angle (HKS Student Policy Review) emphasizes macro-governance concerns: autonomous bot traffic growth, possible crowding effects on human-centric web activity, and need for network/protocol-level responses.[SRC-49][SRC-50]

## MIT

### MIT AI Agent Index (2025)
MIT’s indexing work documents deployed agent systems and highlights transparency gaps in ecosystem interaction and safety disclosure. The accompanying arXiv paper reports missing public information across many annotated fields and explicitly flags weak web-conduct documentation, including examples where anti-bot bypass behavior is marketed.[SRC-43][SRC-44][SRC-45]

### MIT Sloan guidance
MIT Sloan’s 2026 decision-maker guidance is a pragmatic “yes, but not yet fully ready” position: it flags ongoing hallucination and prompt-injection concerns while forecasting that agents may handle a large share of transactions in major processes within roughly five years.[SRC-46]  
MIT Sloan also stresses operational guardrails and human-in-the-loop oversight in current deployments.[SRC-46][SRC-47]

## Other university-adjacent and research sources

Recent arXiv work expands from threat taxonomy to engineering controls:
- Governance architecture for autonomous agent systems and layered controls.[SRC-54]
- Prompt-injection mitigation approaches (e.g., causal diagnostics, context purification, isolation strategies).[SRC-55][SRC-56]

These papers are promising but mostly pre-production/experimental; they are not substitutes for operational security baselines.

## Cross-academic synthesis

Academic and university-affiliated sources converge on four points:

1. **Agent capability is accelerating faster than governance maturity.**[SRC-45][SRC-46]  
2. **Protocol choices are governance choices.** Interoperability standards are not neutral plumbing; they constrain what is easy/hard to build.[SRC-48]  
3. **Security is architectural.** Prompt injection and unsafe autonomy require system-level controls, not only better prompts/models.[SRC-46][SRC-54][SRC-55]  
4. **Transparency standards remain underdeveloped.** Public safety and web-conduct reporting is inconsistent.[SRC-45]

## Gaps and limitations

- Some business-school publications are advisory and non-technical; they should be paired with protocol specs and implementation docs before architectural decisions.
- Some university materials are paywalled or selectively accessible; where direct technical detail was limited, this report used official summaries and openly accessible companion sources.
