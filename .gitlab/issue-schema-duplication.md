## CRITICAL: 100% Schema Duplication - /schemas/ vs /spec/

### Priority: Critical  
### Labels: `critical`, `duplication`, `standards`
### Assignee: Standards Team Lead

---

### Summary
**COMPLETE DUPLICATION:** All example agent schemas and OpenAPI specs exist in BOTH `/schemas/` and `/spec/` directories. This is 100% redundant.

### Evidence

#### Agent Example Files (11 files × 2 = 22 files)
**Duplicated in `/schemas/examples/` AND `/spec/examples/`:**
1. `audit-agent.yml`
2. `chat-agent.yml`
3. `compliance-agent.yml`
4. `data-processing-agent.yml`
5. `development-agent.yml`
6. `edge-agent.yml`
7. `integration-agent.yml`
8. `monitoring-agent.yml`
9. `serverless-agent.yml`
10. `workflow-agent.yml`
11. `agent-autonomous-extensions.json`

**Verification:**
```bash
# Files are IDENTICAL
diff schemas/examples/audit-agent.yml spec/examples/audit-agent.yml
# No output = identical
```

---

#### OpenAPI Spec Files (4 files × 2 = 8 files)
**Duplicated:**
- `/openapi/ossa-registry-api.yaml` = `/spec/openapi/ossa-registry-api.yaml`
- `/openapi/ossa-registry.openapi.yml` = `/spec/openapi/ossa-registry.openapi.yml`
- `/openapi/helm-generator.yaml` = `/spec/openapi/helm-generator.yaml`
- `/spec/openapi/ossa-1.0.schema.json` exists

---

### Recommendation

#### Keep `/schemas/` Structure
**Rationale:**
- More standard naming convention
- Already has versioning (`/schemas/v0.1.9/`)
- New reasoning-compliance.json already in schemas/v0.1.9/

**Action Plan:**
```bash
# DELETE entire /spec/ directory
rm -rf spec/

# Update any code references from /spec/ to /schemas/
grep -r "spec/examples" . --exclude-dir=node_modules
grep -r "spec/openapi" . --exclude-dir=node_modules
```

**Files to DELETE:**
- `/spec/examples/` - 11 files
- `/spec/openapi/` - 4 files  
- `/spec/ossa-1.0.schema.json`
- `/spec/ossa-1.0.yaml`

**Total Files Removed:** 17 files (50% reduction)

---

### Acceptance Criteria
- [ ] `/spec/` directory deleted
- [ ] All code references updated to `/schemas/`
- [ ] Documentation updated
- [ ] CLI tools tested (ossa validate, ossa generate)
- [ ] README updated to reflect single structure
- [ ] Examples page on website updated

### Breaking Changes
**Potential:** Code referencing `/spec/` paths

**Mitigation:**
```bash
# Create symlink for backwards compatibility (temporary)
ln -s schemas spec

# Or update all references
find . -type f -name "*.ts" -o -name "*.js" | \
  xargs sed -i '' 's|spec/examples|schemas/examples|g'
```

---

### Estimated Effort
**3 hours**
- 1h: Verification + dependency analysis
- 1h: Delete + update references
- 1h: Test + documentation

### Risk
**Low Risk** - This is pure cleanup, no logic changes

---

### Follow-up Issues
After this cleanup:
- Consolidate OpenAPI specs in `/schemas/openapi/`
- Review `/schemas/v0.1.9/` versioning strategy
- Document schema governance process

