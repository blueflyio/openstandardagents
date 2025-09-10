# OSSA Branching Strategy (__REBUILD Compliant)

## __REBUILD_TOOLS Governance

This branching strategy is fully aligned with Bluefly.io __REBUILD_TOOLS standards, enforcing:
- **API-First Development**: Specifications before code
- **Test-Driven Development**: Tests before implementation
- **Strict Branch Discipline**: No direct commits to main/development
- **Documentation Requirements**: Every change updates docs

## Version Numbering Standard

**Format**: `v{major}.{minor}.{patch}-{stage}`

### Version Components
- **Major**: Breaking changes, architectural shifts
- **Minor**: New features, non-breaking additions
- **Patch**: Bug fixes, small improvements
- **Stage**: alpha, beta, rc, stable

### Current Version
- **Active**: v0.1.9-alpha
- **Target**: v0.2.0 (beta)
- **Production**: v1.0.0 (Q2 2025)

## Branch Naming Convention

### __REBUILD Standard Format
```
__REBUILD/{task}-v{version}
```

### Branch Types

#### Specification Branches
```
__REBUILD/openapi-spec-v0.1.9-alpha
__REBUILD/ossa-manifest-v0.1.9-alpha
__REBUILD/schema-definitions-v0.1.9-alpha
```

#### Test Branches
```
__REBUILD/test-suite-v0.1.9-alpha
__REBUILD/contract-tests-v0.1.9-alpha
__REBUILD/integration-tests-v0.1.9-alpha
```

#### Implementation Branches
```
__REBUILD/core-implementation-v0.1.9-alpha
__REBUILD/mcp-implementation-v0.1.9-alpha
__REBUILD/cli-implementation-v0.1.9-alpha
```

## Development Phases

### Phase 1: API-First Foundation (SPECS ONLY)

#### Week 1: OpenAPI Specifications
**Branch**: `__REBUILD/openapi-spec-v0.1.9-alpha`  
**Requirements**:
- NO CODE - Only OpenAPI 3.1 specifications
- Complete endpoint definitions
- Request/response schemas
- Validation with openapi-cli
**Gate**: Specs must pass validation before proceeding

#### Week 2: OSSA Manifests
**Branch**: `__REBUILD/ossa-manifest-v0.1.9-alpha`  
**Requirements**:
- Agent manifest schemas
- Capability declarations
- Registry specifications
- YAML validation
**Gate**: All manifests must validate against schema

### Phase 2: Test Infrastructure (TDD)

#### Week 3: Test Framework
**Branch**: `__REBUILD/test-framework-v0.1.9-alpha`  
**Requirements**:
- Jest configuration for unit tests
- Playwright setup for E2E
- Contract testing with Dredd
- Write FAILING tests for all specs
**Gate**: All tests must fail (no implementation yet)

#### Week 4: Mock Infrastructure
**Branch**: `__REBUILD/mock-infrastructure-v0.1.9-alpha`  
**Requirements**:
- Mock servers from OpenAPI specs
- Fixture generators
- Test data factories
- Stub implementations
**Gate**: Mocks must match specifications exactly

### Phase 3: Implementation (Code)

#### Week 5: Package Setup
**Branch**: `__REBUILD/package-setup-v0.1.9-alpha`  
**Requirements**:
- Initialize Node.js package with TypeScript
- Set up 5 core modules (core, mcp, gitlab, drupal, cli)
- Configure module exports and dependencies
- Set up build and test pipelines
**Gate**: Package builds successfully

#### Week 6: Core Implementation
**Branch**: `__REBUILD/core-implementation-v0.1.9-alpha`  
**Requirements**:
- Implement orchestration engine with DAG executor
- Create agent registry with capability matching
- Build task scheduler with priority queues
- Add event-sourced state management
**Gate**: Core module tests pass, API contracts satisfied

#### Week 7: MCP Implementation
**Branch**: `__REBUILD/mcp-implementation-v0.1.9-alpha`  
**Requirements**:
- MCP server/client implementation
- Tool registration and discovery
- Transport layers (stdio, WebSocket)
- Protocol compliance testing
**Gate**: MCP module conformance tests pass

#### Week 8: GitLab Integration
**Branch**: `__REBUILD/gitlab-implementation-v0.1.9-alpha`  
**Requirements**:
- CI/CD components for agent validation
- ML experiment tracking integration
- Pipeline orchestration
- GitLab Runner integration
**Gate**: GitLab module components deploy successfully

#### Week 9: CLI Implementation
**Branch**: `__REBUILD/cli-implementation-v0.1.9-alpha`  
**Requirements**:
- Project initialization commands
- Agent creation and validation
- Workspace management
- Development utilities
**Gate**: CLI module works end-to-end

#### v{VERSION}.6-alpha.1: Documentation Generation
**Branch**: `__REBUILD/documentation-v{VERSION}.6-alpha.1`  
**Focus**: Auto-generated docs from OpenAPI  
**Deliverables**: API documentation, architecture diagrams

