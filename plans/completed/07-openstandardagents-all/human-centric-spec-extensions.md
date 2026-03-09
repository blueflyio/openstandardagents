# OSSA Human-Centric Spec Extensions (v0.5/v0.6)

**Source**: wiki `openstandardagents.wiki/research/human-centric-agent-design-analysis.md`
**Priority**: HIGH — GAP 6 (user controls) and GAP 1 (consent) first

## Action Items

### 1. Create GitLab issue
- [ ] Create issue in `blueflyio/ossa/openstandardagents`: "Human-Centric Agent Design: spec extensions for v0.5/v0.6"
- [ ] Link to wiki analysis page

### 2. Spec extensions to implement (backward-compatible, optional fields)

| GAP | Section to add | Priority | Effort |
|-----|---------------|----------|--------|
| GAP 6 | `spec.user_controls` (pause/stop/undo/emergency_stop) | P0 | Medium |
| GAP 1 | `spec.consent` (data_collected, opt_out, privacy_policy_url) | P0 | Medium |
| GAP 7 | `spec.impact` (reversible, blast_radius, confirmation_required) | P1 | Medium |
| GAP 5 | `spec.transparency` (self_disclosure, provenance, user_audit) | P1 | Small |
| GAP 4 | `spec.safeguards` (prohibited_behaviors, vulnerable_populations) | P2 | Small |
| GAP 2 | `spec.feedback` (channels, categories, retention) | P2 | Small |
| GAP 3 | `spec.accessibility` (modalities, languages, wcag_level) | P3 | Small |

### 3. Implementation steps per extension
- [ ] Add Zod schema to `src/types/` (one file per section)
- [ ] Add to `ossa.schema.json` as optional properties
- [ ] Update `ossa manifest explain` to render new sections
- [ ] Add reference agent examples using new fields
- [ ] Update CLI `ossa init` wizard to offer new sections
- [ ] Add validation rules in `ossa validate`

### 4. Standards to reference
- EU AI Act transparency requirements
- WCAG 2.2
- ECMA-434 consent provisions
- NIST AI RMF (already covered in NIST plans)
