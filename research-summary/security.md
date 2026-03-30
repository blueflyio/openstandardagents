# Security and Governance of Agentic AI (2025-2026)

## Summary

Security data across public reports, government initiatives, and academic papers points to a consistent issue: organizations are deploying autonomous agents faster than identity, authorization, and runtime controls are maturing. [R33][R34][R36][R38]

## Key quantitative signals

### Gravitee 2026 report signals

From Gravitee's 2026 report pages and companion analysis:

- 81% of teams are past planning
- only 14.4% have full security approval for all agents
- 88% report confirmed or suspected incidents
- about 22% treat agents as independent identities
- many teams still rely on shared API keys and hardcoded authorization logic [R33][R34][R35]

### MIT and MIT Sloan signals

- MIT AI Agent Index finds broad transparency gaps in safety/evaluation disclosure for deployed agents.
- MIT Sloan warns agentic AI is not production-ready for many high-autonomy use cases due to hallucinations and prompt-injection/hijack concerns, despite optimistic medium-term adoption expectations. [R21][R22][R24]

### HUMAN traffic and threat benchmark signals

HUMAN's 2026 benchmark reports:

- automation growth outpacing human traffic
- 187% growth in AI-driven traffic in 2025
- 7,851% growth in agentic traffic
- high concentration in commerce/media/travel surfaces that are also targeted by abuse. [R40]

## Threat model

### Primary attack classes

1. **Prompt/indirect prompt injection** through external content ingestion. [R31][R45]
2. **Excessive permissions / over-privileged agents** (shared service identities, broad scopes). [R34][R35]
3. **Hallucinated or mis-scoped actions** (unsafe action selection under uncertainty). [R24][R30]
4. **Data exfiltration via tools and agent chaining** (especially in multi-agent systems). [R35][R39]
5. **Supply chain and plugin/tooling risk** (unverified external capabilities, weak provenance). [R36][R38]

### Practical risk indicators

- Agents issuing tool calls outside intended scopes
- lack of continuous audit logs and event traces
- inability to attribute action chains to specific non-human identities
- absence of action gating for irreversible operations [R33][R34][R38]

## Identity and authorization direction

### NIST/NCCoE direction (2026)

NIST CAISI and NCCoE explicitly call for agent-focused identity and authorization patterns, including standards alignment, secure interoperability, and prompt-injection-aware controls. [R36][R37][R38]

### Emerging implementation pattern

A recurring blueprint across sources:

1. Give each agent a first-class identity (not shared service key)
2. apply least privilege and scoped tokens
3. enforce policy before high-risk actions
4. log and monitor all critical execution events
5. include revocation and incident response pathways [R33][R34][R38]

## Academic security evidence (2025)

Selected peer-reviewed work reinforces that injection remains materially successful against real agents:

- **AGENTVIGIL** reports high success in black-box indirect prompt-injection red teaming against benchmark agents.
- **MELON** demonstrates improved defensive performance but confirms that dedicated defenses are necessary and non-trivial. [R45][R46]

Interpretation: attacks and defenses are co-evolving, but default deployments are not secure by default.

## Recommended baseline controls (actionable)

### Minimum baseline (for any production agent)

1. **Identity**
   - unique non-human identity per agent
   - no shared credentials
2. **Authorization**
   - least-privilege scopes
   - short-lived credentials
   - explicit policy gating for sensitive actions
3. **Runtime security**
   - tool allowlists
   - action risk tiers (read-only vs irreversible)
   - human-in-the-loop for high-impact actions
4. **Observability**
   - full execution/event logging
   - anomaly detection on tool-call sequences
5. **Governance**
   - deployment approval workflow
   - periodic red-team and tabletop incident exercises [R33][R34][R35][R38][R45]

## Governance gaps to monitor in 2026

- Cross-protocol identity portability (MCP + A2A + custom meshes)
- interoperability between policy engines and agent runtimes
- legal/contract accountability for delegated agent actions across organizations [R27][R36][R38]

## Limitations

- Several widely shared security guides are blog-level (strong practical value, weaker formal validation).
- Some enterprise security claims are vendor-reported and should be cross-validated during procurement.

---

## Citation keys used in this file

[R21], [R22], [R24], [R31], [R33], [R34], [R35], [R36], [R37], [R38], [R40], [R45], [R46]
