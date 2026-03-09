# 05 - NIST Compliance & OSSA Alignment Master Plan

## Context
This plan details the alignment of the BlueFly.io / Open Standard for Software Agents (OSSA) with the NIST CAISI (Coalition for AI Secure Interactions) requirements. The primary goal is to ensure federal-grade security, identity, and authorization for AI agents.

## Core Pillars of Compliance

### 1. Agent Identity (Persistent Global Identifier)
- **Implementation**: OSSA mandates a Global Agent Identifier (GAID) using W3C DID syntax (e.g., `did:ossa:<uuid>` or `did:web:<host>:<path>`).
- **Persistence**: GAIDs are tied to a W3C DID Document in a registry, surviving container restarts and redeployments.
- **Revocation**: Supported via explicit API calls (`PUT /registry/revoke/{agentId}`), AsyncAPI real-time events (`uadp.agents.revoked`), and DID document `revoked: true` flags.

### 2. Authorization Model
- **Pre-Authorization**: OSSA uses AWS Cedar (formally verified policy language). Every tool invocation is pre-authorized by evaluating the principal (agent DID), action, and resource against Cedar policies before execution.
- **Tier System**: Agents operate within 4 defined tiers (e.g., `tier_1_read`, `tier_3_write_elevated`).
- **Delegation**: Agent-to-Agent (A2A) delegation uses signed OSSA Verifiable Credentials (VCs). Cedar validates both the delegating agent's policy and the delegated scope.
- **Interoperability**: DIDs and machine-readable capabilities allow cross-system policy mapping.

### 3. Tool Disclosure & Attestation
- **Declarative Tools**: Agents must natively declare all tools (name, inputs, rate limits, required capabilities) in their OSSA manifest.
- **Protocols**: Tool invocation runs via authenticated Model Context Protocol (MCP) servers with API keys or mTLS.
- **Security**: Strict rate limiting and JSON Schema validation are enforced at the gateway/orchestration layer.

## Actionable Next Steps
- Implement and test Cedar policies (`sod-forbid.cedar` and `schema.cedarschema`) within the compliance engine.
- Establish the UADP `CredentialRegistry` endpoint for real-time revocation.
- Ensure all marketplace agents properly sign their manifests to achieve the required `verified-signature` trust tier.


## Implementation Status (Updated 2026-03-08)
- **Agent Identity (Persistent GAID)**: [x] `did:ossa` and `did:web` spec complete. `MeshUUIDV5` deterministic UUID generation. DUADP agent card endpoint.
- **Authorization (Cedar)**: [x] `ossa policy validate` CLI using `@cedar-policy/cedar-wasm`. DUADP `cedar-evaluator.ts` runtime enforcement wired into publish endpoint.
- **Supply Chain (Signatures)**: [x] `ossa sign` CLI with `@noble/ed25519`. DUADP `signature-verifier.ts` enforces Ed25519 on tier_3+ resources.
- **Federated Discovery**: [x] `_duadp.<domain>` and `_agent.<uuid>.<domain>` DNS TXT verification in DUADP SDK `client.ts`.
- **CLI Integration**: [x] `ossa publish --remote` and `ossa search --remote --federated` use `DuadpClient` for network interaction.
- **Tool Disclosure & Attestation**: [x] MCP capability integrated. Cryptographic attestation (`verified-signature`) enforcement live.
- **Cedar Invoke Path Tests**: [x] Added `reference-node/src/cedar-evaluator.test.ts` with allow/deny publish-path coverage.
- **Publish Signature Matrix Tests**: [x] Added `reference-node/src/signature-verifier.test.ts` for tier-based signature requirements and verifier delegation.
- **High-Trust DNS Enforcement**: [x] Enforced in `sdk/typescript/src/client.ts` (`resolveGaid`) and validated by `sdk/typescript/src/__tests__/trust-tier-gaid-matrix.test.ts`.
- **Remaining**: None for this Phase 05 NIST checkpoint.