#### v{VERSION}.7-alpha.1: Integration Test Harness
**Branch**: `__REBUILD/integration-harness-v{VERSION}.7-alpha.1`  
**Focus**: Test scenarios without implementation  
**Deliverables**: Test harness, scenario definitions

#### v{VERSION}.8-alpha.1: Performance Benchmarking
**Branch**: `__REBUILD/benchmarking-v{VERSION}.8-alpha.1`  
**Focus**: Performance test framework setup  
**Deliverables**: Benchmark scenarios, metric definitions

#### v{VERSION}.9-alpha.1: Alpha Validation
**Branch**: `__REBUILD/alpha-validation-v{VERSION}.9-alpha.1`  
**Focus**: Validate all alpha deliverables  
**Deliverables**: Validation reports, readiness checklist

### Alpha Success Criteria
- OpenAPI specification validates without errors
- All contract tests defined (failing is expected)
- Mock server responds with spec-compliant data
- CI/CD pipeline executes validation checks
- Documentation generates from specifications
- Project structure ready for implementation

## Beta Phase: Implementation

### Beta Philosophy
Implement functionality against validated specifications and passing tests.

### Beta Version Template
- v{VERSION+1}.0-beta.1: Core implementation
- v{VERSION+1}.1-beta.1: External integrations
- v{VERSION+1}.2-beta.1: Security implementation
- v{VERSION+1}.3-beta.1: Performance optimization
- v{VERSION+1}.4-beta.1: Error handling
- v{VERSION+1}.5-beta.1: Monitoring/observability
- v{VERSION+1}.6-beta.1: Documentation completion
- v{VERSION+1}.7-beta.1: Integration testing
- v{VERSION+1}.8-beta.1: Bug fixes
- v{VERSION+1}.9-beta.1: Beta validation

## Branching Strategy

### Branch Structure
```
main (production)
├── development (integration)
│   └── __REBUILD/{task}-v{version}  # Feature branches
```

### Branch Naming Convention
```
__REBUILD/{task}-v{version}
```

## Git Workflow

### Creating Feature Branch
```bash
git checkout development
git checkout -b __REBUILD/{task}-v{version}
```

# Example (OSSA 0.1.9)
# Create an alpha branch for the OpenAPI spec
git checkout development
git checkout -b __REBUILD/openapi-spec-v0.1.9.0-alpha.1

### Commit Convention
```
{type}({scope}): {description} v{version}

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- test: Testing
- refactor: Code refactoring
- chore: Maintenance
- perf: Performance improvement
- style: Code style changes
```

### Merge Process
```bash
# Complete feature
git add .
git commit -m "feat(api): complete OpenAPI specification v{VERSION}.0-alpha.1"

# Merge to development
git checkout development
git merge --no-ff __REBUILD/openapi-spec-v{VERSION}.0-alpha.1

# Tag version
git tag -a v{VERSION}.0-alpha.1 -m "OpenAPI specification complete"
git push origin v{VERSION}.0-alpha.1
```

# Example (OSSA 0.1.9)
# Complete feature
git add .
git commit -m "feat(api): complete OpenAPI specification v0.1.9.0-alpha.1"

# Merge to development
git checkout development
git merge --no-ff __REBUILD/openapi-spec-v0.1.9.0-alpha.1

# Tag version
git tag -a v0.1.9.0-alpha.1 -m "OpenAPI specification complete"
# (Optional) push the tag later when the repository is ready to publish releases

## Release Process

### Alpha Release Checklist
- [ ] Specification validates
- [ ] Mock server running
- [ ] Contract tests defined
- [ ] Documentation generated
- [ ] CI/CD pipeline configured
- [ ] No functional code present

### Beta Release Checklist
- [ ] All alpha criteria met
- [ ] Tests passing
- [ ] Implementation complete
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Documentation complete

## Project Application Examples

### New Project Starting Fresh
```
Alpha: v0.1.0-alpha.1 through v0.1.9-alpha.1
Beta:  v0.2.0-beta.1 through v0.2.9-beta.1
RC:    v0.3.0-rc.1 through v0.9.x-rc.n
Prod:  v1.0.0
```

### Existing Project Rebuild (like OSSA)
```
Alpha: v0.1.9-alpha.1 (continuing from v0.1.7 stable; **skipping v0.1.8**)
Beta:  v0.2.0-beta.1 through v0.2.9-beta.1
RC:    v0.3.0-rc.1 through v0.9.x-rc.n
Prod:  v1.0.0
```

### Quick MVP Project
```
Alpha: v0.1.0-alpha.1 through v0.1.3-alpha.1 (compressed)
Beta:  v0.2.0-beta.1 through v0.2.3-beta.1 (accelerated)
Prod:  v1.0.0
```

This generic template allows any project to substitute their actual version numbers while maintaining the consistent API-first, test-driven approach.