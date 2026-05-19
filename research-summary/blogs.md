# Industry Blogs and Engineering Publications

Compiled on May 19, 2026.

## 47Billion: production lessons

47Billion's "AI Agents in Production" is one of the more detailed practitioner
accounts in the source set. It reports work across three frameworks, multiple
proofs of concept, and a production deployment for a global insurance company
[S27].

The post's strongest production lesson is that agent autonomy is a spectrum:

| Level | Pattern | Production note |
| --- | --- | --- |
| 1 | Prompt chaining | Predictable and easy to debug |
| 2 | Workflows with branching | Good for quality gates and controlled loops |
| 3 | Tool-using agents | Practical sweet spot with guardrails |
| 4 | Multi-agent systems | Powerful but expensive and difficult to debug |

47Billion recommends Level 2-3 for most production use cases in 2026 and warns
that Level 4 is often better for demos than critical paths unless heavy
guardrails and human checkpoints are present [S27].

The framework comparison is practical:

- AutoGen is powerful for exploratory multi-agent collaboration but can loop,
  consume many tokens, and be hard to debug [S27].
- CrewAI is a structured middle ground for role/task-based workflows and was
  faster for their table-reservation rebuild [S27].
- LlamaIndex is strongest when the agent's job is document processing,
  retrieval, and synthesis [S27].
- OpenAI Agents SDK is a minimal primitive set: agents, handoffs, guardrails,
  and tracing [S21][S27].
- LangGraph is more verbose but strong for stateful workflows, cycles, and
  visibility [S22][S27].

47Billion also provides useful cost ranges:

| Approach | Cost per task | Tokens per task | Best fit |
| --- | ---: | ---: | --- |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 | Linear deterministic tasks |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 | Structured multi-step tasks |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 | Exploratory collaboration |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 | Document queries |

Their reliability playbook is concise: validate structured outputs, use
conservative temperature settings for deterministic tasks, constrain tools,
roll out progressively, monitor cost from day one, and plan for iterative
refinement after the first working system [S27].

## Ruh.ai: protocol decision framework

Ruh.ai's May 6, 2026 guide frames protocols as the way to overcome agent
communication barriers and reduce integration complexity [S43]. It cites a
Gartner forecast that 40% of enterprise applications will integrate AI agents
by 2026, up from less than 5% in 2025, and argues that communication barriers
remain a primary cause of implementation failure [S43].

The guide maps the three major communication standards:

- MCP for agent-to-tool connections.
- A2A for multi-agent coordination.
- ACP for lightweight REST messaging [S43].

Ruh.ai's decision framework is useful even where some numbers are secondary
citations rather than primary evidence:

- Use MCP for agents that need many data sources, structured context,
  compliance, and broad ecosystem support.
- Use A2A for multi-agent workflows, dynamic discovery, cross-organization
  communication, and vendor-neutral orchestration.
- Use ACP for rapid deployment, legacy systems, REST-first teams, and simple
  low-overhead interoperability [S43].

The post also identifies emerging standards worth watching: ANP for DID-backed
agent networking, OASF for schemas, and W3C AI Agent Protocol Community Group
work [S43].

## Gravitee: state of AI agent security

Gravitee's 2026 report is one of the strongest empirical security sources in
the research set [S28]. Its core message is that adoption has outrun control:
80.9% of technical teams are testing or running agents, but only 14.4% have
full security/IT approval for the full agent fleet [S28].

Important statistics:

- 88% of organizations reported confirmed or suspected agent security incidents
  in the prior year [S28].
- Only 47.1% of agents are actively monitored or secured on average [S28].
- Only 21.9% of teams treat agents as independent identities [S28].
- 45.6% still use shared API keys for agent-to-agent authentication [S28].

Gravitee's March 2026 incident analysis adds qualitative patterns: broad
permissions, post-deployment governance, third-party AI supply-chain opacity,
quiet data leaks, prompts as control surfaces, and near-misses that force
reactive tightening [S40]. The actionable recommendation is to govern agents as
first-class enterprise actors with identity-aware enforcement and continuous
runtime policy [S28][S40].

## Dev.to security guides

Two Dev.to practitioner posts provide implementation-level detail. Alessandro
Pignati's "Stop the Hijack" frames agent security as securing autonomy and
privilege across the OODA loop: observe, orient, decide, act [S41]. Its key
risks are indirect prompt injection, tool inversion, privilege escalation, and
data exfiltration through multi-step reasoning [S41].

Pignati recommends defense-in-depth:

- Granular tool definitions rather than generic tools.
- Dedicated service accounts per agent.
- Tool input validation.
- Runtime tool-use validators.
- Semantic checkers.
- Human-in-the-loop controls.
- Continuous red-team simulations [S41].

Alex Cloudstar's "Securing AI Agents in Production" emphasizes behavioral and
compositional risk [S42]. The nine-second database deletion example illustrates
that a valid credential and a valid SQL operation can still produce an invalid
business outcome [S42]. The practical controls are separate credentials by
task, short-lived scoped tokens, allow-listed tools, staging-first deployment,
secrets managers rather than credentials in prompts, structured traces, and
anomaly alerts [S42].

The Dev.to posts are not standards, but they are useful for converting OWASP
and NIST concepts into developer checklists [S20][S30][S31][S41][S42].

## Harvard policy commentary

Harvard JOLT's agentic web commentary is a policy and institutional design
source rather than an engineering blog [S18]. It argues that the agentic web
will be governed either by platform-specific rules or by protocols that encode
portable identity, verifiable delegation, and accountability [S18].

The Amazon-Perplexity dispute is presented as an early governance test: if
agents can act as user representatives, hosts still need a way to verify agent
identity, authority, and policy compliance [S18]. This aligns with the need for
agent identity standards in NIST/NCCoE and the DID-heavy design of ANP and
DUADP [S02][S09][S18][S20].

## Patterns across industry writing

1. The protocol stack is complementary, not winner-take-all. Most credible
   sources place MCP, A2A, AG-UI, and discovery/contract layers in different
   positions [S01][S02][S03][S04][S07][S27][S43].
2. Production agent reliability depends more on boundaries than on raw model
   intelligence: tool limits, state, memory summarization, output validation,
   and monitoring [S27].
3. Security failures tend to be authorization failures. Prompt injection is the
   trigger; excessive permission is the blast radius [S28][S30][S31][S40].
4. Human-in-the-loop is a standard pattern, especially in regulated industries
   and irreversible actions [S27][S30][S31][S41].
5. The strongest engineering advice is to start narrow, add autonomy
   progressively, and instrument everything from the pilot stage [S27][S42].

## Caution on secondary claims

Some blog statistics are quoted from third-party research behind links or
paywalls. Where this report uses those numbers, it attributes them to the blog
source rather than treating them as independently verified primary data. The
most important primary empirical statistics in this folder are MIT's AI Agent
Index and Gravitee's survey [S15][S16][S28].
