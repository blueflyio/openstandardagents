# OSSA Resilience Patterns

A comprehensive resilience and error handling system for distributed applications, providing advanced patterns for fault tolerance, recovery, and system stability.

## Overview

The OSSA Resilience system implements multiple resilience patterns that work together to provide robust error handling and fault tolerance:

- **Circuit Breaker**: Prevents cascading failures by temporarily blocking calls to failing services
- **Retry Policies**: Intelligent retry mechanisms with exponential backoff and jitter
- **Cascade Prevention**: System-wide failure prevention and dependency isolation
- **Partial Success**: Handling scenarios where operations partially succeed
- **Timeout Management**: Advanced timeout handling with adaptive timeouts and cancellation
- **Error Classification**: Intelligent error categorization and handling strategies
- **Resilience Manager**: Integrated orchestration of all resilience patterns

## Quick Start

### Basic Usage

```typescript
import { ResilienceManager, ResilienceBuilder } from './resilience';

// Create a resilience manager
const resilience = new ResilienceBuilder()
  .circuitBreaker({ failureThreshold: 5, recoveryTimeout: 60000 })
  .retryPolicy({ maxAttempts: 3, baseDelay: 1000 })
  .timeout({ baseTimeout: 5000 })
  .build();

// Execute an operation with resilience
const result = await resilience.execute(
  async () => {
    // Your operation here
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    operationName: 'fetch-data',
    priority: 'high',
    fallbackFunction: async () => {
      // Fallback to cached data
      return getCachedData();
    }
  }
);

console.log(result.success, result.result, result.retriesUsed);
```

### Pre-configured Patterns

```typescript
import { ResiliencePatterns } from './resilience';

// High availability pattern for critical services
const haManager = ResiliencePatterns.highAvailability();

// Fast fail pattern for non-critical services
const ffManager = ResiliencePatterns.fastFail();

// Network resilient pattern for external API calls
const networkManager = ResiliencePatterns.networkResilient();
```

### Utility Functions

```typescript
import { ResilienceUtils } from './resilience';

// Simple retry wrapper
const result = await ResilienceUtils.withRetry(
  () => apiCall(),
  3, // max attempts
  1000 // delay
);

// Timeout wrapper
const result = await ResilienceUtils.withTimeout(
  () => longOperation(),
  5000 // timeout ms
);

// Batch operations with partial success
const { successful, failed, successRate } = await ResilienceUtils.batchWithPartialSuccess([
  { id: 'op1', operation: () => operation1() },
  { id: 'op2', operation: () => operation2() },
  { id: 'op3', operation: () => operation3() }
], 0.7); // 70% success threshold
```

## Core Components

### 1. Circuit Breaker

Automatically isolates failing services to prevent cascade failures.

```typescript
import { CircuitBreaker } from './resilience';

const circuit = new CircuitBreaker('payment-service', {
  failureThreshold: 5,      // Open after 5 failures
  recoveryTimeout: 60000,   // Try recovery after 1 minute
  successThreshold: 3,      // Close after 3 successes
  timeout: 10000,           // Request timeout
  exponentialBackoff: true  // Use exponential backoff for recovery
});

// Execute with circuit breaker protection
const result = await circuit.execute(async () => {
  return await paymentService.processPayment(paymentData);
});
```

**States:**
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit is open, requests fail fast
- **HALF_OPEN**: Testing if service recovered

### 2. Retry Policies

Advanced retry mechanisms with multiple strategies and jitter.

```typescript
import { RetryPolicy, RetryStrategy, JitterType } from './resilience';

const retryPolicy = new RetryPolicy({
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
  jitterType: JitterType.DECORRELATED,
  backoffMultiplier: 2,
  retryableErrors: [/timeout/i, /network/i, /503/],
  nonRetryableErrors: [/400/i, /401/i, /403/i]
});

const result = await retryPolicy.execute(async () => {
  return await apiService.getData();
});
```

**Retry Strategies:**
- **FIXED_DELAY**: Fixed delay between retries
- **EXPONENTIAL_BACKOFF**: Exponentially increasing delays
- **LINEAR_BACKOFF**: Linearly increasing delays
- **CUSTOM**: Custom delay calculation

**Jitter Types:**
- **NONE**: No jitter
- **FULL**: Random jitter (0 to delay)
- **EQUAL**: Half fixed, half random
- **DECORRELATED**: Correlated with previous delay

### 3. Timeout Management

