# Academia, research, and policy notes

Generated on 2026-05-31.

## Cornell / eCornell

Cornell's Agentic AI Architecture certificate is a useful snapshot of how higher education is packaging agentic AI for practitioners. The program starts with LLM mechanics, hallucination behavior, prompting, and context engineering, then moves into RAG, Text-to-SQL, GraphRAG, tool-using agents, memory, multi-agent workflows, protocols, and governance [S16].

The agent course emphasizes the components that appear across most production frameworks: model, system prompt, tools, and memory. It also names practical workflow patterns such as prompt chaining, routing, parallelization, orchestrator-worker designs, and reflection loops. MCP is taught as a standardized tool interface, which shows how quickly protocol literacy has moved from specialist circles into mainstream professional education [S16].

The governance portion is not an add-on. Cornell frames responsible deployment around value, feasibility, ethical trade-offs, error cost, oversight, governance, and security. This aligns with the broader research finding that agent systems must be evaluated as socio-technical deployments, not only as prompt/model artifacts [S16], [S19].

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Agent Protocols Tech Tree (APTT) frames open protocols as an "x-ray" of an emerging technology: they show what builders care about, what has working code, and what is likely to come next [S17]. The analogy to early internet protocols is explicit: TCP/IP, DNS, SMTP, FTP, HTTP, and SSL shaped incentives without a single central authority [S17].

The key policy insight is that agents are hard to regulate because the technical recipe is simple and reproducible: an LLM, a loop, and tools. When a technology is dispersed and easy to recreate, architecture and protocols become important levers because they make some patterns easier to build than others [S17].

APTT is intentionally opinionated rather than authoritative. It is a teaching and convening tool built for a 2026 Berkman Klein workshop, and it invites criticism at the "ragged edge" where proposed future protocols such as signed intent mandates or interoperable memory may or may not become real standards [S17], [S18].

## MIT AI Agent Index

The 2025 MIT AI Agent Index documents 30 prominent deployed agentic systems across origins, design, capabilities, ecosystem interaction, autonomy, and safety features. It is valuable because it records what developers disclose publicly, not only what they claim in demos [S19].

Important empirical findings:

- 24 of 30 agents launched or received major agentic updates in 2024-2025 [S19].
- Chat agents generally show lower autonomy (levels 1-3), browser agents operate at levels 4-5 with limited intervention, and enterprise agents often move from lower-autonomy design to higher-autonomy deployed behavior [S19].
- Of 13 agents with frontier levels of autonomy, only 4 disclose any agentic safety evaluations [S19].
- 227 of 1,350 indexed fields had no public information; the missing fields concentrate in ecosystem interaction and safety [S19].
- 25 of 30 disclose no internal safety results, and 23 of 30 have no third-party testing information [S19].
- There are no established standards for how agents should behave on the web; some browser agents are designed to bypass anti-bot protections and mimic human browsing [S19].

These findings support the need for manifest-level transparency. OSSA's attempt to encode identity, tools, autonomy, compliance, observability, and trust boundaries in a portable contract is directly responsive to the disclosure gaps MIT documents [S01], [S19].

## MIT Sloan management guidance

MIT Sloan's 2026 decision-maker guidance says agentic AI is "not ready for prime time" because hallucinations, mistakes, and prompt injection still slow adoption and require human-in-the-loop guardrails [S20]. That caution is not a dismissal. Davenport and Bean still predict that AI agents will handle most transactions in many large-scale business processes within five years [S20].

The recommended enterprise posture is to build internal capacity now: choose reusable use cases, create and test agents, and design the organizational structures and "AI factories" needed to scale value. The implication for architecture is that teams should standardize manifests, identity, evaluation, and observability early, before agent fleets become unmanageable [S20].

## Academic surveys and protocol research

The arXiv survey of MCP, ACP, A2A, and ANP compares protocols by deployment context, interaction mode, discovery, communication pattern, and security model [S15]. It positions MCP as a JSON-RPC client-server interface for tool invocation and typed data exchange; ACP as RESTful HTTP for structured messaging; A2A as peer-to-peer task delegation using Agent Cards; and ANP as decentralized discovery/collaboration using W3C DIDs and JSON-LD graphs [S15].

The survey's phased adoption roadmap is pragmatic: start with MCP for tool access, add structured agent messaging, move to A2A for collaborative task execution, and extend to ANP-style decentralized marketplaces when cross-domain discovery and identity become necessary [S15]. This roadmap also makes space for OSSA/DUADP: OSSA can be the manifest/contract used before runtime, and DUADP can be the discovery plane for published resources [S01], [S03], [S15].

## Web conduct and bot identity

MIT's web-conduct finding overlaps with Google's experimental Web Bot Auth work. Web Bot Auth is intended to move beyond spoofable headers and IP-based bot identification toward cryptographically signed bot identity, giving websites more reliable observability and access decisions [S19], [S21].

Imperva's 2026 bot report adds urgency by reporting that automated activity accounted for more than 53% of all web traffic in 2025, with AI agents becoming a distinct category of participant that retrieves data, executes workflows, and acts on behalf of users [S38]. The research direction is clear: agent identity cannot rely only on user-agent strings, IP allowlists, or shared API keys.

## Research gaps

- There is no mature cross-industry standard for agent web conduct comparable to robots.txt for crawlers [S19].
- There is no settled contract standard across frameworks; OSSA is early-stage but directly targets this gap [S01], [S02].
- Agent identity and authorization are active NIST/NCCoE questions, not solved deployment defaults [S22].
- Safety disclosures lag capability disclosures, especially for agent-specific evaluations and third-party testing [S19].
- Framework research often focuses on orchestration, while production evidence points to identity, cost, observability, and revocation as equally important [S16], [S20], [S36].
