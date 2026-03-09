# Open Agent Registry - Parallel Execution Plan (UADP + OSSA Aligned)

## Track 1: Mesh Discovery Integration (`spawn-mesh-integration.yaml`)
- [x] Refactor Node API (`/marketplace/api`) to remove SQLite.
- [x] Rebuild Node API to act as a caching proxy `GET`ing from `agent-mesh` (`/api/v1/discovery`).
- [ ] Configure `agent-buildkit` to continuously write `.agents-workspace/discovery/output/discovered-projects.yml`.

## Track 2: Core Domain & Governance Metadata (`spawn-registry-metadata.yaml`)
- [x] Update `.agents/` YAML schemas to enforce Drupal-friendly identifiers (UUID, machine_name).
- [x] Add signature, checksum (sha256), and SBOM pointer fields to OSSA spec.
- [x] OSSA: Add revocation/withdrawal semantics (`revoked`, `deprecated`).
- [x] OSSA: Implement schema validators (JSON Schema/Zod) and CLI hooks (validate, lint).
- [x] Publish Governance docs (how to publish via buildkit, disclosure process).

## Track 3: Drupal 11 Consumer Module (`spawn-drupal-consumer.yaml`)
- [ ] Scaffold `agent_registry_consumer` Drupal 11 module.
- [ ] Build global Config form for registry settings and policy gates (allowlists).
- [ ] Build native Drupal Catalog UI consuming the Node Proxy/Mesh.
- [ ] Implement "Install Action" (download artifact, checksum validation, log provenance).

## Track 4: Frontend UX (`spawn-frontend-ux.yaml`)
- [ ] Rewire Next.js frontend to consume the new Mesh-backed Node proxy.
- [ ] Add compatibility facets (Drupal version, PHP) from discovery metadata.
- [ ] Implement UI Trust Badges (Conformance badges, signed artifact).
- [ ] Refine SEO and Accessibility across the catalog.
