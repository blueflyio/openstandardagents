# OSSA × NIST CAISI — Strategic Next Steps
**RFI Comment deadline: March 9, 2026 (≤7 days)**
**Docket: NIST-2025-0035 | regulations.gov**

> **Principle:** Use proven open-source tools. No reinventing wheels.

---

## ⚡ Priority 0 — Submit the RFI (Must ship by March 9)

- [ ] **Expand** `nist_rfi_response_draft.md` to answer NIST priority questions:
  `1a, 1d, 2a, 2e, 3a, 3b, 4a, 4b, 4d`
- [ ] **Attach exhibits**: schema excerpt, UADP table, trust tier table, threat matrix
- [ ] **Submit** at https://www.regulations.gov/commenton/NIST-2025-0035-0001

---

## Phase 4 — x-signature: Replace Custom Crypto with `jose` + `@noble/ed25519`
> Don't build a crypto library. Use the ones that already exist.

| Task | Tool |
|------|------|
| Ed25519 sign/verify in Node.js | [`@noble/ed25519`](https://github.com/paulmillr/noble-ed25519) |
| JWT / JWK / VC verification | [`jose`](https://github.com/panva/jose) (IETF standard) |
| DID resolution (`did:web`, `did:key`) | [`did-resolver`](https://github.com/decentralized-identity/did-resolver) + [`web-did-resolver`](https://github.com/decentralized-identity/web-did-resolver) |
| Manifest canonicalization before signing | [`json-canonicalize`](https://www.npmjs.com/package/json-canonicalize) (RFC 8785) |

- [ ] Add `@noble/ed25519` + `jose` + `did-resolver` to `openstandardagents` package deps
- [ ] Add `json-canonicalize` — canonical form of manifest is the thing that gets signed
- [ ] Wire `POST /trust/verify` in UADP to use `@noble/ed25519` for Ed25519 and `jose` for JWT/VC types
- [ ] Replace the placeholder `TrustBadge` verification with real `@noble/ed25519` verify call in the backend route (NOT in the browser — keys stay server-side)

---

## Phase 5 — SBOM: Use `syft` / `cdxgen` (not custom)
> `metadata.sbom_pointer` already exists in v0.5 schema. Point it at a real SBOM.

| Task | Tool |
|------|------|
| Generate CycloneDX SBOM from OSSA package | [`syft`](https://github.com/anchore/syft) or [`cdxgen`](https://github.com/CycloneDX/cdxgen) |
| SBOM schema validation | [`@cyclonedx/cyclonedx-library`](https://github.com/CycloneDX/cyclonedx-javascript-library) |
| Include in CI | `cdxgen -t nodejs -o bom.json` in GitLab pipeline |

- [ ] Add `cdxgen` to GitLab CI pipeline for `openstandardagents` package
- [ ] Publish SBOM as a CI artifact, store URL in `metadata.sbom_pointer` of example manifests
- [ ] Add SBOM link to UADP registry `AgentRecord` schema (it's already in v0.5, just document it)

---

## Phase 6 — Schema Linting: Use `Spectral` (not custom validators)
> The UADP OpenAPI and AsyncAPI specs need linting. `spectral` does this in one CLI call.

| Task | Tool |
|------|------|
| OpenAPI linting | [`@stoplight/spectral-cli`](https://github.com/stoplightio/spectral) |
| AsyncAPI linting | [`asyncapi/cli`](https://github.com/asyncapi/cli) |
| JSON Schema validation | [`ajv`](https://ajv.js.org/) (already likely in use) |

- [ ] `npx @stoplight/spectral-cli lint openapi/uadp-openapi.yaml` — fix any violations
- [ ] `npx @asyncapi/cli validate openapi/uadp-asyncapi.yaml` — validate the async spec
- [ ] Add both to the GitLab CI pipeline as a `validate:specs` job

---

## Phase 7 — Compliance Mapping: Use OSCAL (not a Word doc)
> OSCAL (Open Security Controls Assessment Language) is NIST's own machine-readable compliance format.

| Task | Tool |
|------|------|
| NIST CSF 2.0 + SP 800-53 control mapping | [OSCAL](https://pages.nist.gov/OSCAL/) — JSON/YAML format |
| Generate human-readable from OSCAL | [`oscal-cli`](https://github.com/usnistgov/oscal-cli) |

- [ ] Write `docs/security/ossa-oscal-component.json` — OSCAL Component Definition mapping OSSA manifest fields → NIST SP 800-53 controls
- [ ] Key mappings:
  - `safety.blocks` → AC-3 (Access Enforcement)
  - `autonomy.mode: supervised` → AC-6 (Least Privilege)
  - `x-signature` → IA-3 (Device Identification), SC-17 (PKI)
  - `observability.tracing` → AU-2 (Event Logging)
  - `constraints.network` → SC-7 (Boundary Protection)
- [ ] This becomes **Exhibit D** in the NIST RFI submission

---

## Phase 8 — openstandardagents.org: NIST Page + DEI Badge

### 8.1 `/nist` Page
- [ ] New route `openstandardagents.org/app/nist/page.tsx`
- [ ] Content: CAISI alignment matrix (table), link to RFI response, link to UADP spec, docket link
- [ ] Add `NIST Alignment` to site nav

### 8.2 DEI Badge
- [ ] Review https://github.com/badging/badging/blob/main/Template.DEI.md
- [ ] Apply for CHAOSS DEI badge (open governance transparency signal — helps with NIST alignment)
- [ ] Add badge to README + website footer

---

## 7-Day Sprint (Before March 9 Deadline)

| Day | Goal |
|-----|------|
| **Today** | Expand NIST RFI response to 2,500+ words answering all 9 priority questions |
| Day 2 | Phase 4: Add `@noble/ed25519` + `jose` + `json-canonicalize`; wire `/trust/verify` |
| Day 3 | Phase 5: Add `cdxgen` to CI; generate SBOM for openstandardagents package |
| Day 4 | Phase 6: Run `spectral` + `asyncapi/cli` on specs; fix violations |
| Day 5 | Phase 7: Write OSCAL component definition for OSSA security controls |
| Day 6 | Assemble submission: RFI + 4 exhibits. Review. |
| **Day 7 (March 8)** | Submit to regulations.gov before 11:59 PM ET |
