# Exhibit C — OSSA / DUADP Trust Tiers
## NIST CAISI RFI Response — BlueFly.io / OSSA

Source: OSSA docs/specs/duadp.md — Trust tier definitions for agent discovery and authorization

---

## Trust Tier Definitions

| Tier | Name | Description | Verification |
|------|------|-------------|--------------|
| **official** | Official | Curated by platform/registry owner; GAID in allow-list | Registry flag; optional signature |
| **verified-signature** | Verified Signature | Manifest signed; signature verifies against declared key/DID | x-signature block; verificationMethod in DID |
| **signed** | Signed | Manifest has a signature; key not necessarily trusted | Signature present and valid |
| **community** | Community | Listed in registry; no signature requirement | Discovery only; consumer applies own policy |
| **experimental** | Experimental | Not for production; sandbox or lab | Label only; no assurance |

---

## Use in Authorization (Cedar)

- **Principal attribute:** `principal.tier` can be used in Cedar policies (e.g. permit only if `principal.tier == "verified-signature"`).
- **Resource attribute:** Agent card or registry entry includes `trust_tier`; policy can restrict which agents may call which tools by tier.
- **Delegation:** When Agent A (tier_3_write_elevated) delegates to Agent B, B's tier is checked; if B is "community" or "experimental", policy may deny elevated actions.

---

## Mapping to Federal Assurance Levels (Informational)

| OSSA Tier | Possible Fed Mapping |
|-----------|------------------------|
| official | High assurance (curated, allow-listed) |
| verified-signature | Medium–High (cryptographic attestation) |
| signed | Medium (integrity, not trust anchor) |
| community | Low (discovery only; apply local policy) |
| experimental | Not for production systems |

---

*Exhibit C — End*
