# Exhibit D — OSSA-Relevant Threat Matrix and Mitigations
## NIST CAISI RFI Response — BlueFly.io / OSSA

---

## Threat Matrix

| Threat | Description | OSSA / Platform Mitigation | NIST / Fed Relevance |
|--------|-------------|----------------------------|----------------------|
| **Identity spoofing** | Attacker impersonates agent or user | GAID + W3C DID resolution; x-signature on manifest (verified-signature tier); registry serves canonical card | SP 800-63 (identity); CAISI identity pillar |
| **Privilege escalation** | Agent or user gains unauthorized capability | Cedar pre-authorization; tier/capability bounds; delegation credentials with scope and expiry | SP 800-53 AC; CAISI authorization |
| **Unbounded resource use** | Token/API abuse; cost or DoS | token-efficiency budgets (max_tokens_per_call, max_calls_per_session); rate limits per tool; attribution to principal | Resource governance; cost control |
| **Tool abuse** | Unauthorized or excessive tool invocation | Declarative tool list; Cedar gates every call; MCP/auth on tool server; rate_limit in manifest | CAISI tools pillar; least privilege |
| **Revocation lag** | Revoked agent still used from cache | DUADP duadp.agents.revoked event; registry excludes revoked by default; optional short TTL on discovery cache | Revocation (1d); incident response |
| **Supply chain / manifest tampering** | Malicious or altered manifest | Signed manifest (verified-signature); registry integrity; optional SBOM in extension | Software supply chain; NIST SSDF |
| **Data exfiltration via tools** | Tool returns sensitive data to wrong principal | Cedar policy on resource + principal; tool output schema; audit log of principal_did per call | Data protection; audit (4b) |
| **Insufficient audit trail** | No traceability of who did what | Structured logs: agent_gaid, principal_did, tool_name, cedar_decision, token_count, timestamp | CAISI observability; SP 800-53 AU |

---

## Control Summary

- **Identity:** DID resolution, GAID in all logs, signed manifest (trust tier).
- **Authorization:** Cedar pre-auth, tier/capability, delegation scope.
- **Resource:** Token-efficiency extension, rate limits, attribution.
- **Revocation:** Registry + DUADP events, no implicit trust after revoke.
- **Audit:** Every tool call logged with principal and policy decision.

---

*Exhibit D — End*
