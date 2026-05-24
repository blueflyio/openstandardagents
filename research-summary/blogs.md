# Industry Blogs and Engineering Publications

Prepared on May 24, 2026.

## 47Billion: production reality and protocol stack

47Billion's "AI Agents in Production" is one of the most grounded engineering
writeups reviewed. Its central claim is that demos understate the gap between
agent capability and production reliability [S20]. The authors tested AutoGen,
CrewAI, LlamaIndex, and OpenAI Agents SDK patterns, then shipped a production
deployment for an insurance training simulator [S20].

Important production lessons:

* Most production use cases should start at prompt chains, branching workflows,
  or single tool-using agents. Open-ended multi-agent systems are still too
  unpredictable for critical paths [S20].
* CrewAI was faster and more structured for task-based multi-step workflows;
  AutoGen was powerful but costly and harder to debug; LlamaIndex was strongest
  for document-heavy RAG [S20].
* Human-in-the-loop is required for trust, recovery, compliance, and quality
  control [S20].
* Cost monitoring is non-negotiable because multi-agent conversations multiply
  token use [S20].
* Agents fit best as an orchestration layer above existing microservices; they
  should coordinate services rather than replace them [S20].

47Billion's protocol framing is especially clear: MCP handles agent-to-tool,
A2A handles agent-to-agent, and AG-UI handles agent-to-frontend communication
[S20]. Their cost table is also useful:

| Approach | Cost per task | Tokens per task |
| --- | ---: | ---: |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 |

The article's most actionable recommendation is to adopt standards early:
document internal APIs as MCP servers, evaluate A2A only when partner or
cross-agent delegation is needed, and use AG-UI for frontend streaming and
approval workflows [S20].

## Ruh.ai: protocol decision framework

Ruh.ai's May 6, 2026 guide frames agent protocols as the response to enterprise
integration barriers [S12]. It cites Gartner's 2025 research that 40% of
enterprise applications will integrate AI agents by 2026, up from less than 5%
in 2025, while communication barriers remain a major implementation failure
point [S12].

Ruh.ai's decision framework:

| Use | Protocol |
| --- | --- |
| One agent needs tools, databases, APIs, and structured context | MCP |
| Multiple specialized agents need delegation or cross-organization workflows | A2A |
| Lightweight REST-native messaging or legacy integration | ACP |

The guide also emphasizes the N-by-M integration problem: without protocols,
N agents and M tools require N times M custom connectors; with protocols,
integration complexity approaches N plus M [S12]. Its security advice aligns
with the stronger security sources: least privilege, strong authentication,
message integrity, rate limiting, circuit breakers, segmentation, audit trails,
and industry-specific compliance controls [S12].

## Gravitee: State of AI Agent Security 2026

Gravitee's 2026 report is the strongest quantitative industry source reviewed
[S18]. It surveyed 919 executives and practitioners and found that agent
adoption has moved faster than identity, authorization, monitoring, and runtime
governance.

Key statistics:

* 80.9% of technical teams are past planning and actively testing or running
  agents.
* 14.4% have full IT/security approval for the entire agent fleet.
* 88% report confirmed or suspected security/privacy incidents in the last year.
* 47.1% of agents, on average, are actively monitored or secured.
* 21.9% treat agents as independent identity-bearing entities.
* 45.6% use shared API keys for agent-to-agent authentication.
* 57.4% cite insufficient observability as a primary concern when building
  agents and MCP servers [S18].

The report's most important interpretation is that AI agent security is "an
execution problem, not an awareness problem" [S18]. Teams know the risks but
lack cohesive identity models, centralized enforcement, clear ownership, and
continuous visibility [S18].

## Dev.to security guides

Several Dev.to posts converge on the same execution-layer lesson: prompt
injection becomes dangerous when the agent has excessive permissions [S23]. One
guide states that the attack surface is not the model weights; it is the
credentials, permissions, and tool access granted to agents [S23].

Actionable guidance from the Dev.to corpus:

* Use whitelist-based tool access with default deny.
* Make scopes granular and action-specific.
* Add dynamic authorization that considers context, risk, user tier, and task.
* Prevent agents from self-escalating permissions.
* Require human-in-the-loop approval for high-risk operations.
* Treat model outputs as untrusted before execution.
* Use a gateway between the agent and external tools.
* Issue narrow, short-lived credentials only after policy approves the action
  [S23].

This matches NIST/NCCoE's focus on identification, authorization, audit, and
prompt-injection controls [S19].

## DZone and protocol-stack explainers

DZone's "Agent Protocol Stack" is a practical explainer of the boundaries
between MCP, A2A, and AG-UI [S05]. Its main point is architectural hygiene:
MCP is not agent-to-agent communication, A2A is not frontend streaming, and
AG-UI is not a tool protocol [S05].

The article recommends starting with MCP because most agents need tools first,
adding AG-UI when building a frontend, and introducing A2A when specialization
or cross-agent delegation becomes necessary [S05]. This sequencing is also
consistent with 47Billion's production roadmap [S20].

## Harvard and policy-oriented web traffic sources

Harvard Library Innovation Lab's APTT post is less an implementation guide and
more a policy lens. It argues that protocols are a way to steer a distributed
agent ecosystem because no single authority controls the technique [S15]. The
tech-tree format helps non-technical stakeholders see why each protocol layer
became necessary [S15].

Separate traffic and policy sources describe the "agentic web" problem: automated
traffic is now a dominant or rapidly growing share of internet activity. HUMAN
Security reports that automated traffic grew 23.51% year over year in 2025 while
human traffic grew 3.10%, monthly AI-driven traffic grew 187%, and traffic from
AI agents and agentic browsers grew 7,851% year over year [S26]. Imperva reports
that bots accounted for more than 53% of all web traffic in 2025 [S26]. These
numbers support the need for agent-specific conduct, identification, and
machine-readable interfaces.

## HBR and management publications

Harvard Business Review's March 30, 2026 article "AI Agents Act a Lot Like
Malware. Here's How to Contain the Risks" is paywalled in the fetched source,
but the visible summary frames autonomous agents as a cybersecurity and digital
privacy concern [S26]. Related management summaries interpret HBR's guidance as
treating agents like digital coworkers: give them job descriptions, accountable
owners, bounded authority, trusted data sources, audit trails, escalation paths,
and performance governance [S25].

This management framing is useful because it translates engineering controls
into operating-model controls. An agent that can execute work needs the same
organizational treatment as a delegated actor: identity, authority, supervision,
and accountability [S25].

## Emerging publication consensus

The blog and engineering sources agree on five practical rules:

1. Do not start with open-ended multi-agent autonomy.
2. Use MCP, A2A/ACP, and AG-UI as separate layers.
3. Put identity and authorization outside the model.
4. Instrument cost, latency, tool success, and semantic result quality.
5. Roll out progressively with human approval gates and circuit breakers.

The strongest disagreement is not about goals but about maturity. Vendor and
consulting blogs often describe rapid adoption and broad protocol support,
while MIT, NIST, Gravitee, and academic security papers emphasize that safety,
identity, and governance are lagging [S16] [S18] [S19] [S21].
