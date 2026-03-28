# Academia and Education Landscape (2025-2026)

This document summarizes university and research-center perspectives on agentic AI, with focus on architecture, governance, and security.

## 1) Cornell / eCornell

Cornell's public "Agentic AI Architecture" certificate framing is notable because it explicitly combines technical build skills with governance and risk management, instead of treating governance as a separate policy track. The program sequence spans:

- LLM fundamentals and prompting,
- RAG/context engineering,
- tool-using and multi-agent architecture,
- governance, risk, security, and human oversight [T07].

From a research-to-practice standpoint, the strongest signal is that "responsible deployment" is now packaged as a core engineering competency, not optional compliance overhead [T07].

## 2) Harvard: protocol formation as governance

Harvard Library Innovation Lab's "Agent Protocols Tech Tree" (published 2026-02-23) argues that protocol formation provides a direct window into ecosystem consensus and likely technical direction [T08][T09]. The central claim is that, because agents are relatively easy to construct from common ingredients (model + loop + tools), protocol design is a practical leverage point for shaping behavior at scale [T08].

This view is significant for standards strategy: in ecosystems with weak central control, open protocols can function as de facto policy infrastructure, similarly to early internet protocol history [T08].

## 3) MIT: deployment visibility and transparency gaps

MIT's AI Agent Index (2025 edition; paper submitted 2026-02-19) tracks 30 deployed agents and reports uneven disclosure practices, especially for safety/evaluation material [T10][T11]. In effect, capability announcements are progressing faster than standardized safety transparency.

MIT Sloan's 2026 guidance similarly warns that agentic AI remains constrained by hallucinations and prompt-injection vulnerability, even while projecting significant near-term operational impact [T12]. The combined message is:

- strategic adoption pressure is high,
- reliability/security constraints remain non-trivial,
- human oversight remains necessary in many production contexts [T12].

## 4) Broader policy and management discourse

Harvard Business Review's public summary framing (2025-06-13 article) highlights organizational risk-readiness concerns for agentic deployments, especially when systems can execute without explicit per-step instructions [T13]. Because full article access is partially paywalled, only publicly visible summary content is treated as directly citable in this report [T13].

Harvard JOLT's 2026 commentary adds a governance angle: as autonomous agents execute user-delegated actions across platforms, institutional control may shift toward either platform rules or protocol-mediated identity/delegation standards [T14].

## 5) Recent technical security literature (academic)

Recent benchmark and attack work provides evidence that prompt-injection and related control-path attacks remain practical:

- WASP benchmark: realistic prompt-injection exposure in web-agent contexts, with high partial-attack success rates in evaluated scenarios [T48].
- WebInject: optimization-based prompt injection against multimodal web agents [T49].
- 2026 SoK: expanded attack-surface taxonomy for tool-using and autonomous agent systems [T50].

Together, these sources support a research consensus: adding tools, memory, and autonomy broadens utility and attack surface simultaneously [T48][T49][T50].

## 6) Practical implications for academic programs and applied research

### What appears mature

- Foundational architecture pedagogy (LLM + tools + workflow design) [T07].
- Open protocol literacy as part of systems design [T08][T09][T10].
- Security problem framing around prompt injection, tool misuse, and governance controls [T11][T12][T50].

### What remains immature

- Standardized reporting requirements for deployed agent safety/evaluation [T10][T11].
- Cross-institution baseline methods for agent identity and authorization assurance [T47].
- Widely adopted benchmarks that evaluate end-to-end sociotechnical safety, not only model capability [T48][T50].

## 7) Key takeaways

1. **Education is shifting from "build agents" to "operate agents safely."** Cornell's structure is a concrete example [T07].  
2. **Protocol literacy is now governance literacy.** Harvard's framing makes this explicit [T08][T09].  
3. **Transparency remains a bottleneck.** MIT's index evidence suggests safety disclosure trails deployment speed [T10][T11].  
4. **Security research is converging on autonomy/control risk.** Prompt-injection and tool-scope abuse are central concerns [T48][T49][T50].  

