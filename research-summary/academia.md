# Academia and research centers

Source review date: 2026-05-23.

## Cornell and eCornell

eCornell's Agentic AI Architecture certificate frames agentic AI education as a sequence from LLM fundamentals to grounded data access, tool-using agents, multi-agent workflows, protocols and governance [S14]. The program explicitly covers why LLMs hallucinate, how prompt and context engineering improve reliability, and how Retrieval-Augmented Generation gives models access to private and up-to-date data [S14].

The course "Building AI Agents With Tools, Memory, and Agentic Architecture" bridges "AI that thinks" to "AI that acts." It teaches the core components of agents: model, system prompt, tools and memory. It also covers prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, handoffs, and MCP as a standardized tool interface [S14]. The important signal is that Cornell is not treating protocols as an advanced footnote; it places MCP and agentic handoffs inside the practical architecture curriculum.

Cornell's governance component emphasizes responsible deployment, security, human oversight, value/feasibility analysis, and cases where AI should not be used [S14]. This matches the broader research trend: agent architecture is not just an engineering pattern, it is an organizational risk surface.

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Agent Protocols Tech Tree is a visual guide to open protocols behind AI agents. It defines open protocols as shared languages used by multiple projects so systems can interoperate or compete, and compares the agent-protocol moment to internet protocols such as TCP/IP, DNS, SMTP, HTTP and SSL [S15].

The policy insight is that open protocols expose what builders agree on and what they have running. Harvard argues that agents are simple to build, which makes them hard to regulate directly; therefore protocols matter because they determine which agent behaviors are easier or harder to build [S15]. The Agent Protocols Tech Tree is also intentionally layered: it helps non-technical readers understand why each protocol became necessary and helps technical readers inspect wire-level messages [S15].

Harvard JOLT's agentic web analysis focuses on institutions, authority and identification. It argues that the future agentic web needs portable, protocol-based credentials rather than only proprietary bot controls. Its "Know Your Agent" framing includes agent identity, principal-agent linkage, delegation parameters, revocability, auditability and behavioral record keeping [S30]. This aligns closely with NIST/NCCoE's identity and authorization concept paper [S18].

## MIT AI Agent Index

MIT's 2025 AI Agent Index documents 30 prominent agents across 45 annotation fields and 1,350 structured fields, including autonomy, technical architecture, ecosystem interaction, safety, web conduct and accountability [S16]. The index finds a gap between capability disclosure and safety disclosure. Of 13 agents exhibiting frontier autonomy, only 4 disclose agentic safety evaluations; 25 of 30 disclose no internal safety results; and 23 of 30 have no third-party testing [S16].

The MIT index also highlights the absence of web-conduct standards. It reports that many agents do not clearly document robots.txt handling, CAPTCHA behavior or web-access methods, and some browser agents are designed to bypass anti-bot protections or mimic human browsing [S16]. For policy and product teams, that makes agent self-identification and verifiable delegation a first-order design requirement.

MIT's autonomy findings are also useful for scoping deployments. Chat agents tend to operate at Level 1-3 autonomy, browser agents at Level 4-5 with limited intervention, and enterprise agents often split between low-autonomy configuration and higher-autonomy deployed event-triggered behavior [S16]. This suggests governance needs to evaluate deployed behavior, not just the setup UI.

## MIT Sloan 2026 decision guidance

MIT Sloan's 2026 guidance says agentic AI is not yet ready for prime time because ongoing hallucinations, mistakes and prompt injection can hijack agentic systems [S17]. The guidance expects companies to keep humans in the loop for guardrails, which reduces the near-term productivity promise, but it also predicts that agents will handle most transactions in many large-scale business processes by approximately 2031 [S17].

The practical takeaway is to distinguish readiness by risk class. Low-stakes research, summarization, internal coding assistance and reversible workflow automation are more appropriate than irreversible payments, medical actions, legal filings, production deletes or cross-tenant data changes. This is consistent with security guidance that requires runtime authorization and human approval for high-impact actions [S18][S20][S21].

## 2025-2026 academic surveys

A 2025 arXiv survey compares MCP, ACP, A2A and ANP as complementary interoperability protocols. It positions MCP as JSON-RPC client-server tool/context access, ACP as RESTful multimodal agent communication, A2A as capability-card-based task delegation, and ANP as decentralized open-network discovery and secure collaboration with DIDs and JSON-LD graphs [S31].

A separate agent-communication security survey argues that LLM-driven agents are no longer isolated systems; they communicate with tools, users and other agents, creating new security hazards. It categorizes agent communication, maps protocol risks to layers, and calls for authentication, authorization, validation, attestation and governance across the communication lifecycle [S32].

Production-focused research on MCP argues that the protocol is a strong foundation but does not by itself solve safe operation at scale. It identifies missing production primitives: identity propagation, adaptive tool budgeting and structured error semantics. It proposes a broker layer, timeout budget allocation and machine-readable error recovery as infrastructure mechanisms [S42].

## Academic implications

- Curricula are shifting from "prompting LLMs" to "building governed systems": RAG, tools, memory, protocols, multi-agent design and oversight appear together [S14].
- Protocol research is maturing into comparative taxonomy: tool access, task delegation, REST messaging, decentralized discovery and UI streaming have different boundaries [S31][S35].
- Security research is moving from model safety alone to system safety: trust boundaries, tool supply chain, agent identity, runtime authorization and auditability [S18][S32][S33].
- Policy research is converging on portable identity and delegation. Agents need to prove who they are, who authorized them, what they may do, and how their actions can be audited or revoked [S18][S30].
