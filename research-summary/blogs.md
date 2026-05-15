# Tech Blogs and Engineering Publications

Prepared: May 15, 2026. Tether citation IDs are defined in
`reading-list.md`.

## 47Billion: production reality check

47Billion's "AI Agents in Production" is a credible engineering case study
because it is grounded in four months of framework evaluation and a production
deployment for a global insurance company [T25].

Key takeaways:

- Modern agents are usually ReAct-style loops: reason, act through a tool,
  observe, and repeat [T25].
- Autonomy exists on a spectrum from prompt chains to branching workflows,
  tool-using agents, and multi-agent systems [T25].
- For most production use cases, Level 2-3 systems are the sweet spot:
  branching workflows and tool-using agents rather than open-ended multi-agent
  autonomy [T25].
- CrewAI was easier for structured tasks, AutoGen was powerful but expensive and
  difficult to debug, and LlamaIndex was strongest for RAG/document workflows
  [T25].
- Human-in-the-loop is not a limitation; it is a trust and compliance pattern
  for approval gates, review/edit, escalation, and feedback [T25].

47Billion also gives a practical protocol framing:

- MCP: agent-to-tool.
- A2A: agent-to-agent.
- AG-UI: agent-to-user-interface [T25].

Actionable recommendations:

1. Start simple and add agents only when the workflow demands it.
2. Set up cost monitoring before production.
3. Use structured outputs and validation.
4. Whitelist tools and set max iteration/tool-call counts.
5. Roll out progressively: internal pilot, selected beta users, then general
   availability.
6. Log every decision, tool call, and output for audit and reproducibility
   [T25].

## Ruh.ai: protocol selection guide

Ruh.ai's 2026 protocol guide frames agent protocols as standardized
communication frameworks that specify message formats, communication patterns,
and discovery mechanisms [T26]. It cites Gartner's prediction that 40% of
enterprise applications will integrate task-specific AI agents by 2026, up from
less than 5% in 2025 [T26].

The guide's useful contribution is a selection framework:

| Use case | Recommended protocol |
| --- | --- |
| One agent using many external tools and data sources | MCP |
| Multiple specialized agents coordinating tasks | A2A |
| Lightweight REST-style messaging and legacy integration | ACP |
| Open, decentralized agent networking | ANP |

It also explains the integration math: without standards, N agents and M tools
create N x M custom connectors; with protocols, the implementation count moves
toward N + M [T26]. This is a strong argument for early protocol adoption, even
if some adoption statistics in the article depend on secondary sources rather
than primary standards bodies [T26].

Security recommendations in the guide:

- least privilege
- mTLS or signed tokens for strong authentication
- message integrity checks
- rate limits and circuit breakers
- network segmentation and zero-trust architecture [T26]

## Gravitee: agent security as identity governance

Gravitee's 2026 report and blog are security-focused rather than framework
focused [T18][T19]. Their key contribution is a data-backed argument that agent
security is an identity, authorization, and governance problem.

Fast facts:

- 80.9% of technical teams are actively testing or running agents.
- Only 14.4% have full IT/security approval across the entire fleet.
- 88% report confirmed or suspected incidents.
- Only 21.9% treat agents as independent identities.
- 45.6% use shared API keys for agent-to-agent authentication [T18][T19].

Recommendations:

1. Treat AI agents as first-class security principals.
2. Replace shared credentials with unique identities.
3. Add identity-aware proxying around MCP/tool connections.
4. Move from periodic audits to continuous monitoring.
5. Maintain an agent/MCP server catalog that is not manual or stale [T19].

## Dev.to security guides: practical controls

The Dev.to authentication/authorization guide frames the execution layer as the
primary attack surface: credentials, permissions, and tool access granted to
agents can be manipulated through prompt injection, goal hijacking, or
misconfiguration [T27].

Its strongest pattern is the tool gateway:

- verify agent identity/session
- enforce rate limits
- evaluate policy
- require human approval when needed
- validate/sanitize parameters
- execute and audit every tool call [T27]

The production security guide makes the least-privilege lesson concrete: a
debugging agent should have a read-only database connection; a deployment agent
should have CI access but not production database access; a support agent should
read tickets but not delete accounts [T28]. It also stresses that inter-agent
communication should be treated as untrusted input, signed, and scoped to limit
lateral movement [T28].

Recommended immediate actions:

- audit current agent permissions and remove unused tools
- move credentials out of prompts and into a secrets manager
- add confirmation for destructive operations
- create structured traces for every session
- add anomaly alerts for unusual credential/tool access [T28]

## MIT Sloan/BCG: organizational design

The MIT Sloan Management Review/BCG work is not a "tech blog," but it is an
engineering-management source that explains why production agent adoption is
hard [T29][T30]. Agentic AI is framed as a hybrid: owned like a tool but managed
like a coworker [T29].

Four tensions matter for implementation:

1. Scalability versus adaptability.
2. Experience versus expediency.
3. Supervision versus autonomy.
4. Retrofit versus reengineer [T29].

For engineering leaders, this means agent rollout cannot be treated as only an
SDK choice. It changes process design, governance, workforce planning,
investment models, and decision rights [T29].

## GitLab: enterprise software-delivery platform

GitLab's Duo Agent Platform announcement is a strong example of agentic AI being
embedded into an existing DevSecOps system of record [T36]. Its focus is not
only code generation; it extends to planning, security analysis, CI/CD,
conversion flows, code review, issue-to-MR automation, external agents, and
custom cataloged agents [T36][T37].

Engineering lessons:

- Context matters: agents use issues, MRs, pipelines, security findings, and
  project data [T36].
- Governance matters: model selection, namespace-level access controls, LDAP and
  SAML integration, and usage/activity visibility are part of the product
  surface [T36][T37].
- Catalogs matter: custom agents and flows need a central place to be created,
  managed, shared, and governed [T36][T37].

## Blog-source cautions

Some blog statistics are secondary, vendor-sponsored, or consultancy-produced.
They should be used as directional evidence, not as canonical market sizing. For
standards details, prefer primary protocol specs and official announcements:
MCP spec, A2A spec, AG-UI docs, ACP docs, ANP README, DUADP docs, OSSA spec, and
NIST publications [T06][T08][T10][T11][T14][T20][T23][T31].
