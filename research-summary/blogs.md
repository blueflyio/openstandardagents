# Industry Blogs and Engineering Publications

Current date used for relative-date normalization: May 16, 2026.

## 47Billion: production lessons

47Billion's 2026 engineering article is valuable because it reports hands-on
production experience across AutoGen, CrewAI, LlamaIndex, OpenAI Agents SDK,
and a global insurance sales-training deployment [BLOG-01]. It distinguishes
four autonomy levels: prompt chaining, branching workflows, tool-using agents,
and multi-agent systems [BLOG-01].

Key takeaways:

- Level 2-3 workflows are the current production sweet spot; open-ended Level 4
  multi-agent systems are powerful but unpredictable and costly [BLOG-01].
- CrewAI was faster and more predictable than AutoGen for a structured table
  reservation workflow: one week versus three weeks [BLOG-01].
- AutoGen was powerful for exploratory tasks but suffered circular
  conversations, high token use, hard debugging, and repeated tool calls
  [BLOG-01].
- LlamaIndex was strongest for document and RAG-heavy workflows [BLOG-01].
- Human-in-the-loop is not a failure mode. It is required for trustworthy
  regulated or customer-facing deployments [BLOG-01].

The cost model is one of the most actionable parts of the article:

| Approach | Reported cost/task | Tokens/task | Best fit |
| --- | --- | --- | --- |
| Simple workflow | USD 0.10-0.50 | 1k-3k | Linear tasks |
| CrewAI multi-agent | USD 0.50-2.00 | 3k-10k | Structured multi-step |
| AutoGen multi-agent | USD 2.00-5.00 | 5k-25k | Exploratory collaboration |
| LlamaIndex RAG | USD 0.20-1.00 | 1k-5k | Document queries |

47Billion's reliability playbook includes structured outputs, conservative
temperatures, strict tool whitelists, progressive rollout, cost monitoring,
output validation, human approval checkpoints, audit trails, and versioned
behavior [BLOG-01]. Its protocol summary is also useful: MCP for tools, A2A for
agents, AG-UI for UIs [BLOG-01].

## Ruh.ai: protocol guide

Ruh.ai's May 6, 2026 guide is a vendor overview of MCP, A2A, and ACP [BLOG-02].
It cites Gartner's prediction that 40% of enterprise applications will integrate
task-specific AI agents by the end of 2026, up from less than 5% in 2025
[BLOG-02]. It argues that communication barriers are the primary reason
multi-agent deployments fail [BLOG-02].

The practical decision framework is:

- MCP for agent-to-tool connections, structured context, data/API integration,
  and audit trails [BLOG-02].
- A2A for multi-agent coordination, dynamic discovery, cross-organizational
  delegation, and long-running workflows [BLOG-02].
- ACP for simpler REST-based deployments, legacy systems, and teams that prefer
  ordinary HTTP [BLOG-02].

The guide is a useful secondary source, but some claims are aggregated from
analyst or vendor sources. Treat adoption numbers and case studies as
directional unless corroborated by primary material [BLOG-02].

## Gravitee: State of AI Agent Security 2026

Gravitee's February 3, 2026 report is one of the strongest data sources in this
set because it provides a clear sample size: 919 executives and practitioners
[SEC-01]. It argues that security models have not evolved at the same pace as
agent adoption [SEC-01].

Important findings:

- 80.9% of technical teams are beyond planning [SEC-01].
- Only 14.4% have full IT/security approval for the entire agent fleet
  [SEC-01].
- 88% report confirmed or suspected security/privacy incidents [SEC-01].
- Only 21.9% treat agents as independent identity-bearing entities [SEC-01].
- Only 47.1% of agents are actively monitored or secured on average [SEC-01].
- Only 7.7% audit agent activity daily [SEC-01].

The report's strongest recommendation is identity-aware enforcement: agents need
unique identities, centrally governed authorization, continuous monitoring, and
visibility into agent-to-agent and agent-to-tool interactions [SEC-01].

## DEV Community security guide

The DEV guide "Building Production-Ready AI Agents" frames the core security
failure as authenticating the caller but not authorizing the action [BLOG-05].
Its example is a prompt injection that causes a support agent to issue a USD
47,000 refund because the backend verifies credentials and a function signature
but does not verify whether the refund action is legitimate [BLOG-05].

The guide's seven risks are practical:

1. Prompt injection.
2. Excessive permissions.
3. Hallucinated actions.
4. No attribution.
5. Replay attacks.
6. No kill switch.
7. Opaque policy violations [BLOG-05].

The recommended architecture is a signed intent envelope plus a verification
layer before tool execution. The verification layer checks signature, nonce,
timestamp, declared action, constraints, and revocation status [BLOG-05]. This
pattern aligns closely with OSSA/DUADP concepts such as GAID/DID identity,
signed manifests, trust tiers, and revocation, though the article uses its own
reference implementation [BLOG-05] [NPM-01] [NPM-02].

## Harvard policy and legal commentary

Harvard's HKS Student Policy Review essay argues that autonomous agents could
accelerate internet traffic in super-exponential ways because each new bot can
coordinate with many others [ACAD-15]. It notes bots already comprise about 50%
of internet traffic and argues for bot-bot communication protocols, network
upgrades, and stronger human-versus-agent verification [ACAD-15].

Harvard Journal of Law and Technology commentary on the agentic web argues that
the governance fight is not simply Amazon versus Perplexity. It is a choice
between platform-controlled agent behavior and protocol-mediated authority using
portable identity, verifiable delegation, and accountable behavior [ACAD-16].
The proposed "Know Your Agent" direction is relevant to DUADP and OSSA because
both emphasize identity, provenance, and manifest-level accountability [ACAD-16]
[BF-03] [BF-05].

## monday.com Agent Tool Protocol

ATP's public site argues that agents should write code and execute it in a
sandbox instead of choosing from long tool lists [PROTO-07]. The critique is
that MCP tool discovery often happens before the agent reasons about the task,
forcing either huge tool descriptions into context or premature tool filtering
[PROTO-07].

ATP proposes:

- API aggregation across OpenAPI, MCP, and custom APIs.
- Runtime search for relevant APIs.
- TypeScript/JavaScript code execution in a sandbox.
- API annotations for safe, sensitive, and destructive actions.
- Human approval for destructive operations.
- Audit logs, rate limits, and no default file/network/process access
  [PROTO-07].

ATP is early and vendor-authored, but it raises a real production problem:
tool-calling abstractions can become context-expensive and under-composable.

## Engineering caveats

- Vendor blogs often combine technical lessons with product marketing. Their
  operational lessons are useful, but independent validation is needed for
  performance claims [BLOG-01] [BLOG-02] [PROTO-07].
- Reported cost ranges depend heavily on model, prompt design, context size,
  tool latency, caching, and evaluation strategy [BLOG-01].
- Security stories are useful for threat modeling even when anecdotal, but
  production controls should be tested with red teams and incident drills
  [BLOG-05] [SEC-04].
