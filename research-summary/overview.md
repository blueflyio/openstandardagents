# Agentic AI, protocols, standards, and security: overview (as of 2026-03-10 reference date)

## Bottom line

The ecosystem is transitioning from “framework experimentation” to “infrastructure standardization,” but security governance is lagging deployment speed. Protocols are converging; trust controls are not.

## 1) What DUADP and Open Standard Agents are (plain-language summary)

### DUADP (`duadp.org`)

DUADP is positioning itself as a **federated discovery protocol** for AI capabilities (agents/skills/tools), analogous to DNS-style discovery for agent ecosystems. It emphasizes DNS/WebFinger discovery, gossip/federation, DID-based trust, and MCP/REST interfaces, with SDK distribution through npm (`@bluefly/duadp`). [D1][D2][D3]

### Open Standard Agents / OSSA (`openstandardagents.org`)

OSSA is positioning itself as a **portable agent contract/manifest specification** that sits between protocols (like MCP/A2A) and runtime platforms. The core claim is “define once, export everywhere,” with governance metadata and validation included in the contract model, distributed via npm (`@bluefly/openstandardagents`). [D5][D6][D7]

Together, DUADP + OSSA represent a layered proposal:  
**contract layer (OSSA) + discovery layer (DUADP)** on top of broader ecosystem transport/interop standards.

## 2) The protocol stack is becoming legible

A practical 2026 stack pattern now appears:

- **MCP** for tool/data access interfaces [P1][P2][P3]
- **A2A** for agent-task collaboration semantics [P5][P8][P9]
- **AG-UI** for frontend interaction/event synchronization [P10][P11]
- **contract/discovery overlays** (OSSA/DUADP-like systems) for portability + federation [D1][D6]

This is analogous to layered internet architecture: transport and message protocols alone are insufficient without discovery, identity, and contract semantics.

## 3) Security reality check

Security data indicates structural mismatch:

- adoption and deployment are moving faster than approval/governance;
- identity and authorization remain weak in many teams;
- incident prevalence is high;
- shared credentials and broad permissions are still common. [S1][S2]

Academic and practitioner sources align on key hazards: prompt injection, hallucinated action boundaries, and excessive privilege. [A5][A6][S3][S4]

## 4) Where academia and industry agree

Cornell, Harvard, MIT, and MIT Sloan each reinforce a shared thesis:

1. agent autonomy is rising quickly;
2. open protocols matter for interoperability and governance;
3. human oversight and explicit control boundaries remain necessary in near-term production. [A1][A2][A5][A6]

## 5) Opportunities in 2026

1. **Interoperable architecture**: reducing bespoke integration cost with open protocols.
2. **Portable governance**: embedding compliance/trust metadata into agent contracts.
3. **Federated discovery**: moving beyond centralized marketplaces for cross-org agent finding.
4. **Security modernization**: agent-native IAM and policy engines as differentiators.

## 6) Primary challenges

1. No universal behavior standards for web-conduct by autonomous agents yet. [A5]
2. Security controls are often bolted on after deployment, not designed in. [S2]
3. Standards are evolving rapidly, so version drift and partial implementations are common.
4. Ecosystem claims are sometimes ahead of independently verified operational evidence.

## 7) Recommended next-step blueprint (practical)

1. Adopt **open protocol interfaces** (MCP/A2A) with explicit version pinning.
2. Adopt an **agent contract schema** (OSSA-like pattern) for identity/capability/governance portability.
3. Add **federated discovery** only where cross-boundary use cases justify complexity.
4. Enforce **agent-native IAM**, least privilege, and action approval boundaries before scaling fleet size.
5. Run continuous red-team style testing for prompt injection and tool misuse.

---

For full details by domain, see:
- `academia.md`
- `protocols.md`
- `frameworks.md`
- `security.md`
- `blogs.md`
- `reading-list.md`
