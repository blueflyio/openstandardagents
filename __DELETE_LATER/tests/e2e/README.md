# OSSA End-to-End Test Suite

This comprehensive E2E test suite validates the complete OSSA agent lifecycle, multi-agent orchestration, and compliance with OSSA v0.1.8 specification targets.

## Test Architecture

### Core Components Tested

1. **8-Phase Agent Lifecycle** (`eight-phase-lifecycle.test.ts`)
   - Plan → Execute → Critique → Judge → Integrate → Learn → Govern → Signal
   - Complete 360° feedback loop validation
   - Multi-agent orchestration and handoff protocols
   - Performance validation against OSSA v0.1.8 targets

2. **Agent Lifecycle Management** (`agent-lifecycle-manager.test.ts`)
   - Agent registration and initialization
   - State transitions and health monitoring
   - Graceful shutdown and recovery
   - Hot-swapping capabilities
   - Dependency resolution and circular dependency detection
   - Failure detection and automatic remediation

3. **Multi-Agent Coordination** (`multi-agent-coordination.test.ts`)
   - Agent discovery and capability matching
   - Handoff negotiation and consensus mechanisms
   - Load balancing and resource allocation
   - Conflict resolution and deadlock prevention
   - System resilience and recovery

4. **OSSA v0.1.8 Compliance Validation** (`ossa-compliance-validation.test.ts`)
   - Performance benchmarks and efficiency targets
   - Security and governance framework compliance
   - Conformance tier validation (Core, Governed, Advanced)
   - VORTEX Token Exchange System compliance
   - ACTA Token Optimization validation

## OSSA v0.1.8 Performance Targets

The test suite validates against these specific performance benchmarks:

- **Coordination Efficiency**: 26% improvement over baseline
- **Token Optimization**: 67% reduction through VORTEX and ACTA
- **Orchestration Overhead**: 34% reduction
- **Task Completion Rate**: 90%+ success rate
- **System Availability**: 99.5%+ uptime
- **Response Time**: <2000ms p95 latency

## Test Coverage

### Agent Lifecycle States
- `INITIALIZING` → `STARTING` → `RUNNING` → `STOPPING` → `STOPPED`
- `MAINTENANCE`, `SWAPPING`, `SUSPENDED`, `FAILED` states
- Health status transitions: `HEALTHY` → `DEGRADED` → `UNHEALTHY` → `CRITICAL`

### Feedback Loop Phases
- **Plan**: Goal decomposition and task planning
- **Execute**: Task execution by worker agents
- **Critique**: Quality assessment and validation
- **Judge**: Consensus decision making
- **Integrate**: Result merging and consolidation
- **Learn**: Pattern recognition and model updating
- **Govern**: Policy validation and compliance
- **Signal**: Metrics collection and telemetry

### Agent Roles
- **Orchestrator**: Planning and coordination
- **Worker**: Task execution
- **Critic**: Quality assessment
- **Judge**: Decision making and arbitration
- **Integrator**: Result consolidation
- **Trainer**: Learning and adaptation
- **Governor**: Policy enforcement
- **Telemetry**: Monitoring and metrics

### Consensus Algorithms
- **RAFT**: Leader election and log replication
- **PBFT**: Byzantine fault tolerant consensus
- **Simple Majority**: Fast decision making

## Running Tests

### All E2E Tests
```bash
npm run test:e2e
```

### Individual Test Suites
```bash
# 8-Phase Lifecycle Tests
npm run test:e2e:lifecycle

# Multi-Agent Coordination Tests
npm run test:e2e:coordination

# OSSA Compliance Validation Tests
npm run test:e2e:compliance

# Agent Lifecycle Manager Tests
npm run test:e2e:agent-manager
```

### With Coverage
```bash
npm run test:e2e:coverage
```

### Watch Mode
```bash
npm run test:e2e:watch
```

## Test Configuration

Tests use a specialized Vitest configuration (`vitest.e2e.config.ts`) with:
- Extended timeouts (60s) for complex lifecycle operations
- Sequential execution to prevent resource conflicts
- Comprehensive coverage reporting
- Retry mechanisms for handling flaky tests
- Custom matchers for OSSA compliance validation

## Test Utilities

### Fixtures (`tests/fixtures/agent-fixtures.ts`)
- `createTestAgent()`: Creates agents with realistic configurations
- `createTestTask()`: Creates tasks with proper requirements
- `createLifecycleConfig()`: Lifecycle manager configuration
- `waitForState()`: Async state transition helpers
- `PerformanceDataGenerator`: Mock performance data
- `TestEventCollector`: Event monitoring and analysis
- `TestResourceMonitor`: Resource usage tracking

### Custom Matchers
- `toBeWithinRange(min, max)`: Numeric range validation
- `toMeetOSSATarget(target)`: OSSA target compliance
- `toBeOneOf(values)`: Enumeration validation

## Test Scenarios

### Basic Functionality
- Agent registration and discovery
- Task assignment and execution
- Health monitoring and reporting
- Graceful shutdown procedures

### Advanced Features
- Hot-swapping without service disruption
- Circular dependency detection and resolution
- Multi-round consensus with disagreement
- Cascading failure recovery

### Performance Validation
- Coordination efficiency improvements
- Token usage optimization (VORTEX/ACTA)
- Load balancing effectiveness
- System resilience under stress

### Compliance Testing
- OSSA specification conformance
- Security framework validation
- Governance policy enforcement
- Conformance tier requirements

## Error Handling

Tests validate proper error handling for:
- Agent failures during coordination
- Network timeouts and connectivity issues
- Resource exhaustion scenarios
- Invalid configuration parameters
- Consensus failures and deadlocks

## Monitoring and Metrics

Tests collect comprehensive metrics:
- Agent performance over time
- Coordination efficiency measurements
- Resource utilization patterns
- Error rates and recovery times
- Compliance scores and violations

## Integration Points

The E2E test suite validates integration with:
- Lifecycle Manager for agent state management
- Agent Coordinator for multi-agent orchestration
- OSSA Validator for compliance checking
- Performance monitoring systems
- Security and governance frameworks

## Best Practices

1. **Test Isolation**: Each test starts with clean state
2. **Resource Cleanup**: All tests properly clean up resources
3. **Realistic Scenarios**: Tests use realistic data and timing
4. **Error Recovery**: Tests validate both success and failure paths
5. **Performance Focus**: All tests validate performance targets
6. **Compliance First**: OSSA v0.1.8 compliance is validated throughout

## Troubleshooting

### Common Issues
- **Timeout Errors**: Increase test timeouts for complex scenarios
- **Resource Conflicts**: Ensure tests run sequentially
- **State Pollution**: Verify proper cleanup between tests
- **Flaky Tests**: Use retry mechanisms and improve test stability

### Debug Mode
Set environment variable for verbose logging:
```bash
DEBUG=ossa:* npm run test:e2e
```

### Performance Analysis
Generate detailed performance reports:
```bash
OSSA_PERF_ANALYSIS=true npm run test:e2e
```

This E2E test suite provides comprehensive validation of the OSSA agent ecosystem, ensuring reliability, performance, and compliance with the OSSA v0.1.8 specification.