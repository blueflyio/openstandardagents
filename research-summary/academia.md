# Academia and Research Notes

Current date used for relative-date normalization: May 16, 2026.

## Cornell and eCornell

Cornell's eCornell Agentic AI Architecture certificate is an applied program
that moves from LLM fundamentals to autonomous agents. It covers prompt and
context engineering, hallucination causes, RAG, Text-to-SQL, GraphRAG, tools,
memory, multi-agent workflows, agentic protocols, governance, risk, security,
and human oversight [ACAD-01]. The course sequence is relevant because it
mirrors the production maturity path: first understand model behavior, then
ground it with retrieval, then add tool use, then impose oversight.

The dedicated course "Building AI Agents With Tools, Memory, and Agentic
Architecture" covers the agent core: model, system prompt, tools, memory,
prompt chaining, routing, parallelization, orchestrator-worker designs,
reflection loops, handoffs, and MCP [ACAD-02]. Public material is syllabus-level
only; full course details are behind enrollment.

## Harvard: protocols, governance, and the agentic web

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) frames open
protocols as the best lens for understanding the agent ecosystem. The post says
protocols reveal what builder communities agree on, what they have to
coordinate, and what they are likely to build next [ACAD-03]. It compares
agent protocols to TCP/IP, DNS, SMTP, FTP, HTTP, and SSL in the early internet:
rough consensus and running code shaped behavior even without centralized
control [ACAD-03].

APTT maps a layered stack: inference APIs, tool calling, MCP, MCP apps,
AGENTS.md, llms.txt, agent skills, Agent Cards, A2A, agent registries, agent
identity, web bot auth, commerce protocols, signed intent mandates, and audit
traces [ACAD-04]. Harvard explicitly warns that APTT is a whiteboard sketch, not
an authoritative standards body output [ACAD-03].

Berkman Klein's February 2026 workshop on "Towards an Internet Ecosystem for
Sane Autonomous Agents" focused on agent identification, interchange standards,
oversight, operational agency controls, and identifiers [ACAD-05]. Other
Harvard/Berkman sources in 2025-2026 address agency measurement, legal
governance, democratic algorithmic institutions, cybersecurity, and AI agent
accountability [ACAD-06] [ACAD-07] [ACAD-08] [ACAD-09].

Harvard policy commentary on explosive AI growth argues that autonomous agents
could produce super-exponential network activity if bots coordinate and
delegate work among themselves. It notes bots already comprise about 50% of
internet traffic and calls for efficient bot-bot protocols, network investment,
and better mechanisms to distinguish human from automated activity, such as
next-generation verification or proof-of-personhood credentials [ACAD-15].

Harvard Journal of Law and Technology commentary on the agentic web uses the
Amazon-Perplexity dispute to illustrate the institutional choice between
platform-mediated authority and protocol-mediated authority. It argues that
transparent agent identification is non-negotiable, but portable credentials,
verifiable delegation, auditability, and "Know Your Agent" standards could shift
governance toward interoperable infrastructure [ACAD-16].

## MIT: AI Agent Index and management guidance

The 2025 AI Agent Index, hosted by MIT-affiliated researchers, catalogs 30
deployed agentic systems across 45 fields and six categories. Its methodology
uses public information, subject-matter annotation, company feedback, and human
review of LLM-generated fact checks [ACAD-10] [ACAD-11]. The snapshot cutoff is
December 31, 2025 [ACAD-11].

Key findings include:

- 24 of 30 agents were released or had major agentic updates in 2024-2025
  [ACAD-11].
- Of 13 frontier-autonomy agents, only 4 disclose any agentic safety
  evaluations [ACAD-11].
- 25 of 30 disclose no internal safety results, and 23 of 30 disclose no
  third-party testing information [ACAD-11].
- Most agents rely on GPT, Claude, or Gemini model families, creating
  accountability fragmentation between model providers, orchestration layers,
  and deployments [ACAD-11].
- Browser-agent conduct is unsettled. Some agents ignore robots.txt or bypass
  anti-bot systems; only ChatGPT Agent used cryptographic request signing in the
  index [ACAD-11].

MIT Sloan's 2026 action guidance says agentic AI is not ready for broad
unsupervised deployment because hallucinations, mistakes, prompt injection, and
security problems remain unresolved [ACAD-12]. It nevertheless predicts agents
will handle most transactions in many large-scale business processes within
five years and recommends reusable organizational use cases and internal agent
testing capabilities [ACAD-12].

MIT Sloan Management Review and BCG describe an "agentic enterprise" with four
tensions: scalability versus adaptability, experience versus expediency,
supervision versus autonomy, and retrofit versus reengineer [ACAD-14]. MIT Sloan
and MIT CISR sources emphasize decision rights, accountability, operating-model
redesign, and human-agent division of labor [ACAD-13] [ACAD-17].

## Broader academic and practitioner research

Recent arXiv and ACM work provides the security and protocol taxonomy now used
by practitioners:

- ACM Computing Surveys identifies security gaps caused by unpredictable
  multi-step inputs, complex internal execution, variable environments, and
  untrusted external entities [ACAD-18].
- A June 2025 survey of LLM-driven agent communication analyzes user-agent,
  agent-agent, and agent-environment channels, including MCP and A2A
  experiments [ACAD-19].
- A May 2025 interoperability survey compares MCP, ACP, A2A, and ANP across
  discovery, communication, security, and deployment roadmaps [ACAD-20].
- A June 2025 threat survey connects prompt injection to protocol exploits in
  MCP, ACP, ANP, and A2A workflows [ACAD-21].
- A June 2025 autonomy-induced security survey connects memory, tools,
  planning, and reflection to memory poisoning, tool misuse, reward hacking, and
  emergent misalignment [ACAD-22].

Harvard Business Review sources are useful for management framing but are
metered or paywalled. They emphasize supervision levels, trust, workflow
redesign, and cross-functional governance for agentic systems [ACAD-23]
[ACAD-24] [ACAD-25]. Harvard Data Science Review and MIT Press sources extend
the discussion to Agent OS-style enterprise redesign and AI auditing [ACAD-26]
[ACAD-27].

## Limitations

- Cornell material is public syllabus/marketing material, not a full public
  curriculum [ACAD-01] [ACAD-02].
- Several Harvard and MIT sources are workshops, explainers, or management
  articles rather than peer-reviewed studies [ACAD-03] [ACAD-05] [ACAD-12].
- The MIT AI Agent Index is a transparency study based on public information,
  not a behavioral benchmark [ACAD-11].
- The HBR sources are metered or paywalled; only public summaries were used
  [ACAD-23] [ACAD-24] [ACAD-25].
