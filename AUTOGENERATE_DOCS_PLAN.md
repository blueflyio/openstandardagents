# Auto-Generatable Documentation Plan

Documentation that can be automatically generated in CI/CD to eliminate manual updates.

## ✅ Already Auto-Generated

1. **CLI Reference** - From `src/cli/commands/*.ts`
2. **API Reference** - From `openapi/core/*.yaml`
3. **Schema Reference** - From `spec/v*/ossa-*.schema.json`

## 🚀 Can Be Auto-Generated

### 1. Examples Index & Catalog
**Source**: `examples/**/*.{yaml,yml}`  
**Output**: `website/content/docs/examples/index.md`

**Generate**:
- List all example files with descriptions
- Categorize by type (worker, orchestrator, compliance, etc.)
- Extract metadata from YAML frontmatter
- Add links to source files
- Show example snippets

**Script**: `scripts/generate-examples-docs.ts`

```typescript
// Scan examples/ directory
// Parse YAML files
// Extract agent.name, agent.role, agent.description
// Generate categorized index
```

### 2. TypeScript Type Documentation
**Source**: `src/types/*.ts`, `dist/types/*.d.ts`  
**Output**: `website/content/docs/types-reference/`

**Generate**:
- Interface definitions
- Type aliases
- Enum values
- JSDoc comments as descriptions

**Script**: `scripts/generate-types-docs.ts`

**Tools**: `typedoc` or custom parser

### 3. Migration Guides Index
**Source**: `spec/v*/migrations/*.md`  
**Output**: `website/content/docs/migration-guides/versions.md`

**Generate**:
- List all version migrations
- Breaking changes summary
- Migration steps
- Automated migration commands

**Script**: `scripts/generate-migration-index.ts`

### 4. CHANGELOG Documentation
**Source**: `CHANGELOG.md`, `spec/v*/CHANGELOG.md`  
**Output**: `website/content/docs/changelog/`

**Generate**:
- Per-version changelog pages
- Categorized changes (features, fixes, breaking)
- Links to issues/MRs
- Release dates

**Script**: `scripts/generate-changelog-docs.ts`

### 5. Error Code Reference
**Source**: `src/**/*.ts` (error definitions)  
**Output**: `website/content/docs/errors/`

**Generate**:
- All error codes
- Error messages
- Causes and solutions
- Related documentation

**Script**: `scripts/generate-error-docs.ts`

```typescript
// Find all throw new Error() statements
// Extract error codes/messages
// Generate error reference
```

### 6. Configuration Reference
**Source**: `.ossarc.json` schema, config types  
**Output**: `website/content/docs/configuration/`

**Generate**:
- All config options
- Default values
- Environment variables
- Examples

**Script**: `scripts/generate-config-docs.ts`

### 7. Test Coverage Report
**Source**: `coverage/lcov-report/`  
**Output**: `website/content/docs/coverage/`

**Generate**:
- Coverage statistics
- Coverage badges
- Per-file coverage
- Trend graphs

**Script**: `scripts/generate-coverage-docs.ts`

### 8. Architecture Diagrams
**Source**: Code structure, dependencies  
**Output**: `website/content/docs/architecture/diagrams/`

**Generate**:
- Dependency graphs
- Module relationships
- Data flow diagrams
- Sequence diagrams

**Script**: `scripts/generate-architecture-diagrams.ts`

**Tools**: `madge`, `dependency-cruiser`, `mermaid-cli`

### 9. Performance Benchmarks
**Source**: Benchmark test results  
**Output**: `website/content/docs/performance/`

**Generate**:
- Benchmark results
- Performance trends
- Comparison charts
- Optimization tips

**Script**: `scripts/generate-benchmark-docs.ts`

### 10. GitLab Agent Catalog
**Source**: `.gitlab/agents/*/manifest.ossa.yaml`  
**Output**: `website/content/docs/agents/`

**Generate**:
- List all agents
- Agent capabilities
- Usage examples
- Deployment instructions

**Script**: `scripts/generate-agents-catalog.ts`

### 11. OpenAPI Extensions Reference
**Source**: `src/types/openapi-extensions.ts`  
**Output**: `website/content/docs/openapi-extensions/reference.md`

**Generate**:
- All x-ossa-* extensions
- Extension schemas
- Usage examples
- Validation rules

**Script**: `scripts/generate-openapi-extensions-docs.ts`

### 12. Compliance Matrix
**Source**: Code annotations, test results  
**Output**: `website/content/docs/compliance/`

**Generate**:
- SOC2, HIPAA, PCI-DSS compliance
- Security controls
- Audit trail
- Compliance status

**Script**: `scripts/generate-compliance-docs.ts`

### 13. Dependency Documentation
**Source**: `package.json`, `package-lock.json`  
**Output**: `website/content/docs/dependencies/`