Sophisticated timeout handling with adaptive timeouts and cancellation.

```typescript
import { TimeoutManager, TimeoutType, CancellationToken } from './resilience';

const timeoutManager = new TimeoutManager({
  type: TimeoutType.ADAPTIVE,   // Adapts based on performance
  baseTimeout: 5000,
  maxTimeout: 30000,
  adaptiveFactor: 0.2,
  extensionCount: 2,            // Allow 2 extensions
  enableCancellation: true
});

const result = await timeoutManager.executeWithTimeout(
  async (token) => {
    token?.throwIfCancelled(); // Check cancellation
    return await longRunningOperation();
  },
  {
    operationId: 'long-op-1',
    operationName: 'data-processing',
    priority: 'high',
    cleanupFunction: async () => {
      // Cleanup resources
      await releaseResources();
    }
  }
);
```

**Timeout Types:**
- **FIXED**: Fixed timeout value
- **ADAPTIVE**: Adjusts based on historical performance
- **PROGRESSIVE**: Increases over time
- **PERCENTILE_BASED**: Based on response time percentiles

### 4. Cascade Prevention

System-wide failure prevention and dependency management.

```typescript
import { CascadePreventionSystem, DependencyPriority } from './resilience';

const cascadePrevention = new CascadePreventionSystem({
  maxConcurrentFailures: 3,
  systemHealthThreshold: 70,
  enableLoadShedding: true,
  enablePreemptiveIsolation: true
});

// Register dependencies
cascadePrevention.registerDependency({
  name: 'user-service',
  priority: DependencyPriority.CRITICAL,
  timeout: 5000,
  circuitBreakerConfig: { /* ... */ },
  fallbackStrategy: FallbackStrategy.CACHED_RESPONSE,
  isolationLevel: IsolationLevel.SERVICE
});

// Execute with cascade prevention
const result = await cascadePrevention.execute(
  'user-service',
  async () => userService.getUser(userId)
);
```

### 5. Partial Success Handling

Handle operations that partially succeed.

```typescript
import { PartialSuccessHandler, PartialSuccessStrategy } from './resilience';

const partialHandler = new PartialSuccessHandler({
  strategy: PartialSuccessStrategy.THRESHOLD_BASED,
  successThreshold: 0.7,        // 70% success required
  maxConcurrency: 5,
  enableEarlyTermination: true  // Stop early if threshold impossible
});

// Add operations
partialHandler.addOperation({
  id: 'sync-users',
  name: 'Sync User Data',
  operation: async () => syncUsers(),
  weight: 0.8,                  // High importance
  required: true,               // Must succeed
  dependencies: []
});

partialHandler.addOperation({
  id: 'sync-preferences',
  name: 'Sync Preferences',
  operation: async () => syncPreferences(),
  weight: 0.3,                  // Lower importance
  required: false,
  dependencies: ['sync-users']  // Depends on user sync
});

const result = await partialHandler.execute();
console.log(`Success rate: ${result.successRate * 100}%`);
```

### 6. Error Classification

Intelligent error classification and handling.

```typescript
import { ErrorClassifier, ErrorCategory, HandlingStrategy } from './resilience';

const classifier = new ErrorClassifier();

// Register custom error patterns
classifier.registerPattern({
  name: 'database-timeout',
  messagePattern: /database.*timeout/i,
  category: ErrorCategory.TIMEOUT,
  severity: ErrorSeverity.HIGH,
  strategy: HandlingStrategy.RETRY,
  retryable: true,
  maxRetries: 3
});

// Classify and handle errors
const classification = classifier.classify(error, {
  operationName: 'database-query',
  operationId: 'query-1',
  timestamp: new Date(),
  attempt: 1,
  totalAttempts: 3,
  duration: 5000
});

const report = await classifier.handleError(error, context, classification);
```

## Advanced Usage

### Custom Resilience Configuration

```typescript
const customResilience = new ResilienceBuilder()
  .circuitBreaker({
    failureThreshold: 10,
    recoveryTimeout: 120000,
    exponentialBackoff: true,
    bulkheadIsolation: true
  })
  .retryPolicy({
    maxAttempts: 7,
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    jitterType: JitterType.DECORRELATED,
    baseDelay: 500,
    maxDelay: 60000,
    retryableErrors: [/timeout/i, /network/i, /5\d\d/]
  })
  .timeout({
    type: TimeoutType.PERCENTILE_BASED,
    percentile: 95,
    baseTimeout: 3000,
    maxTimeout: 20000,
    extensionCount: 3
  })
  .cascadePrevention({
    maxConcurrentFailures: 5,
    systemHealthThreshold: 60,
    enableLoadShedding: true,
    enableAdaptiveTimeout: true
  })
  .errorHandling({
    enableClassification: true,
    enableAutoRecovery: true,
    escalationThreshold: 3
  })
  .build();
```

