# Academia (Cornell, Harvard, MIT, and adjacent research)

## 1) Cornell / eCornell: practical curriculum from LLMs to agent governance

eCornell's **Agentic AI Architecture** certificate (CISC13) positions agentic AI as a full stack of skills: prompt/context engineering, RAG, tool-using agents, multi-agent workflows/protocols, and governance-risk-security with human oversight [S21]. This matters because it reflects where workforce development is moving in 2026: not "just prompting," but system design plus deployment controls.

Notable curricular signals [S21]:
- Explicit coverage of hallucinations and mitigation.
- MCP included in the "tools/memory/agent architecture" module.
- A separate strategy/governance/ethics module (not an afterthought).

## 2) Harvard (LIL/Berkman/JOLT): protocols as governance levers

Harvard LIL's Agent Protocols Tech Tree frames open protocols as the best real-time indicator of what builders actually coordinate on, similar to how TCP/IP, DNS, and HTTP shaped the early web [S22][S23]. Their policy argument is straightforward: because "agents" are easy to build and hard to centrally regulate, protocol design may be the highest-leverage governance layer [S22].

Harvard-related commentary also highlights "agentic web" institutional issues: platform-centric control vs protocol-centric interoperability, plus identity/delegation/accountability tensions for autonomous agents [S30]. A Harvard policy student review additionally flags concerns around bot-scale traffic and infrastructure strain, citing ~50% bot traffic and super-exponential growth dynamics for machine-to-machine interactions [S29].

## 3) MIT: quantitative transparency gap and maturity realism

MIT's 2025 AI Agent Index documents 30 deployed systems and finds:
- release velocity is high (24/30 major releases/updates in 2024-2025);
- safety and evaluation disclosure lags significantly behind capability claims;
- web conduct standards remain unsettled [S18][S19].

Crucial findings [S18][S19]:
- only **4/13** frontier-autonomy systems disclose agentic safety evaluations;
- **25/30** disclose no internal safety results;
- **23/30** disclose no third-party testing.

MIT Sloan's 2026 enterprise guidance complements this with a pragmatic adoption view: agentic AI is strategically important but "not ready for prime time" in many settings due to hallucinations and prompt-injection susceptibility; human-in-the-loop remains essential near term [S20].

## 4) Broader academic literature (2025-2026)

The arXiv survey on AI agent protocols (2504.16736) categorizes protocol space along:
- context-oriented vs inter-agent protocols; and
- general-purpose vs domain-specific protocols [S24].

This survey reinforces a core architecture trend: layered stacks with explicit concerns for interoperability, privacy, security, and collective behavior, rather than monolithic "one protocol solves all" assumptions [S24].

## 5) Synthesis for decision-makers

Academic and quasi-academic sources converge on four points:
1. **Capability is accelerating faster than governance disclosure** [S18][S19].
2. **Protocol design is now policy design** in practice [S22][S23].
3. **Human oversight remains a first-class control**, not merely transitional [S20][S21].
4. **Interoperability standards are fragmenting into layers**, requiring explicit stack choices by architects [S24].
