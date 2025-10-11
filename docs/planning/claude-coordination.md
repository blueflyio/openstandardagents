# Claude Window Coordination Document

## Window Roles & Responsibilities

### Window 1 (THIS WINDOW) - Architecture & Specifications Lead
**Focus**: API-first design, specifications, documentation, schemas
**Status**: ACTIVE - Working on specifications

#### Current Tasks:
-  Created FILE_INDEX.md (complete file inventory)
-  Created ACDL specification (src/api/acdl-specification.yml)
-  Updated OpenAPI to v0.1.9-alpha.1
-  Created agent orchestration guide
-  Building agent manifest schemas
-  Defining orchestration endpoints
- ⏳ Creating workflow specifications

#### Files I Own:
```
/src/api/acdl-specification.yml
/src/api/specification.openapi.yml
/openapi.yml
/docs/guides/agent-orchestration-guide.md
/docs/specifications/*
/docs/architecture/*
FILE_INDEX.md
CLAUDE_COORDINATION.md
```

### Window 2 - Test Infrastructure Lead
**Focus**: TDD test creation, CI/CD, mock servers
**Status**: WAITING FOR PROMPT

#### Assigned Tasks:
- Write failing tests for ACDL
- Create mock servers from OpenAPI
- Set up .gitlab-ci.yml
- Build test fixtures
- Configure test runners
- NO IMPLEMENTATION CODE

#### Files They Own:
```
/test/**/*.spec.ts
/test/**/*.test.ts
/.gitlab-ci.yml
/test/fixtures/*
/test/mocks/*
/jest.config.js
/playwright.config.ts
```

## Coordination Protocol

### 1. Before Making Changes
- Check this file for ownership
- Read FILE_INDEX.md for latest structure
- Verify no conflicts with other window

### 2. Communication Points
- Update this file when switching tasks
- Mark sections with  (in progress) or  (complete)
- Use git commits every 30 minutes

### 3. Handoff Points
When Window 1 completes a specification:
1. Update FILE_INDEX.md
2. Mark spec as  in this file
3. Window 2 creates tests for that spec

When Window 2 needs a specification:
1. Check if marked  here
2. If not ready, work on different test area
3. Never create specs (that's Window 1's job)

## Current Sprint (Week 1: API-First Foundation)

### Day 1-2: Specifications (Window 1)
-  ACDL specification
-  OpenAPI v0.1.9-alpha.1
-  Agent manifest schemas
- ⏳ Orchestration endpoints
- ⏳ Workflow schemas

### Day 3-4: Testing (Window 2)
- ⏳ ACDL validation tests
- ⏳ Agent registration tests
- ⏳ Orchestration tests
- ⏳ Mock server setup
- ⏳ CI/CD pipeline

### Day 5: Integration
- ⏳ Validate all specs pass schema validation
- ⏳ Ensure 0% test pass rate
- ⏳ Document gaps for Week 2

## File Creation Rules

### Window 1 Creates:
- API specifications (*.openapi.yml)
- Schema definitions (*.schema.json)
- Documentation (docs/**)
- Architecture decisions (docs/adr/*)

### Window 2 Creates:
- Test files (*.spec.ts, *.test.ts)
- Test fixtures (test/fixtures/*)
- Mock configurations (test/mocks/*)
- CI/CD configs (.gitlab-ci.yml)

### Both Can Modify:
- FILE_INDEX.md (with coordination)
- This file (CLAUDE_COORDINATION.md)
- ROADMAP.md (for status updates)

## Git Workflow

### Window 1 Branches:
```bash
git checkout -b __REBUILD/specifications-v0.1.9-alpha
git add src/api/* docs/*
git commit -m "feat(spec): [description] v0.1.9-alpha"
```

### Window 2 Branches:
```bash
git checkout -b __REBUILD/test-infrastructure-v0.1.9-alpha
git add test/* .gitlab-ci.yml
git commit -m "test(tdd): [description] v0.1.9-alpha"
```

## Status Indicators

### Specification Status
-  ACDL Core: COMPLETE
-  OpenAPI Main: COMPLETE
-  Agent Manifests: IN PROGRESS
- ⏳ Orchestration API: PENDING
- ⏳ Workflow Schemas: PENDING
- ⏳ Discovery Protocol: PENDING
- ⏳ Budget Management: PENDING

### Test Coverage Status
- ⏳ ACDL Tests: PENDING (Window 2)
- ⏳ Registration Tests: PENDING (Window 2)
- ⏳ Orchestration Tests: PENDING (Window 2)
- ⏳ Discovery Tests: PENDING (Window 2)
- ⏳ CI/CD Setup: PENDING (Window 2)

## Synchronization Points

### Every 30 Minutes:
1. Git commit current work
2. Update status in this file
3. Check for conflicts

### Every 2 Hours:
1. Review FILE_INDEX.md
2. Sync on completed items
3. Adjust task priorities

### End of Day:
1. Update ROADMAP.md progress
2. Document blockers
3. Plan next day tasks

## Critical Rules (BOTH WINDOWS)

1. **NO IMPLEMENTATION CODE** in Week 1-2
2. **API-FIRST**: Specs before tests
3. **TDD**: Tests before implementation
4. **30-MIN COMMITS**: Prevent work loss
5. **0% PASS RATE**: All tests must fail initially

## Next Actions

### Window 1 (THIS WINDOW):
1. Continue with agent manifest schemas
2. Define orchestration endpoints
3. Create workflow specifications
4. Document budget management

### Window 2 (WHEN STARTED):
1. Read this coordination document
2. Review completed specifications
3. Create test plan from specs
4. Write failing tests
5. Set up mock servers

---

*Last Updated*: [Current timestamp]
*Window 1 Status*: ACTIVE - Building specifications
*Window 2 Status*: WAITING - Needs prompt from user
*Phase*: Week 1 - API-First Foundation