### Monitoring and Metrics

```typescript
// Get system metrics
const metrics = resilience.getSystemMetrics();
console.log(`System health: ${metrics.systemHealth.overallHealth}%`);
console.log(`Resilience score: ${metrics.overallResilience.score}`);

// Monitor events
resilience.on('operationCompleted', (event) => {
  console.log(`Operation ${event.operationId} completed in ${event.duration}ms`);
});

resilience.on('circuitBreakerStateChanged', (event) => {
  console.log(`Circuit breaker ${event.circuitName} changed to ${event.newState}`);
});

resilience.on('systemHealthChanged', (event) => {
  console.log(`System health: ${event.systemHealth.overallHealth}%`);
});

// Get active operations
const activeOps = resilience.getActiveOperations();
console.log(`${activeOps.length} operations currently running`);
```

### Dependency Management

```typescript
// Register critical dependency
resilience.registerDependency({
  name: 'payment-gateway',
  priority: DependencyPriority.CRITICAL,
  timeout: 10000,
  circuitBreakerConfig: {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    successThreshold: 5
  },
  fallbackStrategy: FallbackStrategy.CACHED_RESPONSE,
  isolationLevel: IsolationLevel.BULKHEAD
}, async () => {
  // Fallback implementation
  return getCachedPaymentMethods();
});
```

## Best Practices

### 1. Choose Appropriate Patterns

- **Critical Services**: Use high availability pattern with circuit breakers and aggressive retries
- **External APIs**: Use network resilient pattern with timeout and retry policies
- **Batch Processing**: Use bulk processing pattern with partial success handling
- **Real-time Systems**: Use real-time pattern with minimal timeouts and fast fail

### 2. Configure Timeouts Appropriately

- Set reasonable base timeouts based on expected operation duration
- Use adaptive timeouts for variable-duration operations
- Enable timeout extensions for critical operations
- Implement proper cleanup functions

### 3. Design Effective Fallbacks

- Provide meaningful fallback responses
- Use cached data when appropriate
- Implement graceful degradation
- Avoid expensive fallback operations

### 4. Monitor and Alert

- Monitor system health metrics
- Set up alerts for high error rates
- Track circuit breaker state changes
- Monitor timeout and retry patterns

### 5. Test Resilience Patterns

- Test circuit breaker state transitions
- Verify retry policies work correctly
- Test timeout scenarios
- Validate fallback behaviors

## Error Handling Strategies

### Transient Errors
- Network timeouts → Retry with exponential backoff
- Rate limiting (429) → Retry with longer delays
- Server errors (5xx) → Retry with circuit breaker

### Permanent Errors  
- Authentication (401, 403) → Escalate, don't retry
- Validation errors (400) → Log and continue
- Not found (404) → Use fallback or default

### Critical Errors
- Database connection failures → Activate emergency protocols
- Memory exhaustion → Load shedding and resource cleanup
- Multiple dependency failures → System-wide isolation

## Performance Considerations

- Circuit breakers add minimal overhead in closed state
- Retry policies should use jitter to avoid thundering herd
- Timeout management uses efficient Promise.race implementation
- Metrics collection is optimized for high-throughput scenarios
- Memory usage is bounded with configurable history limits

## Testing

The resilience patterns include comprehensive test coverage:

```bash
# Run tests
npm test

# Run specific test suite
npm test -- circuit-breaker.test.ts
npm test -- retry-policy.test.ts
npm test -- resilience-manager.test.ts
```

Test coverage includes:
- Unit tests for individual components
- Integration tests for pattern combinations
- Performance tests for high-load scenarios
- Fault injection tests for failure scenarios

## API Reference

For detailed API documentation, see the TypeScript definitions in each component file. Key interfaces include:

- `ResilienceConfig` - Main configuration interface
- `OperationOptions` - Operation execution options
- `ResilienceResult` - Operation result with metadata
- `SystemMetrics` - System health and performance metrics

## License

This resilience system is part of the OSSA (Open Source Software Architecture) project.