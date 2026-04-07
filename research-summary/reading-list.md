# Reading List: Agentic AI, Protocols, Standards, and Security (2026)

**Snapshot date:** March 10, 2026  
**Scope:** Foundational specifications, implementation docs, academic/policy analyses, and production security references.

---

## 1) Start Here (Executive Orientation)

1. **DUADP home and docs** (identity + discovery + federation model) [T01]  
2. **Open Standard for Software Agents (OSSA)** (contract layer + validation model) [T02]  
3. **Anthropic MCP announcement** (why MCP exists; ecosystem framing) [T04]  
4. **Google A2A announcement** (inter-agent collaboration protocol) [T05]  
5. **NIST NCCoE concept paper** (identity/security adoption for agents) [T10]

If you only have one hour, read these five in order.

---

## 2) Protocol Specifications and Normative References

### Discovery, identity, and trust

- DUADP specification and architecture [T01]  
- OSSA manifest/spec overview [T02]  
- W3C DID Core (for decentralized identity foundations) [T03]

### Tool and context protocol

- Model Context Protocol official docs [T06]  
- Anthropic MCP launch post [T04]

### Agent-to-agent protocol

- Google A2A launch and updates [T05]  
- Agent Network Protocol (ANP) README [T08]  
- ACP historical references and merge trajectory (secondary synthesis source) [T17]

### Agent-to-UI protocol

- AG-UI introduction and event model [T07]

### Execution/tooling alternatives

- Agent Tool Protocol (ATP) overview and benchmark claims [T09]

---

## 3) Framework and Platform Implementation Reading

### Core open-source frameworks

- OpenAI Agents SDK (Python README + concepts) [T18]  
- LangGraph docs (graph/state execution model) [T19]  
- CrewAI repository docs [T20]  
- AutoGen repository docs and maintenance-mode notes [T21]  
- LlamaIndex repository docs [T22]

### Additional orchestration/control frameworks

- Parlant repository/docs [T23]  
- BotParlay repository docs [T24]

### Enterprise platform implementation

- GitLab Duo Agent Platform GA announcement [T25]  
- GitLab foundational agent docs [T26]

### Package adoption and release monitoring

- npm package pages for DUADP and OSSA packages [T27] [T28]  
- npm package page for OpenAI Agents JS [T29]

---

## 4) Academic, Policy, and Governance Reading

### Education and curriculum

- eCornell Agentic AI Architecture certificate [T11]

### Protocol analysis and policy framing

- Harvard LIL Agent Protocols Tech Tree (APTT) [T12]  
- Harvard JOLT policy commentary on institutional origins of the agentic web [T16]

### Benchmarking and ecosystem risk

- MIT AI Agent Index 2025 (main and further details) [T13] [T14]  
- MIT Sloan action items for AI decision-makers 2026 [T15]

### Security/identity standards trajectory

- NIST NCCoE concept paper on software and AI agent adoption [T10]

---

## 5) Security and Production Operations Reading

### Empirical security posture and incidents

- Gravitee State of AI Agent Security 2026 [T30]

### Practical red-team and attack walkthroughs

- Prompt injection and tool abuse article (developer-facing practical risks) [T31]

### Production lessons and cost realities

- 47Billion production framework/protocol analysis [T32]  
- Ruh.ai protocol guide and enterprise adoption framing [T33]

### Optional deeper operationalization

- OWASP references for LLM and GenAI application security (for control mapping)
- SOC 2 / ISO 27001 control families for governance mapping
- SBOM + provenance practices for agent supply-chain controls

---

## 6) Suggested Reading Paths by Role

| Role | Recommended sequence |
|---|---|
| Platform architect | T02 → T06 → T05 → T07 → T18/T19 |
| Security lead | T10 → T30 → T31 → T04/T06 → T01/T03 |
| Product/engineering lead | T32 → T33 → T25 → T19/T20 → T29 |
| Policy/governance lead | T13/T14 → T16 → T12 → T10 |
| Developer onboarding | T18 → T19 → T20 → T06 → T07 |

---

## 7) Citation Key

- **[T01]** https://duadp.org/  
- **[T02]** https://openstandardagents.org/  
- **[T03]** https://www.w3.org/TR/did-core/  
- **[T04]** https://www.anthropic.com/news/model-context-protocol/  
- **[T05]** https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/  
- **[T06]** https://modelcontextprotocol.io/introduction  
- **[T07]** https://docs.ag-ui.com/introduction  
- **[T08]** https://raw.githubusercontent.com/agent-network-protocol/AgentNetworkProtocol/main/README.md  
- **[T09]** https://agenttoolprotocol.com/  
- **[T10]** https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd  
- **[T11]** https://ecornell.cornell.edu/certificates/ai/agentic-ai-architecture/  
- **[T12]** https://lil.law.harvard.edu/blog/2026/02/23/agent-protocols-tech-tree/  
- **[T13]** https://aiagentindex.mit.edu/2025  
- **[T14]** https://aiagentindex.mit.edu/2025/further-details  
- **[T15]** https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026  
- **[T16]** https://jolt.law.harvard.edu/digest/on-the-institutional-origins-of-the-agentic-web  
- **[T17]** https://a2aprotocol.ai/docs/guide/ai-protocols-analysis-report-a2a-mcp-and-acp  
- **[T18]** https://raw.githubusercontent.com/openai/openai-agents-python/main/README.md  
- **[T19]** https://docs.langchain.com/oss/python/langgraph/graph-api  
- **[T20]** https://raw.githubusercontent.com/crewAIInc/crewAI/main/README.md  
- **[T21]** https://raw.githubusercontent.com/microsoft/autogen/main/README.md  
- **[T22]** https://raw.githubusercontent.com/run-llama/llama_index/main/README.md  
- **[T23]** https://raw.githubusercontent.com/emcie-co/parlant/main/README.md  
- **[T24]** https://raw.githubusercontent.com/dray3310-hash/botparlay/main/README.md  
- **[T25]** https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available  
- **[T26]** https://docs.gitlab.com/user/duo_agent_platform/agents/foundational_agents/  
- **[T27]** https://www.npmjs.com/package/@bluefly/duadp  
- **[T28]** https://www.npmjs.com/package/@bluefly/openstandardagents  
- **[T29]** https://www.npmjs.com/package/@openai/agents  
- **[T30]** https://www.gravitee.io/state-of-ai-agent-security  
- **[T31]** https://dev.to/the_seventeen/your-ai-agent-is-one-prompt-injection-away-from-losing-all-your-api-keys-36cc  
- **[T32]** https://47billion.com/blog/ai-agents-in-production-frameworks-protocols-and-what-actually-works-in-2026  
- **[T33]** https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide
