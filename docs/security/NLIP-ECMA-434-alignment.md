# NLIP / ECMA-434 alignment

This document summarizes how OSSA aligns with [ECMA-434](https://ecma-international.org/wp-content/uploads/ECMA-434_1st_edition_december_2025.pdf) (Security profiles for Natural Language Interaction Protocol). A full audit and recommendations are kept in Research: `/Volumes/AgentPlatform/applications/Research/openstandardagents/ECMA-434-NLIP-Security-Audit.md` (or equivalent path on your NAS).

---

## Profile overview

| Profile | Focus | OSSA status |
| ------- | ----- | ----------- |
| **Profile 1** | Transport and identity (TLS, agent authentication) | Spec and docs recommend TLS and auth; runtimes implement |
| **Profile 2** | Authorization and observability | `spec.autonomy`, tool auth, audit/retention in schema; runtime-dependent |
| **Profile 3** | Prompt-injection and data governance | Validator checks; deployer responsibility for filters and PII handling |

---

## Profile 1: Transport and identity

- **TLS**: All production agent and tool endpoints should use TLS. OSSA does not mandate it in the schema; deployment and runtime docs should require it for NLIP compliance.
- **Agent authentication**: Agent identity and authentication are runtime concerns. The spec supports identity via `identity` and tool endpoints; implementers should use authenticated channels (e.g. mTLS, OAuth, API keys) as per ECMA-434.

## Profile 2: Authorization and observability

- **Authorization**: `spec.autonomy` (e.g. `approval_required`, `allowed_actions`, `blocked_actions`) and tool-level auth (e.g. `auth_required`) support least-privilege and human-in-the-loop.
- **Observability**: Schema supports audit and retention; runtimes should implement logging, metrics, and retention policies per ECMA-434.

## Profile 3: Prompt-injection and data governance

- **Prompt-injection**: Security validator checks for unsafe patterns; deployers should add input/output filters and sandboxing at runtime.
- **Data governance**: Schema allows compliance and retention metadata; PII handling and retention are deployer responsibilities. See [ETHICS.md](../../ETHICS.md) for privacy and data handling.

---

## References

- ECMA-434 1st edition (December 2025): Security profiles for NLIP
- Full audit (Research): `Research/openstandardagents/ECMA-434-NLIP-Security-Audit.md`
- [SECURITY.md](../../SECURITY.md) – vulnerability reporting and compliance statement
- [ETHICS.md](../../ETHICS.md) – ethical-by-design statement