**Generate**:
- All dependencies with versions
- License information
- Security vulnerabilities
- Update recommendations

**Script**: `scripts/generate-dependencies-docs.ts`

**Tools**: `npm audit`, `license-checker`

### 14. Glossary
**Source**: Code comments, JSDoc tags  
**Output**: `website/content/docs/glossary.md`

**Generate**:
- Technical terms
- Acronyms
- Definitions
- Cross-references

**Script**: `scripts/generate-glossary.ts`

### 15. Troubleshooting Guide
**Source**: Error handlers, test failures  
**Output**: `website/content/docs/troubleshooting/`

**Generate**:
- Common errors
- Solutions
- Debug commands
- Support links

**Script**: `scripts/generate-troubleshooting-docs.ts`

---

## Priority Implementation Order

### Phase 1: High Value (Week 1)
1. ✅ CLI Reference (DONE)
2. ✅ API Reference (DONE)
3. ✅ Schema Reference (DONE)
4. **Examples Index** - Most requested
5. **GitLab Agent Catalog** - Showcase feature

### Phase 2: Developer Experience (Week 2)
6. **TypeScript Type Documentation** - Developer reference
7. **Error Code Reference** - Debugging
8. **Configuration Reference** - Setup
9. **Migration Guides Index** - Version upgrades

### Phase 3: Quality & Compliance (Week 3)
10. **Test Coverage Report** - Quality metrics
11. **Dependency Documentation** - Security
12. **Compliance Matrix** - Enterprise requirements
13. **CHANGELOG Documentation** - Release notes

### Phase 4: Advanced (Week 4)
14. **Architecture Diagrams** - System understanding
15. **Performance Benchmarks** - Optimization
16. **OpenAPI Extensions Reference** - Advanced usage
17. **Glossary** - Onboarding
18. **Troubleshooting Guide** - Support

---

## Implementation Scripts

### Quick Wins (Implement First)

#### 1. Examples Index Generator
```bash
npm run docs:examples:generate
```

**Scans**: `examples/**/*.{yaml,yml}`  
**Generates**: Categorized index with descriptions

#### 2. Agent Catalog Generator
```bash
npm run docs:agents:generate
```

**Scans**: `.gitlab/agents/*/manifest.ossa.yaml`  
**Generates**: Agent directory with capabilities

#### 3. Types Documentation Generator
```bash
npm run docs:types:generate
```

**Uses**: `typedoc` to generate from TypeScript

---

## CI/CD Integration

### `.gitlab-ci.yml` Addition

```yaml
docs:generate:all:
  stage: docs
  image: node:20
  script:
    # Core docs (already implemented)
    - npm run docs:api:generate
    - npm run docs:cli:generate
    - npm run docs:schema:generate
    
    # New auto-generated docs
    - npm run docs:examples:generate
    - npm run docs:agents:generate
    - npm run docs:types:generate
    - npm run docs:errors:generate
    - npm run docs:config:generate
    - npm run docs:changelog:generate
    - npm run docs:coverage:generate
    - npm run docs:dependencies:generate
    
    # Convert to lowercase
    - npm run docs:lowercase
  artifacts:
    paths:
      - website/content/docs/
    expire_in: 1 week
  only:
    changes:
      - src/**/*
      - examples/**/*
      - openapi/**/*
      - spec/**/*
      - .gitlab/agents/**/*
      - package.json
```

---

## Benefits

### Eliminate Manual Work
- No manual CLI documentation
- No manual API documentation
- No manual schema documentation
- No manual examples index
- No manual changelog updates

### Always Up-to-Date
- Docs regenerate on every commit
- No stale documentation
- No version mismatches
- No missing features

### Consistency
- Same format across all docs
- Same templates
- Same structure
- Same quality

### Quality Metrics
- Coverage reports
- Dependency audits
- Performance benchmarks
- Compliance status

---

## Estimated Time Savings

**Current Manual Effort**:
- CLI docs: 2 hours per release
- API docs: 3 hours per release
- Schema docs: 2 hours per release
- Examples index: 1 hour per release
- Changelog: 1 hour per release
- **Total**: 9 hours per release

**With Automation**:
- All docs: 0 hours (auto-generated)
- Review: 30 minutes
- **Total**: 30 minutes per release

**Savings**: 8.5 hours per release × 12 releases/year = **102 hours/year**

---

## Next Steps

1. **Review this plan** with team
2. **Prioritize** which docs to auto-generate first
3. **Create issues** for each generator script
4. **Implement** in priority order
5. **Test** in CI/CD pipeline
6. **Deploy** to production

---

## Questions to Answer

1. Which documentation is most frequently out of date?
2. Which documentation takes the most time to update manually?
3. Which documentation would provide the most value if auto-generated?
4. What tools/libraries should we use for generation?
5. How do we handle custom content mixed with auto-generated content?
