# Academia and Research Notes

Prepared on May 27, 2026. Citations use tether IDs from `reading-list.md`.

## Cornell University and eCornell

Cornell's Agentic AI Architecture certificate is a useful signal for how universities are packaging production agent knowledge for practitioners. The curriculum starts with LLM fundamentals, transformers, prompt and context engineering, hallucination failure modes, and API-based chatbot construction [S12]. It then moves into RAG, including relational database access, Text-to-SQL, GraphRAG, chunking, embeddings, query transformation, citations, and evaluation practices [S12].

The agent-specific course, "Building AI Agents With Tools, Memory, and Agentic Architecture," defines agents as LLMs equipped with tools, memory, and reasoning capabilities that execute workflows autonomously. It covers the model, system prompt, tools, memory, prompt chaining, routing, parallelization, orchestrator-worker patterns, reflection loops, protocols, handoffs, and MCP [S12]. The final strategy/governance course focuses on value, feasibility, ethics, algorithmic fairness, workforce effects, risk, security, and oversight [S12].

Key takeaway: Cornell is treating agentic AI as both a systems-engineering discipline and a governance discipline. The program does not teach "agent autonomy" as a standalone trick; it positions autonomy after grounding, retrieval, tool interfaces, and oversight.

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Agent Protocols Tech Tree (APTT) is an educational and policy artifact that maps open protocols supporting agents [S13]. Its central claim is that open protocols are an "x-ray" of emerging technology because they reveal what builders care about, what they have working, and what they are forced to agree on [S13].

The LIL post explicitly compares agent protocols to the early internet's TCP/IP, SMTP, DNS, FTP, HTTP, and SSL adoption pattern: no single entity forced adoption, but participation required speaking the same shared language [S13]. The post also makes an important regulatory point: AI agents are a technique, not a single controllable service. With an LLM, a control loop, and tools, agents are relatively easy to recreate. That makes protocol design one of the most practical levers for shaping behavior [S13].

Key takeaway: Harvard frames protocols as governance infrastructure, not just developer convenience. That aligns with OSSA/DUADP's emphasis on identity, discovery, and policy-bearing agent contracts.

## MIT AI Agent Index

The 2025 AI Agent Index documents 30 prominent AI agents across product overview, accountability, architecture, autonomy/control, ecosystem interaction, and safety/evaluation fields [S14]. It found:

- 24 of 30 agents launched or received major agentic updates in 2024-2025 [S14].
- Chat agents generally remain at autonomy levels 1-3, browser agents operate around levels 4-5, and enterprise agents often move from low-autonomy design to higher-autonomy deployment triggered by events [S14].
- Of 13 agents with frontier autonomy, only 4 disclose any agentic safety evaluations [S14].
- For 227 of 1,350 fields, no public information was found; missing fields concentrate in ecosystem interaction and safety [S14].
- 25 of 30 disclose no internal safety results and 23 of 30 have no third-party testing [S14].
- There are no established standards for how agents should behave on the web, and some agents are designed to bypass anti-bot protections or mimic human browsing [S14].

Key takeaway: transparency is a first-order safety problem. Documentation of autonomy levels, tool access, web behavior, identity, safety testing, and system cards is still far behind deployment.

## MIT Sloan decision-maker guidance for 2026

MIT Sloan's 2026 guidance describes agentic AI as not ready for broad prime-time business use because of hallucinations, mistakes, and prompt-injection vulnerability [S15]. Davenport and Bean expect continued human-in-the-loop guardrails, even though those guardrails reduce the promised productivity advantage [S15]. They also predict that agents may handle most transactions in many large-scale business processes within five years [S15].

The practical recommendation is to envision reusable use cases across the organization and develop internal capacity to create and test agents rather than betting immediately on unconstrained autonomy [S15].

Key takeaway: the business posture should be capability-building plus bounded pilots, not blind production autonomy.

## Harvard Journal of Law and Technology: the agentic web

The Harvard JOLT commentary frames the agentic web as an institutional choice between platform-governed agents and protocol-governed agents [S26]. It uses the Amazon-Perplexity dispute as an example: platforms may insist that agents identify themselves and obey platform rules, while users and agent builders may claim that delegated agents act as representatives of their principals [S26].

The article proposes "Know Your Agent" (KYA) standards as a governance layer that should establish:

1. Agent identity through cryptographically verifiable credentials.
2. Principal-agent linkage.
3. Delegation parameters, including purposes, limits, and revocability.
4. Auditability and behavioral record-keeping [S26].

Key takeaway: identity alone is insufficient. Agent governance also requires delegated authority, platform permission, auditability, and standards bodies that can mediate between platform control and user agency.

## Recent academic security work

### Layered Governance Architecture

The LGA paper argues that LLM agents are shifting from conversational systems to executive systems that can write files, execute shell commands, and invoke transactional APIs [S27]. It proposes four layers:

- Execution sandboxing.
- Intent verification before high-risk tool calls.
- Zero-trust inter-agent authorization.
- Immutable audit logging [S27].

Its benchmark covers 1,081 tool-call samples across prompt injection, RAG poisoning, and malicious skill plugins. The authors report that LLM judges intercepted 93.0-98.5% of certain malicious tool-call classes, and that the complete pipeline achieved 96% interception with about 980 ms median latency, with non-judge layers contributing about 18 ms [S27].

### Attack and defense survey

The 2026 survey from UC Berkeley/SNU/UIUC/UCSB researchers characterizes agentic AI systems through LLMs, memory, tools, external environment, planning, and multi-agent workflow components [S28]. It identifies seven design dimensions relevant to security: input trust, access sensitivity, workflow, action, memory, tool, and user interface [S28]. More flexibility usually increases attack surface.

The survey's attack vectors include indirect prompt injection, malicious data injection, tool poisoning/manipulation, direct prompt injection, model poisoning, and memory poisoning [S28]. Its risk taxonomy includes heterogeneous untrusted interfaces, wrong instruction following, unconstrained data flow, hallucinations and model mistakes, private data leakage, unauthorized action/data corruption, and resource drain/denial-of-service [S28].

### Pre-action authorization

The OAP preprint reframes agent safety as an authorization problem rather than only an alignment problem [S29]. Its claim is direct: agents have passwords but no permission slips. A blocking `before_tool_call` hook should verify signed passports, capability scopes, policy packs, limits, and audit records before tool execution [S29].

The paper reports median authorization latency of 53 ms across 1,000 decisions, and an adversarial testbed in which a restrictive OAP policy blocked all 879 comparable attack attempts after a permissive policy allowed social engineering against the model 74.6% of the time [S29]. Treat this as a preprint result, but the architectural principle matches NIST, Gravitee, and DEV Community guidance: enforce outside the model.

## Open research gaps

- Standard metrics for autonomy, web conduct, and third-party safety testing.
- Native agent identity and delegation models that interoperate across OAuth/OIDC, SPIFFE, DIDs, WebFinger, and agent-specific credentials.
- Tool-call policy languages that balance expressiveness, decidability, and developer usability.
- Evaluation that tests whole agent systems, not just model outputs.
- Governance for agents that browse public web pages, interact with anti-bot systems, and act as user representatives.
