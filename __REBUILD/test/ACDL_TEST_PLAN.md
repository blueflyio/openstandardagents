# ACDL Test Plan - v0.1.9-alpha.1
## Test Infrastructure for Agent Capability Description Language

### 📋 Test Strategy
**Phase**: Week 1-2 (API-First Foundation)
**Approach**: Test-Driven Development (TDD)
**Expected Status**: ALL TESTS MUST FAIL (0% pass rate)
**Reason**: No implementation exists yet

### 🎯 Test Coverage Goals
- [ ] 100% API endpoint coverage
- [ ] All agent types tested (8 types)
- [ ] All validation scenarios covered
- [ ] Mock server responses defined
- [ ] Contract tests established
- [ ] Performance benchmarks defined

## 1️⃣ Agent Registration Tests (`/acdl/register`)

### Test Categories

#### 1.1 Valid Registration Scenarios
```typescript
// test/api/acdl-registration.spec.ts
describe('ACDL Agent Registration', () => {
  // Test each agent type
  const agentTypes = [
    'orchestrator', 'worker', 'critic', 'judge',
    'trainer', 'governor', 'monitor', 'integrator'
  ];
});
```

**Test Cases**:
- ❌ Register orchestrator agent with full capabilities
- ❌ Register worker.api subtype with OpenAPI specialization
- ❌ Register worker.docs subtype with markdown generation
- ❌ Register critic.security with vulnerability scanning
- ❌ Register judge with pairwise comparison
- ❌ Register trainer with feedback synthesis
- ❌ Register governor.cost with budget enforcement
- ❌ Register monitor with telemetry collection
- ❌ Register integrator with protocol bridging

#### 1.2 Invalid Registration Scenarios
- ❌ Missing required fields (agentId, agentType, version)
- ❌ Invalid agentId format (not matching pattern)
- ❌ Invalid version format (not semver)
- ❌ Unknown agent type
- ❌ Invalid protocol specification
- ❌ Performance metrics out of bounds
- ❌ Duplicate agent registration
- ❌ Expired registration attempt

#### 1.3 Edge Cases
- ❌ Maximum payload size (10MB)
- ❌ Minimum viable manifest
- ❌ Unicode in descriptions
- ❌ Deeply nested capability structures
- ❌ Concurrent registration attempts

## 2️⃣ Agent Discovery Tests (`/acdl/discover`)

### Test Categories

#### 2.1 Discovery by Domain
- ❌ Find all documentation agents
- ❌ Find all API design agents
- ❌ Find all validation agents
- ❌ Find agents with multiple domains
- ❌ Empty result set handling

#### 2.2 Discovery by Performance
- ❌ Find agents with <100ms p99 latency
- ❌ Find agents supporting 1000+ RPS
- ❌ Find agents with specific resource limits
- ❌ Performance-based ranking

#### 2.3 Protocol-based Discovery
- ❌ Find REST API agents
- ❌ Find gRPC agents
- ❌ Find MCP-compatible agents
- ❌ Find WebSocket agents
- ❌ Multi-protocol support

## 3️⃣ Agent Matching Tests (`/acdl/match`)

### Test Categories

#### 3.1 Task Matching
- ❌ Match API documentation task to worker.docs
- ❌ Match code review task to critic.quality
- ❌ Match orchestration task to orchestrator
- ❌ Match learning task to trainer
- ❌ No suitable agent found

#### 3.2 Ensemble Matching
- ❌ Complex task requiring multiple agents
- ❌ Workflow with dependencies
- ❌ Parallel execution recommendations
- ❌ Sequential execution recommendations

#### 3.3 Constraint Matching
- ❌ Budget-constrained matching
- ❌ Deadline-constrained matching
- ❌ Resource-constrained matching
- ❌ Combined constraints

## 4️⃣ Validation Tests

### Schema Validation
- ❌ ACDLManifest schema validation
- ❌ Capabilities schema validation
- ❌ Protocols schema validation
- ❌ Performance schema validation
- ❌ Requirements schema validation

### Business Logic Validation
- ❌ Agent naming convention enforcement
- ❌ Version compatibility checks
- ❌ Capability consistency validation
- ❌ Protocol endpoint validation
- ❌ Performance claim verification

## 5️⃣ Mock Server Configuration

### Mock Responses to Create
```yaml
# test/mocks/acdl-responses.yml
registration:
  success:
    registrationId: "uuid-here"
    status: "registered"
  
  pending:
    registrationId: "uuid-here"
    status: "pending"
    
  rejected:
    status: "rejected"
    validationResults: [...]
```

### Mock Agent Database
```json
// test/fixtures/mock-agents.json
{
  "agents": [
    {
      "agentId": "worker-openapi-v1.2.0",
      "agentType": "worker",
      "agentSubType": "worker.api",
      // ... full manifest
    }
  ]
}
```

## 6️⃣ Test File Structure

```
test/
├── api/
│   ├── acdl-registration.spec.ts    # Registration endpoint tests
│   ├── acdl-discovery.spec.ts       # Discovery endpoint tests
│   ├── acdl-matching.spec.ts        # Matching endpoint tests
│   └── acdl-validation.spec.ts      # Validation tests
├── unit/
│   ├── manifest-validator.test.ts   # Manifest validation
│   ├── capability-matcher.test.ts   # Capability matching logic
│   └── performance-evaluator.test.ts # Performance evaluation
├── fixtures/
│   ├── valid-manifests/             # Valid test manifests
│   ├── invalid-manifests/           # Invalid test manifests
│   └── mock-agents.json             # Mock agent database
├── mocks/
│   ├── acdl-server.ts               # Mock ACDL server
│   └── responses/                   # Mock response templates
└── contracts/
    └── acdl-contract.test.ts        # Contract tests

```

## 7️⃣ Test Implementation Timeline

### Week 1 (Current)
- [x] Create test plan
- [ ] Set up test structure
- [ ] Write registration tests (failing)
- [ ] Write discovery tests (failing)
- [ ] Write matching tests (failing)

### Week 2
- [ ] Create mock server
- [ ] Write validation tests (failing)
- [ ] Set up CI/CD pipeline
- [ ] Achieve 0% pass rate with 100% coverage

### Week 3-4
- [ ] NO TEST CHANGES (implementation phase)
- [ ] Tests should start passing as implementation proceeds
- [ ] Target: 100% pass rate by end of Week 4

## 8️⃣ CI/CD Pipeline Configuration

```yaml
# .gitlab-ci.yml
test:acdl:
  stage: test
  script:
    - npm run test:acdl
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  allow_failure: true  # Expected to fail in Week 1-2
```

## 9️⃣ Test Commands

```json
// package.json scripts
{
  "test:acdl": "jest test/api/acdl-*.spec.ts",
  "test:acdl:watch": "jest --watch test/api/acdl-*.spec.ts",
  "test:acdl:coverage": "jest --coverage test/api/acdl-*.spec.ts",
  "test:failing": "jest --passWithNoTests || echo 'Expected: All tests failing'"
}
```

## 📊 Success Metrics

### Week 1-2 (TDD Red Phase)
- ✅ All tests written
- ✅ 0% tests passing
- ✅ 100% code coverage setup
- ✅ Mock server running
- ✅ CI/CD pipeline configured

### Week 3-4 (TDD Green Phase)
- ⏳ Tests start passing
- ⏳ Implementation matches specs
- ⏳ 100% tests passing
- ⏳ Contract tests validated

---

**Generated**: September 10, 2024
**Author**: Window 2 - Implementation Engineer
**Status**: IN PROGRESS - Writing failing tests