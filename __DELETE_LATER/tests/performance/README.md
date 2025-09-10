# OSSA Performance Tests

This directory contains comprehensive performance tests that validate all claimed OSSA metrics:

## 🎯 Validated Metrics

### 1. **34% Orchestration Overhead Reduction**
- **File**: `orchestration-overhead.test.ts`
- **Target**: 34% reduction in total orchestration time
- **Tests**: Agent coordination, resource allocation, communication protocols, task delegation, workflow setup
- **Runtime**: ~2-3 minutes

### 2. **104% Cross-Framework Improvement**
- **File**: `cross-framework-improvement.test.ts`
- **Target**: 104% improvement in cross-framework interoperability
- **Tests**: LangChain, CrewAI, AutoGen, MCP, OpenAI Assistants integration
- **Runtime**: ~2-3 minutes

### 3. **68-82% Token Reduction**
- **File**: `token-reduction.test.ts`
- **Target**: 68-82% reduction in token usage via ACTA optimization
- **Tests**: Context compression, semantic fidelity, conversation complexity scaling
- **Runtime**: ~2-3 minutes

### 4. **Sub-100ms Agent Discovery**
- **File**: `agent-discovery.test.ts`
- **Target**: <100ms P95 response time for 1000+ agents
- **Tests**: Indexed search, concurrent queries, cache effectiveness, scalability
- **Runtime**: ~1-2 minutes

## 🚀 Quick Start

### Run All Performance Tests
```bash
npm run test:performance
```

### Run Complete Validation Suite
```bash
npm run performance:validate
```

### Run Individual Test Suites
```bash
# Orchestration overhead reduction
npm run test:performance:orchestration

# Cross-framework improvement
npm run test:performance:cross-framework

# Token reduction (ACTA)
npm run test:performance:tokens

# Agent discovery performance
npm run test:performance:discovery

# Complete validation suite with reporting
npm run test:performance:suite
```

## 📊 Test Results

### Results Storage
- **Location**: `tests/performance/results/`
- **Latest**: `results/latest-results.json`
- **Timestamped**: `results/performance-results-{timestamp}.json`

### Sample Output
```json
{
  "orchestration": {
    "target": 34,
    "achieved": 38.5,
    "passed": true
  },
  "crossFramework": {
    "target": 104,
    "achieved": 112.3,
    "passed": true
  },
  "tokenReduction": {
    "targetRange": [68, 82],
    "achieved": 75.2,
    "passed": true
  },
  "agentDiscovery": {
    "target": "sub-100ms P95",
    "achieved": 67.8,
    "passed": true
  },
  "summary": {
    "totalTests": 4,
    "passed": 4,
    "failed": 0,
    "overallScore": 100,
    "meetsAllClaims": true
  }
}
```

## 🔧 Test Configuration

### Timeouts
- Individual tests: 5 minutes max
- Complete suite: 10 minutes max
- Configurable via vitest `--timeout` parameter

### Iterations
- Orchestration: 20-50 iterations per test
- Cross-framework: 15-25 iterations per test  
- Token reduction: 20-30 iterations per test
- Agent discovery: 200-1000 queries per test

### Test Data
- **Agents**: 1000-1200 simulated agents
- **Frameworks**: LangChain, CrewAI, AutoGen, MCP, OpenAI Assistants
- **Capabilities**: 15 different capability types
- **Domains**: 14 different domain areas

## 📈 Performance Benchmarking

### System Requirements
- **Memory**: 2GB+ available RAM
- **CPU**: Multi-core recommended for concurrent tests
- **Node.js**: v18+ required

### Optimization Features Tested
- **Indexing**: Capability and domain indexes for fast lookups
- **Caching**: Query result caching with TTL
- **Concurrency**: Parallel processing and batch operations  
- **Compression**: Context and token optimization algorithms

## 🧪 Test Architecture

### Simulation Approach
- **Realistic Delays**: Network latency, processing time simulation
- **Variance**: Random variance in measurements for realistic testing
- **Baseline vs Optimized**: Each test compares unoptimized vs OSSA-optimized approaches
- **Statistical Validation**: Multiple iterations with statistical analysis

### Key Components
```typescript
// Each test follows this pattern:
1. Generate realistic test scenarios
2. Measure baseline performance (without OSSA)
3. Measure optimized performance (with OSSA)
4. Calculate improvement percentages
5. Validate against target metrics
6. Generate detailed reports
```

## 📋 Validation Criteria

### Pass Conditions
- **Orchestration**: ≥34% reduction in total time
- **Cross-Framework**: ≥104% improvement in interoperability
- **Token Reduction**: 68-82% reduction with ≥90% semantic fidelity
- **Discovery**: P95 response time <100ms with 1000+ agents

### Quality Gates
- **Consistency**: Results stable across multiple runs
- **Scalability**: Performance maintained under load
- **Accuracy**: High success rates and low error rates
- **Reliability**: Robust error handling and recovery

## 🚨 Troubleshooting

### Common Issues

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run test:performance
```

#### Timeout Issues
```bash
# Increase timeout for slower systems
vitest run tests/performance/ --timeout=900000  # 15 minutes
```

#### Failed Tests
1. Check system resources (memory, CPU)
2. Review test output for specific failures
3. Run individual tests to isolate issues
4. Check results in `tests/performance/results/latest-results.json`

### Debug Mode
```bash
# Run with detailed output
DEBUG=ossa:performance npm run test:performance:suite
```

## 📚 Understanding Results

### Metric Interpretation
- **Percentage Improvements**: Higher = better performance gain
- **Response Times**: Lower = better performance
- **Success Rates**: Higher = better reliability
- **Throughput**: Higher = better scalability

### Benchmark Context
- Tests simulate real-world agent orchestration scenarios
- Baseline represents typical multi-framework integration overhead
- Optimized represents OSSA-standardized implementation benefits

## 🔗 Related Documentation
- [OSSA Specification](../../README.md)
- [Performance Architecture](../../docs/performance/)
- [ACTA Token Optimization](../../docs/acta/)
- [Agent Discovery Protocol](../../docs/discovery/)

---

## 💡 Performance Tips

1. **Run on dedicated hardware** for consistent results
2. **Close other applications** to reduce resource contention
3. **Use SSD storage** for faster I/O operations
4. **Monitor system resources** during test execution
5. **Run multiple times** to verify consistency

---

*Generated for OSSA v0.1.8 - Performance validation suite validating all claimed metrics through comprehensive simulation and benchmarking.*