# Academia, Research, and Policy Notes

Prepared as of May 30, 2026.

## Cornell / eCornell

Cornell's Agentic AI Architecture certificate is a useful snapshot of how universities are operationalizing agentic AI education. The curriculum starts with LLM behavior, prompt/context engineering, hallucinations, and model limitations; moves into RAG, relational data access, Text-to-SQL, and GraphRAG; then extends into tools, memory, agentic architectures, multi-agent workflows, handoffs, and the Model Context Protocol [S05].

The program's most important signal is its sequencing. Cornell treats autonomous agents as a progression from grounded information systems, not as a standalone chatbot trick. Students first learn how models fail and how RAG reduces hallucination, then learn how tool-using agents act, and finally evaluate governance, risk, security, and human oversight [S05]. This matches production evidence: reliable agents require context design, memory, evaluation, and risk gates before autonomy is expanded.

## Harvard Library Innovation Lab and Berkman Klein

Harvard's Agent Protocols Tech Tree, created for a February 9, 2026 Berkman Klein workshop, frames open protocols as the most important architecture-level lever for the agent ecosystem [S06]. The article defines an open protocol as a shared language used by multiple software projects so they can interoperate or compete. It compares today's agent protocols with early internet standards such as TCP/IP, SMTP, DNS, FTP, HTTP, and SSL, where rough consensus and running code gave distributed builders incentives to speak the same language [S06].

The Harvard framing is especially relevant because agents are easy to recreate: an LLM, a control loop, and tools. That makes centralized regulation difficult. Protocols may shape behavior by determining which capabilities are easy to build, how tools are exposed, how agents identify themselves, and how builders interoperate [S06]. The Tech Tree is explicitly a work in progress rather than an authoritative standard, but it is valuable because it maps the social proof around protocols and shows which concepts are moving from speculative to widely adopted.

## MIT AI Agent Index

MIT's 2025 AI Agent Index documents 30 prominent agents across product overview, company/accountability, technical capabilities, autonomy/control, ecosystem interaction, and safety/evaluation/impact [S07][S08]. Its headline findings are directly relevant to standards work:

| Finding | Number | Implication |
|---|---:|---|
| Recent deployment | 24/30 | Adoption is accelerating. |
| Missing public fields | 227/1,350 | Transparency is incomplete. |
| Safety eval disclosure | 4/13 high-autonomy agents | Safety is under-reported. |
| Internal safety results absent | 25/30 | Evaluation data is scarce. |
| Third-party testing absent | 23/30 | Independent assurance is rare. |
| MCP support | 20/30 | Tool protocol adoption is broad. |

MIT also documents an autonomy split: chat agents often remain Level 1-3, browser agents operate at Level 4-5, and enterprise platforms may be designed at Level 1-2 but run at Level 3-5 once deployed through event triggers [S07][S08]. This distinction matters because user-facing configuration screens can understate actual runtime autonomy. The index also states that web conduct standards are unsettled: browser-based agents often ignore `robots.txt`, some mimic human browsing, and content hosts cannot reliably verify whether a request represents a human, a benign agent, or an abusive bot [S07][S08].

## MIT Sloan guidance for 2026 decision makers

MIT Sloan's 2026 decision-maker guidance is less technical and more organizational. Thomas Davenport and Randy Bean argue that agentic AI is not ready for prime time yet because hallucinations, mistakes, prompt injection, and hijacking risk have slowed adoption [S09]. They still expect agents to handle most transactions in many large-scale business processes within five years, but recommend reusable use cases, internal agent-building capabilities, and continued human-in-the-loop guardrails [S09].

This is a useful counterweight to vendor messaging. The likely near-term pattern is not full autonomy, but progressive autonomy: start with narrow, reusable workflows; maintain human approvals around consequential actions; collect evidence; and reduce review only when the system proves reliable.

## Harvard JOLT and institutional governance

Harvard Journal of Law and Technology's agentic-web commentary frames AI agents as autonomous delegates that act, decide, and transact on users' behalf [S28]. Its central governance question is whether agents will be governed by proprietary platform rules or by open protocols that enable portable identity, verifiable delegation, and accountable behavior [S28].

The paper's Know Your Agent framing is highly aligned with OSSA/DUADP-style identity and manifest thinking. KYA requires: agent identity through verifiable credentials, linkage to the principal on whose behalf the agent acts, delegation parameters with limits and revocation, and auditability/behavioral record-keeping [S28]. This turns identity from a login detail into the foundation of agent accountability.

## NIST/NCCoE and standards research

NIST/NCCoE's February 5, 2026 concept paper asks how existing identity standards and best practices should apply to software and AI agents [S27]. It focuses on use cases, agent-specific challenges, standards, technologies, identification, authorization, auditing, non-repudiation, and prompt-injection controls [S27]. NIST's broader AI Agent Standards Initiative is intended to foster industry-led standards, open protocols, and research into secure human-agent and multi-agent interactions [S32].

Recent research also proposes layered governance architectures for execution-layer vulnerabilities. One 2026 arXiv paper proposes execution sandboxing, intent verification, zero-trust inter-agent authorization, and immutable audit logging, and reports high interception rates on prompt injection, RAG poisoning, and malicious skill-plugin tool calls in benchmark experiments [S33]. The common academic direction is clear: model guardrails alone are not enough; agent safety needs enforceable control layers.
