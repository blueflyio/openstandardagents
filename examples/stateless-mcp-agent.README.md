# Stateless MCP Agent — Design Decisions (needs review before MR)

This example (`stateless-mcp-agent.ossa.yaml`) exercises the new
`protocols.mcp` stateless declaration for MCP spec **2026-07-28**. Adding a
sessionless, OAuth-2.1 MCP auth surface intersects OSSA's existing **identity**
and **governance** blocks. The questions below are **design decisions for Thomas
to resolve before the MR is merged** — they are intentionally *not* resolved in
the schema/CLI patch. Each notes what the current schema actually enforces, so
the decision is concrete.

## Context from the audit (facts, not proposals)

- `protocols.mcp` already existed (`definitions/MCPProtocol`); the patch
  **extends** it. It now carries `specVersion`, `transport`, `endpoint`,
  `auth {type, pkce, issuerValidation}`, `capabilities {serverDiscover, tasks}`,
  and `deprecated {sampling, roots, logging}`.
- Agent DID lives at **`protocols.anp.did`** — *not* under
  `metadata.identity`. `AgentIdentity` has `additionalProperties: false`, so it
  cannot hold `did` or `trust_tier` today.
- Cedar authorization is expressed via
  **`governance.authorization.policy_references`** (array of policy-pack IDs).
  `Governance` has `additionalProperties: false`; there is no literal
  `cedar_policy_pack` field — `policy_references` is the real hook.
- In 2026-07-28 there is **no `Mcp-Session-Id`**. The caller principal must come
  from somewhere else on every self-contained request.

## Decision 1 — OAuth 2.1 issuer validation (RFC 9207) vs `protocols.anp.did`

**Question:** `auth.issuerValidation` validates the OAuth `iss` (the
authorization server). `protocols.anp.did` is the agent's decentralized
identity. Do these two identity anchors need to be reconciled, and if so, which
is authoritative?

**Options for Thomas:**
- **(a) Independent layers (no coupling).** `iss` authenticates the *token
  issuer*; the DID identifies the *agent*. Keep them orthogonal; document that
  they answer different questions. Lowest complexity.
- **(b) Bind DID ↔ issuer.** Require the OAuth issuer to be discoverable from,
  or cross-signed with, the agent DID document (e.g. the DID doc lists accepted
  `iss` values). Strongest trust story; needs a new schema link and a
  verification step.
- **(c) Advisory now, enforce later.** Ship (a); add a validator warning when a
  manifest has `auth.type: oauth2.1` but no `protocols.anp.did`, nudging toward
  (b).

**Recommendation to consider:** (c) — ship decoupled, warn, revisit binding
once DID docs are consistently published.

## Decision 2 — Sessionless caller identity for Cedar policies

**Question:** Cedar policies authorize a **principal**. With
`Mcp-Session-Id` gone in 2026-07-28, what is the principal on each stateless
request?

**Options for Thomas:**
- **(a) OAuth subject + validated issuer** = principal. Natural fit: every
  request already carries the bearer token; `sub` + `iss` (RFC 9207-validated)
  is a stable identity with no session state. Requires `auth.issuerValidation:
  true` to be meaningful.
- **(b) Agent DID as principal.** Bind Cedar principal to
  `protocols.anp.did`. Cleaner for agent-to-agent, but the DID must be provable
  *per request* (token must carry/derive it) — otherwise it's spoofable without
  the removed session.
- **(c) Composite** `{ did, sub, iss }`. Most expressive, most policy surface to
  maintain.

**Coupling note:** whichever is chosen, the sessionless model makes
`auth.issuerValidation` **load-bearing** — without validated `iss`, the
principal derivation in (a)/(c) is attacker-influenceable. This argues for
escalating the current *warning* on `issuerValidation:false` under 2026-07-28 to
an **error** if Cedar binds to OAuth identity. **Thomas decides warning vs error.**

## Decision 3 — Should `protocols.mcp.auth` reference `governance.authorization`?

**Question:** Should the MCP auth block point at the Cedar policy pack that
governs the endpoint's tools, so the transport-layer auth and the
authorization-layer policy are linked rather than drifting independently?

**Options for Thomas:**
- **(a) No reference (status quo).** Keep `protocols.mcp.auth` (authN) and
  `governance.authorization.policy_references` (authZ) separate. Simple; risk of
  drift (an endpoint could authenticate callers the policy pack never scopes).
- **(b) Add an optional `auth.policyRef`** on `protocols.mcp.auth` that must
  match an id in `governance.authorization.policy_references`. Makes the
  authN→authZ link explicit and checkable by a validator. Small schema add.
- **(c) Convention only.** Document that the MCP endpoint MUST be covered by the
  agent's `policy_references`, enforced by review, not schema.

**Recommendation to consider:** (b) — one optional field plus a cross-field
validator gives a real integrity check without forcing coupling on agents that
don't use Cedar.

## Secondary items surfaced (not blocking, Thomas's call)

- **`spec/v0.5/mcp.schema.json` is mislabeled** — its `$id`/`title` say "v0.4",
  and it's a *separate* `kind: MCPServer` manifest whose `spec.transport` enum
  (`stdio|sse|streamable-http`) has no stateless/stateful mode. Decide whether
  the stateless declaration should also land there, or stay only on the agent
  `protocols.mcp` block (this patch did the latter).
- **`issuerValidation` severity** under 2026-07-28: currently a **warning**
  (schema can't express it as an error without over-constraining; enforced in
  CLI). Decision 2 may promote it to an error.
